import { motion } from "framer-motion";
import { useMemo } from "react";

interface ShardProps {
  index: number;
  totalShards: number;
  rows: number;
  cols: number;
}

function Shard({ index, totalShards, rows, cols }: ShardProps) {
  const row = Math.floor(index / cols);
  const col = index % cols;
  
  // Calculate position as percentage
  const x = (col / cols) * 100;
  const y = (row / rows) * 100;
  const width = 100 / cols;
  const height = 100 / rows;
  
  // Random fall parameters
  const delay = Math.random() * 0.8;
  const rotateX = (Math.random() - 0.5) * 180;
  const rotateY = (Math.random() - 0.5) * 180;
  const rotateZ = (Math.random() - 0.5) * 90;
  const fallDistance = 150 + Math.random() * 100;
  const horizontalDrift = (Math.random() - 0.5) * 50;
  
  return (
    <motion.div
      className="absolute overflow-hidden"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${width}%`,
        height: `${height}%`,
        transformStyle: 'preserve-3d',
      }}
      initial={{ 
        opacity: 1,
        y: 0,
        x: 0,
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
        scale: 1,
      }}
      animate={{ 
        opacity: 0,
        y: `${fallDistance}vh`,
        x: `${horizontalDrift}vw`,
        rotateX,
        rotateY,
        rotateZ,
        scale: 0.5,
      }}
      transition={{
        duration: 1.5 + Math.random() * 0.5,
        delay,
        ease: [0.45, 0, 0.9, 1],
      }}
    >
      {/* Clip the welcome screen content to this shard */}
      <div 
        className="absolute flex flex-col"
        style={{
          left: `-${x}vw`,
          top: `-${y}vh`,
          width: '100vw',
          height: '100vh',
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
      </div>
    </motion.div>
  );
}

export function GetReadyScreenShatter() {
  const rows = 6;
  const cols = 8;
  const totalShards = rows * cols;
  
  const shards = useMemo(() => 
    Array.from({ length: totalShards }, (_, i) => i),
    [totalShards]
  );

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen w-screen relative overflow-hidden bg-black"
      style={{ perspective: '1000px' }}
    >
      {/* Crack overlay that appears briefly */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.3, times: [0, 0.1, 1] }}
        style={{
          backgroundImage: `
            linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.8) 45%, transparent 50%),
            linear-gradient(-45deg, transparent 40%, rgba(255,255,255,0.8) 45%, transparent 50%),
            linear-gradient(90deg, transparent 45%, rgba(255,255,255,0.6) 50%, transparent 55%)
          `,
        }}
      />
      
      {/* Shattered pieces */}
      {shards.map((index) => (
        <Shard 
          key={index} 
          index={index} 
          totalShards={totalShards}
          rows={rows}
          cols={cols}
        />
      ))}
    </motion.div>
  );
}
