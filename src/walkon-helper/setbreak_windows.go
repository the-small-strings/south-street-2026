//go:build windows

package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"time"
)

const (
	vkPlay         = 0xFA
	vkSpace        = 0x20
	vkPlayPause    = 0xB3
	vkControl      = 0x11
	vkRightArrow   = 0x27
	keyeventfKeyUp = 0x0002
)

var (
	user32         = syscall.NewLazyDLL("user32.dll")
	procKeybdEvent = user32.NewProc("keybd_event")
)

func launchQobuzAndPlay(cfg config) error {

	fmt.Println("Launching Qobuz")
	if err := launchQobuz(cfg.QobuzLaunchTarget); err != nil {
		return fmt.Errorf("launch qobuz: %w", err)
	}

	fmt.Println("Waiting for Qobuz window")
	if err := waitForQobuzWindow(cfg.ProcessNames, cfg.QobuzWindowTimeout, cfg.QobuzWindowPoll); err != nil {
		return fmt.Errorf("wait for qobuz window: %w", err)
	}

	fmt.Println("Bringing Qobuz window to foreground")
	if err := focusQobuzWindow(cfg.ProcessNames, cfg.QobuzFocusTimeout, cfg.QobuzWindowPoll); err != nil {
		return fmt.Errorf("focus qobuz window: %w", err)
	}

	fmt.Println("Waiting for Qobuz to become input-ready")
	if err := waitForQobuzInputReady(cfg.ProcessNames, cfg.QobuzWindowTimeout, cfg.QobuzWindowPoll); err != nil {
		return fmt.Errorf("wait for qobuz input readiness: %w", err)
	}

	fmt.Println("Sending Ctrl+RightArrow to trigger play of next track")
	if err := sendVKCtrlRightArrow(); err != nil {
		return fmt.Errorf("send keys: %w", err)
	}

	return nil
}

func restartQobuzAndPlay(cfg config) error {
	fmt.Println("Restarting Qobuz process before end-screen play")
	if err := killProcesses(cfg.ProcessNames); err != nil {
		return fmt.Errorf("kill qobuz process: %w", err)
	}
	if cfg.KillSettleDuration > 0 {
		time.Sleep(cfg.KillSettleDuration)
	}

	return launchQobuzAndPlay(cfg)
}

func launchQobuz(target string) error {
	target = strings.TrimSpace(target)
	if target == "" || strings.EqualFold(target, "qobuz://") {
		if shortcutPath, err := findQobuzShortcutPath(); err == nil {
			fmt.Printf("qobuz launch target resolved to shortcut: %s\n", shortcutPath)
			target = shortcutPath
		} else {
			return fmt.Errorf("failed to resolve shortcut")
		}
	}

	fmt.Printf("launching qobuz using target: %s\n", target)

	if err := launchTargetWithFallbacks(target); err != nil {
		return err
	}

	return nil
}

func launchTargetWithFallbacks(target string) error {
	attempts := []struct {
		name string
		args []string
	}{
		{
			name: "cmd-start",
			args: []string{"cmd", "/C", "start", "", target},
		},
		{
			name: "powershell-start-process",
			args: []string{"powershell", "-NoProfile", "-NonInteractive", "-Command", fmt.Sprintf("Start-Process -FilePath '%s'", escapePowerShellSingleQuotes(target))},
		},
		{
			name: "explorer",
			args: []string{"explorer.exe", target},
		},
	}

	var errorsSeen []string
	for _, attempt := range attempts {
		fmt.Printf("attempting qobuz launch via %s: %v\n", attempt.name, attempt.args)
		cmd := exec.Command(attempt.args[0], attempt.args[1:]...)
		output, err := cmd.CombinedOutput()
		trimmed := strings.TrimSpace(string(output))
		if err == nil {
			if trimmed != "" {
				fmt.Printf("qobuz launch attempt %s output: %s\n", attempt.name, trimmed)
			}
			fmt.Printf("qobuz launch attempt %s succeeded\n", attempt.name)
			return nil
		}

		fmt.Printf("qobuz launch attempt %s failed: %v output=%s\n", attempt.name, err, trimmed)
		errorsSeen = append(errorsSeen, fmt.Sprintf("%s: %v output=%s", attempt.name, err, trimmed))
	}

	return fmt.Errorf("all qobuz launch attempts failed (%s)", strings.Join(errorsSeen, " | "))
}

func waitForQobuzWindow(processNames []string, timeout, poll time.Duration) error {
	if timeout <= 0 {
		timeout = 15 * time.Second
	}
	if poll <= 0 {
		poll = 250 * time.Millisecond
	}

	normalized := normalizeProcessNames(processNames)
	deadline := time.Now().Add(timeout)

	for {
		visible, err := isAnyQobuzWindowVisible(normalized)
		if err == nil && visible {
			return nil
		}
		if time.Now().After(deadline) {
			if err != nil {
				return fmt.Errorf("timeout after %s (last check error: %v)", timeout, err)
			}
			return fmt.Errorf("timeout after %s", timeout)
		}
		time.Sleep(poll)
	}
}

