import express from 'express';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';

import { addUser, findUser, getMatchHistory, io } from '../model.js';
import { addUserDB, deleteUsersOnlineDB, getUsersDB, getUsersOnlineDB } from '../firestore.js';
import { pubSubClient, TOPIC_NAME } from '../../../pubsub.js';
import { TIMEFRAME_10_MINUTES } from '../utils/globalConstants.js';
import { currentDate } from '../utils/getCurrentDate.js';

export const userRouter = express.Router();
const SALT_ROUNDS = 10;

export const signUpLimiter = rateLimit({
  windowMs: TIMEFRAME_10_MINUTES,
  max: 10,
});

const publishMessage = async username => {
  const json = { username: username, timestamp: currentDate() };
  try {
    pubSubClient
      .topic(TOPIC_NAME)
      .publishMessage({ json }, () => console.log('Message published!'));
  } catch (error) {
    console.error(`Received error while publishing: ${error.message}`);
  }
};

userRouter.post('/signUp', signUpLimiter, (req, res) => {
  const success = addUser(req.body.username);
  if (!success) {
    res.sendStatus(404);
    return;
  }
  publishMessage(req.body.username);
  bcrypt.hash(req.body.username, SALT_ROUNDS, (_, hash) => {
    addUserDB(req.body.username, hash);
    req.session.userID = req.body.username;
    res.status(200).json({ success });
  });
});

userRouter.put('/signOut', async (req, res) => {
  const userSigningOut = findUser(req.session.userID);
  if (userSigningOut) {
    userSigningOut.socket.conn.close();
    deleteUsersOnlineDB(userSigningOut.name);
    io.emit('userOnlineUpdate', userSigningOut.name, false);
  }
  req.session.destroy();
  if (!userSigningOut) res.sendStatus(404);
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

userRouter.get('/leaderboard', async (req, res) => {
  const users = await getUsersDB();
  const userToExperienceScore = users.map(user => [user.username, user.experience]);
  const sortedLeaderboard = userToExperienceScore.sort(([, a], [, b]) => b - a);
  res.status(200).json({ sortedLeaderboard });
});
