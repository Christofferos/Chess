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
import { POWER } from './utils/globalConstants.js';

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
  liveGames.forEach(
    ({
      id,
      currentGame,
      player1,
      player2,
      timeLeft1,
      timeLeft2,
      isCrazyChess,
      crazyChessPowers,
      availablePowers,
    }) => {
      games[id] = new LiveGame(
        id,
        currentGame,
        player1,
        player2,
        timeLeft1,
        timeLeft2,
        isCrazyChess,
        crazyChessPowers,
        availablePowers,
      );
    },
  );
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
export const addLiveGame = (id, player1, timeLimit, isCrazyChess) => {
  games[id] = new LiveGame(id, undefined, player1, undefined, timeLimit, timeLimit, isCrazyChess);
  io.emit('newRoom', games[id]);
  return games[id];
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

const emitMovePiece = (game, flag, isPlayer1, moveFromTo) => {
  const isGameOver = game.gameState.game_over() || game.timeLeft1 <= 0 || game.timeLeft2 <= 0;
  const isCastle = flag === 'k' || flag === 'q';
  const isEnPassant = flag === 'e';
  const isPromotion = flag === 'p' || flag === 'cp';
  const isCapture = flag === 'c';
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
    game.gameState.in_check(),
    isCastle,
    isEnPassant,
    isPromotion,
    isCapture,
    isPlayer1,
    moveFromTo,
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
      if (!games[game.id]) return;
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
      if (!games[game.id]) return;
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

const removePieceFromFenString = (FEN, rowTarget, colTarget, pieceMatch) => {
  let rowTemp = 0;
  let colTemp = 0;
  let newFenPieceLocation = '';
  const pieces = FEN.slice(0, FEN.indexOf(' '));
  const fenMetaData = FEN.slice(FEN.indexOf(' ') + 1);
  for (let i = 0; i < pieces.length; i += 1) {
    if (pieces.charAt(i) === '/') {
      newFenPieceLocation = `${newFenPieceLocation}/`;
      rowTemp += 1;
      colTemp = 0;
    } else if (pieces.charAt(i).match(`[${pieceMatch}]`)) {
      if (rowTarget === rowTemp && colTarget === colTemp) {
        const signBefore = pieces.charAt(i - 1);
        const signAfter = pieces.charAt(i + 1);
        if (!isNaN(signBefore) && !isNaN(signAfter)) {
          newFenPieceLocation = `${newFenPieceLocation.slice(
            0,
            newFenPieceLocation.length - 1,
          )}${Number(signBefore) + Number(signAfter) + 1}`;
          i += 1;
        } else if (isNaN(signBefore) && !isNaN(signAfter)) {
          newFenPieceLocation = `${newFenPieceLocation}${Number(signAfter) + 1}`;
          i += 1;
        } else if (!isNaN(signBefore) && isNaN(signAfter)) {
          newFenPieceLocation = `${newFenPieceLocation.slice(
            0,
            newFenPieceLocation.length - 1,
          )}${Number(signBefore) + 1}`;
        } else if (isNaN(signBefore) && isNaN(signAfter)) {
          newFenPieceLocation = `${newFenPieceLocation}1`;
        }
      } else {
        newFenPieceLocation = `${newFenPieceLocation}${pieces.charAt(i)}`;
      }
      colTemp += 1;
    } else {
      newFenPieceLocation = `${newFenPieceLocation}${pieces.charAt(i)}`;
      colTemp += Number(pieces.charAt(i));
    }
  }
  const newGameFEN = `${newFenPieceLocation} ${fenMetaData}`;
  return newGameFEN;
};

const oneStepMove = (game, startPos, startRow, startCol, endRow, endCol) => {
  const piece = game.gameState.get(startPos);
  const type = piece?.type;
  if (!type) return true;
  if (type.match('[rbqpRBQP]')) {
    const xDistance = Math.abs(startCol - endCol);
    const yDistance = Math.abs(startRow - endRow);
    if (xDistance <= 1 && yDistance <= 1) return true;
    else return false;
  } else return true;
};

const isKingTeleportCheck = (
  game,
  startPos,
  endPos,
  startRow,
  startCol,
  endRow,
  endCol,
  isPlayer1,
) => {
  const isPlayerTurn =
    (game.gameState.turn() === 'w' && isPlayer1) || (game.gameState.turn() === 'b' && !isPlayer1);
  if (!isPlayerTurn) return false;
  const piece = game.gameState.get(startPos);
  const type = piece?.type;
  if (!type) return false;
  const isSelectedPieceKing = type.match('[kK]');
  if (!isSelectedPieceKing) return false;
  const xDistance = Math.abs(startCol - endCol);
  const yDistance = Math.abs(startRow - endRow);
  const isEndPosOccupied = game.gameState.get(endPos) !== null;
  if (isEndPosOccupied) return false;
  if (xDistance <= 2 && yDistance == 0) return true;
  else if (xDistance == 0 && yDistance <= 2) return true;
  else return false;
};

const kingTeleportMove = (game, startPos, endPos, isPlayer1) => {
  game.gameState.remove(startPos);
  if (isPlayer1 && game.crazyChessPowers.kingTeleportP1) {
    game.crazyChessPowers.kingTeleportP1 = false;
    io.in(game.id).emit('kingTeleportDisable', 'w');
    game.gameState.put({ type: 'k', color: 'w' }, endPos);
  } else if (!isPlayer1 && game.crazyChessPowers.kingTeleportP2) {
    game.crazyChessPowers.kingTeleportP2 = false;
    io.in(game.id).emit('kingTeleportDisable', 'b');
    game.gameState.put({ type: 'K', color: 'b' }, endPos);
  }
  return game.gameState.fen();
};

const changeFenTurn = game => {
  const FEN = game.fen;
  const pieces = FEN.slice(0, FEN.indexOf(' '));
  const fenMetaData = FEN.slice(FEN.indexOf(' ') + 1);
  let newColorTurn = 'w';
  if (game.gameState.turn() === 'w') newColorTurn = 'b';
  else if (game.gameState.turn() === 'b') newColorTurn = 'w';
  const newFenMetaData = `${newColorTurn}${fenMetaData.slice(1)}`;
  const newGameFEN = `${pieces} ${newFenMetaData}`;
  return newGameFEN;
};

/**
 * Updates the piece placement
 */
export const movePiece = async (gameId, startPos, endPos, username, promotionPiece) => {
  const moveFromTo = { from: startPos, to: endPos };
  const isPlayer1 = username === games[gameId].player1;
  const isUserAllowedToMove = isPlayer1 || username === games[gameId].player2;
  if (!isUserAllowedToMove) return;
  const game = games[gameId];
  if (!game) return;
  const OLD_GAME_HISTORY_LEN = game.gameState.history().length;
  if (game.gameState.fen() !== game.fen) game.gameState.load(game.fen);
  let move;
  let isCaptureImmunityEnabled = false;
  const isSnowFreeze = getSnowFreeze(gameId);
  let isOmegaUpgradeActive = false;
  let isGoldBoltMove = false;
  const isCrazyChessGame = games[gameId].isCrazyChess;
  if (isCrazyChessGame) {
    const {
      isRandomMove,
      isRoadblock,
      isCaptureImmune,
      isOmegaUpgrade,
      isEndPosOnGoldBolt,
    } = crazyChessPower(game, username, endPos);
    isCaptureImmunityEnabled = isCaptureImmune;
    isOmegaUpgradeActive = isOmegaUpgrade;
    isGoldBoltMove = isEndPosOnGoldBolt;
    if (isRoadblock) {
      emitMovePiece(game, null, isPlayer1, moveFromTo);
      return;
    }
    if (isRandomMove) {
      const moves = game.gameState.moves();
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      move = game.gameState.move(randomMove);
      game.fen = game.gameState.fen();
    }
  }
  const { row: startRow, col: startCol } = translateSelectedPiece(startPos);
  const { row: endRow, col: endCol } = translateSelectedPiece(endPos);
  let isValidMoveInSnowStorm = true;
  if (isSnowFreeze)
    isValidMoveInSnowStorm = oneStepMove(game, startPos, startRow, startCol, endRow, endCol);
  let isKingTeleportMove = false;
  const isKingTeleportActivated =
    game.crazyChessPowers?.kingTeleportP1 || game.crazyChessPowers?.kingTeleportP2;
  if (isKingTeleportActivated) {
    isKingTeleportMove = isKingTeleportCheck(
      game,
      startPos,
      endPos,
      startRow,
      startCol,
      endRow,
      endCol,
      isPlayer1,
    );
    if (isKingTeleportMove) {
      game.fen = kingTeleportMove(game, startPos, endPos, isPlayer1);
      game.fen = changeFenTurn(game);
      game.gameState.load(game.fen);
    }
  }
  const isNoMoveMadeYet = !move && isValidMoveInSnowStorm && !isKingTeleportMove;
  if (isNoMoveMadeYet) {
    move = game.gameState.move({
      from: startPos,
      to: endPos,
      promotion: promotionPiece?.toLowerCase(),
    });
    game.fen = game.gameState.fen();
  }
  const isValidMove = move || isKingTeleportMove;
  if (isValidMove) startOpposingTimer(game);
  const flags = isValidMove ? move?.flags : null;
  const isValidMoveInCrazyChess = move && isCrazyChessGame;
  if (isCaptureImmunityEnabled && isMoveCapture(flags)) {
    game.gameState.undo();
    game.fen = game.gameState.fen();
    io.in(game.id).emit('captureImmune', isPlayer1);
    return;
  } else if (isCaptureImmunityEnabled && isValidMoveInCrazyChess) {
    game.crazyChessPowers.captureImmunity = '';
    io.in(game.id).emit('captureImmunityRemoved');
  }
  if (isValidMoveInCrazyChess) {
    if (isOmegaUpgradeActive) upgradePiece(gameId, endPos, username);
    fogOfWarDurationHandling(game);
    snowFreezeDurationHandling(game);
    const explosivePawnIndex = game.crazyChessPowers.explosivePawns.indexOf(
      `${startRow}${startCol}`,
    );
    const isExplosivePawnFound = explosivePawnIndex !== -1;
    const killExplosivePawnIndex = game.crazyChessPowers.explosivePawns.indexOf(
      `${endRow}${endCol}`,
    );
    const isExplosivePawnKilled = killExplosivePawnIndex !== -1;
    if (isMoveCapture(flags) && isExplosivePawnKilled) {
      const possiblePieceRemovals = 'rnbqpRNBQP';
      game.fen = removePieceFromFenString(game.fen, endRow, endCol, possiblePieceRemovals);
      game.crazyChessPowers.explosivePawns.splice(explosivePawnIndex, 1);
      io.in(gameId).emit('explosivePawnPosition', game.crazyChessPowers.explosivePawns);
    } else if (isExplosivePawnFound) {
      game.crazyChessPowers.explosivePawns[explosivePawnIndex] = `${endRow}${endCol}`;
      io.in(gameId).emit('explosivePawnPosition', game.crazyChessPowers.explosivePawns);
    }
  }
  const gameHistoryLength =
    game.gameState.history() !== undefined
      ? game.gameState.history().length
      : OLD_GAME_HISTORY_LEN;
  if (isValidMoveInCrazyChess && gameHistoryLength % 7 === 0) generateNewPower(gameId);
  if (isValidMoveInCrazyChess && gameHistoryLength % 15 === 0) spawnGoldBolt(gameId);
  if (isValidMoveInCrazyChess && isGoldBoltMove) consumeGoldBolt(gameId, username);
  setLiveGameStateDB(
    gameId,
    game.fen,
    game.timeLeft1,
    game.timeLeft2,
    game.crazyChessPowers,
    game.availablePowers,
  );
  const isGameOver = game.gameState.game_over();
  if (isGameOver) gameOver(game);
  emitMovePiece(game, flags, isPlayer1, moveFromTo);
};

export const backToMenu = gameId => {
  io.in(gameId).emit('backToMenuResponse');
};

export const getMatchHistory = userId => matchHistory[userId];

/* ---           --- */
/* ---           --- */
/* --- STOCKFISH --- */
export const stockfishMovePiece = async (gameId, from, to, username, promotionPiece) => {
  const moveFromTo = { from, to };
  const isPlayer1 = username === games[gameId].player1;
  const isUserAllowedToMove = isPlayer1 || username === games[gameId].player2;
  if (!isUserAllowedToMove) return;
  const game = games[gameId];
  const move = game.gameState.move({
    from,
    to,
    promotion: promotionPiece?.toLowerCase(),
  });
  if (move) startOpposingTimer(game);
  game.fen = game.gameState.fen();
  setLiveGameStateDB(gameId, game.fen, game.timeLeft1, game.timeLeft2);
  const isGameOver = game.gameState.game_over();
  if (isGameOver) gameOver(game);
  const flags = move ? move.flags : null;
  emitMovePiece(game, flags, !isPlayer1, moveFromTo);
};

export const stockfishGetHistory = (gameId, username) => {
  const game = games[gameId];
  /* const isStockfishTurn = game.gameState.turn() === 'b';
  if (!isStockfishTurn) return; */
  const isPlayer1 = username === games[gameId].player1;
  const isUserAllowedToMove = isPlayer1 || username === games[gameId].player2;
  if (!isUserAllowedToMove) return;
  return game.gameState.history({ verbose: true });
};

export const crazyChessPower = (game, username, endPos) => {
  let isRandomMove = false;
  let isRoadblock = false;
  let isCaptureImmune = false;
  let isOmegaUpgrade = false;
  const isUserMatchUpgrade = username === game.crazyChessPowers.omegaUpgrade;
  const isUserMatchImmunity = username === game.crazyChessPowers.captureImmunity;
  const isUserMatchRandomMove = username === game.crazyChessPowers.randomMove;
  const isPlayer1 = username === game.player1;
  const isPlayerTurn =
    (game.gameState.turn() === 'w' && isPlayer1) || (game.gameState.turn() === 'b' && !isPlayer1);
  if (isUserMatchRandomMove && isPlayerTurn) {
    game.crazyChessPowers.randomMove = '';
    isRandomMove = true;
  }
  if (isUserMatchImmunity && isPlayerTurn) {
    isCaptureImmune = true;
  }
  if (isUserMatchUpgrade) {
    isOmegaUpgrade = true;
  }
  const { row, col } = translateSelectedPiece(endPos);
  const rowColId = `${row}${col}`;
  const isEndPosOnGoldBolt = rowColId === game.goldBolt;
  const isCellBlocked = game.crazyChessPowers.disabledCells.includes(rowColId);
  if (isCellBlocked) {
    isRoadblock = true;
  }
  return { isRandomMove, isRoadblock, isCaptureImmune, isOmegaUpgrade, isEndPosOnGoldBolt };
};

export const nextOpponentMoveRandom = (gameId, username) => {
  const game = games[gameId];
  if (!game) return;
  const isPlayer1 = username === games[gameId].player1;
  const isPlayer2 = username === games[gameId].player2;
  if (isPlayer1 && game.availablePowers.player1.includes(POWER.RANDOM)) {
    game.crazyChessPowers.randomMove = games[gameId].player2;
    removeUserPowerOnce(POWER.RANDOM, username, game);
  } else if (isPlayer2 && game.availablePowers.player2.includes(POWER.RANDOM)) {
    game.crazyChessPowers.randomMove = games[gameId].player1;
    removeUserPowerOnce(POWER.RANDOM, username, game);
  }
};

export const undoMove = (gameId, username) => {
  const game = games[gameId];
  if (!game) return;
  const isPlayer1 = username === games[gameId].player1;
  const isPlayer2 = username === games[gameId].player2;
  if (isPlayer1 && !game.availablePowers.player1.includes(POWER.UNDO)) return;
  else if (isPlayer2 && !game.availablePowers.player2.includes(POWER.UNDO)) return;
  else if (game.gameState.history() === 0) return false;
  const undoData = game.gameState.undo();
  if (!undoData) return false;
  const flags = undoData.flags;
  startOpposingTimer(game);
  game.fen = game.gameState.fen();
  setLiveGameStateDB(
    gameId,
    game.fen,
    game.timeLeft1,
    game.timeLeft2,
    game.crazyChessPowers,
    game.availablePowers,
  );
  const isCastle = flags === 'k' || flags === 'q';
  const isEnPassant = flags === 'e';
  const isPromotion = flags === 'p' || flags === 'cp';
  const isCapture = flags === 'c';
  io.in(game.id).emit(
    'undoMove',
    game.fen,
    game.gameState.in_check(),
    isCastle,
    isEnPassant,
    isPromotion,
    isCapture,
  );
  removeUserPowerOnce(POWER.UNDO, username, game);
};

export const disableSelectedCell = (gameId, username, row, col) => {
  const game = games[gameId];
  if (!game) return;
  const isPlayer1 = username === games[gameId].player1;
  const isPlayer2 = username === games[gameId].player2;
  if (isPlayer1 && !game.availablePowers.player1.includes(POWER.DISABLE)) return;
  else if (isPlayer2 && !game.availablePowers.player2.includes(POWER.DISABLE)) return;
  const pieces = game.fen.split(' ')[0];
  let rowIter = 0;
  let colIter = 0;
  for (let i = 0; i < pieces.length; i += 1) {
    if (pieces.charAt(i) === '/') {
      rowIter += 1;
      colIter = 0;
    } else if (pieces.charAt(i).match('[rnbqkpRNBQKP]')) {
      const isCellOccupied = row === rowIter && col === colIter;
      if (isCellOccupied) return;
      colIter += 1;
    } else {
      for (let j = 0; j < Number(pieces.charAt(i)); j += 1) {
        const isEmptyCell = row == rowIter && col == colIter;
        if (isEmptyCell) {
          io.in(game.id).emit('disableSelectedCell', row, col);
          const rowColId = `${row}${col}`;
          const isUnique = game.crazyChessPowers.disabledCells.indexOf(rowColId) === -1;
          if (isUnique) {
            game.crazyChessPowers.disabledCells.push(rowColId);
            removeUserPowerOnce(POWER.DISABLE, username, game);
          }
          return;
        }
        colIter += 1;
      }
    }
  }
};

export const disabledCells = gameId => {
  const game = games[gameId];
  if (!game) return;
  return game.crazyChessPowers.disabledCells;
};

const translateSelectedPiece = pos => {
  const letterIndex = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const row = 8 - Number(pos.charAt(1));
  const file = pos.charAt(0);
  const col = letterIndex.indexOf(file);
  return { row, col };
};

export const activateCaptureImmunity = (gameId, username) => {
  const game = games[gameId];
  if (!game) return;
  const isPlayer1 = username === game.player1;
  const isPlayer2 = username === game.player2;
  if (isPlayer1 && game.availablePowers.player1.includes(POWER.IMMUNE))
    game.crazyChessPowers.captureImmunity = game.player2;
  else if (isPlayer2 && game.availablePowers.player2.includes(POWER.IMMUNE))
    game.crazyChessPowers.captureImmunity = game.player1;
  removeUserPowerOnce(POWER.IMMUNE, username, game);
};

const isMoveCapture = flags => {
  const isEnPassant = flags === 'e';
  const isPromotionCapture = flags === 'cp';
  const isNormalCapture = flags === 'c';
  const isCapture = isEnPassant || isPromotionCapture || isNormalCapture;
  return isCapture;
};

export const cutDownOpponentTime = (gameId, username) => {
  const game = games[gameId];
  if (!game) return;
  const isPlayer1 = username === game.player1;
  const isPlayer2 = username === game.player2;
  if (isPlayer1 && !game.availablePowers.player1.includes(POWER.CUTDOWN_TIME)) return;
  else if (isPlayer2 && !game.availablePowers.player2.includes(POWER.CUTDOWN_TIME)) return;
  const twentyPercentCutOff = 5;
  if (isPlayer1)
    game.timeLeft2 = game.timeLeft2 - Math.trunc(game.timeLeft2 / twentyPercentCutOff);
  else if (isPlayer2)
    game.timeLeft1 = game.timeLeft1 - Math.trunc(game.timeLeft1 / twentyPercentCutOff);
  removeUserPowerOnce(POWER.CUTDOWN_TIME, username, game);
};

export const spawnFriendlyPiece = (gameId, username, spawnCell) => {
  const game = games[gameId];
  if (!game) return;
  const isPlayer1 = username === game.player1;
  const isPlayer2 = username === game.player2;
  if (isPlayer1 && !game.availablePowers.player1.includes(POWER.SPAWN)) return;
  else if (isPlayer2 && !game.availablePowers.player2.includes(POWER.SPAWN)) return;
  const isAllowedRow =
    (spawnCell.charAt(1) === '3' && isPlayer1) || (spawnCell.charAt(1) === '6' && isPlayer2);
  const isCellOccupied = game.gameState.get(spawnCell);
  if (!isAllowedRow || isCellOccupied) return;
  let isSpawnValid = false;
  if (isPlayer1)
    isSpawnValid = game.gameState.put(
      { type: game.gameState.PAWN, color: game.gameState.WHITE },
      spawnCell,
    );
  else if (isPlayer2)
    isSpawnValid = game.gameState.put(
      { type: game.gameState.PAWN, color: game.gameState.BLACK },
      spawnCell,
    );
  game.fen = game.gameState.fen();
  if (isSpawnValid) io.in(gameId).emit('pieceSpawn', game.fen, username);
  removeUserPowerOnce(POWER.SPAWN, username, game);
};

export const omegaPieceUpgrade = (gameId, username) => {
  const game = games[gameId];
  if (!game) return;
  const isPlayer1 = username === game.player1;
  const isPlayer2 = username === game.player2;
  if (isPlayer1 && !game.availablePowers.player1.includes(POWER.UPGRADE)) return;
  else if (isPlayer2 && !game.availablePowers.player2.includes(POWER.UPGRADE)) return;
  if (isPlayer1) game.crazyChessPowers.omegaUpgrade = game.player1;
  else if (isPlayer2) game.crazyChessPowers.omegaUpgrade = game.player2;
  removeUserPowerOnce(POWER.UPGRADE, username, game);
};

const upgradePiece = (gameId, upgradeCell, username) => {
  const game = games[gameId];
  if (!game) return;
  const color = game.gameState.turn() === 'w' ? game.gameState.BLACK : game.gameState.WHITE;
  const piecePreUpgrade = game.gameState.get(upgradeCell);
  if (!piecePreUpgrade) return;
  const isKnightOrPawn =
    piecePreUpgrade.type === 'n' ||
    piecePreUpgrade.type === 'N' ||
    piecePreUpgrade.type === 'p' ||
    piecePreUpgrade.type === 'P';
  if (!isKnightOrPawn) return;
  let piecePostUpgrade = game.gameState.KNIGHT;
  if (piecePreUpgrade.type === 'n' || piecePreUpgrade.type === 'N')
    piecePostUpgrade = game.gameState.BISHOP;
  const isPieceRemoved = games[gameId].gameState.remove(upgradeCell);
  const isPiecePlaced = games[gameId].gameState.put(
    { type: piecePostUpgrade, color: color },
    upgradeCell,
  );
  if (isPieceRemoved && isPiecePlaced) {
    io.in(gameId).emit('omegaPieceUpgrade', username);
    games[gameId].crazyChessPowers.omegaUpgrade = '';
    game.fen = games[gameId].gameState.fen();
  }
};

export const selectExplosivePawn = (gameId, username, row, col) => {
  const game = games[gameId];
  if (!game) return;
  const isPlayer1 = username === game.player1;
  const isPlayer2 = username === game.player2;
  if (isPlayer1 && !game.availablePowers.player1.includes(POWER.EXPLOSIVE)) return;
  else if (isPlayer2 && !game.availablePowers.player2.includes(POWER.EXPLOSIVE)) return;
  const isPlayer1Turn = game.gameState.turn() === 'w';
  const isPlayer2Turn = game.gameState.turn() === 'b';
  if (isPlayer1 && !isPlayer1Turn) return;
  else if (isPlayer2 && !isPlayer2Turn) return;
  const pieces = game.fen.split(' ')[0];
  let rowIter = 0;
  let colIter = 0;
  for (let i = 0; i < pieces.length; i += 1) {
    const isSelectedCell = row === rowIter && col === colIter;
    const rowColId = `${row}${col}`;
    const isUnique = game.crazyChessPowers.explosivePawns.indexOf(rowColId) === -1;
    if (pieces.charAt(i) === '/') {
      rowIter += 1;
      colIter = 0;
    } else if (isSelectedCell && isUnique && isPlayer1 && pieces.charAt(i).match('[P]')) {
      removeUserPowerOnce(POWER.EXPLOSIVE, username, game);
      io.in(gameId).emit('selectExplosivePawn', row, col);
      game.crazyChessPowers.explosivePawns.push(`${row}${col}`);
      return;
    } else if (isSelectedCell && isUnique && isPlayer2 && pieces.charAt(i).match('[p]')) {
      removeUserPowerOnce(POWER.EXPLOSIVE, username, game);
      io.in(gameId).emit('selectExplosivePawn', row, col);
      game.crazyChessPowers.explosivePawns.push(`${row}${col}`);
      return;
    } else if (pieces.charAt(i).match('[rnbqkpRNBQKP]')) {
      colIter += 1;
    } else {
      for (let j = 0; j < Number(pieces.charAt(i)); j += 1) {
        colIter += 1;
      }
    }
  }
};

export const snowFreeze = (gameId, username) => {
  /* ❄️🥶 */
  const game = games[gameId];
  if (!game) return;
  const isPlayer1 = username === game.player1;
  const isPlayer2 = username === game.player2;
  if (isPlayer1 && !game.availablePowers.player1.includes(POWER.SNOW_FREEZE)) return;
  else if (isPlayer2 && !game.availablePowers.player2.includes(POWER.SNOW_FREEZE)) return;
  if (isPlayer1) {
    game.crazyChessPowers.snowFreezeP1 = 2;
    io.in(gameId).emit('snowFreezeEnable', 'b');
    removeUserPowerOnce(POWER.SNOW_FREEZE, username, game);
  } else if (isPlayer2) {
    game.crazyChessPowers.snowFreezeP2 = 2;
    io.in(gameId).emit('snowFreezeEnable', 'w');
    removeUserPowerOnce(POWER.SNOW_FREEZE, username, game);
  }
};

export const getSnowFreeze = gameId => {
  const game = games[gameId];
  if (!game) return;
  if (!game.isCrazyChess) return;
  if (game.crazyChessPowers.snowFreezeP1 > 0) return true;
  if (game.crazyChessPowers.snowFreezeP2 > 0) return true;
  return false;
};

const snowFreezeDurationHandling = game => {
  if (game.crazyChessPowers.snowFreezeP1 > 0) games[game.id].crazyChessPowers.snowFreezeP1 -= 1;
  if (game.crazyChessPowers.snowFreezeP2 > 0) games[game.id].crazyChessPowers.snowFreezeP2 -= 1;
  if (game.crazyChessPowers.snowFreezeP1 <= 0 && game.crazyChessPowers.snowFreezeP2 <= 0)
    io.in(game.id).emit('snowFreezeDisable');
};

export const kingTeleport = (gameId, username) => {
  const game = games[gameId];
  if (!game) return;
  const isPlayer1 = username === game.player1;
  const isPlayer2 = username === game.player2;
  if (isPlayer1 && !game.availablePowers.player1.includes(POWER.KING_TELEPORT)) return;
  else if (isPlayer2 && !game.availablePowers.player2.includes(POWER.KING_TELEPORT)) return;
  if (isPlayer1) {
    game.crazyChessPowers.kingTeleportP1 = true;
    io.in(gameId).emit('kingTeleport', 'b');
    removeUserPowerOnce(POWER.KING_TELEPORT, username, game);
  } else if (isPlayer2) {
    game.crazyChessPowers.kingTeleportP2 = true;
    io.in(gameId).emit('kingTeleport', 'w');
    removeUserPowerOnce(POWER.KING_TELEPORT, username, game);
  }
};

export const fogOfWar = (gameId, username) => {
  const game = games[gameId];
  if (!game) return;
  const isPlayer1Turn = game.gameState.turn() === 'w';
  const isPlayer2Turn = game.gameState.turn() === 'b';
  const isPlayer1 = username === game.player1;
  const isPlayer2 = username === game.player2;
  if (isPlayer1 && !game.availablePowers.player1.includes(POWER.FOG)) return;
  else if (isPlayer2 && !game.availablePowers.player2.includes(POWER.FOG)) return;
  if (isPlayer1 && !isPlayer1Turn) {
    game.crazyChessPowers.fogOfWarP1 = 3;
    io.in(gameId).emit('fogOfWarEnable', 'b');
    removeUserPowerOnce(POWER.FOG, username, game);
  } else if (isPlayer2 && !isPlayer2Turn) {
    game.crazyChessPowers.fogOfWarP2 = 3;
    io.in(gameId).emit('fogOfWarEnable', 'w');
    removeUserPowerOnce(POWER.FOG, username, game);
  }
};

export const getFogOfWar = (gameId, username) => {
  const game = games[gameId];
  if (!game) return;
  const isPlayer1 = username === game.player1;
  const isPlayer2 = username === game.player2;
  if (game.crazyChessPowers.fogOfWarP1 > 0 && isPlayer2) return true;
  if (game.crazyChessPowers.fogOfWarP2 > 0 && isPlayer1) return true;
  return false;
};

const fogOfWarDurationHandling = game => {
  if (game.crazyChessPowers.fogOfWarP1 > 0) games[game.id].crazyChessPowers.fogOfWarP1 -= 1;
  if (game.crazyChessPowers.fogOfWarP2 > 0) games[game.id].crazyChessPowers.fogOfWarP2 -= 1;
  if (game.crazyChessPowers.fogOfWarP1 <= 0) io.in(game.id).emit('fogOfWarDisable', 'b');
  if (game.crazyChessPowers.fogOfWarP2 <= 0) io.in(game.id).emit('fogOfWarDisable', 'w');
};

const generateNewPower = gameId => {
  const game = games[gameId];
  if (!game) return;
  if (game.availablePowers.player1.length < 3) {
    const newPower1 = getPower(game.availablePowers.player1);
    game.availablePowers.player1.push(newPower1);
  }
  if (game.availablePowers.player2.length < 3) {
    const newPower2 = getPower(game.availablePowers.player2);
    game.availablePowers.player2.push(newPower2);
  }
  io.in(game.id).emit('updatedPowers', game.availablePowers.player1, game.availablePowers.player2);
};

export const getStartingPowers = (gameId, username) => {
  const game = games[gameId];
  if (!game) return;
  const isPlayer1 = username === game.player1;
  if (isPlayer1) {
    return game.availablePowers.player1;
  } else {
    return game.availablePowers.player2;
  }
};

export const randomizeNStartPowers = nActivePowers => {
  const powersGenerated = [];
  let elementIndex = 0;
  while (elementIndex < nActivePowers) {
    const power = getPower(powersGenerated);
    powersGenerated[elementIndex] = power;
    elementIndex += 1;
  }
  return powersGenerated;
};

const getPower = playerPowers => {
  const allPowers = [
    POWER.SNOW_FREEZE,
    POWER.IMMUNE,
    POWER.DISABLE,
    POWER.CUTDOWN_TIME,
    POWER.SPAWN,
    POWER.UPGRADE,
    POWER.RANDOM,
    POWER.UNDO,
    POWER.EXPLOSIVE,
    POWER.FOG,
    POWER.KING_TELEPORT,
  ];
  const filteredPowers = allPowers.filter(power => !playerPowers.includes(power));
  const uniquePower = filteredPowers[Math.floor(Math.random() * filteredPowers.length)]; // filteredPowers[filteredPowers.length - 1]; // //
  return uniquePower;
};

const spawnGoldBolt = gameId => {
  const game = games[gameId];
  if (!game) return;
  const pieces = game.fen.split(' ')[0];
  const rowLowerBound = 3;
  const rowUpperBound = 4;
  const colLowerBound = 0;
  const colUpperBound = 7;
  let row = randomInt(rowLowerBound, rowUpperBound);
  let col = randomInt(colLowerBound, colUpperBound);
  let rowIter = 0;
  let colIter = 0;
  for (let i = 0; i < pieces.length; i += 1) {
    if (pieces.charAt(i) === '/') {
      rowIter += 1;
      colIter = 0;
    } else if (pieces.charAt(i).match('[rnbqkpRNBQKP]')) {
      const isCellOccupied = row === rowIter && col === colIter;
      if (isCellOccupied) {
        row = randomInt(rowIter, rowUpperBound);
        col = randomInt(colIter, colUpperBound);
      }
      colIter += 1;
    } else {
      for (let j = 0; j < Number(pieces.charAt(i)); j += 1) {
        const isEmptyCell = row == rowIter && col == colIter;
        if (isEmptyCell) {
          io.in(game.id).emit('spawnGoldBolt', row, col);
          const rowColId = `${row}${col}`;
          game.goldBolt = rowColId;
          return;
        }
        colIter += 1;
      }
    }
  }
};

export const getGoldBolt = gameId => {
  const game = games[gameId];
  if (!game) return;
  return game.goldBolt;
};

const consumeGoldBolt = (gameId, username) => {
  const game = games[gameId];
  if (!game) return;
  const isPlayer1 = username === game.player1;
  const isPlayer2 = username === game.player2;
  game.goldBolt = '';
  if (isPlayer1) io.in(game.id).emit('consumeGoldBolt', isPlayer1, false);
  else if (isPlayer2) io.in(game.id).emit('consumeGoldBolt', false, isPlayer2);
};

const randomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const incrementPowerFreq = (gameId, username, powerIncrement) => {
  const game = games[gameId];
  if (!game) return;
  if (!Object.values(POWER).includes(powerIncrement)) return;
  const isPlayer1 = username === game.player1;
  const isPlayer2 = username === game.player2;
  if (isPlayer1) {
    game.availablePowers.player1.push(powerIncrement);
  } else if (isPlayer2) {
    game.availablePowers.player2.push(powerIncrement);
  }
};

const removeUserPowerOnce = (powerType, username, game) => {
  const isPlayer1 = username === game.player1;
  const isPlayer2 = username === game.player2;
  let arr = [];
  if (isPlayer1) {
    arr = game.availablePowers.player1;
  } else if (isPlayer2) {
    arr = game.availablePowers.player2;
  }
  const index = arr.indexOf(powerType);
  if (index > -1) {
    arr.splice(index, 1);
  }
};
