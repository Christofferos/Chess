import express from 'express';

import { addLiveGame, movePiece, getLiveGame, removeLiveGame } from '../model.js';
import { db } from '../database.js';

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
  addLiveGame(gameId, req.session.userID);
  db.serialize(async () => {
    const statement = db.prepare('INSERT INTO liveGames VALUES (?, ?, ?, ?, ?, ?)');
    statement.run(gameId, '', req.session.userID, '', 180, 180);
  });
  res.json({ gameId });
});

gameRouter.post('/movePiece', (req, res) => {
  if (req.session.userID) {
    movePiece(req.body.gameId, req.body.startPos, req.body.endPos, req.session.userID);
  }
  res.status(200).end();
});

gameRouter.delete('/removeGame', (req, res) => {
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
  removeLiveGame(req.body.id);

  db.serialize(async () => {
    const statement = db.prepare('DELETE FROM liveGames WHERE id = (?)');
    statement.run(req.body.id);
  });
  res.status(200).end();
});
