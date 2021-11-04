import express from 'express';

import {
  getLiveGames,
  getUserLiveGames,
  findLiveGame,
  authorizedToJoinGame,
  findUser,
  addMessage,
  io,
} from '../model.js';
import { setPlayer2InLiveGameDB } from '../firestore.js';

export const chatRouter = express.Router();

/**
 * Fetch the list the currently active rooms
 * @returns {void}
 */
chatRouter.get('/roomList', (req, res) => {
  const liveGames = getLiveGames();
  res.status(200).json({ list: liveGames });
});

chatRouter.get('/userRoomList', (req, res) => {
  const liveGames = getUserLiveGames(req.session.userID);
  res.status(200).json({ list: liveGames });
});

chatRouter.get('/room/:room/authorizedToJoin', (req, res) => {
  if (!req.session.userID) {
    res.status(401).end();
    return;
  }
  const game = findLiveGame(req.params.room.trim());
  if (!game) {
    res.status(404).json({
      msg: `No game with ID: ${req.params.room}`,
      href_roomList: '/roomList',
    });
    return;
  }
  const success = authorizedToJoinGame(req.session.userID, game.id);
  res.json({ success, isCrazyChess: game.isCrazyChess });
});

const getJoinGameResponseObject = game => {
  const { timer1, timer2, ...gameWithoutTimers } = game;
  return {
    game: gameWithoutTimers,
    list: game.messages,
    msg: `Successfully joined game: ${game.id}`,
    href_messages: `/room/${game.id}`,
    href_send_message: `/room/${game.id}/message`,
    success: true,
  };
};

/**
 * Join the specific game.
 * This will allow the user-session to listen to and post messages in the given game.
 * @param {String} req.params.room - The id of the game you would like to join
 * @param {String} req.session.userID - A string that uniquely identifies the given user.
 * @returns {void}
 */
chatRouter.get('/room/:room/join', (req, res) => {
  if (!req.session.userID) {
    res.status(401).end();
    return;
  }
  const game = findLiveGame(req.params.room.trim());
  const user = findUser(req.session.userID);
  if (!game || !user) {
    console.log('User or Game was null');
    res.status(401).end();
    return;
  }
  if (!user.socket) {
    console.log('User socket was null ');
    res.status(404).end();
    return;
  }
  user.currentRoom = game.id;
  user.socket.join(user.currentRoom);
  const isPlayer1RejoiningGame = game.player2 !== '' || game.player1 === req.session.userID;
  const isPlayer2JoiningGame = !isPlayer1RejoiningGame;
  const RESPONSE_OBJ = getJoinGameResponseObject(game);
  if (isPlayer1RejoiningGame) {
    addMessage(user.currentRoom, `Game code: ${game.id}`);
    addMessage(user.currentRoom, `${user.name} joined the room!`);
    res.status(200).json(RESPONSE_OBJ);
  } else if (isPlayer2JoiningGame) {
    addMessage(user.currentRoom, `${user.name} joined the room!`);
    game.player2 = req.session.userID;
    setPlayer2InLiveGameDB(game.player2, game.id);
    io.emit('getGamePlayers', { player1: game.player1, player2: game.player2 });
    res.status(200).json(RESPONSE_OBJ);
  } else {
    res.statusStatus(404);
  }
});

/**
 * Send a message in the given room.
 * @param {String} req.params.room - The id of the room you would like to join
 * @param {String} req.session.userID - A string that uniquely identifies the given user.
 * @returns {void}
 */
chatRouter.post('/room/:room/message', (req, res) => {
  const user = findUser(req.session.userID);
  if (user.currentRoom !== req.params.room) {
    res.status(403).json({
      msg: 'You may only send messages in rooms you are partaking in.',
      href_join: `/room/${req.params.room}/join`,
    });
    return;
  }
  const room = findLiveGame(req.params.room);
  addMessage(room.id, `${user.name}: ${req.body.message}`);
  res.sendStatus(200);
});
