import { motion } from "framer-motion";

export function GetReadyScreenLiquid() {
  // Create drip columns for liquid effect
  const columns = 20;
  const columnWidth = 100 / columns;
  
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen w-screen relative overflow-hidden bg-black"
    >
      {/* Original content that will be masked by liquid drip columns */}
      <div className="absolute inset-0 flex flex-col">
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
      </div>

      {/* Liquid drip overlay - black columns that slide down at varying speeds */}
      <div className="absolute inset-0 flex">
        {Array.from({ length: columns }).map((_, i) => {
          // Create organic variation in timing
          const baseDelay = Math.sin(i * 0.5) * 0.3 + Math.random() * 0.2;
          const delay = Math.max(0, baseDelay);
          const duration = 1.8 + Math.random() * 0.6;
          
          return (
            <motion.div
              key={i}
              className="h-full bg-black"
              style={{ 
                width: `${columnWidth}%`,
                borderRadius: '0 0 50% 50%',
              }}
              initial={{ y: '-100%', scaleY: 1.5 }}
              animate={{ y: '0%', scaleY: 1 }}
              transition={{
                duration: duration,
                delay: delay,
                ease: [0.45, 0, 0.55, 1], // Custom ease for liquid feel
              }}
            />
          );
        })}
      </div>

      {/* Secondary drips for more organic liquid feel */}
      <div className="absolute inset-0 flex pointer-events-none">
        {Array.from({ length: columns * 2 }).map((_, i) => {
          const baseDelay = 0.3 + Math.sin(i * 0.3) * 0.4 + Math.random() * 0.3;
          const delay = Math.max(0.2, baseDelay);
          const duration = 1.2 + Math.random() * 0.8;
          const width = 2 + Math.random() * 3;
          const left = (i / (columns * 2)) * 100 + Math.random() * 3;
          
          return (
            <motion.div
              key={`drip-${i}`}
              className="absolute h-[120%] bg-black rounded-full"
              style={{ 
                width: `${width}%`,
                left: `${left}%`,
              }}
              initial={{ y: '-120%' }}
              animate={{ y: '0%' }}
              transition={{
                duration: duration,
                delay: delay,
                ease: [0.25, 0, 0.35, 1],
              }}
            />
          );
        })}
      </div>

      {/* Glossy liquid sheen effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.3, 0] }}
        transition={{ duration: 2, times: [0, 0.3, 1] }}
        style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
        }}
      />
    </motion.div>
  )
}
