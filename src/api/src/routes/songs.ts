import { Router, Request, Response } from 'express';
import { gameState } from '../state';

export const router = Router();

// Get all songs
router.get('/', (req: Request, res: Response) => {
  res.json(gameState.getSongs());
});

// Get played songs
router.get('/played', (req: Request, res: Response) => {
  const fullState = gameState.getFullState();
  res.json(fullState.playedSongs);
});
