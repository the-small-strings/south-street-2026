import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '@/hooks/use-socket'
import type { GigState, BattleSong, SongPage } from '@/lib/types'
import * as api from '@/lib/api'
import { TestScreen } from './audience/TestScreen'
import { WelcomeScreen } from './audience/WelcomeScreen'
// GetReady screen variants - uncomment one to use:
// import { GetReadyScreen } from './audience/GetReadyScreen'                             // Simple fade
// import { GetReadyScreenSwirl as GetReadyScreen } from './audience/GetReadyScreenSwirl'       // Drain swirl
// import { GetReadyScreenPixelate as GetReadyScreen } from './audience/GetReadyScreenPixelate' // Pixelate + fade
// import { GetReadyScreenLiquid as GetReadyScreen } from './audience/GetReadyScreenLiquid'     // Liquid drip
// import { GetReadyScreenShatter as GetReadyScreen } from './audience/GetReadyScreenShatter'   // Glass shatter
// import { GetReadyScreenCRT as GetReadyScreen } from './audience/GetReadyScreenCRT'           // CRT power off
// import { GetReadyScreenRipple as GetReadyScreen } from './audience/GetReadyScreenRipple'     // Water ripple
import { GetReadyScreenVCRCRT as GetReadyScreen } from './audience/GetReadyScreenVCRCRT'           // VCR effect followed by CRT
// import { GetReadyScreenBlackHole as GetReadyScreen } from './audience/GetReadyScreenBlackHole' // Black hole
// GetReadyAgain screen variants - uncomment one to use:
// import { GetReadyAgainScreen } from './audience/GetReadyAgainScreen'                             // Typing + fade
// import { GetReadyAgainScreenPixelate as GetReadyAgainScreen } from './audience/GetReadyAgainScreenPixelate' // Pixelate + fade (starts after typing endpoint)
import { GetReadyAgainScreenCRT as GetReadyAgainScreen } from './audience/GetReadyAgainScreenCRT'           // CRT power off (starts after typing endpoint)
import { FixedSongDisplay } from './audience/FixedSongDisplay'
import { BattleSongDisplay } from './audience/BattleSongDisplay'
import { IntroScreenFilmStyle } from './audience/IntroScreenFilmStyle'
import { EndScreen } from './audience/EndScreen'
import { SetBreakScreen } from './audience/SetBreakScreen'
import { DisconnectedIndicator } from '@/components/DisconnectedIndicator'

export function Audience() {
  const [currentInfo, setCurrentInfo] = useState<GigState | null>(null)
  const [loading, setLoading] = useState(true)

  // Handle socket updates
  const handleGameStateUpdate = useCallback((info: GigState) => {
    setCurrentInfo(info)
  }, [])

  // Connect to socket
  const { isConnected } = useSocket({
    onGameStateUpdate: handleGameStateUpdate,
  })

  // Load initial state
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        setLoading(true)
        const current = await api.getCurrentGigState()
        setCurrentInfo(current)
      } catch (err) {
        console.error('Failed to load game state:', err)
      } finally {
        setLoading(false)
      }
    }
    loadInitialState()
  }, [])

  if (loading) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-orange-500 text-6xl font-bold"
        >
          Loading...
        </motion.div>
      </div>
    )
  }

  if (!currentInfo) {
    return <WelcomeScreen />
  }

  const { currentPage } = currentInfo
  const pageType = currentPage.type
  const currentSong = currentPage.type === 'song' ? (currentPage as SongPage).song : null
  const songNumber = currentPage.type === 'song' ? (currentPage as SongPage).songNumber : 0
  const songRevealed = currentPage.type === 'song' ? (currentPage as SongPage).songRevealed : false
  const introAnimationStarted = currentPage.type === 'intro' ? currentPage.introAnimationStarted ?? false : false

  console.log('Rendering Audience page:', pageType, currentSong, songNumber, 'revealed:', songRevealed, 'introAnimationStarted:', introAnimationStarted);
  return (
    <div className="h-screen w-screen overflow-hidden">
      <AnimatePresence mode="wait">
        {pageType === 'test' && <TestScreen key="test" />}
        {pageType === 'welcome' && <WelcomeScreen key="welcome" />}
        {pageType === 'getReady' && <GetReadyScreen key="getReady" />}
        {pageType === 'walkOnPrep' && <div key="walkOnPrep" className="h-screen w-screen bg-black" />}
        {/* {pageType === 'intro' && <IntroScreenCopilot key="intro" />} */}
        {pageType === 'intro' && <IntroScreenFilmStyle key="intro" introAnimationStarted={introAnimationStarted} />}
        {pageType === 'setBreak' && <SetBreakScreen key="setBreak" />}
        {pageType === 'getReadyAgain' && <GetReadyAgainScreen key="getReadyAgain" />}
        {pageType === 'comeBackPrep' && <div key="comeBackPrep" className="h-screen w-screen bg-black" />}
        {pageType === 'end' && <EndScreen key="end" />}
        {pageType === 'end2' && <EndScreen key="end2" />}
        {pageType === 'song' && currentSong && (
          currentSong.type === 'fixed' ? (
            <FixedSongDisplay 
              key={`fixed-${songNumber}`} 
              name={currentSong.name} 
              songRevealed={songRevealed}
            />
          ) : (
            <BattleSongDisplay
              key={`battle-${songNumber}`}
              battle={currentSong}
            />
          )
        )}
      </AnimatePresence>
      <DisconnectedIndicator isConnected={isConnected} position="bottom-right" />
    </div>
  )
}
