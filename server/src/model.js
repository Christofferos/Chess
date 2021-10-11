import { User } from './models/user.model.js';
import { LiveGame } from './models/liveGame.model.js';
import { MatchHistory } from './models/matchHistory.model.js';
import {
  addMatchHistoryGameDB,
  addUserExperiencePointDB,
  addUserOnlineDB,
  cleanOldLiveGamesDB,
  deleteLiveGameDB,
  deleteUsersOnlineDB,
  getAllMatchHistoryDB,
  getLiveGamesDB,
  getUsersDB,
  setLiveGameStateDB,
} from './firestore.js';
import { currentDate } from './utils/getCurrentDate.js';

/**
 * games & users are effectively hash maps with the name of the entry serving as a unique key.
 */
let users = {};
let games = {};
let matchHistory = {};

/**
 * unregisteredSockets is used as a temporary pool of sockets
 * that belonging to users who are yet to login.
 */
let nextUnregisteredSocketID = 0;
let unregisteredSockets = {};

// Will be initialized in the exports.init function
export let io = undefined;

/**
 * Initialize the model
 * @param { { io: SocketIO.Server} } config - The configurations needed to initialize the model.
 * @returns {void}
 */
export const initSocketIOServerModel = ioParam => {
  io = ioParam;
};

// Fill local liveGames model with db data
export const liveGamesInit = async () => {
  games = {};
  const liveGames = await getLiveGamesDB();
  liveGames.forEach(({ id, currentGame, player1, player2, timeLeft1, timeLeft2 }) => {
    games[id] = new LiveGame(id, currentGame, player1, player2, timeLeft1, timeLeft2);
  });
  await cleanOldLiveGamesDB();
};

const initMatchHistoryArrays = (player1, player2) => {
  const isPlayer1MatchHistoryEmpty = !matchHistory[player1];
  const isPlayer2MatchHistoryEmpty = !matchHistory[player2];
  if (isPlayer1MatchHistoryEmpty) matchHistory[player1] = [];
  if (isPlayer2MatchHistoryEmpty) matchHistory[player2] = [];
};

// Fill local matchHistory model with db data
export const matchHistoryInit = async () => {
  matchHistory = {};
  const finishedGames = await getAllMatchHistoryDB();
  finishedGames.forEach(({ player1, player2, nMoves, winner, date }) => {
    initMatchHistoryArrays(player1, player2);
    matchHistory[player1].push(new MatchHistory(player2, winner, nMoves, date));
    matchHistory[player2].push(new MatchHistory(player1, winner, nMoves, date));
  });
};

// Fill local users model with db data
export const usersInit = async () => {
  const usersFromDB = await getUsersDB();
  const setUsers = usersFromDB.map(user => {
    users[user.username] = new User(user.username);
  });
  Promise.all(setUsers).then(() => console.log('Stored users initialized'));
};

/**
 * Add a socket.io socket to the pool of unregistered sockets
 * @param {SocketIO.Socket} socket - The socket.io socket to add to the pool.
 * @returns {Number} The ID of the socket in the pool of unregistered sockets.
 */
export const addUnregisteredSocket = socket => {
  const socketID = nextUnregisteredSocketID;
  nextUnregisteredSocketID += 1;
  unregisteredSockets[socketID] = socket;
  return socketID;
};
const assignUnregisteredSocket = socketID => {
  const socket = unregisteredSockets[socketID];
  unregisteredSockets = Object.keys(unregisteredSockets)
    .filter(sockID => sockID !== socketID)
    .reduce((res, sockID) => ({ ...res, [sockID]: unregisteredSockets[sockID] }), {});
  return socket;
};

/**
 * Updated the socket associated with the user with the given name.
 * @param {String} name - The name of the user.
 * @param {SocketIO.Socket} socket - A socket.io socket.
 * @returns {void}
 */
export const updateUserSocket = (name, socket) => {
  users[name].socket = socket;
};

/**
 * Adds an onlineUser to DB and other clients web apps.
 * @param {Socket} socket - An optional ID of a socket.io socket in the unregistered sockets pool.
 * @returns {void}
 */
export const addUserOnline = socket => {
  if (socket.handshake.session.userID) {
    addUserOnlineDB(socket.handshake.session.userID);
    io.emit('userOnlineUpdate', socket.handshake.session.userID, true);
  }
};

