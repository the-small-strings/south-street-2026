import type { BingoCard, Song, BingoWin } from './types'

export function calculateBingoWins(
  cards: BingoCard[],
  songs: Song[],
  currentIndex: number
): Map<number, { line: number; fullhouse: number; lineWinners: number[]; fullhouseWinners: number[] }> {
  const revealedSongs = new Set<string>()
  const winsPerSong = new Map<number, { line: number; fullhouse: number; lineWinners: number[]; fullhouseWinners: number[] }>()
  
  const allLineWinners = new Set<number>()
  const allFullhouseWinners = new Set<number>()

  for (let songIndex = 0; songIndex <= currentIndex; songIndex++) {
    const song = songs[songIndex]
    
    if (!song) continue
    
    if (song.type === 'fixed') {
      revealedSongs.add(song.name)
    } else if (song.type === 'battle' && song.selected) {
      const selectedOptions = song.selected === 'A' ? song.optionA : song.optionB
      selectedOptions.forEach(songName => revealedSongs.add(songName))
    }

    const newLineWinners: number[] = []
    const newFullhouseWinners: number[] = []

    for (const card of cards) {
      if (allFullhouseWinners.has(card.id)) {
        continue
      }

      const hasLine = !allLineWinners.has(card.id) && checkForLine(card, revealedSongs)
      const hasFullhouse = checkForFullhouse(card, revealedSongs)

      if (hasLine && !allLineWinners.has(card.id)) {
        allLineWinners.add(card.id)
        newLineWinners.push(card.id)
      }

      if (hasFullhouse && !allFullhouseWinners.has(card.id)) {
        allFullhouseWinners.add(card.id)
        newFullhouseWinners.push(card.id)
      }
    }

    winsPerSong.set(songIndex, {
      line: newLineWinners.length,
      fullhouse: newFullhouseWinners.length,
      lineWinners: newLineWinners,
      fullhouseWinners: newFullhouseWinners
    })
  }

  return winsPerSong
}

function checkForLine(card: BingoCard, revealedSongs: Set<string>): boolean {
  for (const row of card.grid) {
    if (row.every(cell => cell === 'FREE' || revealedSongs.has(cell))) {
      return true
    }
  }
  return false
}

function checkForFullhouse(card: BingoCard, revealedSongs: Set<string>): boolean {
  for (const row of card.grid) {
    for (const cell of row) {
      if (cell !== 'FREE' && !revealedSongs.has(cell)) {
        return false
      }
    }
  }
  return true
}
