/* https://firebase.google.com/docs/firestore/quickstart#node.js */
import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import * as fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

let serviceAccount;
let privateFirestoreKey;
try {
  privateFirestoreKey = fs.readFileSync('./privateFirestoreKey.json', 'utf-8');
  serviceAccount = JSON.parse(privateFirestoreKey);
} catch (err) {
  serviceAccount = null;
}
if (!serviceAccount) {
  serviceAccount = {
    type: 'service_account',
    project_id: 'chessonlinepro',
    private_key_id: process.env.PRIVATE_KEY_ID || '',
    private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n') || '',
    client_email: 'firebase-adminsdk-l8nkl@chessonlinepro.iam.gserviceaccount.com',
    client_id: process.env.CLIENT_ID || '',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url:
      'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-l8nkl%40chessonlinepro.iam.gserviceaccount.com',
  };
}
initializeApp({
  credential: cert(serviceAccount),
});
const firestore = getFirestore();

import firebase from '@firebase/app';
import '@firebase/firestore';

const usersCollection = firestore.collection('users');
const liveGamesCollection = firestore.collection('liveGames');
const matchHistoryCollection = firestore.collection('matchHistory');
const usersOnlineCollection = firestore.collection('usersOnline');

export const addUserDB = async (username, password) => {
  const userRef = await usersCollection.add({
    username,
    password,
    experience: 0,
  });
  console.log('User document written with ID: ', userRef.id);
};

export const getUserDB = async username => {
  const query = await usersCollection.where('username', '==', username).get();
  if (query.empty) return;
  const userData = query.docs[0].data();
  return userData;
};

export const getUsersDB = async () => {
  const snapshot = await usersCollection.get();
  const users = [];
  snapshot.forEach(doc => {
    users.push(doc.data());
  });
  return users;
};

export const addUserExperiencePointDB = async userId => {
  const users = await usersCollection.where('username', '==', userId).get();
  users.forEach(user => {
    const userData = user.data();
    user.ref.update({ experience: userData.experience + 1 });
  });
};

export const addLiveGameDB = async (
  id,
  currentGame,
  player1,
  player2,
  timeLeft1,
  timeLeft2,
  isCrazyChess,
  crazyChessPowers,
  availablePowers,
) => {
  const UNIX_SECONDS = Math.round(new Date().getTime() / 1000);
  await liveGamesCollection.doc(id).set({
    id,
    currentGame,
    player1,
    player2,
    timeLeft1,
    timeLeft2,
    unixTimeCreation: UNIX_SECONDS,
    isCrazyChess,
    ...(isCrazyChess && { crazyChessPowers }),
    ...(availablePowers && { availablePowers }),
  });
};

export const setLiveGameStateDB = async (
  id,
  fen,
  timeLeft1,
  timeLeft2,
  crazyChessPowers,
  availablePowers,
) => {
  await liveGamesCollection.doc(id).update({
    currentGame: fen,
    timeLeft1,
    timeLeft2,
    crazyChessPowers: crazyChessPowers ?? {},
    availablePowers: availablePowers ?? {},
  });
};

export const cleanOldLiveGamesDB = async () => {
  const CURRENT_UNIX_TIME_SECONDS = Math.round(new Date().getTime() / 1000);
  const ONE_DAY_SECONDS = 24 * 60 * 60;
  const liveGames = await liveGamesCollection
    .where('unixTimeCreation', '<', CURRENT_UNIX_TIME_SECONDS - ONE_DAY_SECONDS)
    .get();
  const isGamesNotFound = !liveGames;
  if (isGamesNotFound) return;
  const batch = firestore.batch();
  liveGames.forEach(liveGame => {
    batch.delete(liveGame.ref);
  });
  await batch.commit();
};

export const deleteLiveGameDB = async id => {
  const liveGames = await liveGamesCollection.where('id', '==', id).get();
  const isGameNotFound = !liveGames;
  if (isGameNotFound) return;
  const batch = firestore.batch();
  liveGames.forEach(liveGame => {
    batch.delete(liveGame.ref);
  });
  await batch.commit();
};

export const setPlayer2InLiveGameDB = async (player2, id) => {
  await liveGamesCollection.doc(id).update({ player2 });
};

export const getLiveGamesDB = async () => {
  const snapshot = await liveGamesCollection.get();
  const liveGames = snapshot.docs.map(doc => doc.data());
  return liveGames;
};

export const addMatchHistoryGameDB = async (player1, player2, winner, nMoves, date) => {
  const matchHistoryRef = await matchHistoryCollection.add({
    player1,
    player2,
    winner,
    nMoves,
    date,
  });
  console.log('MatchHistory document added with ID: ', matchHistoryRef.id);
};

export const getAllMatchHistoryDB = async () => {
  const snapshot = await matchHistoryCollection.get();
  const allMatchHistory = snapshot.docs.map(doc => doc.data());
  return allMatchHistory;
};

export const addUserOnlineDB = async userId => {
  const query = await usersOnlineCollection.where('userId', '==', userId).get();
  if (!query.empty) return;
  const userOnlineRef = await usersOnlineCollection.add({
    userId,
  });
  console.log('UserOnline document added with ID: ', userOnlineRef.id);
};

export const getUsersOnlineDB = async () => {
  const snapshot = await usersOnlineCollection.get();
  const usersOnline = [];
  snapshot.forEach(doc => {
    usersOnline.push(doc.data());
  });
  return usersOnline;
};

export const deleteUsersOnlineDB = async userId => {
  const usersOnline = await usersOnlineCollection.where('userId', '==', userId).get();
  if (usersOnline.empty) return;
  const batch = firestore.batch();
  usersOnline.forEach(userOnline => {
    batch.delete(userOnline.ref);
  });
  await batch.commit();
};
