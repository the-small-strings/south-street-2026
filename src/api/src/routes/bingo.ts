import { Router, Request, Response } from 'express';
import { gameState } from '../state';

export const router = Router();

// Get all bingo cards
router.get('/', (req: Request, res: Response) => {
  res.json(gameState.getBingoCards());
});

// Get a specific bingo card
router.get('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid card ID' });
    return;
  }

  const card = gameState.getBingoCard(id);
  if (!card) {
    res.status(404).json({ error: 'Card not found' });
    return;
  }

  res.json(card);
});

// Get all wins per song
router.get('/wins/all', (req: Request, res: Response) => {
  const fullState = gameState.getFullState();
  res.json(fullState.winsPerSong);
});

// Get wins for a specific song
router.get('/wins/:songIndex', (req: Request, res: Response) => {
  const songIndex = parseInt(req.params.songIndex, 10);
  if (isNaN(songIndex)) {
    res.status(400).json({ error: 'Invalid song index' });
    return;
  }

  const wins = gameState.getWinsForSong(songIndex);
  res.json(wins ?? { line: 0, fullhouse: 0, lineWinners: [], fullhouseWinners: [] });
});

// Get winning cards with details for a specific song
router.get('/winners/:songIndex', (req: Request, res: Response) => {
  const songIndex = parseInt(req.params.songIndex, 10);
  if (isNaN(songIndex)) {
    res.status(400).json({ error: 'Invalid song index' });
    return;
  }

  const result = gameState.getWinningCardsForSong(songIndex);
  res.json(result);
});
