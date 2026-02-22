//go:build !windows

package audio

import (
	"errors"
	"time"
)

var errUnsupported = errors.New("audio volume controls are only supported on Windows")

func GetMasterVolume() (float64, error) {
	return 0, errUnsupported
}

func GetVolumeStepInfoValues() (currentStep, stepCount uint32, err error) {
	return 0, 0, errUnsupported
}

func SetMasterVolume(level float64) error {
	_ = level
	return errUnsupported
}

func FadeTo(from, to float64, duration time.Duration) error {
	_, _, _ = from, to, duration
	return errUnsupported
}
