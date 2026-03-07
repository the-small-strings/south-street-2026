package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"runtime"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"

	"walkon-helper/internal/audio"
)

type config struct {
	APIBaseURL           string
	SocketURL            string
	FadeDownDuration     time.Duration
	FadeTarget           float64
	CooldownDuration     time.Duration
	ReconnectDelay       time.Duration
	HTTPTimeout          time.Duration
	ProcessNames         []string
	KillSettleDuration   time.Duration
	QobuzLaunchTarget    string
	QobuzRestartOnEnd    bool
	QobuzWindowTimeout   time.Duration
	QobuzFocusTimeout    time.Duration
	QobuzWindowPoll      time.Duration
	QobuzPlaybackTimeout time.Duration
}

type gigState struct {
	CurrentPage struct {
		Type string `json:"type"`
	} `json:"currentPage"`
	PageIndex int `json:"pageIndex"`
}

type stateTransition struct {
	from gigState
	to   gigState
}

type triggerRunner struct {
	cfg              config
	client           *http.Client
	mu               sync.Mutex
	running          bool
	setBreakRunning  bool
	endScreenRunning bool
	lastRun          time.Time
	prev             *gigState
}

func main() {
	// Check for --test flag
	for _, arg := range os.Args[1:] {
		if arg == "--test" || arg == "-test" {
			runVolumeTest()
			return
		}
	}

	cfg, err := loadConfig()
	if err != nil {
		log.Fatalf("config error: %v", err)
	}

	log.Printf("starting walk-on helper")
	log.Printf("api: %s", cfg.APIBaseURL)
	log.Printf("socket: %s", cfg.SocketURL)
	log.Printf("process names: %v", cfg.ProcessNames)
	log.Printf("qobuz window timeout: %s", cfg.QobuzWindowTimeout)
	log.Printf("qobuz focus timeout: %s", cfg.QobuzFocusTimeout)
	log.Printf("qobuz playback verify timeout: %s", cfg.QobuzPlaybackTimeout)
	log.Printf("qobuz poll interval: %s", cfg.QobuzWindowPoll)

	runner := &triggerRunner{
		cfg: cfg,
		client: &http.Client{
			Timeout: cfg.HTTPTimeout,
		},
	}

	runner.seedInitialState()
	runner.runLoop()
}

func runVolumeTest() {
	if runtime.GOOS != "windows" {
		log.Fatalf("volume test only supported on Windows")
	}

	log.Printf("=== Volume Fade Test ===")

	// Get current volume
	originalVol, err := audio.GetMasterVolume()
	if err != nil {
		log.Fatalf("failed to get current volume: %v", err)
	}
	log.Printf("current volume: %.1f%%", originalVol*100)

	// Fade down to 20% over 3 seconds
	log.Printf("fading down to 20%% over 3 seconds...")
	if err := audio.FadeTo(originalVol, 0.2, 3*time.Second); err != nil {
		log.Fatalf("fade down failed: %v", err)
	}
	log.Printf("fade down complete")

	// Wait a moment
	time.Sleep(500 * time.Millisecond)

	// Read volume to confirm
	currentVol, err := audio.GetMasterVolume()
	if err != nil {
		log.Printf("warning: failed to read volume after fade: %v", err)
	} else {
		log.Printf("volume after fade: %.1f%%", currentVol*100)
	}

	// Fade back up over 2 seconds
	log.Printf("fading back to %.1f%% over 2 seconds...", originalVol*100)
	if err := audio.FadeTo(0.2, originalVol, 2*time.Second); err != nil {
		log.Fatalf("fade up failed: %v", err)
	}
	log.Printf("fade up complete")

	// Confirm restored
	finalVol, err := audio.GetMasterVolume()
	if err != nil {
		log.Printf("warning: failed to read final volume: %v", err)
	} else {
		log.Printf("final volume: %.1f%%", finalVol*100)
	}

	log.Printf("=== Test Complete ===")
}