func focusQobuzWindow(processNames []string, timeout, poll time.Duration) error {
	if timeout <= 0 {
		timeout = 3 * time.Second
	}
	if poll <= 0 {
		poll = 250 * time.Millisecond
	}

	normalized := normalizeProcessNames(processNames)
	deadline := time.Now().Add(timeout)
	var lastErr error

	for {
		focused, err := focusAnyQobuzWindow(normalized)
		if err == nil && focused {
			return nil
		}
		if err != nil {
			lastErr = err
		}

		if time.Now().After(deadline) {
			if lastErr != nil {
				return fmt.Errorf("timeout after %s (last attempt error: %v)", timeout, lastErr)
			}
			return fmt.Errorf("timeout after %s", timeout)
		}

		time.Sleep(poll)
	}
}

func waitForQobuzInputReady(processNames []string, timeout, poll time.Duration) error {
	if timeout <= 0 {
		timeout = 15 * time.Second
	}
	if poll <= 0 {
		poll = 250 * time.Millisecond
	}

	normalized := normalizeProcessNames(processNames)
	deadline := time.Now().Add(timeout)
	var lastErr error

	for {
		ready, err := isQobuzInputReady(normalized)
		if err == nil && ready {
			return nil
		}
		if err != nil {
			lastErr = err
		}

		if time.Now().After(deadline) {
			if lastErr != nil {
				return fmt.Errorf("timeout after %s (last check error: %v)", timeout, lastErr)
			}
			return fmt.Errorf("timeout after %s", timeout)
		}

		time.Sleep(poll)
	}
}

func focusAnyQobuzWindow(processNames []string) (bool, error) {
	if len(processNames) == 0 {
		processNames = []string{"Qobuz"}
	}

	quoted := make([]string, 0, len(processNames))
	for _, name := range processNames {
		quoted = append(quoted, fmt.Sprintf("'%s'", escapePowerShellSingleQuotes(name)))
	}

	psScript := fmt.Sprintf(`$names = @(%s)
$sig = @'
[DllImport("user32.dll")]
public static extern bool SetForegroundWindow(IntPtr hWnd);
[DllImport("user32.dll")]
public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
[DllImport("user32.dll")]
public static extern IntPtr GetForegroundWindow();
'@
Add-Type -Namespace Win32 -Name User32 -MemberDefinition $sig -ErrorAction SilentlyContinue | Out-Null
$shell = New-Object -ComObject WScript.Shell
$candidates = Get-Process -ErrorAction SilentlyContinue |
  Where-Object { $names -contains $_.ProcessName -and $_.MainWindowHandle -ne 0 } |
  Sort-Object StartTime -Descending
if ($null -eq $candidates -or $candidates.Count -eq 0) { exit 0 }

foreach ($proc in $candidates) {
  $hwnd = $proc.MainWindowHandle
  [Win32.User32]::ShowWindowAsync($hwnd, 9) | Out-Null
  Start-Sleep -Milliseconds 80
  [void]$shell.AppActivate($proc.Id)
  Start-Sleep -Milliseconds 80
  $shell.SendKeys('%%')
  Start-Sleep -Milliseconds 80
  [Win32.User32]::SetForegroundWindow($hwnd) | Out-Null
  Start-Sleep -Milliseconds 120
  if ([Win32.User32]::GetForegroundWindow() -eq $hwnd) {
    Write-Output '1'
    exit 0
  }
}
`, strings.Join(quoted, ","))

	cmd := exec.Command("powershell", "-NoProfile", "-NonInteractive", "-Command", psScript)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return false, fmt.Errorf("%v output=%s", err, strings.TrimSpace(string(output)))
	}

	return strings.TrimSpace(string(output)) == "1", nil
}

func isAnyQobuzWindowVisible(processNames []string) (bool, error) {
	if len(processNames) == 0 {
		processNames = []string{"Qobuz"}
	}

	quoted := make([]string, 0, len(processNames))
	for _, name := range processNames {
		quoted = append(quoted, fmt.Sprintf("'%s'", escapePowerShellSingleQuotes(name)))
	}

	script := fmt.Sprintf("$names = @(%s); $p = Get-Process -ErrorAction SilentlyContinue | Where-Object { $names -contains $_.ProcessName -and $_.MainWindowHandle -ne 0 } | Select-Object -First 1; if ($null -ne $p) { Write-Output '1' }", strings.Join(quoted, ","))
	cmd := exec.Command("powershell", "-NoProfile", "-NonInteractive", "-Command", script)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return false, fmt.Errorf("%v output=%s", err, strings.TrimSpace(string(output)))
	}

	return strings.TrimSpace(string(output)) == "1", nil
}

