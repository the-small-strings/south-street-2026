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

export interface BingoWins {
  line: number
  fullhouse: number
  lineWinners: number[]
  fullhouseWinners: number[]
}

export interface GameState {
  songs: Song[]
  bingoCards: BingoCard[]
  currentIndex: number
  battleChoices: Record<number, 'A' | 'B'>
  winsPerSong: Record<number, BingoWins>
  playedSongs: PlayedSong[]
}

export interface PlayedSong {
  index: number
  name: string
  type: 'fixed' | 'battle'
}


export type PageType = 'test' | 'welcome' | 'intro' | 'song' | 'end'

export interface GigState {
  currentSong: Song | null
  nextSong: Song | null
  songNumber: number
  totalSongs: number
  actualSongNumber: number
  actualTotalSongs: number
  progress: number
  isComplete: boolean
  wins: BingoWins | null
  pageType: PageType
}
