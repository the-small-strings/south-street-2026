import type { BingoCard } from '@/lib/types'

interface BingoCardDisplayProps {
  card: BingoCard
  revealedSongs: Set<string>
}

export function BingoCardDisplay({ card, revealedSongs }: BingoCardDisplayProps) {
  return (
    <div className="flex flex-col gap-2 p-4 bg-secondary rounded-lg">
      <div className="font-mono text-sm text-accent font-semibold">
        Card #{card.id}
      </div>
      <div className="grid grid-cols-5 gap-1">
        {card.grid.flat().map((cell, idx) => {
          const isRevealed = cell === 'FREE' || revealedSongs.has(cell)
          return (
            <div
              key={idx}
              className={`
                aspect-square flex items-center justify-center text-xs p-1 rounded
                ${isRevealed 
                  ? 'bg-accent text-accent-foreground font-semibold' 
                  : 'bg-muted text-muted-foreground'
                }
              `}
            >
              <span className="text-center leading-tight break-words">
                {cell === 'FREE' ? '★' : cell.replace('Song', '')}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
