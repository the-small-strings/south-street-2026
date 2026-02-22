export type SongType = 'fixed' | 'battle';

export interface FixedSong {
  type: 'fixed';
  name: string;
}

export interface BattleSong {
  type: 'battle';
  name: string;
  optionA: string[];
  optionB: string[];
  selected?: 'A' | 'B';
}

export type Song = FixedSong | BattleSong;

export interface BingoCard {
  id: number;
  card_type: string;
  grid: string[][];
  songs: string[];
}

export interface BingoWins {
  line: number;
  fullhouse: number;
  lineWinners: number[];
  fullhouseWinners: number[];
}

export interface GameState {
  songs: Song[];
  bingoCards: BingoCard[];
  winsPerSong: Record<number, BingoWins>;
  playedSongs: PlayedSong[];
}

export interface PlayedSong {
  index: number;
  name: string;
  type: 'fixed' | 'battle';
}

export type BasicPageType = 'test' | 'welcome' | 'walkOnPrep' | 'intro' | 'setBreak' | 'end';

export interface BasicPage {
  type: BasicPageType;
  name: string;
  introAnimationStarted?: boolean; // Only used for intro page
}

export interface SongPage {
  type: 'song';
  song: Song;
  songNumber: number;
  actualSongNumber: number;
  songRevealed: boolean;
  // wins: BingoWins | null;
}

export type Page = BasicPage | SongPage;

export type PageType = BasicPageType | 'song';

export interface GigState {
  currentPage: Page;
  nextPage: Page | null;
  pageIndex: number;
  actualTotalSongs: number;
  progress: number;
  isComplete: boolean;
}

// State that is persisted to disk for crash recovery
export interface PersistedState {
  currentPageIndex: number;
  battleChoices: Record<number, 'A' | 'B'>; // songIndex -> choice
}
