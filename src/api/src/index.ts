import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { router as healthRouter } from './routes/health';
import { router as gameRouter } from './routes/game';
import { router as songsRouter } from './routes/songs';
import { router as bingoRouter } from './routes/bingo';

const app: Express = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/health', healthRouter);
app.use('/api/game', gameRouter);
app.use('/api/songs', songsRouter);
app.use('/api/bingo', bingoRouter);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to the API',
    version: '1.0.0',
  });
});

// Start server
app.listen(port, () => {
  console.log(`⚡️ Server is running at http://localhost:${port}`);
});

export default app;
