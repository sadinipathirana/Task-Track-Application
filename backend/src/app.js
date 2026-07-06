const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const userRoutes = require('./routes/userRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Creates the Express app. `io` (Socket.IO server instance) is injected so
// controllers can emit real-time events; it is attached to every request.
function createApp(io) {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : '*',
      credentials: true,
    })
  );
  app.use(express.json());
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Attach io to req so controllers can emit events without a global import
  app.use((req, res, next) => {
    req.io = io || { to: () => ({ emit: () => {} }) }; // no-op fallback for tests without a real io
    next();
  });

  app.get('/health', (req, res) => {
    res.status(200).json({ success: true, message: 'OK' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/users', userRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