func loadConfig() (config, error) {
	apiBase := strings.TrimSpace(getEnv("API_BASE_URL", "http://localhost:33001"))
	if apiBase == "" {
		return config{}, errors.New("API_BASE_URL cannot be empty")
	}

	socketURL := strings.TrimSpace(getEnv("SOCKET_URL", ""))
	if socketURL == "" {
		derived, err := deriveSocketURL(apiBase)
		if err != nil {
			return config{}, fmt.Errorf("derive socket url: %w", err)
		}
		socketURL = derived
	}

	fadeSeconds := getEnvFloat("FADE_DOWN_SECONDS", 3)
	if fadeSeconds < 0 {
		return config{}, errors.New("FADE_DOWN_SECONDS must be >= 0")
	}

	fadeTarget := getEnvFloat("FADE_DOWN_TARGET", 0.0)
	if fadeTarget < 0 || fadeTarget > 1 {
		return config{}, errors.New("FADE_DOWN_TARGET must be between 0 and 1")
	}

	cooldownSeconds := getEnvFloat("TRIGGER_COOLDOWN_SECONDS", 8)
	reconnectSeconds := getEnvFloat("RECONNECT_SECONDS", 2)
	httpTimeoutSeconds := getEnvFloat("HTTP_TIMEOUT_SECONDS", 5)
	killSettleMs := getEnvInt("KILL_SETTLE_MS", 150)
	windowWaitSeconds := getEnvFloat("QOBUZ_WINDOW_WAIT_SECONDS", 15)
	focusTimeoutSeconds := getEnvFloat("QOBUZ_FOCUS_TIMEOUT_SECONDS", 10)
	playbackTimeoutSeconds := getEnvFloat("QOBUZ_PLAYBACK_VERIFY_TIMEOUT_SECONDS", getEnvFloat("QOBUZ_TITLE_CHANGE_TIMEOUT_SECONDS", 6))
	windowPollMs := getEnvInt("QOBUZ_WINDOW_POLL_MS", 250)
	restartOnEnd := getEnvBool("QOBUZ_RESTART_ON_END", true)

	processNames := parseProcessList(getEnv("QOBUZ_PROCESS_NAMES", "Qobuz.exe"))
	if len(processNames) == 0 {
		processNames = []string{"Qobuz.exe"}
	}

	qobuzLaunchTarget := strings.TrimSpace(getEnv("QOBUZ_LAUNCH_TARGET", ""))
	if windowWaitSeconds <= 0 {
		windowWaitSeconds = 15
	}
	if windowPollMs <= 0 {
		windowPollMs = 250
	}
	if focusTimeoutSeconds <= 0 {
		focusTimeoutSeconds = 3
	}
	if playbackTimeoutSeconds <= 0 {
		playbackTimeoutSeconds = 6
	}

	return config{
		APIBaseURL:           strings.TrimRight(apiBase, "/"),
		SocketURL:            socketURL,
		FadeDownDuration:     time.Duration(fadeSeconds * float64(time.Second)),
		FadeTarget:           fadeTarget,
		CooldownDuration:     time.Duration(cooldownSeconds * float64(time.Second)),
		ReconnectDelay:       time.Duration(reconnectSeconds * float64(time.Second)),
		HTTPTimeout:          time.Duration(httpTimeoutSeconds * float64(time.Second)),
		ProcessNames:         processNames,
		KillSettleDuration:   time.Duration(killSettleMs) * time.Millisecond,
		QobuzLaunchTarget:    qobuzLaunchTarget,
		QobuzRestartOnEnd:    restartOnEnd,
		QobuzWindowTimeout:   time.Duration(windowWaitSeconds * float64(time.Second)),
		QobuzFocusTimeout:    time.Duration(focusTimeoutSeconds * float64(time.Second)),
		QobuzWindowPoll:      time.Duration(windowPollMs) * time.Millisecond,
		QobuzPlaybackTimeout: time.Duration(playbackTimeoutSeconds * float64(time.Second)),
	}, nil
}

func (r *triggerRunner) runLoop() {
	for {
		if err := r.connectAndListen(); err != nil {
			log.Printf("socket loop error: %v", err)
		}
		time.Sleep(r.cfg.ReconnectDelay)
	}
}

