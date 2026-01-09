import { useState, useEffect } from 'react';
import "../../intro-film-style.css";

export function EndScreen() {
  const websiteUrl = "thesmallstrings.com";
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    // Start typing after a 1.5s delay
    const startDelay = setTimeout(() => {
      let currentIndex = 0;
      const typingInterval = setInterval(() => {
        if (currentIndex < websiteUrl.length) {
          setDisplayedText(websiteUrl.slice(0, currentIndex + 1));
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
    <div className="end-screen">
      <div className="end-screen-logo-container">
        <img src="/logo/black with orange.png" alt="Logo" className="end-screen-logo" />
      </div>
      <div className="end-screen-website">
        <span className="typing-text">{displayedText}</span>
        {showCursor && <span className="typing-cursor">|</span>}
      </div>
    </div>
  )
}
