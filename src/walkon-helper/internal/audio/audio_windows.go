//go:build windows

package audio

import (
	"fmt"
	"syscall"
	"time"
	"unsafe"

	"github.com/go-ole/go-ole"
)

// GUIDs for Windows Core Audio API
var (
	CLSID_MMDeviceEnumerator = ole.NewGUID("{BCDE0395-E52F-467C-8E3D-C4579291692E}")
	IID_IMMDeviceEnumerator  = ole.NewGUID("{A95664D2-9614-4F35-A746-DE8DB63617E6}")
	IID_IAudioEndpointVolume = ole.NewGUID("{5CDF2C82-841E-4546-9722-0CF74078229A}")
)

const (
	eRender  = 0
	eConsole = 0
)

// COM interface structures
type iMMDeviceEnumeratorVtbl struct {
	QueryInterface                         uintptr
	AddRef                                 uintptr
	Release                                uintptr
	EnumAudioEndpoints                     uintptr
	GetDefaultAudioEndpoint                uintptr
	GetDevice                              uintptr
	RegisterEndpointNotificationCallback   uintptr
	UnregisterEndpointNotificationCallback uintptr
}

type iMMDeviceEnumerator struct {
	vtbl *iMMDeviceEnumeratorVtbl
}

func (e *iMMDeviceEnumerator) Release() {
	syscall.SyscallN(e.vtbl.Release, uintptr(unsafe.Pointer(e)))
}

func (e *iMMDeviceEnumerator) GetDefaultAudioEndpoint(dataFlow, role uint32, device **iMMDevice) int32 {
	ret, _, _ := syscall.SyscallN(
		e.vtbl.GetDefaultAudioEndpoint,
		uintptr(unsafe.Pointer(e)),
		uintptr(dataFlow),
		uintptr(role),
		uintptr(unsafe.Pointer(device)),
	)
	return int32(ret)
}

type iMMDeviceVtbl struct {
	QueryInterface    uintptr
	AddRef            uintptr
	Release           uintptr
	Activate          uintptr
	OpenPropertyStore uintptr
	GetId             uintptr
	GetState          uintptr
}

type iMMDevice struct {
	vtbl *iMMDeviceVtbl
}

func (d *iMMDevice) Release() {
	syscall.SyscallN(d.vtbl.Release, uintptr(unsafe.Pointer(d)))
}

func (d *iMMDevice) Activate(iid *ole.GUID, clsCtx uint32, params unsafe.Pointer, object unsafe.Pointer) int32 {
	ret, _, _ := syscall.SyscallN(
		d.vtbl.Activate,
		uintptr(unsafe.Pointer(d)),
		uintptr(unsafe.Pointer(iid)),
		uintptr(clsCtx),
		uintptr(params),
		uintptr(object),
	)
	return int32(ret)
}

type iAudioEndpointVolumeVtbl struct {
	QueryInterface                uintptr
	AddRef                        uintptr
	Release                       uintptr
	RegisterControlChangeNotify   uintptr
	UnregisterControlChangeNotify uintptr
	GetChannelCount               uintptr
	SetMasterVolumeLevel          uintptr
	GetMasterVolumeLevel          uintptr
	SetMasterVolumeLevelScalar    uintptr
	GetMasterVolumeLevelScalar    uintptr
	SetChannelVolumeLevel         uintptr
	GetChannelVolumeLevel         uintptr
	SetChannelVolumeLevelScalar   uintptr
	GetChannelVolumeLevelScalar   uintptr
	SetMute                       uintptr
	GetMute                       uintptr
	GetVolumeStepInfo             uintptr
	VolumeStepUp                  uintptr
	VolumeStepDown                uintptr
	QueryHardwareSupport          uintptr
	GetVolumeRange                uintptr
}

type iAudioEndpointVolume struct {
	vtbl *iAudioEndpointVolumeVtbl
}

func (v *iAudioEndpointVolume) Release() {
	syscall.SyscallN(v.vtbl.Release, uintptr(unsafe.Pointer(v)))
}

func (v *iAudioEndpointVolume) GetMasterVolumeLevelScalar(level *float32) int32 {
	ret, _, _ := syscall.SyscallN(
		v.vtbl.GetMasterVolumeLevelScalar,
		uintptr(unsafe.Pointer(v)),
		uintptr(unsafe.Pointer(level)),
	)
	return int32(ret)
}

// GetVolumeStepInfo gets current step and total step count
func (v *iAudioEndpointVolume) GetVolumeStepInfo(currentStep, stepCount *uint32) int32 {
	ret, _, _ := syscall.SyscallN(
		v.vtbl.GetVolumeStepInfo,
		uintptr(unsafe.Pointer(v)),
		uintptr(unsafe.Pointer(currentStep)),
		uintptr(unsafe.Pointer(stepCount)),
	)
	return int32(ret)
}

// VolumeStepUp increases volume by one step
func (v *iAudioEndpointVolume) VolumeStepUp(eventContext *ole.GUID) int32 {
	ret, _, _ := syscall.SyscallN(
		v.vtbl.VolumeStepUp,
		uintptr(unsafe.Pointer(v)),
		uintptr(unsafe.Pointer(eventContext)),
	)
	return int32(ret)
}

// VolumeStepDown decreases volume by one step
func (v *iAudioEndpointVolume) VolumeStepDown(eventContext *ole.GUID) int32 {
	ret, _, _ := syscall.SyscallN(
		v.vtbl.VolumeStepDown,
		uintptr(unsafe.Pointer(v)),
		uintptr(unsafe.Pointer(eventContext)),
	)
	return int32(ret)
}

