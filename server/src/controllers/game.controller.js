import express from 'express';

import { addLiveGame, movePiece, getLiveGame, removeLiveGame, io, surrender } from '../model.js';
import { addLiveGameDB } from '../firestore.js';

export const gameRouter = express.Router();

function makeId(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i += 1) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

gameRouter.post('/newGame', (req, res) => {
  if (req.session.userID === undefined) {
    res.status(401).end();
    return;
  }
  const gameId = makeId(8);
  console.log(req.session.userID);
  io.emit('inviteToGame', req.body.userToInvite, gameId, req.session.userID);
  const minutes = req.body.minuteTimeLimit ? req.body.minuteTimeLimit : 5;
  const timeLimitSecs = minutes * 60;
  addLiveGame(gameId, req.session.userID, timeLimitSecs);
  addLiveGameDB(gameId, '', req.session.userID, '', timeLimitSecs, timeLimitSecs);
  res.json({ gameId });
});

gameRouter.post('/movePiece', async (req, res) => {
  if (req.session.userID) {
    movePiece(
      req.body.gameId,
      req.body.startPos,
      req.body.endPos,
      req.session.userID,
      req.body.promotion,
    );
  }
  res.status(200).end();
});

gameRouter.delete('/removeGame', async (req, res) => {
  if (getLiveGame(req.body.id)[0] === undefined || req.session.userID === undefined) {
    res.status(401).end();
    return;
  } else if (
    getLiveGame(req.body.id)[0].player1 !== req.session.userID &&
    getLiveGame(req.body.id)[0].player2 !== req.session.userID
  ) {
    res.status(401).end();
    return;
  }
  removeLiveGame(req.body.id);
  res.status(200).end();
});

gameRouter.post('/surrender', async (req, res) => {
  if (getLiveGame(req.body.id) === undefined || req.session.userID === undefined) {
    res.status(401).end();
    return;
  }
  if (
    getLiveGame(req.body.id)[0].player1 !== req.session.userID &&
    getLiveGame(req.body.id)[0].player2 !== req.session.userID
  ) {
    res.status(401).end();
    return;
  }
  surrender(req.body.id, req.session.userID);
  res.status(200).end();
});

/* gameRouter.get('/moveAudio', async (req, res) => {
  res.status(200).end();
}); */
