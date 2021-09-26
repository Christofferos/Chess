import express from 'express';
import bcrypt from 'bcrypt';

import { findUser } from '../model.js';
import { getUserDB } from '../firestore.js';

export const authRouter = express.Router();

/**
 * requireAuth is an endpoint guard for logged in users.
 * aka: A middle ware used to limit access to an endpoint to authenticated users
 * @param {Request} req
 * @param {String} req.session.userID - A string that uniquely identifies the given user.
 * @param {Response} res
 * @param {Function} next
 * @returns {void}
 */
export const requireAuth = (req, res, next) => {
  const isUserFound = findUser(req.session.userID);
  if (!isUserFound) {
    res
      .status(401)
      .send(
        'Unauthorized. Please make sure you are logged in before attempting this action again.',
      );
    return;
  }
  next();
};

/**
 * Tells the client if they are in an authenticated user-session.
 * @param {String} req.session.userID - A string that uniquely identifies the given user.
 * @returns {void}
 */
authRouter.get('/isAuthenticated', (req, res) => {
  const isUserFound = findUser(req.session.userID);
  res.status(200).json({
    isAuthenticated: isUserFound !== undefined,
    username: isUserFound !== undefined ? isUserFound.name : 'N/A',
  });
});

/**
 * Attempts to authenticate the user-session
 * @param {String} req.body.username - The username of the user attempting to authenticate
 * @param {String} req.session.userID - A string that uniquely identifies the given user.
 * @returns {void}
 */
authRouter.post('/authenticate', async (req, res) => {
  const { username, password } = req.body;
  const user = await getUserDB(username);
  if (!user) {
    res.sendStatus(404);
    return;
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    res.sendStatus(404);
    return;
  }
  req.session.userID = user.username;
  req.session.save(error => (error ? res.sendStatus(401) : res.sendStatus(200)));
});
