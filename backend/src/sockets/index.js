const jwt = require('jsonwebtoken');

// Initializes Socket.IO auth + room assignment.
// Clients connect with `auth: { token }` (a JWT from login/register).
// Each user joins a private room `user:<id>`; admins additionally join `admins`
// so they receive updates for all tasks.
function initSocket(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      return next();
    } catch (err) {
      return next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const { id, role } = socket.user;
    socket.join(`user:${id}`);
    if (role === 'admin') {
      socket.join('admins');
    }

    socket.on('disconnect', () => {
      // no-op: room membership is cleaned up automatically by Socket.IO
    });
  });
}

module.exports = initSocket;
