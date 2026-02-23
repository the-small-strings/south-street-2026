import { motion } from "framer-motion";

export function GetReadyScreenCRT() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen w-screen relative overflow-hidden bg-black"
    >
      {/* Main content that shrinks */}
      <motion.div
        className="h-full w-full flex flex-col"
        initial={{ 
          scaleX: 1, 
          scaleY: 1,
          filter: 'brightness(1) blur(0px)',
        }}
        animate={{ 
          scaleX: [1, 1, 0.002],
          scaleY: [1, 0.005, 0.005],
          filter: ['brightness(1) blur(0px)', 'brightness(1.5) blur(1px)', 'brightness(2) blur(2px)'],
        }}
        transition={{
          duration: 0.8,
          times: [0, 0.4, 1],
          ease: [0.4, 0, 1, 1],
        }}
        style={{ transformOrigin: 'center center' }}
      >
        {/* Top half - Orange background */}
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

        {/* Bottom half - Black background */}
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

      {/* Bright dot that lingers then fades */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        initial={{ 
          width: 0, 
          height: 0, 
          opacity: 0,
          boxShadow: '0 0 0px 0px rgba(255,255,255,0)',
        }}
        animate={{ 
          width: [0, 8, 4, 0],
          height: [0, 8, 4, 0],
          opacity: [0, 1, 1, 0],
          boxShadow: [
            '0 0 0px 0px rgba(255,255,255,0)',
            '0 0 30px 15px rgba(255,255,255,0.8)',
            '0 0 20px 10px rgba(255,255,255,0.6)',
            '0 0 0px 0px rgba(255,255,255,0)',
          ],
        }}
        transition={{
          duration: 1.2,
          delay: 0.6,
          times: [0, 0.1, 0.5, 1],
          ease: 'easeOut',
        }}
        style={{ backgroundColor: 'white' }}
      />

      {/* Scan lines effect */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)',
          backgroundSize: '100% 4px',
        }}
      />

      {/* CRT curvature vignette */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 150px 60px rgba(0,0,0,0.5)',
        }}
      />
    </motion.div>
  );
}
