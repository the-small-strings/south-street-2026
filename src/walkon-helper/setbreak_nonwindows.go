//go:build !windows

package main

import "errors"

func launchQobuzAndPlay(cfg config) error {
	_ = cfg
	return errors.New("set-break qobuz launch/play is only supported on Windows")
}

func prelaunchQobuz(cfg config) error {
	_ = cfg
	return errors.New("qobuz prelaunch is only supported on Windows")
}

func playQobuz(cfg config) error {
	_ = cfg
	return errors.New("qobuz playback trigger is only supported on Windows")
}

func restartQobuzAndPlay(cfg config) error {
	_ = cfg
	return errors.New("end-screen qobuz restart/play is only supported on Windows")
}
