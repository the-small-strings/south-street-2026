import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import "../../intro-film-style.css";

const INITIAL_START_DELAY_MS = 800;
const DELETE_INTERVAL_MS = 50;
const BEFORE_TYPING_PAUSE_MS = 300;
const TYPE_INTERVAL_MS = 80;
const AFTER_TYPING_PAUSE_MS = 1500;

const PIXELATE_EFFECT_DURATION_MS = 2000;
const BRIGHTNESS_START_MS = 1500;
const BRIGHTNESS_STEPS = 20;
const BRIGHTNESS_DURATION_MS = 1000;
const FINAL_OVERLAY_DURATION_S = 0.5;
const FINAL_OVERLAY_DELAY_S = 2.5;

export function GetReadyAgainScreenPixelate() {
  const initialMessage = "We'll be back soon...";
  const newMessage = "Let's go!";
  const [displayedText, setDisplayedText] = useState(initialMessage);
  const [showCursor, setShowCursor] = useState(true);
  const [startEffect, setStartEffect] = useState(false);
  const [pixelSize, setPixelSize] = useState(1);
  const [brightness, setBrightness] = useState(1);

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

  useEffect(() => {
    if (!startEffect) {
      return;
    }

    const timerIds: number[] = [];
    const pixelSteps = [1, 2, 4, 8, 12, 16, 24, 32, 48, 64, 80];
    const stepDuration = PIXELATE_EFFECT_DURATION_MS / pixelSteps.length;

    pixelSteps.forEach((size, index) => {
      const timerId = window.setTimeout(() => {
        setPixelSize(size);
      }, index * stepDuration);
      timerIds.push(timerId);
    });

    for (let i = 0; i <= BRIGHTNESS_STEPS; i++) {
      const timerId = window.setTimeout(() => {
        setBrightness(1 - (i / BRIGHTNESS_STEPS));
      }, BRIGHTNESS_START_MS + (i * (BRIGHTNESS_DURATION_MS / BRIGHTNESS_STEPS)));
      timerIds.push(timerId);
    }

    return () => {
      timerIds.forEach((timerId) => window.clearTimeout(timerId));
    };
  }, [startEffect]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen w-screen relative overflow-hidden bg-black"
    >
      <div
        className="h-full w-full"
        style={{
          filter: `url(#pixelateGetReadyAgain) brightness(${brightness})`,
        }}
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
      </div>

      <svg className="absolute w-0 h-0">
        <defs>
          <filter id="pixelateGetReadyAgain">
            <feFlood x="0" y="0" height="1" width="1" />
            <feComposite width={pixelSize} height={pixelSize} />
            <feTile result="a" />
            <feComposite in="SourceGraphic" in2="a" operator="in" />
            <feMorphology operator="dilate" radius={pixelSize / 2} />
          </filter>
        </defs>
      </svg>

      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        transition={{ duration: 0.5 }}
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
          backgroundSize: '100% 4px',
        }}
      />

      <motion.div
        className="absolute inset-0 bg-black pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: startEffect ? 1 : 0 }}
        transition={{ duration: FINAL_OVERLAY_DURATION_S, delay: FINAL_OVERLAY_DELAY_S }}
      />
    </motion.div>
  );
}
