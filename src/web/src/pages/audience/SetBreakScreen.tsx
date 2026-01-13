import { useState, useEffect } from 'react';
import "../../intro-film-style.css";

export function SetBreakScreen() {
  const message = "We'll be back soon...";
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    // Start typing after a 1.5s delay
    const startDelay = setTimeout(() => {
      let currentIndex = 0;
      const typingInterval = setInterval(() => {
        if (currentIndex < message.length) {
          setDisplayedText(message.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(typingInterval);
          // Hide cursor after typing is complete
          setTimeout(() => setShowCursor(false), 500);
        }
      }, 100);

      return () => clearInterval(typingInterval);
    }, 1500);

    return () => clearTimeout(startDelay);
  }, []);

  return (
    <div className="set-break-screen">
      <div className="set-break-screen-logo-container">
        <img src="/logo/black with orange.png" alt="Logo" className="set-break-screen-logo" />
      </div>
      <div className="set-break-screen-message">
        <span className="typing-text">{displayedText}</span>
        {/* Keep the cursor in the layout when not displayed so that the text doesn't shift */}
        <span className={`typing-cursor ${showCursor ? '' : 'typing-cursor-hidden'}`}>|</span>
      </div>
    </div>
  )
}
