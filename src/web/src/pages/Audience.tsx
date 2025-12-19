import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '@/hooks/use-socket'
import type { CurrentSongInfo, BattleSong } from '@/lib/types'
import * as api from '@/lib/api'

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

  if (!currentInfo || !currentInfo.currentSong) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="text-9xl mb-8">🎵</div>
          <div className="text-7xl font-bold text-orange-500">Welcome to the Show!</div>
        </motion.div>
      </div>
    )
  }

  const { currentSong, songNumber } = currentInfo

  return (
    <div className="h-screen w-screen overflow-hidden">
      <AnimatePresence mode="wait">
        {currentSong.type === 'fixed' ? (
          <FixedSongDisplay key={`fixed-${songNumber}`} name={currentSong.name} />
        ) : (
          <BattleSongDisplay
            key={`battle-${songNumber}`}
            battle={currentSong}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function FixedSongDisplay({ name }: { name: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -50 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="h-full w-full bg-black flex items-center justify-center"
    >
      <div className="text-center w-full px-8">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-9xl font-bold text-white leading-tight audience-song-title"
          style={{ textShadow: '0 4px 20px rgba(251, 146, 60, 0.3)' }}
        >
          {name}
        </motion.h1>
      </div>
    </motion.div>
  )
}

function BattleSongDisplay({ battle }: { battle: BattleSong }) {
  const isDecided = !!battle.selected

  if (isDecided) {
    // Show the winning option with expanding animation
    const winningSongs = battle.selected === 'A' ? battle.optionA : battle.optionB
    const isOptionA = battle.selected === 'A'

    return (
      <div className="h-full w-full flex flex-col overflow-hidden">
        {/* Top half - expands if Option A wins */}
        <motion.div
          initial={{ flex: 1 }}
          animate={{ flex: isOptionA ? 1 : 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="bg-orange-500 flex items-center justify-center overflow-hidden"
        >
          {isOptionA && (
            <div className="text-center w-full px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-6 battle-list"
              >
                {winningSongs.map((song, idx) => (
                  <motion.h1
                    key={song}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + idx * 0.1 }}
                    className="text-8xl font-bold text-black audience-song-title"
                  >
                    {song}
                  </motion.h1>
                ))}
              </motion.div>
            </div>
          )}
        </motion.div>

        {/* Bottom half - expands if Option B wins */}
        <motion.div
          initial={{ flex: 1 }}
          animate={{ flex: isOptionA ? 0 : 1 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="bg-black flex items-center justify-center overflow-hidden"
        >
          {!isOptionA && (
            <div className="text-center w-full px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-6 battle-list"
              >
                {winningSongs.map((song, idx) => (
                  <motion.h1
                    key={song}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + idx * 0.1 }}
                    className="text-8xl font-bold text-white audience-song-title"
                  >
                    {song}
                  </motion.h1>
                ))}
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    )
  }

  // Show both options for undecided battle - split screen vertically
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full w-full flex flex-col"
    >
      {/* Top half - Orange background with black text */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="flex-1 bg-orange-500 flex items-center justify-center"
      >
        <div className="text-center px-12">
          <div className="space-y-4">
            {battle.optionA.map((song, idx) => (
              <motion.div
                key={song}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className="text-8xl font-bold text-black audience-song-battle-title"
              >
                {song}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Divider with VS */}
      <div className="relative h-0">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-white text-black text-5xl font-black px-10 py-5 rounded-full shadow-2xl border-4 border-black song-battle-vs"
        >
          {/* ⚔️ VS */} vs
        </motion.div>
      </div>

      {/* Bottom half - Black background with white text */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="flex-1 bg-black flex items-center justify-center"
      >
        <div className="text-center px-12">
          <div className="space-y-4">
            {battle.optionB.map((song, idx) => (
              <motion.div
                key={song}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className="text-8xl font-bold text-white audience-song-battle-title"
              >
                {song}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
