import { User } from './models/user.model.js';
import { LiveGame } from './models/liveGame.model.js';
import { MatchHistory } from './models/matchHistory.model.js';
import {
  addMatchHistoryGameDB,
  deleteLiveGameDB,
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
export const init = ioParam => {
  io = ioParam;
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

// Fill local liveGames model with db data
const gamesInit = async () => {
  games = {};
  const liveGames = await getLiveGamesDB();
  liveGames.forEach(({ id, currentGame, player1, player2, timeLeft1, timeLeft2 }) => {
    games[id] = new LiveGame(id, currentGame, player1, player2, timeLeft1, timeLeft2);
  });
};
gamesInit();

const initMatchHistoryArrays = (player1, player2) => {
  const isPlayer1MatchHistoryEmpty = !matchHistory[player1];
  const isPlayer2MatchHistoryEmpty = !matchHistory[player2];
  if (isPlayer1MatchHistoryEmpty) matchHistory[player1] = [];
  if (isPlayer2MatchHistoryEmpty) matchHistory[player2] = [];
};

// Fill local matchHistory model with db data
const matchHistoryInit = async () => {
  matchHistory = {};
  const liveGames = await getLiveGamesDB();
  liveGames.forEach(({ player1, player2, nrMoves, winner, date }) => {
    initMatchHistoryArrays(player1, player2);
    matchHistory[player1].push(new MatchHistory(player2, winner, nrMoves, date));
    matchHistory[player2].push(new MatchHistory(player1, winner, nrMoves, date));
  });
};
matchHistoryInit();

// Fill local users model with db data
const usersInit = async () => {
  const usersFromDB = await getUsersDB();
  usersFromDB.forEach(user => (users[user.username] = new User(user.username)));
};
usersInit();

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
 * Creates a game with the given id.
 * @param {String} id - The id of the game.
 * @returns {void}
 */
export const addLiveGame = (id, player1) => {
  games[id] = new LiveGame(id, undefined, player1, undefined, undefined, undefined);
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
  Object.values(games).filter(game => {
    const isUserParticipantInGame = game.player1 === userID || game.player2 === userID;
    return isUserParticipantInGame;
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

const emitMovePiece = game => {
  io.in(game.id).emit(
    'movePieceResponse',
    game.fen,
    game.gameState.game_over(),
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

/**
 * Updates the piece placement
 */
export const movePiece = async (gameId, startPos, endPos, username) => {
  const isUserAllowedToMove =
    username === games[gameId].player1 || username === games[gameId].player2;
  if (!isUserAllowedToMove) return;
  const game = games[gameId];
  game.gameState.move({ from: startPos, to: endPos });
  game.fen = game.gameState.fen();
  await setLiveGameStateDB(game.fen, gameId);

  const isGameOver = game.gameState.game_over();
  if (isGameOver) {
    let winner;
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
  }
  emitMovePiece(game);
};

export const backToMenu = gameId => {
  io.in(gameId).emit('backToMenuResponse');
};

export const getMatchHistory = userId => matchHistory[userId];

export const updateTimers = (gameId, timer1, timer2) => {
  const game = games[gameId];
  game.timeLeft1 = timer1;
  game.timeLeft2 = timer2;
  /* db.serialize(async () => {
    // Update timers in db
    const statement = db.prepare(
      'UPDATE liveGames SET timeLeft1 = (?), timeLeft2 = (?) WHERE id = (?)',
    );
    statement.run(timer1, timer2, gameId);
  }); */
};
