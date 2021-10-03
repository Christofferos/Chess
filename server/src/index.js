import express from 'express';
import SocketIO from 'socket.io';
import expressSession from 'express-session';
import socketIOSession from 'express-socket.io-session';
import path from 'path';
import http from 'http';
import helmet from 'helmet';
import connectSqlite3 from 'connect-sqlite3';
import betterLogging, { Theme } from 'better-logging';
import crypto from 'crypto';

import { InMemorySessionStore } from './sessionStore.js';
import { userRouter } from './controllers/user.controller.js';
import { gameRouter } from './controllers/game.controller.js';
import { authRouter, requireAuth } from './controllers/auth.controller.js';
import { chatRouter } from './controllers/chat.controller.js';
import {
  init,
  findUser,
  updateUserSocket,
  addUnregisteredSocket,
  backToMenu,
  removeLiveGame,
  getMatchHistory,
} from './model.js';
import { addUserOnlineDB, deleteUsersOnlineDB } from './firestore.js';

const PORT = process.env.PORT || 8989;
const EXPRESS_APP = express();

const httpServer = http.createServer(EXPRESS_APP);
const io = SocketIO.listen(httpServer);

const SQLiteStore = connectSqlite3(expressSession);

EXPRESS_APP.use(helmet());
EXPRESS_APP.use(express.json());
EXPRESS_APP.use(express.urlencoded({ extended: true }));

const session = expressSession({
  secret: 'secret',
  resave: true,
  saveUninitialized: true,
  rolling: true, // Passive session invalidation
  cookie: { maxAge: 300000 }, // Passive session invalidation
  store: new SQLiteStore(),
});
EXPRESS_APP.use(session);
io.use(
  socketIOSession(session, {
    autoSave: true,
    saveUninitialized: true,
  }),
);

betterLogging(console, {
  color: Theme.green,
});
console.logLevel = 4;
EXPRESS_APP.use(
  betterLogging.expressMiddleware(console, {
    ip: { show: true, color: Theme.green.base },
    method: { show: true, color: Theme.green.base },
    header: { show: false },
    path: { show: true },
    body: { show: true },
  }),
);

// Serve client
const publicPath = path.join(path.resolve(), '..', 'client', 'dist');
EXPRESS_APP.use(express.static(publicPath));

// Bind REST controllers to /api/...
EXPRESS_APP.use('/api', authRouter);
EXPRESS_APP.use('/api', userRouter);
EXPRESS_APP.use('/api', gameRouter);
EXPRESS_APP.use('/api', requireAuth, chatRouter);

// Init model
init(io);

const randomId = () => crypto.randomBytes(8).toString('hex');
export const sessionStore = new InMemorySessionStore();
io.use((socket, next) => {
  const sessionID = socket.handshake.sessionID;
  // console.log('HANDSHAKE: ', socket.handshake.sessionID);
  if (sessionID) {
    // find existing session
    const session = sessionStore.findSession(sessionID);
    if (session) {
      socket.sessionID = sessionID;
      return next();
    }
  }
  // create new session
  socket.sessionID = randomId();
  // console.log('socket sesssionID: ', socket.sessionID);
  next();
});

// Handle connected socket.io sockets
io.on('connection', socket => {
  // Client connected to server
  console.log('Connection ... ', socket.handshake.session.userID);
  if (socket.handshake.session.userID) {
    addUserOnlineDB(socket.handshake.session.userID);
    io.emit('userOnlineUpdate', socket.handshake.session.userID, true);
  }
  sessionStore.saveSession(socket.sessionID, {
    connected: true,
  });
  socket.on('disconnect', async () => {
    const userId = socket.handshake.session.userID;
    console.log('Disconnect ... ', userId);
    if (userId) {
      deleteUsersOnlineDB(userId);
      io.emit('userOnlineUpdate', userId, false);
    }
    /* const matchingSockets = await io.sockets; // clients or sockets
    console.log('HERE:', JSON.stringify(matchingSockets, null, '\t'));
    const isDisconnected = matchingSockets.size === 0;
    if (isDisconnected) {
      // update the connection status of the session
      sessionStore.saveSession(socket.sessionID, {
        connected: false,
      });
    } */
  });

  // This function serves to bind socket.io connections to user models
  if (socket.handshake.session.userID && findUser(socket.handshake.session.userID) !== undefined) {
    // If the current user already logged in and then reloaded the page
    updateUserSocket(socket.handshake.session.userID, socket);
  } else {
    socket.handshake.session.socketID = addUnregisteredSocket(socket);
    socket.handshake.session.save(err => {
      if (err) {
        console.log('Connection error in index.js');
        // console.error(err);
      } else {
        console.log('Saved SocketID');
        // console.debug(`Saved socketID: ${socket.handshake.session.socketID}`);
      }
    });
  }

  // ### Client listeners: ###
  socket.on('backToMenu', gameId => {
    backToMenu(gameId);
    removeLiveGame(gameId);
  });

  socket.on('getMatchHistory', userId => getMatchHistory(userId));

  socket.on('updateTimers', (gameId, timer1, timer2) => {
    console.log('UPDATE TIMERS HIT');
    model.updateTimers(gameId, timer1, timer2);
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