func (r *triggerRunner) connectAndListen() error {
	wsURL, err := appendSocketEngineParams(r.cfg.SocketURL)
	if err != nil {
		return err
	}

	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		return fmt.Errorf("dial websocket: %w", err)
	}
	defer conn.Close()

	log.Printf("connected to socket")
	r.seedInitialState()

	handshakeDone := false
	for {
		_, msgBytes, err := conn.ReadMessage()
		if err != nil {
			return fmt.Errorf("read websocket: %w", err)
		}
		msg := string(msgBytes)

		switch {
		case strings.HasPrefix(msg, "0"):
			if !handshakeDone {
				if err := conn.WriteMessage(websocket.TextMessage, []byte("40")); err != nil {
					return fmt.Errorf("send namespace connect: %w", err)
				}
				handshakeDone = true
				log.Printf("engine.io handshake complete")
			}
		case msg == "2":
			if err := conn.WriteMessage(websocket.TextMessage, []byte("3")); err != nil {
				return fmt.Errorf("send pong: %w", err)
			}
		case strings.HasPrefix(msg, "42"):
			r.handleEventMessage(msg[2:])
		default:
			// Ignore other engine/socket frames.
		}
	}
}

func (r *triggerRunner) handleEventMessage(payload string) {
	var raw []json.RawMessage
	if err := json.Unmarshal([]byte(payload), &raw); err != nil {
		log.Printf("failed to parse event frame: %v", err)
		return
	}
	if len(raw) < 2 {
		return
	}

	var eventName string
	if err := json.Unmarshal(raw[0], &eventName); err != nil {
		return
	}
	if eventName != "gameStateUpdate" {
		return
	}

	var state gigState
	if err := json.Unmarshal(raw[1], &state); err != nil {
		log.Printf("failed to parse game state payload: %v", err)
		return
	}

	r.onStateUpdate(state)
}

func (r *triggerRunner) onStateUpdate(state gigState) {
	r.mu.Lock()
	prev := r.prev
	r.prev = &state
	r.mu.Unlock()

	if prev == nil {
		return
	}

	transition := stateTransition{from: *prev, to: state}
	if shouldTriggerSetBreakLaunch(transition) {
		r.tryRunSetBreakLaunch(transition)
	}
	if shouldTriggerEndScreenLaunch(transition) {
		if r.cfg.QobuzRestartOnEnd {
			r.tryRunEndScreenLaunch(transition)
		} else {
			log.Printf("end screen restart disabled; skipping qobuz restart/play")
		}
	}

	if !shouldTriggerSequence(transition) {
		return
	}

	r.tryRunSequence(transition)
}

func shouldTriggerSetBreakLaunch(tr stateTransition) bool {
	return tr.to.CurrentPage.Type == "setBreak" && tr.to.PageIndex > tr.from.PageIndex
}

func shouldTriggerEndScreenLaunch(tr stateTransition) bool {
	return tr.to.CurrentPage.Type == "end2" && tr.to.PageIndex > tr.from.PageIndex
}

func shouldTriggerSequence(tr stateTransition) bool {
	// Trigger on welcome -> getReady (start of show)
	if tr.from.CurrentPage.Type == "welcome" &&
		tr.to.CurrentPage.Type == "getReady" &&
		tr.to.PageIndex > tr.from.PageIndex {
		return true
	}
	// Trigger on setBreak -> getReadyAgain (return from break)
	if tr.from.CurrentPage.Type == "setBreak" &&
		tr.to.CurrentPage.Type == "getReadyAgain" &&
		tr.to.PageIndex > tr.from.PageIndex {
		return true
	}
	return false
}

func (r *triggerRunner) tryRunSequence(tr stateTransition) {
	r.mu.Lock()
	if r.running {
		r.mu.Unlock()
		log.Printf("sequence already running; ignoring duplicate trigger")
		return
	}
	if time.Since(r.lastRun) < r.cfg.CooldownDuration {
		r.mu.Unlock()
		log.Printf("trigger cooldown active; ignoring duplicate trigger")
		return
	}
	r.running = true
	r.lastRun = time.Now()
	r.mu.Unlock()

	go func() {
		defer func() {
			r.mu.Lock()
			r.running = false
			r.mu.Unlock()
		}()

		log.Printf("detected transition %s(%d) -> %s(%d)", tr.from.CurrentPage.Type, tr.from.PageIndex, tr.to.CurrentPage.Type, tr.to.PageIndex)
		if err := r.executeSequence(); err != nil {
			log.Printf("sequence failed, manual advance fallback remains available: %v", err)
			return
		}
		log.Printf("sequence completed successfully")
	}()
}