/**
 * Removes an onlineUser to DB and other clients web apps.
 * @param {Socket} socket - An optional ID of a socket.io socket in the unregistered sockets pool.
 * @returns {void}
 */
export const deleteUserOnline = socket => {
  if (socket.handshake.session.userID) {
    deleteUsersOnlineDB(socket.handshake.session.userID);
    io.emit('userOnlineUpdate', socket.handshake.session.userID, false);
  }
};

/**
 * Creates a user with the given name.
 * @param {String} name - The name of the user.
 * @param {Number} socketID - An optional ID of a socket.io socket in the unregistered sockets pool.
 * @see model.addUser
 * @returns {void}
 */
export const addUser = (name, socketID = undefined) => {
  if (users[name] !== undefined) {
    return false; // Username taken.
  }
  users[name] = new User(name);
  if (socketID !== undefined) {
    users[name].socket = assignUnregisteredSocket(socketID);
  }
  return true;
};

export const signInUser = (name, socketID = undefined) => {
  if (socketID !== undefined) {
    users[name].socket = assignUnregisteredSocket(socketID);
  }
  return true;
};

/**
 * Returns the user object with the given name.
 * @param {String} name - The name of the user.
 * @returns {User}
 */
export const findUser = name => users[name];

/**
 * Removes the user object with the matching name.
 * @param {String} name - The name of the user
 * @returns {void}
 */
export const removeUser = name => {
  users = Object.values(users)
    .filter(user => user.name !== name)
    .reduce((res, user) => ({ ...res, [user.name]: user }), {});
};

export const authorizedToJoinGame = (userId, gameId) => {
  const isFirstPlayerJoining = games[gameId].player1 === userId;
  const isSecondPlayerJoining = games[gameId].player2 === '' || games[gameId].player2 === userId;
  if (isFirstPlayerJoining || isSecondPlayerJoining) return true;
  return false;
};

/**
 * Add a message to a room & push out the message to all connected clients
 * @param {String} roomName - The name of the room to add the message to.
 * @param {String} message - The message to add.
 * @returns {void}
 */
export const addMessage = (roomName, message) => {
  findLiveGame(roomName).addMessage(message);
  io.in(roomName).emit('msg', message);
};

/**
 * Creates a game with the given id.
 * @param {String} id - The id of the game.
 * @returns {void}
 */
export const addLiveGame = (id, player1, timeLimit) => {
  games[id] = new LiveGame(id, undefined, player1, undefined, timeLimit, timeLimit);
  io.emit('newRoom', games[id]);
};

/**
 * Returns all the LiveGame:s.
 * @returns {LiveGame}
 */
export const getLiveGame = gameId => Object.values(games).filter(game => game.id === gameId);

/**
 * Returns all the LiveGame:s.
 * @returns {LiveGame[]}
 */
export const getLiveGames = () => Object.values(games);

/**
 * Returns LiveGames that user is involved in.
 * @returns {LiveGame[]}
 */
export const getUserLiveGames = userID =>
  Object.values(games)
    .filter(game => {
      const isUserParticipantInGame = game.player1 === userID || game.player2 === userID;
      return isUserParticipantInGame;
    })
    .map(game => {
      const { timer1, timer2, ...gameWithoutTimers } = game;
      return gameWithoutTimers;
    });

/**
 * Removes the liveGame object with the matching id.
 * @param {String} id - The id of the liveGame.
 * @returns {void}
 */
export const removeLiveGame = async id => {
  const initialValue = {};
  games = Object.values(games)
    .filter(game => game.id !== id)
    .reduce((previousValue, game) => ({ ...previousValue, [game.id]: game }), initialValue);
  io.emit('remainingRooms', games);
  await deleteLiveGameDB(id);
};

/**
 * Return the liveGame object with the matching id.
 * @param {String} id - The id of the game.
 * @returns {LiveGame}
 */
export const findLiveGame = id => {
  return games[id];
};

const emitSurrenderGameOver = (gameId, surrenderUser) => {
  io.in(gameId).emit('surrenderGameOver', surrenderUser);
};

