import { useEffect, useRef, useState } from "react"
import "../../intro-film-style.css"

export function IntroScreenFilmStyle() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    audioRef.current = new Audio("/Walk-on v5.wav")
    audioRef.current.onplay = () => setIsPlaying(true)
    audioRef.current.play().catch((err) => {
      console.error("Failed to play audio:", err)
    })

    return () => {
      if (audioRef.current) {
        audioRef.current.onplay = null
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

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
            <g id="numbers" text-anchor="middle" className="no-select">
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
          <div id="logo-container-outer">
            <img src="/logo/black with white.png" alt="Logo" className="intro-logo" />
          </div>
      </div>}

    </>
  )
}