func (r *triggerRunner) tryRunSetBreakLaunch(tr stateTransition) {
	r.mu.Lock()
	if r.setBreakRunning {
		r.mu.Unlock()
		log.Printf("set break launch already running; ignoring duplicate trigger")
		return
	}
	r.setBreakRunning = true
	r.mu.Unlock()

	go func() {
		defer func() {
			r.mu.Lock()
			r.setBreakRunning = false
			r.mu.Unlock()
		}()

		log.Printf("detected set break transition %s(%d) -> %s(%d)", tr.from.CurrentPage.Type, tr.from.PageIndex, tr.to.CurrentPage.Type, tr.to.PageIndex)
		if err := launchQobuzAndPlay(r.cfg); err != nil {
			log.Printf("set break qobuz launch/play failed: %v", err)
			return
		}
		log.Printf("set break qobuz launch/play completed")
	}()
}

func (r *triggerRunner) tryRunEndScreenLaunch(tr stateTransition) {
	r.mu.Lock()
	if r.endScreenRunning {
		r.mu.Unlock()
		log.Printf("end screen launch already running; ignoring duplicate trigger")
		return
	}
	r.endScreenRunning = true
	r.mu.Unlock()

	go func() {
		defer func() {
			r.mu.Lock()
			r.endScreenRunning = false
			r.mu.Unlock()
		}()

		log.Printf("detected end screen transition %s(%d) -> %s(%d)", tr.from.CurrentPage.Type, tr.from.PageIndex, tr.to.CurrentPage.Type, tr.to.PageIndex)
		if err := restartQobuzAndPlay(r.cfg); err != nil {
			log.Printf("end screen qobuz restart/play failed: %v", err)
			return
		}
		log.Printf("end screen qobuz restart/play completed")
	}()
}

func (r *triggerRunner) executeSequence() error {
	if runtime.GOOS != "windows" {
		return errors.New("this helper currently supports volume control only on Windows")
	}

	originalVolume, err := audio.GetMasterVolume()
	if err != nil {
		return fmt.Errorf("read original volume: %w", err)
	}
	log.Printf("original volume captured: %.3f", originalVolume)

	defer func() {
		if restoreErr := audio.SetMasterVolume(originalVolume); restoreErr != nil {
			log.Printf("failed to restore original volume: %v", restoreErr)
		} else {
			log.Printf("restored original volume: %.3f", originalVolume)
		}
	}()

	if err := audio.FadeTo(originalVolume, r.cfg.FadeTarget, r.cfg.FadeDownDuration); err != nil {
		return fmt.Errorf("fade down: %w", err)
	}
	log.Printf("fade-down complete in %s (target %.3f)", r.cfg.FadeDownDuration, r.cfg.FadeTarget)

	if err := killProcesses(r.cfg.ProcessNames); err != nil {
		return fmt.Errorf("kill process step: %w", err)
	}

	if r.cfg.KillSettleDuration > 0 {
		time.Sleep(r.cfg.KillSettleDuration)
	}

	if err := r.advanceToNext(); err != nil {
		return fmt.Errorf("auto-advance to intro: %w", err)
	}

	return nil
}

func (r *triggerRunner) advanceToNext() error {
	endpoint := r.cfg.APIBaseURL + "/api/game/next"
	req, err := http.NewRequestWithContext(context.Background(), http.MethodPost, endpoint, bytes.NewReader(nil))
	if err != nil {
		return err
	}

	resp, err := r.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		log.Printf("auto-advanced to next page via %s", endpoint)
		return nil
	}

	body, _ := io.ReadAll(io.LimitReader(resp.Body, 2048))
	if resp.StatusCode == http.StatusBadRequest {
		log.Printf("next returned 400 (likely already advanced), treating as benign: %s", strings.TrimSpace(string(body)))
		return nil
	}
	return fmt.Errorf("next failed with %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
}

