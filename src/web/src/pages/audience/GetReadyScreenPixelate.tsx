import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function GetReadyScreenPixelate() {
  const [pixelSize, setPixelSize] = useState(1);
  const [brightness, setBrightness] = useState(1);

  useEffect(() => {
    // Animate pixel size from 1 to 80 over 2 seconds
    const pixelSteps = [1, 2, 4, 8, 12, 16, 24, 32, 48, 64, 80];
    const stepDuration = 2000 / pixelSteps.length;
    
    pixelSteps.forEach((size, index) => {
      setTimeout(() => {
        setPixelSize(size);
      }, index * stepDuration);
    });

    // Start fading brightness after 1.5 seconds
    const brightnessStart = 1500;
    const brightnessSteps = 20;
    const brightnessDuration = 1000;
    
    for (let i = 0; i <= brightnessSteps; i++) {
      setTimeout(() => {
        setBrightness(1 - (i / brightnessSteps));
      }, brightnessStart + (i * (brightnessDuration / brightnessSteps)));
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen w-screen relative overflow-hidden bg-black"
    >
      {/* Content with pixelation effect via SVG filter */}
      <div 
        className="h-full w-full flex flex-col"
        style={{ 
          filter: `url(#pixelate) brightness(${brightness})`,
        }}
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
      </div>

      {/* SVG Filter for pixelation */}
      <svg className="absolute w-0 h-0">
        <defs>
          <filter id="pixelate">
            <feFlood x="0" y="0" height="1" width="1" />
            <feComposite width={pixelSize} height={pixelSize} />
            <feTile result="a" />
            <feComposite in="SourceGraphic" in2="a" operator="in" />
            <feMorphology operator="dilate" radius={pixelSize / 2} />
          </filter>
        </defs>
      </svg>

      {/* Scan lines effect for retro feel */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        transition={{ duration: 0.5 }}
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
          backgroundSize: '100% 4px'
        }}
      />

      {/* Final black overlay */}
      <motion.div
        className="absolute inset-0 bg-black pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 2.5 }}
      />
    </motion.div>
  )
}
