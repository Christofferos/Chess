import { Chess } from '../chess.js';
import { randomizeNStartPowers } from '../model.js';

/**
 * @class LiveGame
 */
export class LiveGame {
  constructor(
    id,
    fen,
    player1,
    player2,
    timeLeft1,
    timeLeft2,
    crazyChess = false,
    crazyChessPowers,
    availablePowers,
  ) {
    this.id = id; // (Number)
    if (fen === undefined || fen === '' || fen === null) {
      /*
      1. Piece placement (/ === next rank on the board)
      2. Turn
      3. Castling availability
      4. En passant
      5. Halfmove clock (no capture, no pawn advancement. 50-move-rule)
      6. Fullmove clock
      */
      this.gameState = new Chess();
    } else {
      this.gameState = new Chess(fen);
    }
    this.fen = this.gameState.fen();
    if (player1 === undefined) {
      this.player1 = '';
    } else {
      this.player1 = player1;
    }
    if (player2 === undefined) {
      this.player2 = '';
    } else {
      this.player2 = player2;
    }
    if (timeLeft1 === undefined) {
      this.timeLeft1 = 180;
    } else {
      this.timeLeft1 = timeLeft1;
    }
    if (timeLeft2 === undefined) {
      this.timeLeft2 = 180;
    } else {
      this.timeLeft2 = timeLeft2;
    }
    this.timer1 = null;
    this.timer2 = null;
    this.messages = []; // Not persistant
    this.isCrazyChess = crazyChess;
    if (crazyChess) {
      if (!crazyChessPowers) {
        this.crazyChessPowers = {
          randomMove: '',
          undoMove: false,
          disabledCells: [],
          captureImmunity: '',
          omegaUpgrade: '',
          fogOfWarP1: 0,
          fogOfWarP2: 0,
          explosivePawns: [],
        };
      } else if (crazyChessPowers) {
        this.crazyChessPowers = crazyChessPowers;
      }
      if (availablePowers) {
        this.availablePowers = availablePowers;
      } else if (!availablePowers) {
        this.availablePowers = {
          player1: randomizeNStartPowers(2),
          player2: randomizeNStartPowers(2),
        };
      }
      this.goldBolt = '';
    }
  }

  addMessage(message) {
    this.messages.push(message);
  }
}
