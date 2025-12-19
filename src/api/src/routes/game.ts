import { Router, Request, Response } from 'express';
import { gameState } from '../state';

export const router = Router();

// Get current game state (current song, progress, wins)
router.get('/current', (req: Request, res: Response) => {
  res.json(gameState.getCurrentSongInfo());
});

// Get full game state
router.get('/full', (req: Request, res: Response) => {
  res.json(gameState.getFullState());
});

// Advance to next song
router.post('/next', (req: Request, res: Response) => {
  const result = gameState.advanceToNext();
  res.json(result);
});

// Go back to previous song
router.post('/previous', (req: Request, res: Response) => {
  const result = gameState.goBack();
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
  res.json(result);
});

// Reset the game
router.post('/reset', (req: Request, res: Response) => {
  const result = gameState.reset();
  res.json(result);
});
