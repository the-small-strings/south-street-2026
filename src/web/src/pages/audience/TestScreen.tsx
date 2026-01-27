import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "@/hooks/use-socket";
import { Check, Warning } from "@phosphor-icons/react";

export function TestScreen() {
  const [pressedKeys, setPressedKeys] = useState<string[]>([]);
  const [audioAutoplayStatus, setAudioAutoplayStatus] = useState<'testing' | 'ok' | 'error' | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Function to test audio playback
  const testAudio = useCallback(() => {
    setAudioAutoplayStatus('testing');
    const silentAudio = new Audio('/silent.wav');
    silentAudio.play()
      .then(() => {
        setAudioAutoplayStatus('ok');
        setAudioError(null);
      })
      .catch((err) => {
        setAudioAutoplayStatus('error');
        setAudioError(err.message || 'Autoplay blocked');
      });
  }, []);

  // Test audio autoplay when component mounts
  useEffect(() => {
    if (audioAutoplayStatus === null) {
      testAudio();
    }
  }, [audioAutoplayStatus, testAudio]);

  // Handle click to retry audio test when blocked
  const handlePageClick = useCallback(() => {
    if (audioAutoplayStatus === 'error') {
      testAudio();
    }
  }, [audioAutoplayStatus, testAudio]);

  // Handle test key presses from band
  const handleTestKeyPress = (key: string) => {
    setPressedKeys((prev) => [...prev, key]);
    setTimeout(() => {
      setPressedKeys((prev) => prev.slice(1));
    }, 1000);
  };

  // Listen for socket events from band
  useSocket({
    onTestKeyPress: handleTestKeyPress,
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handlePageClick}
      className="h-screen w-screen bg-black flex flex-col items-center justify-center relative"
    >
      {/* Logo */}
      <motion.img
        src="/logo/black with orange.png"
        alt="The Small Strings Logo"
        className="w-96 h-96 object-contain"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 150, damping: 20, delay: 0.2 }}
      />

      {/* Audio autoplay status indicator */}
      <div className="fixed top-8 right-8 flex items-center gap-2">
        {audioAutoplayStatus === 'testing' && (
          <span className="text-muted-foreground text-sm">Testing audio...</span>
        )}
        {audioAutoplayStatus === 'ok' && (
          <div className="flex items-center gap-2 text-green-500 bg-black/50 px-3 py-2 rounded-lg">
            <Check weight="bold" className="h-5 w-5" />
            <span className="text-sm font-medium">Audio OK</span>
          </div>
        )}
        {audioAutoplayStatus === 'error' && (
          <div className="flex flex-col items-end gap-1 bg-black/50 px-3 py-2 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-500">
              <Warning weight="bold" className="h-5 w-5" />
              <span className="text-sm font-medium">Audio blocked</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {audioError} — Click anywhere on the page to enable audio
            </span>
          </div>
        )}
      </div>

      {/* Key press indicators */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex gap-4 items-center justify-center min-h-[80px]">
        <AnimatePresence>
          {pressedKeys.map((key, index) => (
            <motion.div
              key={`${key}-${index}-${Date.now()}`}
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-orange-500 text-black text-3xl font-bold px-6 py-3 rounded-lg shadow-lg border-2 border-orange-400"
            >
              {key}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