func killProcesses(processNames []string) error {
	if runtime.GOOS != "windows" {
		return errors.New("process kill step currently supports Windows only")
	}

	for _, processName := range processNames {
		if processName == "" {
			continue
		}

		cmd := exec.Command("taskkill", "/IM", processName, "/F")
		output, err := cmd.CombinedOutput()
		out := strings.TrimSpace(string(output))
		if err != nil {
			lower := strings.ToLower(out)
			if strings.Contains(lower, "not found") || strings.Contains(lower, "no running instance") {
				log.Printf("process %s not running (noop)", processName)
				continue
			}
			return fmt.Errorf("taskkill %s: %v output=%s", processName, err, out)
		}

		if out == "" {
			log.Printf("taskkill succeeded for %s", processName)
		} else {
			log.Printf("taskkill output for %s: %s", processName, out)
		}
	}

	return nil
}

func (r *triggerRunner) seedInitialState() {
	state, err := r.fetchCurrentState()
	if err != nil {
		log.Printf("initial state fetch failed (continuing): %v", err)
		return
	}

	r.mu.Lock()
	r.prev = &state
	r.mu.Unlock()
	log.Printf("seeded initial state: %s (index %d)", state.CurrentPage.Type, state.PageIndex)
}

func (r *triggerRunner) fetchCurrentState() (gigState, error) {
	endpoint := r.cfg.APIBaseURL + "/api/game/current"
	req, err := http.NewRequestWithContext(context.Background(), http.MethodGet, endpoint, nil)
	if err != nil {
		return gigState{}, err
	}

	resp, err := r.client.Do(req)
	if err != nil {
		return gigState{}, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 2048))
		return gigState{}, fmt.Errorf("status=%d body=%s", resp.StatusCode, strings.TrimSpace(string(body)))
	}

	var state gigState
	if err := json.NewDecoder(resp.Body).Decode(&state); err != nil {
		return gigState{}, err
	}
	return state, nil
}

func appendSocketEngineParams(base string) (string, error) {
	u, err := url.Parse(base)
	if err != nil {
		return "", err
	}

	if u.Scheme == "http" {
		u.Scheme = "ws"
	} else if u.Scheme == "https" {
		u.Scheme = "wss"
	} else if u.Scheme == "ws" || u.Scheme == "wss" {
		// Keep as-is.
	} else {
		return "", fmt.Errorf("unsupported socket scheme: %s", u.Scheme)
	}

	u.Path = strings.TrimRight(u.Path, "/") + "/socket.io/"
	q := u.Query()
	q.Set("EIO", "4")
	q.Set("transport", "websocket")
	u.RawQuery = q.Encode()

	return u.String(), nil
}

func deriveSocketURL(apiBase string) (string, error) {
	u, err := url.Parse(apiBase)
	if err != nil {
		return "", err
	}
	switch u.Scheme {
	case "http":
		u.Scheme = "ws"
	case "https":
		u.Scheme = "wss"
	case "ws", "wss":
	default:
		return "", fmt.Errorf("unsupported scheme: %s", u.Scheme)
	}
	u.Path = ""
	u.RawQuery = ""
	u.Fragment = ""
	return u.String(), nil
}

func parseProcessList(raw string) []string {
	parts := strings.Split(raw, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}

func getEnv(key, defaultValue string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return defaultValue
	}
	return value
}

func getEnvFloat(key string, defaultValue float64) float64 {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return defaultValue
	}
	parsed, err := strconv.ParseFloat(raw, 64)
	if err != nil {
		log.Printf("invalid float for %s=%q, using default %v", key, raw, defaultValue)
		return defaultValue
	}
	return parsed
}

func getEnvInt(key string, defaultValue int) int {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return defaultValue
	}
	parsed, err := strconv.Atoi(raw)
	if err != nil {
		log.Printf("invalid int for %s=%q, using default %d", key, raw, defaultValue)
		return defaultValue
	}
	return parsed
}

func getEnvBool(key string, defaultValue bool) bool {
	raw := strings.TrimSpace(strings.ToLower(os.Getenv(key)))
	if raw == "" {
		return defaultValue
	}

	switch raw {
	case "1", "true", "t", "yes", "y", "on":
		return true
	case "0", "false", "f", "no", "n", "off":
		return false
	default:
		log.Printf("invalid bool for %s=%q, using default %t", key, raw, defaultValue)
		return defaultValue
	}
}
