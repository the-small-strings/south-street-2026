import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function GetReadyScreenVHS() {
  const [trackingOffset, setTrackingOffset] = useState(0);
  const [glitchActive, setGlitchActive] = useState(false);
  const [noiseIntensity, setNoiseIntensity] = useState(0);

  useEffect(() => {
    // Simulate VHS tracking problems
    const trackingInterval = setInterval(() => {
      setTrackingOffset(Math.random() * 20 - 10);
    }, 100);

    // Random glitch bursts
    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        setGlitchActive(true);
        setTimeout(() => setGlitchActive(false), 50 + Math.random() * 100);
      }
    }, 200);

    // Increase noise over time
    const noiseTimer = setInterval(() => {
      setNoiseIntensity(prev => Math.min(prev + 0.02, 1));
    }, 50);

    return () => {
      clearInterval(trackingInterval);
      clearInterval(glitchInterval);
      clearInterval(noiseTimer);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen w-screen relative overflow-hidden bg-black"
    >
      {/* Main content with VHS distortion */}
      <motion.div
        className="absolute inset-0 flex flex-col"
        style={{
          transform: `translateY(${trackingOffset}px)`,
          filter: glitchActive ? 'saturate(2) hue-rotate(90deg)' : 'saturate(0.8)',
        }}
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 1, delay: 2.5, ease: 'easeIn' }}
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

      {/* RGB separation effect */}
      {glitchActive && (
        <>
          <div 
            className="absolute inset-0 mix-blend-screen opacity-50 pointer-events-none"
            style={{ 
              transform: 'translateX(-3px)',
              filter: 'url(#red-channel)',
            }}
          />
          <div 
            className="absolute inset-0 mix-blend-screen opacity-50 pointer-events-none"
            style={{ 
              transform: 'translateX(3px)',
              filter: 'url(#blue-channel)',
            }}
          />
        </>
      )}

      {/* Tracking lines that roll up */}
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute left-0 right-0 h-8 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.1), black, rgba(255,255,255,0.1), transparent)',
          }}
          initial={{ top: '110%' }}
          animate={{ top: '-10%' }}
          transition={{
            duration: 2,
            delay: i * 0.8,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}

      {/* Static noise overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: noiseIntensity * 0.4,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: '256px 256px',
        }}
        animate={{
          backgroundPosition: ['0px 0px', '256px 256px'],
        }}
        transition={{
          duration: 0.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Scan lines */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
          backgroundSize: '100% 4px',
        }}
      />

      {/* VHS timestamp overlay */}
      <motion.div
        className="absolute bottom-8 right-8 font-mono text-white text-2xl opacity-70"
        style={{ textShadow: '2px 2px 0 rgba(255,0,0,0.5), -2px -2px 0 rgba(0,0,255,0.5)' }}
        animate={{ opacity: [0.7, 0.5, 0.7, 0] }}
        transition={{ duration: 2.5, times: [0, 0.3, 0.6, 1] }}
      >
        STOP ▢
      </motion.div>

      {/* Final black screen */}
      <motion.div
        className="absolute inset-0 bg-black pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 2.5 }}
      />
    </motion.div>
  );
}