func isQobuzInputReady(processNames []string) (bool, error) {
	if len(processNames) == 0 {
		processNames = []string{"Qobuz"}
	}

	quoted := make([]string, 0, len(processNames))
	for _, name := range processNames {
		quoted = append(quoted, fmt.Sprintf("'%s'", escapePowerShellSingleQuotes(name)))
	}

	psScript := fmt.Sprintf(`$names = @(%s)
$sig = @'
[DllImport("user32.dll")]
public static extern IntPtr GetForegroundWindow();
'@
Add-Type -Namespace Win32 -Name User32 -MemberDefinition $sig -ErrorAction SilentlyContinue | Out-Null

$candidates = Get-Process -ErrorAction SilentlyContinue |
  Where-Object { $names -contains $_.ProcessName -and $_.MainWindowHandle -ne 0 }

if ($null -eq $candidates -or $candidates.Count -eq 0) { exit 0 }

$foreground = [Win32.User32]::GetForegroundWindow()
foreach ($proc in $candidates) {
  if ($proc.Responding -and $proc.MainWindowHandle -eq $foreground) {
    Write-Output '1'
    exit 0
  }
}
`, strings.Join(quoted, ","))

	cmd := exec.Command("powershell", "-NoProfile", "-NonInteractive", "-Command", psScript)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return false, fmt.Errorf("%v output=%s", err, strings.TrimSpace(string(output)))
	}

	return strings.TrimSpace(string(output)) == "1", nil
}

func findQobuzShortcutPath() (string, error) {
	appData := strings.TrimSpace(os.Getenv("APPDATA"))
	if appData == "" {
		return "", fmt.Errorf("APPDATA is not set")
	}

	startMenuPrograms := filepath.Join(appData, "Microsoft", "Windows", "Start Menu", "Programs", "Qobuz")
	entries, err := os.ReadDir(startMenuPrograms)
	if err != nil {
		return "", fmt.Errorf("read start menu programs directory: %w", err)
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		name := entry.Name()
		fmt.Printf("testing qobuz shortcut candidate: %s\n", name)
		lower := strings.ToLower(name)
		if strings.HasSuffix(lower, ".lnk") && lower == "qobuz.lnk" {
			selected := filepath.Join(startMenuPrograms, name)
			fmt.Printf("selected exact qobuz shortcut: %s\n", selected)
			return selected, nil
		}
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		name := entry.Name()
		lower := strings.ToLower(name)
		if strings.HasSuffix(lower, ".lnk") && strings.Contains(lower, "qobuz") {
			selected := filepath.Join(startMenuPrograms, name)
			fmt.Printf("selected fuzzy qobuz shortcut: %s\n", selected)
			return selected, nil
		}
	}

	return "", fmt.Errorf("qobuz shortcut not found in %s", startMenuPrograms)
}

func normalizeProcessNames(processNames []string) []string {
	result := make([]string, 0, len(processNames))
	seen := make(map[string]struct{})
	for _, name := range processNames {
		normalized := strings.TrimSpace(name)
		normalized = strings.TrimSuffix(normalized, ".exe")
		normalized = strings.TrimSuffix(normalized, ".EXE")
		if normalized == "" {
			continue
		}
		key := strings.ToLower(normalized)
		if _, exists := seen[key]; exists {
			continue
		}
		seen[key] = struct{}{}
		result = append(result, normalized)
	}
	if len(result) == 0 {
		return []string{"Qobuz"}
	}
	return result
}

func sendVKPlay() error {
	sendVirtualKey(vkPlay)
	return nil
}

func sendVKSpace() error {
	sendVirtualKey(vkSpace)
	return nil
}

func sendVKPlayPause() error {
	sendVirtualKey(vkPlayPause)
	return nil
}

func sendVKCtrlRightArrow() error {
	procKeybdEvent.Call(uintptr(vkControl), 0, 0, 0)
	time.Sleep(20 * time.Millisecond)
	procKeybdEvent.Call(uintptr(vkRightArrow), 0, 0, 0)
	time.Sleep(40 * time.Millisecond)
	procKeybdEvent.Call(uintptr(vkRightArrow), 0, uintptr(keyeventfKeyUp), 0)
	time.Sleep(20 * time.Millisecond)
	procKeybdEvent.Call(uintptr(vkControl), 0, uintptr(keyeventfKeyUp), 0)
	return nil
}

func sendVirtualKey(vk byte) {
	procKeybdEvent.Call(uintptr(vk), 0, 0, 0)
	time.Sleep(40 * time.Millisecond)
	procKeybdEvent.Call(uintptr(vk), 0, uintptr(keyeventfKeyUp), 0)
}

func escapePowerShellSingleQuotes(input string) string {
	return strings.ReplaceAll(input, "'", "''")
}
