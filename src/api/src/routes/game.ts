import { Router, Request, Response } from 'express';
import { Server } from 'socket.io';
import { gameState } from '../state';

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
  const result = gameState.advanceToNext();
  emitGameStateUpdate();
  res.json(result);
});

// Go back to previous song
router.post('/previous', (req: Request, res: Response) => {
  const result = gameState.goBack();
  emitGameStateUpdate();
  res.json(result);
});

// Go to specific song index
router.post('/goto/:index', (req: Request, res: Response) => {
  const index = parseInt(req.params.index, 10);
  if (isNaN(index)) {
    res.status(400).json({ error: 'Invalid song index' });
    return;
  }
  const result = gameState.goToSong(index);
  emitGameStateUpdate();
  res.json(result);
});

// Set battle choice for a song
router.post('/battle/:songIndex', (req: Request, res: Response) => {
  const songIndex = parseInt(req.params.songIndex, 10);
  const { choice } = req.body as { choice?: 'A' | 'B' };

  if (isNaN(songIndex)) {
    res.status(400).json({ error: 'Invalid song index' });
    return;
  }

  if (choice !== 'A' && choice !== 'B') {
    res.status(400).json({ error: 'Choice must be "A" or "B"' });
    return;
  }

  const result = gameState.setBattleChoice(songIndex, choice);
  emitGameStateUpdate();
  res.json(result);
});

// Clear battle choice for a song
router.delete('/battle/:songIndex', (req: Request, res: Response) => {
  const songIndex = parseInt(req.params.songIndex, 10);

  if (isNaN(songIndex)) {
    res.status(400).json({ error: 'Invalid song index' });
    return;
  }

  const result = gameState.clearBattleChoice(songIndex);
  emitGameStateUpdate();
  res.json(result);
});

// Reset the game
router.post('/reset', (req: Request, res: Response) => {
  const result = gameState.reset();
  emitGameStateUpdate();
  res.json(result);
});
