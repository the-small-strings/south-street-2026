import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "@/hooks/use-socket";

export function TestScreen() {
  const [pressedKeys, setPressedKeys] = useState<string[]>([]);

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
