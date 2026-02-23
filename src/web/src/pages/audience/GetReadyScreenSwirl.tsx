import { motion } from "framer-motion";

export function GetReadyScreenSwirl() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen w-screen relative overflow-hidden bg-black"
    >
      {/* Content that swirls down like going down a drain */}
      <motion.div
        className="h-full w-full flex flex-col"
        initial={{ 
          scale: 1, 
          rotate: 0, 
          x: 0, 
          y: 0,
          filter: 'blur(0px)'
        }}
        animate={{ 
          scale: 0, 
          rotate: 720, 
          x: 0, 
          y: '50vh',
          filter: 'blur(8px)'
        }}
        transition={{ 
          duration: 2.5, 
          ease: [0.4, 0, 0.2, 1],
          scale: { duration: 2.5, ease: [0.55, 0, 1, 0.45] },
          rotate: { duration: 2.5, ease: 'easeIn' },
          y: { duration: 2.5, ease: [0.55, 0, 1, 0.45] },
          filter: { duration: 1.5, delay: 1 }
        }}
        style={{ transformOrigin: 'center center' }}
      >
        {/* Top half - Orange background with The Small Strings */}
        <div className="flex-1 bg-orange-500 flex items-center justify-center">
          <div className="text-center px-12">
            <h1
              className="text-[10rem] font-black text-black leading-none tracking-tight"
              style={{ 
                textShadow: '4px 4px 0 rgba(0,0,0,0.1)',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            >
              THE SMALL STRINGS
            </h1>
          </div>
        </div>

        {/* Divider with VS */}
        <div className="relative h-0 z-20">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="bg-white text-black text-6xl font-black px-12 py-6 rounded-full shadow-2xl border-4 border-black">
              vs
            </div>
          </div>
        </div>

        {/* Bottom half - Black background with The Audience */}
        <div className="flex-1 bg-black flex items-center justify-center">
          <div className="text-center px-12">
            <h1
              className="text-[10rem] font-black text-white leading-none tracking-tight"
              style={{ 
                textShadow: '4px 4px 0 rgba(251,146,60,0.3)',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            >
              THE AUDIENCE
            </h1>
          </div>
        </div>
      </motion.div>

      {/* Drain effect overlay - radial gradient that appears */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.5, 0] }}
        transition={{ duration: 2.5, times: [0, 0.5, 1] }}
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.8) 50%, black 100%)'
        }}
      />
    </motion.div>
  )
}
