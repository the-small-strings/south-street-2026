import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface FixedSongDisplayProps {
  name: string;
  onSkipReveal?: () => void;
  skipRevealTriggered?: boolean;
}

const REVEAL_DELAY_MS = 5000;

export function FixedSongDisplay({ name, skipRevealTriggered }: FixedSongDisplayProps) {
  const [showSong, setShowSong] = useState(false);

  useEffect(() => {
    // If skip was triggered, show immediately
    if (skipRevealTriggered) {
      setShowSong(true);
      return;
    }

    // Otherwise wait for the delay
    const timer = setTimeout(() => {
      setShowSong(true);
    }, REVEAL_DELAY_MS);

    return () => clearTimeout(timer);
  }, [skipRevealTriggered]);

  // Also respond to skip trigger changes after mount
  useEffect(() => {
    if (skipRevealTriggered) {
      setShowSong(true);
    }
  }, [skipRevealTriggered]);

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
          animate={{ opacity: showSong ? 1 : 0, y: showSong ? 0 : 20 }}
          transition={{ duration: 5, ease: 'linear' }}
          className="text-9xl font-bold text-white leading-tight audience-song-title"
          style={{ textShadow: '0 4px 20px rgba(251, 146, 60, 0.3)' }}
        >
          {name}
        </motion.h1>
      </div>
    </motion.div>
  )
}