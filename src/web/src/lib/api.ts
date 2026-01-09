import type {
  Song,
  BingoCard,
  GameState,
  CurrentSongInfo,
  BingoWins,
  PlayedSong,
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Game state endpoints
export async function getCurrentSongInfo(): Promise<CurrentSongInfo> {
  return fetchApi<CurrentSongInfo>('/api/game/current');
}

export async function getFullGameState(): Promise<GameState> {
  return fetchApi<GameState>('/api/game/full');
}

export async function advanceToNextSong(): Promise<CurrentSongInfo> {
  return fetchApi<CurrentSongInfo>('/api/game/next', { method: 'POST' });
}

export async function goToPreviousSong(): Promise<CurrentSongInfo> {
  return fetchApi<CurrentSongInfo>('/api/game/previous', { method: 'POST' });
}

export async function goToSong(index: number): Promise<CurrentSongInfo> {
  return fetchApi<CurrentSongInfo>(`/api/game/goto/${index}`, { method: 'POST' });
}

export async function setBattleChoice(
  songIndex: number,
  choice: 'A' | 'B'
): Promise<CurrentSongInfo> {
  return fetchApi<CurrentSongInfo>(`/api/game/battle/${songIndex}`, {
    method: 'POST',
    body: JSON.stringify({ choice }),
  });
}

export async function clearBattleChoice(
  songIndex: number
): Promise<CurrentSongInfo> {
  return fetchApi<CurrentSongInfo>(`/api/game/battle/${songIndex}`, {
    method: 'DELETE',
  });
}

export async function resetGame(): Promise<GameState> {
  return fetchApi<GameState>('/api/game/reset', { method: 'POST' });
}

// Song endpoints
export async function getSongs(): Promise<Song[]> {
  return fetchApi<Song[]>('/api/songs');
}

export async function getPlayedSongs(): Promise<PlayedSong[]> {
  return fetchApi<PlayedSong[]>('/api/songs/played');
}

// Bingo endpoints
export async function getBingoCards(): Promise<BingoCard[]> {
  return fetchApi<BingoCard[]>('/api/bingo');
}

export async function getBingoCard(id: number): Promise<BingoCard> {
  return fetchApi<BingoCard>(`/api/bingo/${id}`);
}

export async function getAllWins(): Promise<Record<number, BingoWins>> {
  return fetchApi<Record<number, BingoWins>>('/api/bingo/wins/all');
}

export async function getWinsForSong(songIndex: number): Promise<BingoWins> {
  return fetchApi<BingoWins>(`/api/bingo/wins/${songIndex}`);
}

export async function getWinningCardsForSong(
  songIndex: number
): Promise<{
  lineWinners: BingoCard[];
  fullhouseWinners: BingoCard[];
  revealedSongs: string[];
}> {
  return fetchApi(`/api/bingo/winners/${songIndex}`);
}
