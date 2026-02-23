import { motion } from "framer-motion";

export function GetReadyScreenBlackHole() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen w-screen relative overflow-hidden bg-black"
      style={{ perspective: '1000px' }}
    >
      {/* Main content that gets sucked into black hole */}
      <motion.div
        className="absolute inset-0 flex flex-col"
        style={{ 
          transformStyle: 'preserve-3d',
          transformOrigin: 'center center',
        }}
        initial={{ 
          scale: 1,
          rotateZ: 0,
          filter: 'blur(0px) brightness(1)',
        }}
        animate={{ 
          scale: [1, 1.05, 0.8, 0.4, 0.1, 0],
          rotateZ: [0, -5, -30, -90, -180, -360],
          filter: [
            'blur(0px) brightness(1)',
            'blur(0px) brightness(1.1)',
            'blur(2px) brightness(0.9)',
            'blur(4px) brightness(0.7)',
            'blur(8px) brightness(0.4)',
            'blur(16px) brightness(0)',
          ],
        }}
        transition={{
          duration: 3,
          ease: [0.4, 0, 0.8, 1],
          times: [0, 0.1, 0.3, 0.5, 0.7, 1],
        }}
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

      {/* Black hole center */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ backgroundColor: 'black' }}
        initial={{ width: 0, height: 0 }}
        animate={{ 
          width: ['0px', '20px', '60px', '150px', '300px', '400vmax'],
          height: ['0px', '20px', '60px', '150px', '300px', '400vmax'],
        }}
        transition={{
          duration: 3,
          ease: [0.2, 0, 0.8, 1],
          times: [0, 0.2, 0.4, 0.6, 0.8, 1],
        }}
      />

      {/* Event horizon glow */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        initial={{ 
          width: 0, 
          height: 0,
          boxShadow: '0 0 0px 0px rgba(255,100,0,0)',
        }}
        animate={{ 
          width: ['0px', '40px', '100px', '250px', '500px', '0px'],
          height: ['0px', '40px', '100px', '250px', '500px', '0px'],
          boxShadow: [
            '0 0 0px 0px rgba(255,100,0,0)',
            '0 0 30px 10px rgba(255,100,0,0.8)',
            '0 0 60px 20px rgba(255,150,0,0.6)',
            '0 0 100px 40px rgba(255,100,0,0.4)',
            '0 0 150px 60px rgba(255,50,0,0.2)',
            '0 0 0px 0px rgba(255,100,0,0)',
          ],
        }}
        transition={{
          duration: 3,
          ease: [0.2, 0, 0.8, 1],
          times: [0, 0.2, 0.4, 0.6, 0.8, 1],
        }}
      />

      {/* Gravitational lensing rings */}
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border pointer-events-none"
          style={{
            borderColor: `rgba(255, ${100 + i * 30}, 0, ${0.3 - i * 0.05})`,
            borderWidth: 2 - i * 0.3,
          }}
          initial={{ width: 0, height: 0, opacity: 0 }}
          animate={{ 
            width: [0, 100 + i * 80, 200 + i * 150, 0],
            height: [0, 100 + i * 80, 200 + i * 150, 0],
            opacity: [0, 0.6, 0.3, 0],
            rotate: [0, 90 + i * 30, 180 + i * 60, 360],
          }}
          transition={{
            duration: 2.5,
            delay: 0.3 + i * 0.1,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* Particle streams being pulled in */}
      {Array.from({ length: 30 }).map((_, i) => {
        const angle = (i / 30) * Math.PI * 2;
        const startRadius = 800;
        const startX = Math.cos(angle) * startRadius;
        const startY = Math.sin(angle) * startRadius;
        
        return (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full pointer-events-none"
            style={{
              backgroundColor: i % 3 === 0 ? '#ff6600' : i % 3 === 1 ? '#ffaa00' : '#ff3300',
              boxShadow: '0 0 10px 2px currentColor',
            }}
            initial={{ 
              x: startX, 
              y: startY, 
              scale: 1,
              opacity: 0,
            }}
            animate={{ 
              x: 0, 
              y: 0, 
              scale: 0,
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 2,
              delay: 0.5 + Math.random() * 1,
              ease: [0.4, 0, 1, 1],
            }}
          />
        );
      })}

      {/* Accretion disk effect */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          background: 'conic-gradient(from 0deg, transparent, rgba(255,100,0,0.3), transparent, rgba(255,150,0,0.2), transparent)',
        }}
        initial={{ width: 0, height: 0, rotate: 0, opacity: 0 }}
        animate={{ 
          width: ['0px', '300px', '500px', '200px', '0px'],
          height: ['0px', '300px', '500px', '200px', '0px'],
          rotate: [0, 180, 360, 540, 720],
          opacity: [0, 0.8, 0.6, 0.3, 0],
        }}
        transition={{
          duration: 3,
          ease: 'linear',
        }}
      />

      {/* Distortion ripples */}
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={`ripple-${i}`}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 pointer-events-none"
          initial={{ width: 0, height: 0, opacity: 0 }}
          animate={{ 
            width: '200vmax', 
            height: '200vmax', 
            opacity: [0, 0.2, 0],
          }}
          transition={{
            duration: 1.5,
            delay: 1 + i * 0.3,
            ease: 'easeOut',
          }}
        />
      ))}
    </motion.div>
  );
}
