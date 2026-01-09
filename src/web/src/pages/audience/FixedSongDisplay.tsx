import { motion } from "framer-motion";

export function FixedSongDisplay({ name }: { name: string }) {
  return (
	<motion.div
	  initial={{ opacity: 0, scale: 0.8, y: 50 }}
	  animate={{ opacity: 1, scale: 1, y: 0 }}
	  exit={{ opacity: 0, scale: 0.8, y: -50 }}
	  transition={{ duration: 0.5, ease: 'easeOut' }}
	  className="h-full w-full bg-black flex items-center justify-center"
	>
	  <div className="text-center w-full px-8">
		<motion.h1
		  initial={{ opacity: 0, y: 20 }}
		  animate={{ opacity: 1, y: 0 }}
		  transition={{ delay: 0.3 }}
		  className="text-9xl font-bold text-white leading-tight audience-song-title"
		  style={{ textShadow: '0 4px 20px rgba(251, 146, 60, 0.3)' }}
		>
		  {name}
		</motion.h1>
	  </div>
	</motion.div>
  )
}