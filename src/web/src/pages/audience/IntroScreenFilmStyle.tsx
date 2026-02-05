import { useEffect, useRef, useState, useCallback } from "react"
import "../../intro-film-style.css"
import * as api from "@/lib/api"

// Timing constant for when to show logo-container-outer after audio starts (in ms)
// This should match when the audio naturally transitions to the logo reveal
const LOGO_REVEAL_DELAY_MS = 15500
// Duration for audio fade out when triggered by API (in ms)
const AUDIO_FADE_DURATION_MS = 3000
// How many seconds before the end of the song to notify the API
const SONG_COMPLETE_THRESHOLD_SECONDS = 2

interface IntroScreenFilmStyleProps {
  introAnimationStarted?: boolean
}

export function IntroScreenFilmStyle({ introAnimationStarted = false }: IntroScreenFilmStyleProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showLogoOuter, setShowLogoOuter] = useState(introAnimationStarted)
  const [triggeredManually, setTriggeredManually] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Track if we triggered the animation locally (via timer) - used to know not to fade audio on natural playback
  const triggeredLocallyRef = useRef(false)
  // Track if we've already notified the API that the song is near completion
  const hasNotifiedSongCompleteRef = useRef(false)

  // Fade out audio over specified duration
  const fadeOutAudio = useCallback(() => {
    if (!audioRef.current || fadeIntervalRef.current) return // Don't start if already fading
    
    const audio = audioRef.current
    const startVolume = audio.volume
    const fadeSteps = 30 // Number of steps for smooth fade
    const stepDuration = AUDIO_FADE_DURATION_MS / fadeSteps
    const volumeStep = startVolume / fadeSteps
    
    fadeIntervalRef.current = setInterval(() => {
      if (audioRef.current) {
        const newVolume = Math.max(0, audioRef.current.volume - volumeStep)
        audioRef.current.volume = newVolume
        if (newVolume <= 0) {
          if (fadeIntervalRef.current) {
            clearInterval(fadeIntervalRef.current)
            fadeIntervalRef.current = null
          }
          audioRef.current.pause()
        }
      }
    }, stepDuration)
  }, [])

  // When introAnimationStarted prop changes from parent (via API/socket)
  useEffect(() => {
    if (introAnimationStarted) {
      // Band triggered - show logo (if not showing), fade audio, and trigger orange fade
      if (!showLogoOuter) {
        setShowLogoOuter(true)
      }
      setTriggeredManually(true)
      // Cancel any pending timer
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      // Fade out the audio (unless already fading)
      fadeOutAudio()
    }
  }, [introAnimationStarted, showLogoOuter, fadeOutAudio])

  useEffect(() => {
    audioRef.current = new Audio("/Walk-on v5.wav")
    
    // Track when the song is near the end to notify the API
    audioRef.current.ontimeupdate = () => {
      if (audioRef.current && !hasNotifiedSongCompleteRef.current) {
        const timeRemaining = audioRef.current.duration - audioRef.current.currentTime
        if (timeRemaining <= SONG_COMPLETE_THRESHOLD_SECONDS && timeRemaining > 0) {
          hasNotifiedSongCompleteRef.current = true
          // Notify API that song is nearly complete - pressing next now will advance
          api.notifyIntroSongCompleted().catch((err) => {
            console.error("Failed to notify intro song completed:", err)
          })
        }
      }
    }
    
    audioRef.current.onplay = () => {
      setIsPlaying(true)
      
      // Only start timer if animation hasn't been triggered yet
      if (!introAnimationStarted && !showLogoOuter) {
        timerRef.current = setTimeout(() => {
          // Mark that we triggered this locally
          triggeredLocallyRef.current = true
          setShowLogoOuter(true)
        }, LOGO_REVEAL_DELAY_MS)
      }
    }
    audioRef.current.play().catch((err) => {
      console.error("Failed to play audio:", err)
    })

    return () => {
      if (audioRef.current) {
        audioRef.current.onplay = null
        audioRef.current.ontimeupdate = null
        audioRef.current.pause()
        audioRef.current = null
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current)
        fadeIntervalRef.current = null
      }
    }
  }, []) // Only run on mount

  return (
    <>

      {isPlaying && <div id="film-container">
        <div className="animated-flicker">
          <svg id="film-mask" version="1.1" xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink" xmlSpace="preserve"
            width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 400 225">
            <rect className="rectangle01" width="400" height="225" />
            <line id="line-h" className="line01" x1="0" y1="112.5" x2="400" y2="112.5" />
            <line id="line-v" className="line02" x1="200" y1="0" x2="200" y2="225" />
          </svg>
          <svg id="film-countdown" version="1.1" xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink" xmlSpace="preserve"
            width="100%" height="100%" viewBox="0 0 400 225">
            <circle id="circle-outer" className="circle01" cx="200" cy="112.5" r="95" />
            <circle id="circle-inner" className="circle01" cx="200" cy="112.5" r="85" />
            <circle className="circle02 animated-rotate" cx="200" cy="112.5" r="494.5" />
            <g id="numbers" textAnchor="middle" className="no-select">
              <text id="animated-text1" x="200.5" y="155">5</text>
              <text id="animated-text2" x="200.5" y="155">4</text>
              <text id="animated-text3" x="200.5" y="155">3</text>
              <text id="animated-text4" x="200.5" y="155">2</text>
              <text id="animated-text5" x="200.5" y="155">1</text>
            </g>
          </svg>
          <div id="logo-container">
            <img src="/logo/black with white.png" alt="Logo" className="intro-logo" />
          </div>
        </div>
        {showLogoOuter && (
          <div id="logo-container-outer" className={`logo-container-outer-visible${triggeredManually ? ' manual-trigger' : ''}`}>
            <img src="/logo/black with white.png" alt="Logo" className="intro-logo" />
            <img src="/logo/black with orange.png" alt="Logo" className="intro-logo intro-logo-orange" />
          </div>
        )}
      </div>}

    </>
  )
}
