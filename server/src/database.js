/* import path from 'path';
import connectSqlite3 from 'sqlite3';
const { Database } = connectSqlite3.verbose();

const databasePath = path.join(path.resolve(), 'src', 'db.sqlite');
export const db = new Database(databasePath); */

//db.serialize(async () => {
  /* 
    db.run('DROP TABLE IF EXISTS liveGames');
    db.run(
      'CREATE TABLE liveGames (id TEXT, currentGame TEXT, player1 TEXT, player2 TEXT, timeLeft1 INTEGER, timeLeft2 INTEGER)',
    );
  */
  // ----------------------------------------
  /*
    db.run('DROP TABLE IF EXISTS matchHistory');
    db.run(
      'CREATE TABLE matchHistory (player1 TEXT, player2 TEXT, winner TEXT, nrMoves INTEGER, date TEXT)',
    );
  */
  // ----------------------------------------
  /*
    db.run('DROP TABLE IF EXISTS users');
    db.run('CREATE TABLE users (username TEXT, password TEXT)'); 
  */
//});
