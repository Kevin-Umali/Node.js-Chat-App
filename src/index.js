const path = require('path');
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const Filter = require('bad-words');
const {
  generateMessage,
  generateLocationMessage,
} = require('./utils/messages');
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;

const publicPathDirectory = path.join(__dirname, '../public');

app.use(express.static(publicPathDirectory));

io.on('connection', (socket) => {
  console.log('New websocket connection');

  // socket.emit('message', generateMessage('Welcome!'));
  //Broadcast to everyone but not the one who connected.
  // socket.broadcast.emit('message', generateMessage('A new user has joined!'));

  socket.on('join', (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);

    //Broadcast only to specific chat room or one only room
    socket.emit(
      'message',
      generateMessage('CHATAPP BOT', `Welcome ${user.username}!`)
    );
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        generateMessage('CHATAPP BOT', `${user.username} has joined!`)
      );
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
  });

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);

    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback('Profanity is not allowed');
    }

    if (user) {
      io.to(user.room).emit('message', generateMessage(user.username, message));
    }

    callback();
  });

  socket.once('disconnect', () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        generateMessage('CHATAPP BOT', `${user.username} has left`)
      );
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });

  socket.on('sendLocation', (coords, callback) => {
    const user = getUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        'locationMessage',
        generateLocationMessage(
          user.username,
          `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
        )
      );
    }
    callback();
  });
  //   socket.emit('countUpdated', count);

  //   socket.on('increment', () => {
  //     count++;
  // socket.emit('countUpdated', count); // Single connection/emit
  //     io.emit('countUpdated', count);
  //   });
});

server.listen(port, () => {
  console.log(`Application listening on ${port}`);
});
