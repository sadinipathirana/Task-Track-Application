require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const createApp = require('./app');
const initSocket = require('./sockets');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

async function start() {
  await connectDB(MONGO_URI);

  const server = http.createServer();
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : '*',
      credentials: true,
    },
  });
  initSocket(io);

  const app = createApp(io);
  server.on('request', app);

  server.listen(PORT, () => {
    console.log(`Task Tracker API listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });

  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    server.close(() => process.exit(1));
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
