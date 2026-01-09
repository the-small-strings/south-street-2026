import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '@/hooks/use-socket'
import type { CurrentSongInfo, BattleSong } from '@/lib/types'
import * as api from '@/lib/api'
import { WelcomeScreen } from './audience/WelcomeScreen'
import { FixedSongDisplay } from './audience/FixedSongDisplay'
import { BattleSongDisplay } from './audience/BattleSongDisplay'
import { IntroScreen } from './audience/IntroScreen'

export function Audience() {
  const [currentInfo, setCurrentInfo] = useState<CurrentSongInfo | null>(null)
  const [loading, setLoading] = useState(true)

  // Handle socket updates
  const handleGameStateUpdate = useCallback((info: CurrentSongInfo) => {
    setCurrentInfo(info)
  }, [])

  // Connect to socket
  useSocket(handleGameStateUpdate)

  // Load initial state
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        setLoading(true)
        const current = await api.getCurrentSongInfo()
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

  const { currentSong, songNumber, pageType } = currentInfo

  return (
    <div className="h-screen w-screen overflow-hidden">
      <AnimatePresence mode="wait">
        {pageType === 'welcome' && <WelcomeScreen key="welcome" />}
        {pageType === 'intro' && <IntroScreen key="intro" />}
        {pageType === 'end' && <EndScreen key="end" />}
        {pageType === 'song' && currentSong && (
          currentSong.type === 'fixed' ? (
            <FixedSongDisplay key={`fixed-${songNumber}`} name={currentSong.name} />
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
