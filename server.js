const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const users = {};

app.get('/', (req, res) => {
  res.json({ status: 'online', service: 'NextCall Signaling Server' });
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('register', (user) => {
    users[user.id] = {
      id: user.id,
      name: user.name,
      socketId: socket.id
    };
    socket.userId = user.id;
    io.emit('users_update', Object.values(users).map(u => ({ id: u.id, name: u.name })));
    console.log(`${user.name} is online`);
  });
  
  socket.on('call_initiate', (data) => {
    const target = users[data.to];
    if (target) {
      io.to(target.socketId).emit('incoming_call', {
        from: data.from,
        offer: data.offer
      });
    }
  });
  
  socket.on('call_accept', (data) => {
    const target = users[data.to];
    if (target) {
      io.to(target.socketId).emit('call_accepted', { answer: data.answer });
    }
  });
  
  socket.on('call_reject', (data) => {
    const target = users[data.to];
    if (target) {
      io.to(target.socketId).emit('call_rejected');
    }
  });
  
  socket.on('ice_candidate', (data) => {
    const target = users[data.to];
    if (target) {
      io.to(target.socketId).emit('ice_candidate', { candidate: data.candidate });
    }
  });
  
  socket.on('call_end', (data) => {
    const target = users[data.to];
    if (target) {
      io.to(target.socketId).emit('call_ended');
    }
  });
  
  socket.on('disconnect', () => {
    if (socket.userId && users[socket.userId]) {
      const userName = users[socket.userId].name;
      delete users[socket.userId];
      io.emit('users_update', Object.values(users).map(u => ({ id: u.id, name: u.name })));
      console.log(`${userName} disconnected`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ NextCall Server running on port ${PORT}`);
});
