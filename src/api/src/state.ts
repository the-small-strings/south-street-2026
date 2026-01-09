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
  CurrentSongInfo,
  PageType,
} from './types';
import { calculateBingoWins, getRevealedSongsUpTo } from './bingo';

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

function parseConfigToSongs(yamlContent: string): Song[] {
  const config = yaml.load(yamlContent) as YamlConfig;
  const songs: Song[] = [];

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

  return songs;
}

class GameStateManager {
  private songs: Song[] = [];
  private bingoCards: BingoCard[] = [];
  // Index scheme: -2 = welcome, -1 = intro, 0..n-1 = songs, n = end
  private currentIndex: number = -2;
  private battleChoices: Record<number, 'A' | 'B'> = {};

  constructor() {
    this.loadData();
  }

  private loadData(): void {
    const assetFolder = process.env.ASSET_FOLDER || "test";
    const assetsPath = path.join(__dirname, '..', 'assets', assetFolder);

    // Load config.yml
    const configPath = path.join(assetsPath, 'config.yml');
    const configContent = fs.readFileSync(configPath, 'utf-8');
    this.songs = parseConfigToSongs(configContent);

    // Load bingo_cards.json
    const bingoCardsPath = path.join(assetsPath, 'bingo_cards.json');
    const bingoCardsContent = fs.readFileSync(bingoCardsPath, 'utf-8');
    this.bingoCards = JSON.parse(bingoCardsContent);
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

  private getSongsWithBattleResults(): Song[] {
    return this.songs.map((song, idx) => {
      const normalized = this.normalizeSong(song);
      if (normalized.type === 'battle' && this.battleChoices[idx]) {
        return { ...normalized, selected: this.battleChoices[idx] };
      }
      return normalized;
    });
  }

  private getWinsPerSong(): Record<number, BingoWins> {
    const songsWithBattleResults = this.getSongsWithBattleResults();
    const winsMap = calculateBingoWins(this.bingoCards, songsWithBattleResults, this.currentIndex);
    const result: Record<number, BingoWins> = {};
    winsMap.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  private getPlayedSongs(): PlayedSong[] {
    const played: PlayedSong[] = [];
    for (let idx = 0; idx <= this.currentIndex; idx++) {
      const song = this.songs[idx];
      if (!song) continue;

      if (song.type === 'fixed') {
        played.push({ index: idx, name: song.name, type: 'fixed' });
      } else if (song.type === 'battle' && this.battleChoices[idx]) {
        const selectedSongs =
          this.battleChoices[idx] === 'A' ? song.optionA : song.optionB;
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
      songs: this.songs.map((s) => this.normalizeSong(s)),
      bingoCards: this.bingoCards,
      currentIndex: this.currentIndex,
      battleChoices: this.battleChoices,
      winsPerSong: this.getWinsPerSong(),
      playedSongs: this.getPlayedSongs(),
    };
  }

  getCurrentSongInfo(): CurrentSongInfo {
    const normalizedSongs = this.songs.map((s) => this.normalizeSong(s));
    
    // Determine page type based on currentIndex
    // -2 = welcome, -1 = intro, 0..n-1 = songs, n = end
    let pageType: PageType;
    if (this.currentIndex === -2) {
      pageType = 'welcome';
    } else if (this.currentIndex === -1) {
      pageType = 'intro';
    } else if (this.currentIndex >= this.songs.length) {
      pageType = 'end';
    } else {
      pageType = 'song';
    }

    const isSongPage = pageType === 'song';
    const currentSong = isSongPage ? (normalizedSongs[this.currentIndex] ?? null) : null;
    const nextSong = pageType === 'intro' 
      ? normalizedSongs[0] ?? null
      : isSongPage 
        ? normalizedSongs[this.currentIndex + 1] ?? null 
        : null;
    const winsPerSong = this.getWinsPerSong();

    // Add selected battle choice to current song if applicable
    let currentWithSelection = currentSong;
    if (currentSong?.type === 'battle' && this.battleChoices[this.currentIndex]) {
      currentWithSelection = {
        ...currentSong,
        selected: this.battleChoices[this.currentIndex],
      };
    }

    // Calculate actual song counts (battles with multiple songs count each song)
    const getSongCount = (song: Song, battleChoice?: 'A' | 'B'): number => {
      if (song.type === 'fixed') {
        return 1;
      }
      // For battles, count the songs in the selected option, or default to optionA length
      if (battleChoice) {
        return battleChoice === 'A' ? song.optionA.length : song.optionB.length;
      }
      // If no choice made yet, use optionA length as default (both options should have same count)
      return song.optionA.length;
    };

    // Calculate actual total songs (sum of all songs across all entries)
    let actualTotalSongs = 0;
    for (let i = 0; i < normalizedSongs.length; i++) {
      const song = normalizedSongs[i];
      actualTotalSongs += getSongCount(song, this.battleChoices[i]);
    }

    // Calculate actual song number (sum of songs up to and including current)
    let actualSongNumber = 0;
    for (let i = 0; i <= this.currentIndex; i++) {
      const song = normalizedSongs[i];
      if (song) {
        actualSongNumber += getSongCount(song, this.battleChoices[i]);
      }
    }

    return {
      currentSong: isSongPage ? currentWithSelection : null,
      nextSong,
      songNumber: isSongPage ? this.currentIndex + 1 : 0,
      totalSongs: this.songs.length,
      actualSongNumber: isSongPage ? actualSongNumber : 0,
      actualTotalSongs,
      progress: this.songs.length > 0 ? (Math.max(0, this.currentIndex + 1) / this.songs.length) * 100 : 0,
      isComplete: this.currentIndex >= this.songs.length,
      wins: isSongPage ? (winsPerSong[this.currentIndex] ?? null) : null,
      pageType,
    };
  }

  getSongs(): Song[] {
    return this.songs.map((s) => this.normalizeSong(s));
  }

  getBingoCards(): BingoCard[] {
    return this.bingoCards;
  }

  getBingoCard(id: number): BingoCard | undefined {
    return this.bingoCards.find((card) => card.id === id);
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  getBattleChoices(): Record<number, 'A' | 'B'> {
    return this.battleChoices;
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
    const songsWithBattleResults = this.getSongsWithBattleResults();
    const revealedSongs = getRevealedSongsUpTo(songsWithBattleResults, songIndex);

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

  advanceToNext(): CurrentSongInfo {
    // Handle special page transitions
    // -2 = welcome -> -1 = intro
    // -1 = intro -> 0 = first song
    // n-1 = last song -> n = end
    if (this.currentIndex === -2) {
      this.currentIndex = -1;
      return this.getCurrentSongInfo();
    }

    if (this.currentIndex === -1) {
      this.currentIndex = 0;
      return this.getCurrentSongInfo();
    }

    // Already at end page, can't advance further
    if (this.currentIndex >= this.songs.length) {
      return this.getCurrentSongInfo();
    }

    const currentSong = this.songs[this.currentIndex];

    // Can only advance if current song is fixed, or battle with a choice made
    if (currentSong?.type === 'fixed') {
      this.currentIndex++;
    } else if (currentSong?.type === 'battle' && this.battleChoices[this.currentIndex]) {
      this.currentIndex++;
    }

    return this.getCurrentSongInfo();
  }

  goBack(): CurrentSongInfo {
    if (this.currentIndex > -2) {
      this.currentIndex--;
    }
    return this.getCurrentSongInfo();
  }

  goToSong(index: number): CurrentSongInfo {
    if (index >= 0 && index < this.songs.length) {
      this.currentIndex = index;
    }
    return this.getCurrentSongInfo();
  }

  setBattleChoice(songIndex: number, choice: 'A' | 'B'): CurrentSongInfo {
    const song = this.songs[songIndex];
    if (song?.type === 'battle') {
      this.battleChoices[songIndex] = choice;
    }
    return this.getCurrentSongInfo();
  }

  clearBattleChoice(songIndex: number): CurrentSongInfo {
    const song = this.songs[songIndex];
    if (song?.type === 'battle') {
      delete this.battleChoices[songIndex];
    }
    return this.getCurrentSongInfo();
  }

  reset(): GameState {
    this.currentIndex = -2; // Reset to welcome screen
    this.battleChoices = {};
    return this.getFullState();
  }
}

// Singleton instance
export const gameState = new GameStateManager();
