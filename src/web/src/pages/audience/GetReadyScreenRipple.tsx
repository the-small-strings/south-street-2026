import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function GetReadyScreenRipple() {
  const [rippleProgress, setRippleProgress] = useState(0);

  useEffect(() => {
    const duration = 2500;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setRippleProgress(progress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, []);

  // Calculate ripple distortion based on progress
  const maxRipples = 8;
  const rippleAmplitude = 30 * (1 - rippleProgress * 0.5);
  const rippleFrequency = 0.02 + rippleProgress * 0.03;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen w-screen relative overflow-hidden bg-black"
    >
      {/* Main content with ripple distortion */}
      <motion.div
        className="absolute inset-0 flex flex-col"
        style={{
          filter: `url(#ripple-filter)`,
        }}
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 1, delay: 2, ease: 'easeIn' }}
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

      {/* SVG Filter for ripple effect */}
      <svg className="absolute w-0 h-0">
        <defs>
          <filter id="ripple-filter" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency={rippleFrequency}
              numOctaves="3"
              seed="1"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={rippleAmplitude * rippleProgress}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Water surface overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.3, 0.2, 0.4, 0.1, 0] }}
        transition={{ duration: 2.5, times: [0, 0.2, 0.4, 0.6, 0.8, 1] }}
        style={{
          background: 'radial-gradient(ellipse at center, rgba(100,150,255,0.2) 0%, transparent 70%)',
        }}
      />

      {/* Ripple rings emanating from center */}
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/20"
          initial={{ width: 0, height: 0, opacity: 0.5 }}
          animate={{ 
            width: '200vmax', 
            height: '200vmax', 
            opacity: 0,
          }}
          transition={{
            duration: 2,
            delay: i * 0.3,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* Dark overlay that fades in */}
      <motion.div
        className="absolute inset-0 bg-black pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 1.5, ease: 'easeIn' }}
      />
    </motion.div>
  );
}
