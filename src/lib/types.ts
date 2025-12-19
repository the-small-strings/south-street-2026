export type SongType = 'fixed' | 'battle'

export interface FixedSong {
  type: 'fixed'
  name: string
}

export interface BattleSong {
  type: 'battle'
  name: string
  optionA: string[]
  optionB: string[]
  selected?: 'A' | 'B'
}

export type Song = FixedSong | BattleSong

export interface BingoCard {
  id: number
  card_type: string
  grid: string[][]
  songs: string[]
}

export interface BingoWin {
  cardId: number
  type: 'line' | 'fullhouse'
  wonAtSongIndex: number
}
