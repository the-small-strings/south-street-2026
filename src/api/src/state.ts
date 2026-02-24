import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import type {
  Song,
  FixedSong,
  BattleSong,
  BingoCard,
  GameState,
  BingoWins,
  PlayedSong,
  GigState,
  Page,
  BasicPage,
  SongPage,
  BasicPageType,
  PersistedState,
} from './types';
import { calculateBingoWins, getRevealedSongsUpTo } from './bingo';

// Get the state file path from env var or use default
function getStateFilePath(): string {
  return process.env.STATE_FILE || path.join(__dirname, '..', 'state.json');
}

// Save state to disk
export function saveStateToDisk(state: PersistedState): void {
  const filePath = getStateFilePath();
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf-8');
    console.log(`State saved to ${filePath}`);
  } catch (error) {
    console.error(`Failed to save state to ${filePath}:`, error);
  }
}

// Load state from disk
export function loadStateFromDisk(): PersistedState | null {
  const filePath = getStateFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8').trim();
      // Handle empty file as clean state
      if (!content) {
        console.log(`State file at ${filePath} is empty, starting with clean state`);
        return null;
      }
      const state = JSON.parse(content) as PersistedState;
      console.log(`State loaded from ${filePath}`);
      return state;
    }
    console.log(`No state file found at ${filePath}`);
    return null;
  } catch (error) {
    console.error(`Failed to load state from ${filePath}:`, error);
    return null;
  }
}

interface YamlSongItem {
  name: string;
}

interface YamlSongEntry {
  name?: string;
  optionSet?: YamlSongItem[][];
}

interface YamlConfig {
  songs: YamlSongEntry[];
}

function parseConfig(yamlContent: string): {songs: Song[], setBreakAfter?: string} {
  const config = yaml.load(yamlContent) as YamlConfig;
  const songs: Song[] = [];

  const setBreakAfter = (config as any).setBreakAfter as string | undefined;
  for (const entry of config.songs) {
    if (entry.name) {
      const fixedSong: FixedSong = {
        type: 'fixed',
        name: entry.name,
      };
      songs.push(fixedSong);
    } else if (entry.optionSet) {
      const [optionA, optionB] = entry.optionSet;
      const battleSong: BattleSong = {
        type: 'battle',
        name: `Battle: ${optionA.map((s) => s.name).join(' + ')} vs ${optionB.map((s) => s.name).join(' + ')}`,
        optionA: optionA.map((s) => s.name),
        optionB: optionB.map((s) => s.name),
      };
      songs.push(battleSong);
    }
  }

  return {songs, setBreakAfter};
}

// Callback type for when song is revealed or intro animation starts
type StateChangeCallback = () => void;

