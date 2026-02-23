import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import "../../intro-film-style.css";

const INITIAL_START_DELAY_MS = 800;
const DELETE_INTERVAL_MS = 50;
const BEFORE_TYPING_PAUSE_MS = 300;
const TYPE_INTERVAL_MS = 80;
const AFTER_TYPING_PAUSE_MS = 500;
const BEFORE_FADE_PAUSE_MS = 500;
const FADE_TO_BLACK_DURATION_S = 2;

export function GetReadyAgainScreen() {
  const initialMessage = "We'll be back soon...";
  const newMessage = "Let's go!";
  const [displayedText, setDisplayedText] = useState(initialMessage);
  const [showCursor, setShowCursor] = useState(true);
  const [fadeToBlack, setFadeToBlack] = useState(false);

  useEffect(() => {
    // Start deleting after a brief pause
    const startDelay = setTimeout(() => {
      let currentText = initialMessage;
      
      // Delete the initial message character by character
      const deleteInterval = setInterval(() => {
        if (currentText.length > 0) {
          currentText = currentText.slice(0, -1);
          setDisplayedText(currentText);
        } else {
          clearInterval(deleteInterval);
          
          // Small pause before typing new message
          setTimeout(() => {
            let newIndex = 0;
            const typeInterval = setInterval(() => {
              if (newIndex < newMessage.length) {
                setDisplayedText(newMessage.slice(0, newIndex + 1));
                newIndex++;
              } else {
                clearInterval(typeInterval);
                // Hide cursor and start fade to black
                setTimeout(() => {
                  setShowCursor(false);
                  setTimeout(() => setFadeToBlack(true), BEFORE_FADE_PAUSE_MS);
                }, AFTER_TYPING_PAUSE_MS);
              }
            }, TYPE_INTERVAL_MS);
          }, BEFORE_TYPING_PAUSE_MS);
        }
      }, DELETE_INTERVAL_MS);

      return () => clearInterval(deleteInterval);
    }, INITIAL_START_DELAY_MS);

    return () => clearTimeout(startDelay);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen w-screen relative overflow-hidden"
    >
      {/* Logo screen content matching SetBreakScreen layout */}
      <div className="set-break-screen">
        <div className="set-break-screen-logo-container">
          <img src="/logo/black with orange.png" alt="Logo" className="set-break-screen-logo" />
        </div>
        <div className="set-break-screen-message">
          <span className="typing-text">{displayedText}</span>
          <span className={`typing-cursor ${showCursor ? '' : 'typing-cursor-hidden'}`}>|</span>
        </div>
      </div>

      {/* Black overlay that fades in */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: fadeToBlack ? 1 : 0 }}
        transition={{ duration: FADE_TO_BLACK_DURATION_S, ease: 'easeInOut' }}
        className="absolute inset-0 bg-black"
      />
    </motion.div>
  )
}
