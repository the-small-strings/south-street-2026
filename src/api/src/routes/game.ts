import { Router, Request, Response } from 'express';
import { Server } from 'socket.io';
import { gameState } from '../state';
import type { SongPage } from '../types';

export const router = Router();

let io: Server | null = null;

export function setSocketIO(socketIO: Server) {
  io = socketIO;
}

function emitGameStateUpdate() {
  if (io) {
    const currentInfo = gameState.getCurrentGigState();
    io.emit('gameStateUpdate', currentInfo);
  }
}

// Get current game state (current song, progress, wins)
router.get('/current', (req: Request, res: Response) => {
  res.json(gameState.getCurrentGigState());
});

// Get full game state
router.get('/full', (req: Request, res: Response) => {
  res.json(gameState.getFullState());
});

// Advance to next song
router.post('/next', (req: Request, res: Response) => {
  const currentState = gameState.getCurrentGigState();
  const currentPage = currentState.currentPage;

  // Cannot advance from end page
  if (currentPage.type === 'end') {
    res.status(400).json({ error: 'Cannot advance from end page' });
    return;
  }

  // Cannot advance from battle song without a selection
  if (currentPage.type === 'song') {
    const songPage = currentPage as SongPage;
    if (songPage.song.type === 'battle' && !songPage.song.selected) {
      res.status(400).json({ error: 'Must select a battle choice before advancing' });
      return;
    }
  }

  const result = gameState.advanceToNext();
  gameState.saveState();
  emitGameStateUpdate();
  res.json(result);
});

// Go back to previous song
router.post('/previous', (req: Request, res: Response) => {
  const currentState = gameState.getCurrentGigState();

  // Cannot go back from first page
  if (currentState.pageIndex === 0) {
    res.status(400).json({ error: 'Already at the beginning' });
    return;
  }

  const result = gameState.goBack();
  gameState.saveState();
  emitGameStateUpdate();
  res.json(result);
});

// Set battle choice for a song
router.post('/battle/current', (req: Request, res: Response) => {
  const { choice } = req.body as { choice?: 'A' | 'B' };

  if (choice !== 'A' && choice !== 'B') {
    res.status(400).json({ error: 'Choice must be "A" or "B"' });
    return;
  }

  const currentState = gameState.getCurrentGigState();
  const currentPage = currentState.currentPage;

  // Can only set battle choice on a battle song page
  if (currentPage.type !== 'song') {
    res.status(400).json({ error: 'Not currently on a song page' });
    return;
  }

  const songPage = currentPage as SongPage;
  if (songPage.song.type !== 'battle') {
    res.status(400).json({ error: 'Current song is not a battle song' });
    return;
  }

  const result = gameState.setBattleChoice(choice);
  gameState.saveState();
  emitGameStateUpdate();
  res.json(result);
});

// Clear battle choice for a song
router.delete('/battle/current', (req: Request, res: Response) => {
  console.log('Clearing battle choice for current song');
  
  const currentState = gameState.getCurrentGigState();
  const currentPage = currentState.currentPage;

  // Can only clear battle choice on a battle song page
  if (currentPage.type !== 'song') {
    res.status(400).json({ error: 'Not currently on a song page' });
    return;
  }

  const songPage = currentPage as SongPage;
  if (songPage.song.type !== 'battle') {
    res.status(400).json({ error: 'Current song is not a battle song' });
    return;
  }

  if (!songPage.song.selected) {
    res.status(400).json({ error: 'No battle choice to clear' });
    return;
  }

  const result = gameState.clearBattleChoice();
  gameState.saveState();
  emitGameStateUpdate();
  res.json(result);
});

// Reset the game
router.post('/reset', (req: Request, res: Response) => {
  const result = gameState.reset();
  gameState.saveState();
  emitGameStateUpdate();
  res.json(result);
});
