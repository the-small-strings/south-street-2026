import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import "../../intro-film-style.css";

const INITIAL_START_DELAY_MS = 800;
const DELETE_INTERVAL_MS = 50;
const BEFORE_TYPING_PAUSE_MS = 300;
const TYPE_INTERVAL_MS = 80;
const AFTER_TYPING_PAUSE_MS = 1500;

const CRT_MAIN_ANIMATION_DURATION_S = 0.8;
const CRT_DOT_ANIMATION_DURATION_S = 1.2;
const CRT_DOT_DELAY_S = 0.6;

export function GetReadyAgainScreenCRT() {
  const initialMessage = "We'll be back soon...";
  const newMessage = "Let's go!";
  const [displayedText, setDisplayedText] = useState(initialMessage);
  const [showCursor, setShowCursor] = useState(true);
  const [startEffect, setStartEffect] = useState(false);

  useEffect(() => {
    const timerIds: number[] = [];
    let deleteIntervalId: ReturnType<typeof setInterval> | null = null;
    let typeIntervalId: ReturnType<typeof setInterval> | null = null;

    const startDelayId = window.setTimeout(() => {
      let currentText = initialMessage;

      deleteIntervalId = window.setInterval(() => {
        if (currentText.length > 0) {
          currentText = currentText.slice(0, -1);
          setDisplayedText(currentText);
          return;
        }

        if (deleteIntervalId) {
          window.clearInterval(deleteIntervalId);
        }

        const beforeTypingPauseId = window.setTimeout(() => {
          let newIndex = 0;

          typeIntervalId = window.setInterval(() => {
            if (newIndex < newMessage.length) {
              setDisplayedText(newMessage.slice(0, newIndex + 1));
              newIndex += 1;
              return;
            }

            if (typeIntervalId) {
              window.clearInterval(typeIntervalId);
            }

            setShowCursor(false);
            const afterTypingPauseId = window.setTimeout(() => {
              setStartEffect(true);
            }, AFTER_TYPING_PAUSE_MS);
            timerIds.push(afterTypingPauseId);
          }, TYPE_INTERVAL_MS);
        }, BEFORE_TYPING_PAUSE_MS);

        timerIds.push(beforeTypingPauseId);
      }, DELETE_INTERVAL_MS);
    }, INITIAL_START_DELAY_MS);

    timerIds.push(startDelayId);

    return () => {
      timerIds.forEach((timerId) => window.clearTimeout(timerId));
      if (deleteIntervalId) {
        window.clearInterval(deleteIntervalId);
      }
      if (typeIntervalId) {
        window.clearInterval(typeIntervalId);
      }
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen w-screen relative overflow-hidden bg-black"
    >
      <motion.div
        className="h-full w-full"
        initial={{
          scaleX: 1,
          scaleY: 1,
          filter: 'brightness(1) blur(0px)',
        }}
        animate={startEffect ? {
          scaleX: [1, 1, 0.002],
          scaleY: [1, 0.005, 0.005],
          filter: ['brightness(1) blur(0px)', 'brightness(1.5) blur(1px)', 'brightness(2) blur(2px)'],
        } : {
          scaleX: 1,
          scaleY: 1,
          filter: 'brightness(1) blur(0px)',
        }}
        transition={startEffect ? {
          duration: CRT_MAIN_ANIMATION_DURATION_S,
          times: [0, 0.4, 1],
          ease: [0.4, 0, 1, 1],
        } : { duration: 0 }}
        style={{ transformOrigin: 'center center' }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
          <div className="set-break-screen-logo-container">
            <img src="/logo/black with orange.png" alt="Logo" className="set-break-screen-logo" />
          </div>
          <div className="set-break-screen-message">
            <span className="typing-text">{displayedText}</span>
            <span className={`typing-cursor ${showCursor ? '' : 'typing-cursor-hidden'}`}>|</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        initial={{
          width: 0,
          height: 0,
          opacity: 0,
          boxShadow: '0 0 0px 0px rgba(255,255,255,0)',
        }}
        animate={startEffect ? {
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
        transition={startEffect ? {
          duration: CRT_DOT_ANIMATION_DURATION_S,
          delay: CRT_DOT_DELAY_S,
          times: [0, 0.1, 0.5, 1],
          ease: 'easeOut',
        } : { duration: 0 }}
        style={{ backgroundColor: 'white' }}
      />

      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)',
          backgroundSize: '100% 4px',
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 150px 60px rgba(0,0,0,0.5)',
        }}
      />
    </motion.div>
  );
}
