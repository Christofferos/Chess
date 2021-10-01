import express from 'express';
import bcrypt from 'bcrypt';

import { addUser, getMatchHistory } from '../model.js';
import { addUserDB, getUsersOnlineDB } from '../firestore.js';
import { sessionStore } from '../index.js';

export const userRouter = express.Router();
const SALT_ROUNDS = 10;

userRouter.post('/signUp', (req, res) => {
  const success = addUser(req.body.username);
  if (!success) res.sendStatus(404);
  bcrypt.hash(req.body.username, SALT_ROUNDS, (_, hash) => {
    addUserDB(req.body.username, hash);
    req.session.userID = req.body.username;
    res.status(200).json({ success });
  });
});

userRouter.put('/signOut', (req, res) => {
  req.session.destroy();
  res.status(200).end();
});

userRouter.get('/matchHistory/:userId', (req, res) => {
  const userId = req.params.userId.trim();
  res.status(200).json({ matchHistory: getMatchHistory(userId) });
});

userRouter.get('/userOnlineInitialize', async (req, res) => {
  const onlineUsers = await getUsersOnlineDB();
  res.status(200).json({ onlineUsers });
});
