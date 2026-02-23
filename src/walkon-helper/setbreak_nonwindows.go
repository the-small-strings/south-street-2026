//go:build !windows

package main

import "errors"

func launchQobuzAndPlay(cfg config) error {
	_ = cfg
	return errors.New("set-break qobuz launch/play is only supported on Windows")
}
