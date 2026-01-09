import { motion } from "framer-motion";

export function EndScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen w-screen bg-black flex flex-col items-center justify-center relative overflow-hidden"
    >
      {/* Celebration background */}
      <div className="absolute inset-0 bg-gradient-to-t from-orange-500/30 via-transparent to-transparent pointer-events-none" />

      {/* Trophy / celebration icon */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 150, damping: 15 }}
        className="text-9xl mb-8"
      >
        🏆
      </motion.div>

      {/* Thank you text */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="text-center px-8"
      >
        <h1 className="text-8xl font-black text-white mb-6">
          Thank You!
        </h1>
        <p className="text-4xl text-orange-500 font-bold mb-4">
          What a show!
        </p>
      </motion.div>

      {/* Logo */}
      <motion.img
        src="/logo/black with orange.png"
        alt="The Small Strings Logo"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="w-24 h-24 object-contain mt-12"
      />

      {/* Confetti-like particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, idx) => (
          <motion.div
            key={idx}
            className="absolute w-4 h-4 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              backgroundColor: idx % 2 === 0 ? '#f97316' : '#ffffff',
            }}
            initial={{ y: -20, opacity: 0 }}
            animate={{ 
              y: '100vh',
              opacity: [0, 1, 1, 0],
              rotate: [0, 360],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: 'linear',
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}
