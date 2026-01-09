import { motion } from "framer-motion";

export function IntroScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen w-screen bg-black flex flex-col items-center justify-center relative overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-orange-500/20 via-transparent to-orange-500/20 pointer-events-none" />
      
      {/* Logo */}
      <motion.img
        src="/logo/black with orange.png"
        alt="The Small Strings Logo"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="w-40 h-40 object-contain mb-12"
      />

      {/* Intro text */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="text-center px-8"
      >
        <h1 className="text-7xl font-bold text-white mb-6">
          Get Ready!
        </h1>
        <p className="text-3xl text-orange-500 font-medium">
          The show is about to begin...
        </p>
      </motion.div>

      {/* Animated music notes */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-20 flex gap-8"
      >
        {['🎵', '🎶', '🎸', '🎶', '🎵'].map((emoji, idx) => (
          <motion.span
            key={idx}
            className="text-6xl"
            animate={{ 
              y: [0, -20, 0],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              delay: idx * 0.2,
              ease: 'easeInOut'
            }}
          >
            {emoji}
          </motion.span>
        ))}
      </motion.div>
    </motion.div>
  )
}
