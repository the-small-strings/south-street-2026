import { motion } from "framer-motion";

export function WelcomeScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen w-screen flex flex-col relative overflow-hidden"
    >
      {/* Top half - Orange background with The Small Strings */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
        className="flex-1 bg-orange-500 flex items-center justify-center"
      >
        <div className="text-center px-12">
          <motion.h1
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-[10rem] font-black text-black leading-none tracking-tight"
            style={{ 
              textShadow: '4px 4px 0 rgba(0,0,0,0.1)',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
          >
            THE SMALL STRINGS
          </motion.h1>
        </div>
      </motion.div>

      {/* Divider with VS - styled like a song battle */}
      <div className="relative h-0 z-20">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 15 }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <div className="bg-white text-black text-6xl font-black px-12 py-6 rounded-full shadow-2xl border-4 border-black">
            vs
          </div>
        </motion.div>
      </div>

      {/* Bottom half - Black background with The Audience */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
        className="flex-1 bg-black flex items-center justify-center"
      >
        <div className="text-center px-12">
          <motion.h1
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-[10rem] font-black text-white leading-none tracking-tight"
            style={{ 
              textShadow: '4px 4px 0 rgba(251,146,60,0.3)',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
          >
            THE AUDIENCE
          </motion.h1>
        </div>
      </motion.div>

      {/* Logo overlay in the center */}
      {/* <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, type: 'spring', stiffness: 150, damping: 20 }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
      >
        <motion.img
          src="/logo/black with orange.png"
          alt="The Small Strings Logo"
          className="w-32 h-32 object-contain drop-shadow-2xl"
          style={{ filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.5))' }}
          animate={{ 
            scale: [1, 1.05, 1],
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: 'easeInOut' 
          }}
        />
      </motion.div> */}
    </motion.div>
  )
}