var (
	modOle32             = syscall.NewLazyDLL("ole32.dll")
	procCoInitialize     = modOle32.NewProc("CoInitialize")
	procCoUninitialize   = modOle32.NewProc("CoUninitialize")
	procCoCreateInstance = modOle32.NewProc("CoCreateInstance")
)

func withAudioEndpointVolume(fn func(aev *iAudioEndpointVolume) error) error {
	// Initialize COM
	ret, _, _ := procCoInitialize.Call(0)
	if ret != 0 && ret != 1 { // S_OK or S_FALSE
		return fmt.Errorf("CoInitialize failed: 0x%08x", ret)
	}
	defer procCoUninitialize.Call()

	// Create device enumerator
	var enumerator *iMMDeviceEnumerator
	ret, _, _ = procCoCreateInstance.Call(
		uintptr(unsafe.Pointer(CLSID_MMDeviceEnumerator)),
		0,
		0x17, // CLSCTX_ALL
		uintptr(unsafe.Pointer(IID_IMMDeviceEnumerator)),
		uintptr(unsafe.Pointer(&enumerator)),
	)
	if ret != 0 {
		return fmt.Errorf("CoCreateInstance MMDeviceEnumerator failed: 0x%08x", ret)
	}
	defer enumerator.Release()

	// Get default audio endpoint
	var device *iMMDevice
	hr := enumerator.GetDefaultAudioEndpoint(eRender, eConsole, &device)
	if hr != 0 {
		return fmt.Errorf("GetDefaultAudioEndpoint failed: 0x%08x", hr)
	}
	defer device.Release()

	// Activate IAudioEndpointVolume
	var aev *iAudioEndpointVolume
	hr = device.Activate(IID_IAudioEndpointVolume, 0x17, nil, unsafe.Pointer(&aev))
	if hr != 0 {
		return fmt.Errorf("Activate IAudioEndpointVolume failed: 0x%08x", hr)
	}
	defer aev.Release()

	return fn(aev)
}

func GetMasterVolume() (float64, error) {
	var level float32
	err := withAudioEndpointVolume(func(aev *iAudioEndpointVolume) error {
		hr := aev.GetMasterVolumeLevelScalar(&level)
		if hr != 0 {
			return fmt.Errorf("GetMasterVolumeLevelScalar failed: 0x%08x", hr)
		}
		return nil
	})
	if err != nil {
		return 0, err
	}
	return clamp01(float64(level)), nil
}

// GetVolumeStepInfoValues returns current step and total step count
func GetVolumeStepInfoValues() (currentStep, stepCount uint32, err error) {
	err = withAudioEndpointVolume(func(aev *iAudioEndpointVolume) error {
		hr := aev.GetVolumeStepInfo(&currentStep, &stepCount)
		if hr != 0 {
			return fmt.Errorf("GetVolumeStepInfo failed: 0x%08x", hr)
		}
		return nil
	})
	return
}

// SetMasterVolume sets volume to a target level (0.0-1.0) using step-based API
func SetMasterVolume(targetLevel float64) error {
	targetLevel = clamp01(targetLevel)

	return withAudioEndpointVolume(func(aev *iAudioEndpointVolume) error {
		var currentStep, stepCount uint32
		hr := aev.GetVolumeStepInfo(&currentStep, &stepCount)
		if hr != 0 {
			return fmt.Errorf("GetVolumeStepInfo failed: 0x%08x", hr)
		}

		// Calculate target step (stepCount-1 is max)
		targetStep := uint32(targetLevel * float64(stepCount-1))
		if targetStep >= stepCount {
			targetStep = stepCount - 1
		}

		// Step up or down to reach target
		for currentStep < targetStep {
			hr = aev.VolumeStepUp(nil)
			if hr != 0 {
				return fmt.Errorf("VolumeStepUp failed: 0x%08x", hr)
			}
			currentStep++
		}
		for currentStep > targetStep {
			hr = aev.VolumeStepDown(nil)
			if hr != 0 {
				return fmt.Errorf("VolumeStepDown failed: 0x%08x", hr)
			}
			currentStep--
		}

		return nil
	})
}

func FadeTo(from, to float64, duration time.Duration) error {
	from = clamp01(from)
	to = clamp01(to)
	if duration <= 0 {
		return SetMasterVolume(to)
	}

	// Get step info once to calculate how many steps we have
	_, stepCount, err := GetVolumeStepInfoValues()
	if err != nil {
		return fmt.Errorf("GetVolumeStepInfo failed: %w", err)
	}

	fromStep := int(from * float64(stepCount-1))
	toStep := int(to * float64(stepCount-1))
	stepsNeeded := abs(toStep - fromStep)

	if stepsNeeded == 0 {
		return nil
	}

	stepDuration := duration / time.Duration(stepsNeeded)
	if stepDuration < 10*time.Millisecond {
		stepDuration = 10 * time.Millisecond
	}

	stepDown := toStep < fromStep

	return withAudioEndpointVolume(func(aev *iAudioEndpointVolume) error {
		for i := 0; i < stepsNeeded; i++ {
			var hr int32
			if stepDown {
				hr = aev.VolumeStepDown(nil)
			} else {
				hr = aev.VolumeStepUp(nil)
			}
			if hr != 0 {
				return fmt.Errorf("volume step failed: 0x%08x", hr)
			}
			time.Sleep(stepDuration)
		}
		return nil
	})
}

func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

func clamp01(v float64) float64 {
	if v < 0 {
		return 0
	}
	if v > 1 {
		return 1
	}
	return v
}
