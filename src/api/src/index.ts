import express, { Express, Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { router as healthRouter } from './routes/health';
import { router as gameRouter, setSocketIO } from './routes/game';
import { router as songsRouter } from './routes/songs';
import { router as bingoRouter } from './routes/bingo';
import { gameState } from './state';

const app: Express = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});
const port = process.env.PORT || 33001;

// Set socket.io on game router for emitting events
setSocketIO(io);

// Set up callback for when a song is auto-revealed by the timer
gameState.setOnSongReveal(() => {
  console.log('Song auto-revealed by timer, emitting gameStateUpdate');
  const currentInfo = gameState.getCurrentGigState();
  io.emit('gameStateUpdate', currentInfo);
});

// Set up callback for when intro animation starts by the timer
gameState.setOnIntroAnimation(() => {
  console.log('Intro animation started by timer, emitting gameStateUpdate');
  const currentInfo = gameState.getCurrentGigState();
  io.emit('gameStateUpdate', currentInfo);
});

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

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Handle test key press from band view test screen
  socket.on('testKeyPress', (key: string) => {
    console.log('Test key pressed:', key, 'by:', socket.id);
    // Broadcast to all clients (for audience to display)
    io.emit('testKeyPress', key);
  });
});

// Start server
const host = process.env.HOST || '0.0.0.0';
httpServer.listen({ port, host }, () => {
  console.log(`⚡️ Server is running at http://${host}:${port}`);
});

export { io };
export default app;
