import { Router, Request, Response } from 'express';

export const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Crash endpoint for easy testing of process restarts and state persistence
// router.post('/crash', (req: Request, res: Response) => {
//   console.log('Crash endpoint called - exiting process with non-zero code');
//   res.status(200).json({ message: 'Server shutting down...' });
//   process.exit(1);
// });
