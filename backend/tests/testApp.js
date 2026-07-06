const createApp = require('../src/app');

// A minimal mock of the Socket.IO server surface used by controllers
// (req.io.to(room).emit(event, payload)), so tests don't need a real socket server.
const mockIo = {
  to: () => ({ emit: () => {} }),
};

module.exports = createApp(mockIo);
