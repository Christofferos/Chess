import express from 'express';
import bcrypt from 'bcrypt';

import { addUser, findUser, getMatchHistory, io } from '../model.js';
import { addUserDB, deleteUsersOnlineDB, getUsersDB, getUsersOnlineDB } from '../firestore.js';
import { TOPIC_NAME } from './pubsub.js';
import { pubSubClient } from '../index.js';

export const userRouter = express.Router();
const SALT_ROUNDS = 10;

const publishMessage = async () => {
  const json = { foo: 'bar' };
  try {
    console.log('ID: ', pubSubClient.projectId);
    pubSubClient.topic(TOPIC_NAME).publishMessage({ json }, () => console.log('DONE'));
  } catch (error) {
    console.error(`Received error while publishing: ${error.message}`);
    process.exitCode = 1;
  }
};

userRouter.post('/signUp', (req, res) => {
  const success = addUser(req.body.username);
  if (!success) {
    res.sendStatus(404);
    return;
  }
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
  // ----
  publishMessage();
  const [topic] = await pubSubClient.createTopic('test');
  console.log(`Topic ${topic.name} created.`);
  // Creates a subscription on that new topic
  const [subscription] = await topic.createSubscription('testSub');
  // Receive callbacks for new messages on the subscription
  subscription.on('message', message => {
    console.log('Received message:', message.data.toString());
    process.exit(0);
  });
  subscription.on('error', error => {
    console.error('Received error:', error);
    process.exit(1);
  });
  // Send a message to the topic
  topic.publish(Buffer.from('Test message!'));
  // ----
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
