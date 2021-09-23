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

/* const userObj = {
  username: 'Ada',
  password: 'Lovelace',
};
const test = async () => {
  await firestore.collection('users').doc(v4()).set(userObj);
};
test(); */

/* const addUser = async () => {
  // const docRef = await
  addDoc(collection(db, 'users'), {
    username: 'Ada',
    password: 'Lovelace',
  });
  // console.log('User document written with ID: ', docRef.id);
};

const addMatchHistoryGame = async () => {
  const docRef = await addDoc(collection(db, 'matchHistory'), {
    player1: 'Ada',
    player2: 'Lovelace',
    winner: '',
    nrMoves: '',
    date: new Date().toJSON().slice(0, 10).replace(/-/g, '/'),
  });
  console.log('MatchHistory document written with ID: ', docRef.id);
};

const addLiveGame = async () => {
  const docRef = await addDoc(collection(db, 'liveGames'), {
    id: 'TEST12345',
    currentGame: '',
    player1: 'testPlayer1',
    player2: 'testPlayer2',
    timeLeft1: 180,
    timeLeft2: 180,
  });
  console.log('LiveGame document written with ID: ', docRef.id);
};

export const testAddOccurences = () => {
  try {
    addUser();
    // addMatchHistoryGame();
    // addLiveGame(); 
  } catch (e) {
    console.error('Error adding document: ', e);
  }
};

export const testSeeTestUsers = () => {
  const querySnapshot = await getDocs(collection(db, 'users'));
  querySnapshot.forEach(doc => {
    console.log(`${doc.id} => ${doc.data()}`);
  });
};  */
