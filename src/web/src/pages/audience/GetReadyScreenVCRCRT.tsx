import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const VCR_DURATION_S = 2.6;
const CRT_MAIN_ANIMATION_DURATION_S = 0.8;
const CRT_DOT_ANIMATION_DURATION_S = 1.2;
const CRT_DOT_DELAY_S = 0.6;
const FINAL_BLACKOUT_BUFFER_MS = 120;

const VCR_END_FILTER = 'brightness(1.3) blur(1px) saturate(0.7)';

export function GetReadyScreenVCRCRT() {
  const [trackingOffset, setTrackingOffset] = useState(0);
  const [glitchActive, setGlitchActive] = useState(false);
  const [noiseIntensity, setNoiseIntensity] = useState(0);
  const [phase, setPhase] = useState<'vcr' | 'crt'>('vcr');
  const [blackout, setBlackout] = useState(false);

  useEffect(() => {
    const phaseTimer = window.setTimeout(() => {
      setPhase('crt');
    }, VCR_DURATION_S * 1000);

    const trackingInterval = window.setInterval(() => {
      if (phase !== 'vcr') {
        return;
      }
      setTrackingOffset(Math.random() * 20 - 10);
    }, 100);

    const glitchInterval = window.setInterval(() => {
      if (phase !== 'vcr') {
        setGlitchActive(false);
        return;
      }

      if (Math.random() > 0.7) {
        setGlitchActive(true);
        window.setTimeout(() => setGlitchActive(false), 50 + Math.random() * 100);
      }
    }, 200);

    const noiseTimer = window.setInterval(() => {
      if (phase === 'vcr') {
        setNoiseIntensity((previous) => Math.min(previous + 0.02, 1));
        return;
      }

      setNoiseIntensity((previous) => Math.max(previous - 0.03, 0));
    }, 50);

    return () => {
      window.clearTimeout(phaseTimer);
      window.clearInterval(trackingInterval);
      window.clearInterval(glitchInterval);
      window.clearInterval(noiseTimer);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'crt') {
      return;
    }

    const blackoutTimer = window.setTimeout(() => {
      setBlackout(true);
    }, (CRT_DOT_DELAY_S + CRT_DOT_ANIMATION_DURATION_S) * 1000 + FINAL_BLACKOUT_BUFFER_MS);

    return () => {
      window.clearTimeout(blackoutTimer);
    };
  }, [phase]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen w-screen relative overflow-hidden bg-black"
    >
      <motion.div
        className="absolute inset-0 flex flex-col"
        style={{
          transform: `translateY(${trackingOffset}px)`,
          transformOrigin: 'center center',
        }}
        initial={{
          scaleX: 1,
          scaleY: 1,
          filter: 'brightness(1) blur(0px) saturate(0.8)',
        }}
        animate={phase === 'vcr' ? {
          scaleX: 1,
          scaleY: 1,
          filter: glitchActive ? 'brightness(1.35) blur(1px) saturate(2) hue-rotate(90deg)' : VCR_END_FILTER,
        } : {
          scaleX: [1, 1, 0.002],
          scaleY: [1, 0.005, 0.005],
          filter: [
            VCR_END_FILTER,
            'brightness(1.7) blur(1.5px) saturate(0.6)',
            'brightness(2.1) blur(2px) saturate(0.4)',
          ],
        }}
        transition={phase === 'vcr' ? {
          duration: VCR_DURATION_S,
          ease: 'easeInOut',
        } : {
          duration: CRT_MAIN_ANIMATION_DURATION_S,
          times: [0, 0.4, 1],
          ease: [0.4, 0, 1, 1],
        }}
      >
        <div className="flex-1 bg-orange-500 flex items-center justify-center">
          <div className="text-center px-12">
            <h1
              className="text-[10rem] font-black text-black leading-none tracking-tight"
              style={{
                textShadow: '4px 4px 0 rgba(0,0,0,0.1)',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              THE SMALL STRINGS
            </h1>
          </div>
        </div>

        <div className="relative h-0 z-20">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="bg-white text-black text-6xl font-black px-12 py-6 rounded-full shadow-2xl border-4 border-black">
              vs
            </div>
          </div>
        </div>

        <div className="flex-1 bg-black flex items-center justify-center">
          <div className="text-center px-12">
            <h1
              className="text-[10rem] font-black text-white leading-none tracking-tight"
              style={{
                textShadow: '4px 4px 0 rgba(251,146,60,0.3)',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              THE AUDIENCE
            </h1>
          </div>
        </div>
      </motion.div>

      {phase === 'vcr' && glitchActive && (
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

      {phase === 'vcr' && Array.from({ length: 3 }).map((_, index) => (
        <motion.div
          key={index}
          className="absolute left-0 right-0 h-8 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.1), black, rgba(255,255,255,0.1), transparent)',
          }}
          initial={{ top: '110%' }}
          animate={{ top: '-10%' }}
          transition={{
            duration: 2,
            delay: index * 0.8,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}

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

      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
          backgroundSize: '100% 4px',
        }}
      />

      {phase === 'vcr' && (
        <motion.div
          className="absolute bottom-8 right-8 font-mono text-white text-2xl opacity-70"
          style={{ textShadow: '2px 2px 0 rgba(255,0,0,0.5), -2px -2px 0 rgba(0,0,255,0.5)' }}
          animate={{ opacity: [0.7, 0.5, 0.7] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        >
          STOP ▢
        </motion.div>
      )}

      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        initial={{
          width: 0,
          height: 0,
          opacity: 0,
          boxShadow: '0 0 0px 0px rgba(255,255,255,0)',
        }}
        animate={phase === 'crt' ? {
          width: [0, 8, 4, 0],
          height: [0, 8, 4, 0],
          opacity: [0, 1, 1, 0],
          boxShadow: [
            '0 0 0px 0px rgba(255,255,255,0)',
            '0 0 30px 15px rgba(255,255,255,0.8)',
            '0 0 20px 10px rgba(255,255,255,0.6)',
            '0 0 0px 0px rgba(255,255,255,0)',
          ],
        } : {
          width: 0,
          height: 0,
          opacity: 0,
          boxShadow: '0 0 0px 0px rgba(255,255,255,0)',
        }}
        transition={phase === 'crt' ? {
          duration: CRT_DOT_ANIMATION_DURATION_S,
          delay: CRT_DOT_DELAY_S,
          times: [0, 0.1, 0.5, 1],
          ease: 'easeOut',
        } : { duration: 0 }}
        style={{ backgroundColor: 'white' }}
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 150px 60px rgba(0,0,0,0.5)',
        }}
      />

      {blackout && <div className="absolute inset-0 bg-black pointer-events-none z-50" />}
    </motion.div>
  );
}