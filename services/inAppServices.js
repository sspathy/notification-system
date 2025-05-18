let io;

exports.init = server => {
  io = require('socket.io')(server, { cors: { origin: '*' } });
  io.on('connection', socket => {
    socket.on('subscribe', userId => {
      socket.join(userId);
    });
  });
};

exports.broadcastInApp = (userId, data) => {
  if (io) {
    io.to(userId).emit('notification', data);
  }
};
