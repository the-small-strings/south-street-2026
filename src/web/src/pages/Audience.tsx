import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '@/hooks/use-socket'
import type { GigState, BattleSong, SongPage } from '@/lib/types'
import * as api from '@/lib/api'
import { TestScreen } from './audience/TestScreen'
import { WelcomeScreen } from './audience/WelcomeScreen'
import { FixedSongDisplay } from './audience/FixedSongDisplay'
import { BattleSongDisplay } from './audience/BattleSongDisplay'
import { IntroScreenCopilot } from './audience/IntroScreenCopilot'
import { IntroScreenFilmStyle } from './audience/IntroScreenFilmStyle'
import { EndScreen } from './audience/EndScreen'
import { SetBreakScreen } from './audience/SetBreakScreen'

export function Audience() {
  const [currentInfo, setCurrentInfo] = useState<GigState | null>(null)
  const [loading, setLoading] = useState(true)

  // Handle socket updates
  const handleGameStateUpdate = useCallback((info: GigState) => {
    setCurrentInfo(info)
  }, [])

  // Connect to socket
  useSocket({
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

  console.log('Rendering Audience page:', pageType, currentSong, songNumber, 'revealed:', songRevealed);
  return (
    <div className="h-screen w-screen overflow-hidden">
      <AnimatePresence mode="wait">
        {pageType === 'test' && <TestScreen key="test" />}
        {pageType === 'welcome' && <WelcomeScreen key="welcome" />}
        {/* {pageType === 'intro' && <IntroScreenCopilot key="intro" />} */}
        {pageType === 'intro' && <IntroScreenFilmStyle key="intro" />}
        {pageType === 'setBreak' && <SetBreakScreen key="setBreak" />}
        {pageType === 'end' && <EndScreen key="end" />}
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
    </div>
  )
}