// Reveal delay in milliseconds (from env or default to 5000)
function getRevealDelayMs(): number {
  const envValue = process.env.REVEAL_DELAY_MS;
  if (envValue !== undefined) {
    const parsed = parseInt(envValue, 10);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  return 5000;
}

// Intro animation delay in milliseconds (from env or default to 15500ms - after countdown completes)
function getIntroAnimationDelayMs(): number {
  const envValue = process.env.INTRO_ANIMATION_DELAY_MS;
  if (envValue !== undefined) {
    const parsed = parseInt(envValue, 10);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  return 15500; // Default: 15.5s (matches when logo-container-outer would normally appear)
}

class GameStateManager {
  private bingoCards: BingoCard[] = [];
  private currentPage: Page;
  private currentPageIndex: number = 0;
  private pages: Page[];
  private songs: Song[];
  private songRevealed: boolean;
  private revealTimer: ReturnType<typeof setTimeout> | null = null;
  private onSongRevealCallback: StateChangeCallback | null = null;
  private introAnimationStarted: boolean = false;
  private introSongCompleted: boolean = false;
  private introAnimationTimer: ReturnType<typeof setTimeout> | null = null;
  private onIntroAnimationCallback: StateChangeCallback | null = null;

  constructor() {
    const assetFolder = process.env.ASSET_FOLDER || "test";
    const assetsPath = path.join(__dirname, '..', 'assets', assetFolder);

    // Load config.yml
    const configPath = path.join(assetsPath, 'config.yml');
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const parsedConfig = parseConfig(configContent);
    this.songs = parsedConfig.songs.map((s) => this.normalizeSong(s));
    const setBreakAfter = parsedConfig.setBreakAfter;

    this.currentPage = this.createBasicPage('test');

    // Load bingo_cards.json
    const bingoCardsPath = path.join(assetsPath, 'bingo_cards.json');
    const bingoCardsContent = fs.readFileSync(bingoCardsPath, 'utf-8');
    this.bingoCards = JSON.parse(bingoCardsContent);

    this.pages = this.generatePages(setBreakAfter);

    // Load persisted state if available
    this.loadPersistedState();
    this.songRevealed = false;
  }

  // Set callback for when song is revealed (called by socket handler)
  setOnSongReveal(callback: StateChangeCallback): void {
    this.onSongRevealCallback = callback;
  }

  // Set callback for when intro animation starts (called by socket handler)
  setOnIntroAnimation(callback: StateChangeCallback): void {
    this.onIntroAnimationCallback = callback;
  }

  // Cancel any active reveal timer
  private cancelRevealTimer(): void {
    if (this.revealTimer) {
      clearTimeout(this.revealTimer);
      this.revealTimer = null;
    }
  }

  // Cancel any active intro animation timer
  private cancelIntroAnimationTimer(): void {
    if (this.introAnimationTimer) {
      clearTimeout(this.introAnimationTimer);
      this.introAnimationTimer = null;
    }
  }

  // Start the intro animation timer
  private startIntroAnimationTimer(): void {
    this.cancelIntroAnimationTimer();
    const delayMs = getIntroAnimationDelayMs();
    
    // If delay is <= 0, start animation immediately without timer
    if (delayMs <= 0) {
      console.log('Starting intro animation immediately (no delay)');
      this.introAnimationStarted = true;
      return;
    }
    
    console.log(`Starting intro animation timer for ${delayMs} ms`);
    this.introAnimationStarted = false;
    this.introAnimationTimer = setTimeout(() => {
      console.log('Intro animation timer elapsed, starting animation');
      this.introAnimationStarted = true;
      this.introAnimationTimer = null;
      // Notify listeners that intro animation started
      if (this.onIntroAnimationCallback) {
        this.onIntroAnimationCallback();
      }
    }, delayMs);
  }

  // Immediately start intro animation (cancel timer if active)
  triggerIntroAnimation(): boolean {
    // Only relevant if not already started and on intro page
    if (this.introAnimationStarted) {
      return false; // Already started, nothing to do
    }
    this.cancelIntroAnimationTimer();
    this.introAnimationStarted = true;
    // Notify listeners
    if (this.onIntroAnimationCallback) {
      this.onIntroAnimationCallback();
    }
    return true; // Animation was started
  }

  // Check if intro song has completed (song is near the end, can advance to next page)
  isIntroSongCompleted(): boolean {
    return this.introSongCompleted;
  }

  // Check if intro animation has started
  isIntroAnimationStarted(): boolean {
    return this.introAnimationStarted;
  }

  // Called by the audience client when the intro song is near the end
  notifyIntroSongCompleted(): void {
    if (!this.introSongCompleted) {
      this.introSongCompleted = true;
      console.log('Intro song completed notification received from client');
    }
  }

  // Start the reveal timer for fixed songs
  private startRevealTimer(): void {
    this.cancelRevealTimer();
    const delayMs = getRevealDelayMs();
    
    // If delay is <= 0, reveal immediately without timer
    if (delayMs <= 0) {
      console.log('Revealing song immediately (no delay)');
      this.songRevealed = true;
      return;
    }
    
    console.log(`Starting song reveal timer for ${delayMs} ms`);
    this.songRevealed = false;
    this.revealTimer = setTimeout(() => {
      console.log('Song reveal timer elapsed, revealing song');
      this.songRevealed = true;
      this.revealTimer = null;
      // Notify listeners that song was revealed
      if (this.onSongRevealCallback) {
        this.onSongRevealCallback();
      }
    }, delayMs);
  }

  // Immediately reveal the current song (cancel timer if active)
  revealCurrentSong(): boolean {
    // Only relevant if not already revealed and on a fixed song
    if (this.songRevealed) {
      return false; // Already revealed, nothing to do
    }
    this.cancelRevealTimer();
    this.songRevealed = true;
    // Notify listeners
    if (this.onSongRevealCallback) {
      this.onSongRevealCallback();
    }
    return true; // Song was revealed
  }

  // Check if current song is revealed
  isSongRevealed(): boolean {
    return this.songRevealed;
  }

  // Get the current persisted state
  getPersistedState(): PersistedState {
    const battleChoices: Record<number, 'A' | 'B'> = {};
    for (let i = 0; i < this.songs.length; i++) {
      const song = this.songs[i];
      if (song.type === 'battle' && song.selected) {
        battleChoices[i] = song.selected;
      }
    }
    return {
      currentPageIndex: this.currentPageIndex,
      battleChoices,
    };
  }

  // Save current state to disk
  saveState(): void {
    saveStateToDisk(this.getPersistedState());
  }

  // Load persisted state from disk
  private loadPersistedState(): void {
    const persistedState = loadStateFromDisk();
    if (persistedState) {
      this.restoreFromPersistedState(persistedState);
    }
  }

  // Restore state from a persisted state object
  restoreFromPersistedState(persistedState: PersistedState): void {
    // Restore battle choices
    for (const [indexStr, choice] of Object.entries(persistedState.battleChoices)) {
      const index = parseInt(indexStr, 10);
      const song = this.songs[index];
      if (song && song.type === 'battle') {
        song.selected = choice;
        // Also update the song in the corresponding page
        for (const page of this.pages) {
          if (page.type === 'song') {
            const songPage = page as SongPage;
            if (songPage.songNumber - 1 === index && songPage.song.type === 'battle') {
              songPage.song.selected = choice;
            }
          }
        }
      }
    }

    // Restore current page index (validate it's within bounds)
    if (persistedState.currentPageIndex >= 0 && persistedState.currentPageIndex < this.pages.length) {
      this.currentPageIndex = persistedState.currentPageIndex;
      this.currentPage = this.pages[this.currentPageIndex];
    }

    console.log(`Restored state: page ${this.currentPageIndex}, ${Object.keys(persistedState.battleChoices).length} battle choices`);
  }
  generatePages(setBreakAfter?: string): Page[] {
    const pages: Page[] = [];
    pages.push(this.createBasicPage('test'));
    pages.push(this.createBasicPage('welcome'));
    pages.push(this.createBasicPage('getReady'));
    pages.push(this.createBasicPage('walkOnPrep'));
    pages.push(this.createBasicPage('intro'));
    for (let i = 0; i < this.songs.length; i++) {
      const songPage = this.createSongPage(i);
      if (songPage) {
        pages.push(songPage);
      }
      if (setBreakAfter && this.songs[i].type === 'fixed' && this.songs[i].name === setBreakAfter) {
        pages.push(this.createBasicPage('setBreak'));
        pages.push(this.createBasicPage('getReadyAgain'));
        pages.push(this.createBasicPage('comeBackPrep'));
      }
    }
    pages.push(this.createBasicPage('end'));
    pages.push(this.createBasicPage('end2'));
    return pages;
  }

  private normalizeSong(song: Song): Song {
    if (song.type === 'battle') {
      return {
        ...song,
        optionA: Array.isArray(song.optionA) ? song.optionA : [song.optionA],
        optionB: Array.isArray(song.optionB) ? song.optionB : [song.optionB],
      };
    }
    return song;
  }

  // Get the current song index based on the current page (-1 if not on a song page)
  private getCurrentSongIndex(): number {
    if (this.currentPage.type === 'song') {
      return (this.currentPage as SongPage).songNumber - 1;
    }
    // If on the set break page, return the index of the last song before the break
    if (this.currentPage.type === 'setBreak') {
      for (let i = this.currentPageIndex - 1; i >= 0; i--) {
        const page = this.pages[i];
        if (page.type === 'song') {
          return (page as SongPage).songNumber - 1;
        }
      }
    }
    // If on end pages, return last song index
    if (this.currentPage.type === 'end' || this.currentPage.type === 'end2') {
      return this.songs.length - 1;
    }
    return -1;
  }

  private getWinsPerSong(): Record<number, BingoWins> {
    const songsWithBattleResults = this.songs;
    const currentSongIndex = this.getCurrentSongIndex();
    const winsMap = calculateBingoWins(this.bingoCards, songsWithBattleResults, currentSongIndex);
    const result: Record<number, BingoWins> = {};
    winsMap.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  private getPlayedSongs(): PlayedSong[] {
    const played: PlayedSong[] = [];
    const currentSongIndex = this.getCurrentSongIndex();
    console.log("Calculating played songs up to index", currentSongIndex);
    for (let idx = 0; idx <= currentSongIndex; idx++) {
      const song = this.songs[idx];
      if (!song) continue;

      if (song.type === 'fixed') {
        played.push({ index: idx, name: song.name, type: 'fixed' });
      } else if (song.type === 'battle' && song.selected) {
        const selectedSongs =
          song.selected === 'A' ? song.optionA : song.optionB;
        const songName = Array.isArray(selectedSongs)
          ? selectedSongs.join(' + ')
          : String(selectedSongs);
        played.push({ index: idx, name: songName, type: 'battle' });
      }
    }
    return played;
  }

  getFullState(): GameState {
    return {
      songs: this.songs,
      bingoCards: this.bingoCards,
      winsPerSong: this.getWinsPerSong(),
      playedSongs: this.getPlayedSongs(),
    };
  }

  // Helper to get page name for basic pages
  private getBasicPageName(type: BasicPageType): string {
    switch (type) {
      case 'test': return 'Test Screen';
      case 'welcome': return 'Welcome';
      case 'getReady': return 'Get Ready';
      case 'walkOnPrep': return 'Walk-on Prep';
      case 'intro': return 'Get Ready';
      case 'setBreak': return 'Set Break';
      case 'getReadyAgain': return 'Get Ready Again';
      case 'comeBackPrep': return 'Come Back Prep';
      case 'end': return 'The End';
      case 'end2': return 'The End (2)';
    }
  }
  // Helper to create a BasicPage
  private createBasicPage(type: BasicPageType): BasicPage {
    return {
      type,
      name: this.getBasicPageName(type),
    }
  }

  // Helper to count songs (battles with multiple songs count each song)
  private getSongCount(song: Song): number {
    if (song.type === 'fixed') {
      return 1;
    }
    if (song.type === 'battle' && song.selected) {
      return song.selected === 'A' ? song.optionA.length : song.optionB.length;
    }
    return song.optionA.length;
  };
  // Calculate actual song number for a given index
  private getActualSongNumber(songIndex: number): number {
    let count = 0;
    for (let i = 0; i <= songIndex; i++) {
      const song = this.songs[i];
      if (song) {
        count += this.getSongCount(song);
      }
    }
    return count;
  };


  // Helper to create a SongPage
  private createSongPage(songIndex: number): SongPage | null {
    const song = this.songs[songIndex];
    if (!song) return null;

    return {
      type: 'song',
      song,
      songNumber: songIndex + 1,
      actualSongNumber: this.getActualSongNumber(songIndex),
      songRevealed: this.songRevealed,
    };
  };



  getCurrentGigState(): GigState {

    // Calculate actual total songs
    let actualTotalSongs = 0;
    for (let i = 0; i < this.songs.length; i++) {
      const song = this.songs[i];
      actualTotalSongs += this.getSongCount(song);
    }

    const nextPage = this.pages[this.currentPageIndex + 1] || null;
    const currentSongIndex = this.getCurrentSongIndex();

    // Ensure songRevealed is up-to-date on the current page
    let currentPage: Page = this.currentPage;
    if (this.currentPage.type === 'song') {
      currentPage = {
        ...this.currentPage,
        songRevealed: this.songRevealed,
      } as SongPage;
    } else if (this.currentPage.type === 'intro') {
      // Include introAnimationStarted for intro page
      currentPage = {
        ...this.currentPage,
        introAnimationStarted: this.introAnimationStarted,
      } as BasicPage;
    }

    return {
      currentPage,
      nextPage,
      pageIndex: this.currentPageIndex,
      actualTotalSongs,
      progress: this.songs.length > 0 ? (Math.max(0, currentSongIndex + 1) / this.songs.length) * 100 : 0,
      isComplete: this.currentPageIndex >= this.pages.length - 1,
    };
  }

  getSongs(): Song[] {
    return this.songs;
  }

  getBingoCards(): BingoCard[] {
    return this.bingoCards;
  }

  getBingoCard(id: number): BingoCard | undefined {
    return this.bingoCards.find((card) => card.id === id);
  }

  getWinsForSong(songIndex: number): BingoWins | null {
    const winsPerSong = this.getWinsPerSong();
    return winsPerSong[songIndex] ?? null;
  }

  getWinningCardsForSong(songIndex: number): {
    lineWinners: BingoCard[];
    fullhouseWinners: BingoCard[];
    revealedSongs: string[];
  } {
    const wins = this.getWinsForSong(songIndex);
    const revealedSongs = getRevealedSongsUpTo(this.songs, songIndex);

    if (!wins) {
      return {
        lineWinners: [],
        fullhouseWinners: [],
        revealedSongs: Array.from(revealedSongs),
      };
    }

    const lineWinners = wins.lineWinners
      .map((id) => this.bingoCards.find((c) => c.id === id))
      .filter((c): c is BingoCard => c !== undefined);

    const fullhouseWinners = wins.fullhouseWinners
      .map((id) => this.bingoCards.find((c) => c.id === id))
      .filter((c): c is BingoCard => c !== undefined);

    return {
      lineWinners,
      fullhouseWinners,
      revealedSongs: Array.from(revealedSongs),
    };
  }

  advanceToNext(): GigState {
    if (this.currentPageIndex < this.pages.length - 1) {
      if (this.currentPage.type === 'song') {
        const songPage = this.currentPage as SongPage;
        // If battle song without choice, cannot advance
        console.log('Advancing from song page:', songPage);
        if (songPage.song.type === 'battle' && !songPage.song.selected) {
          return this.getCurrentGigState();
        }
      }
      this.currentPageIndex++;
      this.currentPage = this.pages[this.currentPageIndex];
      
      // Handle reveal state for the new page
      if (this.currentPage.type === 'song') {
        const newSongPage = this.currentPage as SongPage;
        if (newSongPage.song.type === 'fixed') {
          // Start reveal timer for fixed songs
          this.startRevealTimer();
        } else {
          // Battle songs are always "revealed" (no reveal animation)
          this.cancelRevealTimer();
          this.songRevealed = true;
        }
        // Cancel intro animation timer when leaving intro page
        this.cancelIntroAnimationTimer();
      } else if (this.currentPage.type === 'intro') {
        // Don't start intro animation timer automatically - wait for either:
        // 1. Client notification when song finishes naturally (notifyIntroAnimationStarted)
        // 2. Manual trigger from band page (triggerIntroAnimation via /next endpoint)
        // Cancel song reveal timer
        this.cancelRevealTimer();
        this.songRevealed = true;
        // Reset intro animation state for the new page
        this.introAnimationStarted = false;
        this.introSongCompleted = false;
      } else {
        // Non-song, non-intro pages don't need timers
        this.cancelRevealTimer();
        this.cancelIntroAnimationTimer();
        this.songRevealed = true;
        this.introAnimationStarted = false;
        this.introSongCompleted = false;
      }
    }
    return this.getCurrentGigState();
  }

  goBack(): GigState {
    if (this.currentPageIndex > 0) {
      // Cancel any active timers when going back
      this.cancelRevealTimer();
      this.cancelIntroAnimationTimer();
      
      this.currentPageIndex--;
      this.currentPage = this.pages[this.currentPageIndex];
      
      // If going back to intro page, reset intro state so it can be replayed
      if (this.currentPage.type === 'intro') {
        this.introAnimationStarted = false;
        this.introSongCompleted = false;
      } else {
        // For other pages, mark as already revealed/completed
        this.songRevealed = true;
        this.introAnimationStarted = true;
        this.introSongCompleted = true;
      }
    }
    return this.getCurrentGigState();
  }

  setBattleChoice(choice: 'A' | 'B'): GigState {
    if (this.currentPage.type === 'song') {
      const songPage = this.currentPage as SongPage;
      if (songPage.song.type === 'battle') {
        songPage.song.selected = choice;
      }
    }

    return this.getCurrentGigState();
  }

  clearBattleChoice(): GigState {
    if (this.currentPage.type === 'song') {
      const songPage = this.currentPage as SongPage;
      if (songPage.song.type === 'battle') {
        delete songPage.song.selected;
      }
    }
    return this.getCurrentGigState();
  }

  reset(): GameState {
    // Cancel any active timers
    this.cancelRevealTimer();
    this.cancelIntroAnimationTimer();
    this.songRevealed = true;
    this.introAnimationStarted = false;
    this.introSongCompleted = false;
    
    this.currentPageIndex = 0; // Reset to test screen
    this.currentPage = this.pages[this.currentPageIndex];
    for (let i = 0; i < this.pages.length; i++) {
      const page = this.pages[i];
      if (page.type === 'song') {
        const songPage = page as SongPage;
        if (songPage.song.type === 'battle') {
          delete songPage.song.selected;
        }
      }
    }
    return this.getFullState();
  }
}

// Singleton instance
export const gameState = new GameStateManager();
