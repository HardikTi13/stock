// Socket.IO instance will be set by server.js
let io = null;

function setIO(ioInstance) {
  io = ioInstance;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized. Make sure server.js has started.');
  }
  return io;
}

module.exports = {
  setIO,
  getIO
};

