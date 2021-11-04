import firebase from '@firebase/app';
import '@firebase/firestore';
import v4 from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: 'chessonlinepro.firebaseapp.com',
  databaseURL: 'https://chessonlinepro-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'chessonlinepro',
  storageBucket: 'chessonlinepro.appspot.com',
  messagingSenderId: '59988433154',
  appId: '1:59988433154:web:b43f906e670538ee548a1b',
  measurementId: 'G-DTBVHHB8X8',
};
export const firebaseApp = firebase.default.initializeApp(firebaseConfig);
export const firestore = firebaseApp.firestore();

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
  });
};

export const setLiveGameStateDB = async (id, fen, timeLeft1, timeLeft2, crazyChessPowers) => {
  await liveGamesCollection.doc(id).update({
    currentGame: fen,
    timeLeft1,
    timeLeft2,
    ...(crazyChessPowers && { crazyChessPowers }),
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
