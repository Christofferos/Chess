import express from 'express';

import {
  addLiveGame,
  movePiece,
  getLiveGame,
  removeLiveGame,
  io,
  surrender,
  stockfishMovePiece,
  stockfishGetHistory,
  nextOpponentMoveRandom,
  undoMove,
  disableSelectedCell,
  disabledCells,
  activateCaptureImmunity,
  cutDownOpponentTime,
  spawnFriendlyPiece,
  omegaPieceUpgrade,
  fogOfWar,
  getFogOfWar,
  getStartingPowers,
  getGoldBolt,
  incrementPowerFreq,
} from '../model.js';
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
  const gameId = makeId(3);
  console.log(req.session.userID);
  io.emit('inviteToGame', req.body.userToInvite, gameId, req.session.userID);
  const minutes = req.body.minuteTimeLimit ? req.body.minuteTimeLimit : 5;
  const timeLimitSecs = minutes * 60;
  const isCrazyChess = req.body.crazyChess ? true : false;
  const game = addLiveGame(gameId, req.session.userID, timeLimitSecs, isCrazyChess);
  addLiveGameDB(
    gameId,
    '',
    req.session.userID,
    '',
    timeLimitSecs,
    timeLimitSecs,
    isCrazyChess,
    game.crazyChessPowers,
    game.availablePowers,
  );
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
    getLiveGame(req.body.id)[0]?.player1 !== req.session.userID &&
    getLiveGame(req.body.id)[0]?.player2 !== req.session.userID
  ) {
    res.status(401).end();
    return;
  }
  surrender(req.body.id, req.session.userID);
  res.status(200).end();
});

gameRouter.post('/stockfishMovePiece', async (req, res) => {
  if (req.session.userID) {
    stockfishMovePiece(
      req.body.gameId,
      req.body.from,
      req.body.to,
      req.session.userID,
      req.body.promotion,
    );
  }
  res.status(200).end();
});

gameRouter.post('/stockfishGetHistory', async (req, res) => {
  if (!req.session.userID) return res.status(401).end();
  const history = stockfishGetHistory(req.body.gameId, req.session.userID);
  res.json({ history: history });
});

gameRouter.post('/randomMoveOpponent', async (req, res) => {
  if (!req.session.userID) return res.status(401).end();
  nextOpponentMoveRandom(req.body.gameId, req.session.userID);
  res.status(200).end();
});

gameRouter.post('/undoMove', async (req, res) => {
  if (!req.session.userID) return res.status(401).end();
  undoMove(req.body.gameId, req.session.userID);
  res.status(200).end();
});

gameRouter.post('/disabledCells', async (req, res) => {
  if (!req.session.userID) return res.status(401).end();
  const roadblocks = disabledCells(req.body.gameId);
  res.json({ roadblocks });
});

gameRouter.post('/disableSelectedCell', async (req, res) => {
  if (!req.session.userID) return res.status(401).end();
  disableSelectedCell(req.body.gameId, req.session.userID, req.body.row, req.body.col);
  res.status(200).end();
});

gameRouter.post('/captureImmunity', async (req, res) => {
  if (!req.session.userID) return res.status(401).end();
  activateCaptureImmunity(req.body.gameId, req.session.userID);
  res.status(200).end();
});

gameRouter.post('/cutDownOpponentTime', async (req, res) => {
  if (!req.session.userID) return res.status(401).end();
  cutDownOpponentTime(req.body.gameId, req.session.userID);
  res.status(200).end();
});

gameRouter.post('/spawnFriendlyPiece', async (req, res) => {
  if (!req.session.userID) return res.status(401).end();
  spawnFriendlyPiece(req.body.gameId, req.session.userID, req.body.spawnCell);
  res.status(200).end();
});

gameRouter.post('/omegaPieceUpgrade', async (req, res) => {
  if (!req.session.userID) return res.status(401).end();
  omegaPieceUpgrade(req.body.gameId, req.session.userID);
  res.status(200).end();
});

gameRouter.post('/fogOfWar', async (req, res) => {
  if (!req.session.userID) return res.status(401).end();
  fogOfWar(req.body.gameId, req.session.userID);
  res.status(200).end();
});

gameRouter.post('/checkFogOfWar', async (req, res) => {
  if (!req.session.userID) return res.status(401).end();
  const isFogOfWar = getFogOfWar(req.body.gameId, req.session.userID);
  res.json({ isFogOfWar });
});

gameRouter.post('/startingPowers', async (req, res) => {
  if (!req.session.userID) return res.status(401).end();
  const powers = getStartingPowers(req.body.gameId, req.session.userID);
  res.json({ powers });
});

gameRouter.post('/goldBoltPlacement', async (req, res) => {
  if (!req.session.userID) return res.status(401).end();
  const goldBolt = getGoldBolt(req.body.gameId);
  res.json({ goldBolt });
});

gameRouter.post('/incrementPowerFreq', async (req, res) => {
  if (!req.session.userID) return res.status(401).end();
  incrementPowerFreq(req.body.gameId, req.session.userID, req.body.powerIncrement);
  res.status(200).end();
});
