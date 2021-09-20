import express from 'express';
import bcrypt from 'bcrypt';
import { addUser, getMatchHistory } from '../model.js';
import { db } from '../database.js';

const saltRounds = 10;

export const userRouter = express.Router();

userRouter.post('/signUp', (req, res) => {
  const success = addUser(req.body.username);
  if (success) {
    db.serialize(() => {
      const statement = db.prepare('INSERT INTO users VALUES (?, ?)');
      bcrypt.hash(req.body.username, saltRounds, (err, hash) => {
        statement.run(req.body.username, hash);
        statement.finalize();

        req.session.userID = req.body.username;

        res.status(200).json({ success });
      });
    });
  } else {
    res.status(200).json({ success });
  }
});

userRouter.put('/signOut', (req, res) => {
  req.session.destroy();
  res.status(200).end();
});

userRouter.get('/matchHistory/:userId', (req, res) => {
  const userId = req.params.userId.trim();
  res.status(200).json({ matchHistory: getMatchHistory(userId) });
});
