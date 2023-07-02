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
import rateLimit from 'express-rate-limit';

import { InMemorySessionStore } from './sessionStore.js';
import { userRouter } from './controllers/user.controller.js';
import { gameRouter } from './controllers/game.controller.js';
import { authRouter, requireAuth } from './controllers/auth.controller.js';
import { chatRouter } from './controllers/chat.controller.js';
import {
  initSocketIOServerModel,
  findUser,
  updateUserSocket,
  addUnregisteredSocket,
  backToMenu,
  getMatchHistory,
  addUserOnline,
  matchHistoryInit,
  liveGamesInit,
  usersInit,
  deleteUserOnline,
  signInUser,
} from './model.js';
import { TIMEFRAME_10_MINUTES } from './utils/globalConstants.js';

const PORT = process.env.PORT || 8989;
const EXPRESS_APP = express();

const httpServer = http.createServer(EXPRESS_APP);
const io = SocketIO.listen(httpServer);
initSocketIOServerModel(io);

// const SQLiteStore = connectSqlite3(expressSession);

const IP_REQUEST_LIMIT = 1000;
const limiter = rateLimit({
  windowMs: TIMEFRAME_10_MINUTES,
  max: IP_REQUEST_LIMIT,
});
EXPRESS_APP.use(limiter);
EXPRESS_APP.use(helmet());
EXPRESS_APP.use(express.json());
EXPRESS_APP.use(express.urlencoded({ extended: true }));

const TEN_MINUTES_IN_MILLIS = 1000 * 60 * 10;
/**
 * Session Handling
 * @param {, rolling: boolean, cookie: { maxAge: number } } - rolling and maxAge setup enables Passive Session Invalidation
 * @returns {void}
 */
const session = expressSession({
  secret: 'secret',
  resave: true,
  saveUninitialized: true,
  rolling: true,
  cookie: { maxAge: TEN_MINUTES_IN_MILLIS },
  // store: new SQLiteStore(),
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

// Serve client static files
const publicPath = path.join(path.resolve(), '..', 'client', 'dist');
EXPRESS_APP.use(express.static(publicPath));

// Bind REST controllers to /api/...
EXPRESS_APP.use('/api', authRouter);
EXPRESS_APP.use('/api', userRouter);
EXPRESS_APP.use('/api', gameRouter);
EXPRESS_APP.use('/api', requireAuth, chatRouter);

const randomId = () => crypto.randomBytes(8).toString('hex');
export const sessionStore = new InMemorySessionStore();

io.use((socket, next) => {
  const sessionID = socket.handshake.sessionID;
  const isSessionActive = sessionID;
  if (isSessionActive) {
    const session = sessionStore.findSession(sessionID);
    if (session) {
      socket.sessionID = sessionID;
      return next();
    }
  }
  socket.sessionID = randomId(); // create new session
  next();
});

const saveSocketSessionInMemory = socket => {
  sessionStore.saveSession(socket.sessionID, {
    connected: true,
  });
};

/**
 * Bind socket.io connections to user models.
 * NOTE: UpdateUserSocket is fired in case user is signed in and reloads page.
 */
const bindSocketToUserInMemoryModel = socket => {
  const isUserSessionActive =
    socket.handshake.session.userID && findUser(socket.handshake.session.userID) !== undefined;
  if (isUserSessionActive) {
    updateUserSocket(socket.handshake.session.userID, socket);
  } else {
    socket.handshake.session.socketID = addUnregisteredSocket(socket);
    socket.handshake.session.save(err => {
      if (err) console.log('Connection error in index.js');
      // , err);
      else console.log(`Saved SocketID: ${socket.handshake.session.socketID}`);
    });
  }
};

const initalizeServerEnvironment = async () => {
  // Initialize InMemoryDatabaseModel
  await usersInit();
  await liveGamesInit();
  await matchHistoryInit();
  // Handle connected sockets (socket.io)
  io.on('connection', socket => {
    console.log('Connection ... ', socket.handshake.session.userID);
    saveSocketSessionInMemory(socket);
    bindSocketToUserInMemoryModel(socket);
    addUserOnline(socket);
    socket.on('disconnect', () => {
      console.log('Disconnect ... ', socket.handshake.session.userID);
      deleteUserOnline(socket);
    });
    socket.on('backToMenu', gameId => {
      backToMenu(gameId);
    });
    socket.on('signInAuthenticate', username => {
      socket.handshake.session.userID = username;
      console.log('SignIn User... ', socket.handshake.session.userID);
      addUserOnline(socket);
      signInUser(username, socket.handshake.session.socketID);
    });
    socket.on('closeClientSocket', () => {
      socket.conn.close();
    });
  });
};
initalizeServerEnvironment();

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server listening for requests on http://localhost:${PORT}`);
});