const emitTimerGameOver = game => {
  io.in(game.id).emit('timerGameOver', game.fen, game.gameState.game_over());
};

const emitMovePiece = game => {
  const isGameOver = game.gameState.game_over() || game.timeLeft1 <= 0 || game.timeLeft2 <= 0;
  io.in(game.id).emit(
    'movePieceResponse',
    game.fen,
    game.timeLeft1,
    game.timeLeft2,
    isGameOver,
    game.gameState.in_draw(),
    game.gameState.in_stalemate(),
    game.gameState.in_threefold_repetition(),
    game.gameState.insufficient_material(),
  );
};

const isGameDraw = game => {
  return (
    game.gameState.in_draw() ||
    game.gameState.in_stalemate() ||
    game.gameState.in_threefold_repetition() ||
    game.gameState.insufficient_material()
  );
};

const startOpposingTimer = game => {
  const isGameDefined = games[game.id];
  if (!isGameDefined) return;
  const whiteTimer = games[game.id].timer1;
  const blackTimer = games[game.id].timer2;
  const playerTurn = game.gameState.turn();
  const isBlacksTurn = playerTurn === 'b';
  if (isBlacksTurn) {
    games[game.id].timer2 = setInterval(() => {
      if (!isGameDefined) return;
      games[game.id].timeLeft2 -= 1;
      const isOutOfTime = games[game.id].timeLeft2 <= 0;
      if (isOutOfTime) {
        emitTimerGameOver(game);
        gameOver(game);
      }
    }, 1000);
    if (!whiteTimer) return;
    clearInterval(games[game.id].timer1);
    games[game.id].timer1 = null;
  } else {
    games[game.id].timer1 = setInterval(() => {
      if (!isGameDefined) return;
      games[game.id].timeLeft1 -= 1;
      const isOutOfTime = games[game.id].timeLeft1 <= 0;
      if (isOutOfTime) {
        emitTimerGameOver(game);
        gameOver(game);
      }
    }, 1000);
    if (!blackTimer) return;
    clearInterval(games[game.id].timer2);
    games[game.id].timer2 = null;
  }
};

const stopPlayerTimes = game => {
  clearInterval(games[game.id].timer1);
  games[game.id].timer1 = null;
  clearInterval(games[game.id].timer2);
  games[game.id].timer2 = null;
};

export const surrender = (gameId, surrenderUser) => {
  const game = games[gameId];
  stopPlayerTimes(game);
  emitSurrenderGameOver(game.id, surrenderUser);
  removeLiveGame(game.id);
};

const gameOver = async game => {
  let winner;
  stopPlayerTimes(game);
  const isDraw = isGameDraw(game);
  const isPlayer2Winner = game.fen.split(' ')[1] === 'w';
  if (isDraw) winner = '';
  else winner = isPlayer2Winner ? game.player2 : game.player1;
  initMatchHistoryArrays(game.player1, game.player2);
  const date = currentDate();
  const nMoves = game.gameState.history().length;
  matchHistory[game.player1].push(new MatchHistory(game.player2, winner, nMoves, date));
  matchHistory[game.player2].push(new MatchHistory(game.player1, winner, nMoves, date));
  await addMatchHistoryGameDB(game.player1, game.player2, winner, nMoves, date);
  await addUserExperiencePointDB(winner);
  removeLiveGame(game.id);
};

/**
 * Updates the piece placement
 */
export const movePiece = async (gameId, startPos, endPos, username, promotionPiece) => {
  const isUserAllowedToMove =
    username === games[gameId].player1 || username === games[gameId].player2;
  if (!isUserAllowedToMove) return;
  const game = games[gameId];
  const isLegalMove = game.gameState.move({
    from: startPos,
    to: endPos,
    promotion: promotionPiece?.toLowerCase(),
  });
  if (isLegalMove) startOpposingTimer(game);
  game.fen = game.gameState.fen();
  setLiveGameStateDB(gameId, game.fen, game.timeLeft1, game.timeLeft2);
  const isGameOver = game.gameState.game_over();
  if (isGameOver) {
    gameOver(game);
  }
  emitMovePiece(game);
};

export const backToMenu = gameId => {
  io.in(gameId).emit('backToMenuResponse');
};

export const getMatchHistory = userId => matchHistory[userId];
