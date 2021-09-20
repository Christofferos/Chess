import express from 'express';
import bcrypt from 'bcrypt';

import { findUser } from '../model.js';
import { db } from '../database.js';

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
  const maybeUser = findUser(req.session.userID);
  if (maybeUser === undefined) {
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
  const maybeUser = findUser(req.session.userID);
  res.status(200).json({
    isAuthenticated: maybeUser !== undefined,
    username: maybeUser !== undefined ? maybeUser.name : 'N/A',
  });
});

/**
 * Attempts to authenticate the user-session
 * @param {String} req.body.username - The username of the user attempting to authenticate
 * @param {String} req.session.userID - A string that uniquely identifies the given user.
 * @returns {void}
 */
authRouter.post('/authenticate', (req, res) => {
  const { username, password } = req.body;

  db.serialize(() => {
    const statement = db.prepare('SELECT username, password FROM users WHERE username = (?)');
    statement.get(username, async (err, row) => {
      if (err) {
        throw new Error(err);
      }
      if (typeof row !== 'undefined') {
        const match = await bcrypt.compare(password, row.password);
        if (match) {
          statement.finalize();
          req.session.userID = row.username;
          req.session.save(error => {
            if (error) {
              res.sendStatus(401);
            } else {
              console.debug('Saved session');
            }
          });
          res.sendStatus(200);
        } else if (!match) {
          statement.finalize();
          res.sendStatus(404);
        }
      } else {
        statement.finalize();
        res.sendStatus(404);
      }
    });
  });
});
