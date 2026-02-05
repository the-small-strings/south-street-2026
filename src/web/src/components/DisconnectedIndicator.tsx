import { WifiSlash } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'

interface DisconnectedIndicatorProps {
  isConnected: boolean
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

export function DisconnectedIndicator({ 
  isConnected, 
  position = 'bottom-right' 
}: DisconnectedIndicatorProps) {
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  }

  return (
    <AnimatePresence>
      {!isConnected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          className={`fixed ${positionClasses[position]} z-50`}
        >
          <div 
            className="flex items-center gap-2 bg-red-900/80 text-red-200 px-3 py-2 rounded-lg shadow-lg backdrop-blur-sm border border-red-700/50"
            title="Disconnected from server - attempting to reconnect..."
          >
            <WifiSlash size={18} weight="bold" className="animate-pulse" />
            <span className="text-sm font-medium">Disconnected</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
