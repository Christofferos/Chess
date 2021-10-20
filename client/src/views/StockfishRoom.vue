<template>
  <div style="display: flex; align-content: center; justify-content: center;">
    <div
      style="display: flex; flex-direction: column; justify-content: center; align-items: center"
    >
      <div class="row" style="text-align: center">
        <h1>
          {{ this.black ? this.whiteTime : this.blackTime }} | {{ this.opponent }} |
          {{ this.black ? piecePointsWhite : piecePointsBlack }}
        </h1>
      </div>

      <div
        v-bind:style="{
          display: this.endGameMsg === '' ? 'none' : 'flex',
          position: 'absolute',
          top: '33%',
          margin: '0 auto',
          width: '300px',
          height: '150px',
          fontSize: '30px',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          flexDirection: 'column',
          color: 'black',
          backgroundColor: 'rgba(205, 133, 63, 0.6)',
          padding: '30px auto',
          borderRadius: '5px',
          zIndex: '11',
        }"
        type="text"
      >
        {{ this.endGameMsg }}
        <button
          v-on:click="() => backToMenu()"
          v-bind:style="{
            backgroundColor: 'green',
            border: '1px solid black',
            borderRadius: '10px',
          }"
        >
          Back to menu
        </button>
      </div>

      <div
        :class="
          black
            ? isTimeAboutToRunOutWhite
              ? 'blinking'
              : null
            : isTimeAboutToRunOutBlack
            ? 'blinking'
            : null
        "
        v-bind:style="{
          borderBottom: black
            ? isTimeAboutToRunOutWhite
              ? '3px solid red'
              : ''
            : isTimeAboutToRunOutBlack
            ? '3px solid red'
            : '',
          width: '375px',
          height: '3px',
        }"
      />
      <div
        id="board"
        v-bind:style="{
          display: 'flex',
          flexDirection: 'column',
        }"
      >
        <div
          class="row"
          v-for="row in rows"
          :key="row"
          v-bind:id="row"
          v-bind:style="{ display: 'flex', flexDirection: 'row' }"
        >
          <span
            class="col"
            v-for="col in columns"
            :key="col"
            v-bind:id="col"
            v-on:click="() => checkSelectedPiece(row, col)"
            v-bind:style="{
              background:
                selectedPiece === row.toString() + col.toString()
                  ? 'yellow'
                  : (col + row) % 2 === 0
                  ? '#E2E5BE'
                  : '#58793B',
              display: 'flex',
              justifyContent: 'space-between',
              height: `${deviceScale}px`,
              width: `${deviceScale}px`,
              cursor: 'pointer',
            }"
          >
            <img
              v-if="piecePlacement[row][col] !== ''"
              :src="pieces[piecePlacement[row][col]]"
              v-bind:style="{ width: `${deviceScale}px`, position: 'absolute' }"
            />
            <span
              v-bind:style="{
                opacity: col === 0 ? 1 : 0,
                color: row % 2 === 0 ? '#58793B' : '#E2E5BE',
                fontWeight: 800,
                zIndex: 10,
              }"
              >{{ black ? row + 1 : 8 - row }}
            </span>
            <span
              v-if="row === 7"
              v-bind:style="{
                display: 'flex',
                alignItems: 'flex-end',
                color: col % 2 !== 0 ? '#58793B' : '#E2E5BE',
                fontWeight: 1000,
                paddingRight: '3px',
              }"
              >{{ black ? letters[7 - col] : letters[col] }}</span
            >
          </span>
        </div>
      </div>
      <div
        :class="
          black
            ? isTimeAboutToRunOutBlack
              ? 'blinking'
              : null
            : isTimeAboutToRunOutWhite
            ? 'blinking'
            : null
        "
        v-bind:style="{
          borderBottom: black
            ? isTimeAboutToRunOutBlack
              ? '3px solid red'
              : ''
            : isTimeAboutToRunOutWhite
            ? '3px solid red'
            : '',
          width: '375px',
          height: '3px',
        }"
      />

      <div class="row" style="text-align: center">
        <h1 style="margin-top: 10px">
          {{ this.black ? this.blackTime : this.whiteTime }} |
          {{ this.$store.state.cookie.username }} |
          {{ this.black ? piecePointsBlack : piecePointsWhite }}
          <span v-on:click="surrender()" style="cursor: pointer">🏳️</span>
        </h1>
      </div>
    </div>
  </div>
</template>

<script>
import P from '../assets/wp.png';
import R from '../assets/wr.png';
import N from '../assets/wn.png';
import B from '../assets/wb.png';
import Q from '../assets/wq.png';
import K from '../assets/wk.png';
import p from '../assets/bp.png';
import r from '../assets/br.png';
import n from '../assets/bn.png';
import b from '../assets/bb.png';
import q from '../assets/bq.png';
import k from '../assets/bk.png';
import { getBoardSize } from '../utils/getBoardSize';

/* AFTER USER HAS MADE A VALID MOVE - RUN prepareMove() */
const stockfishEngine = new Worker('stockfish.js');

const TWENTY_PERCENT = 0.2;

export default {
  name: 'StockfishRoom',
  components: {},
  data() {
    return {
      deviceScale: getBoardSize(),
      room: this.$route.params.roomName,
      game: null,
      entries: [],
      socket: null,
      input: '',
      opponent: 'Stockfish AI',
      black: false,
      startPos: '',
      endPos: '',
      selectedPiece: '',
      rows: [0, 1, 2, 3, 4, 5, 6, 7],
      columns: [0, 1, 2, 3, 4, 5, 6, 7],
      letters: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
      setIntervalObj: null,
      endGameMsg: '',
      gameOver: false,
      pieces: {
        P,
        R,
        N,
        B,
        Q,
        K,
        p,
        r,
        n,
        b,
        q,
        k,
      },
      piecePlacement: [
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
      ],
      isPawnPromotionTime: false,
      isPromotionColorWhite: true,
      promotionPiecesWhite: {
        R,
        N,
        B,
        Q,
      },
      promotionPiecesBlack: {
        r,
        n,
        b,
        q,
      },
      piecePointsWhite: 0,
      piecePointsBlack: 0,
      timer1: null,
      timer2: null,
      timeConstraintForGame: 0,
      whiteTime: '-',
      blackTime: '-',
      isTimeAboutToRunOutBlack: false,
      isTimeAboutToRunOutWhite: false,
      eventListener: () => {
        console.log('CONNECT/RECONNECT!!!');
        this.reconnectionEvents();
      },
      socket: '',
      msgAudio: new Audio(require('../assets/messageNotification.mp3')),
      gameStartAudio: new Audio(require('../assets/gameStart.mp3')),
      moveAudio: new Audio(require('../assets/move.mp3')),
      invalidMoveAudio: new Audio(require('../assets/invalidAction.mp3')),
      checkAudio: new Audio(require('../assets/check.mp3')),
      timerRunningOutAudio: new Audio(require('../assets/timerRunningOut1.mp3')),
      gameOverAudio: new Audio(require('../assets/gameOver.mp3')),
      captureAudio: new Audio(require('../assets/capture.mp3')),
      castleAudio: new Audio(require('../assets/castle.mp3')),
      extraAudio: this.$store.state.extraSoundEffects,
      checkExtraAudio: new Audio(require('../assets/checkExtra.mp3')),
      checkExtra2Audio: new Audio(require('../assets/checkExtra2.mp3')),
      aunPassunAudio: new Audio(require('../assets/aunPassun.mp3')),
    };
  },
  methods: {
    debug() {
      console.log('Debug');
    },
    redirect(name) {
      this.$router.push(`/${name}`).catch(() => {});
    },
    send() {
      fetch(`/api/room/${this.room}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: this.input,
        }),
      }).catch(console.error);
      this.input = '';
    },
    updateScores() {
      let whitePieces = 0;
      let blackPieces = 0;
      const piecesFEN = this.game.fen.split(' ')[0];
      piecesFEN.split('').forEach((fenChar) => {
        if (fenChar === 'p') blackPieces += 1;
        else if (fenChar === 'n') blackPieces += 3;
        else if (fenChar === 'b') blackPieces += 3;
        else if (fenChar === 'r') blackPieces += 5;
        else if (fenChar === 'q') blackPieces += 9;
        else if (fenChar === 'P') whitePieces += 1;
        else if (fenChar === 'N') whitePieces += 3;
        else if (fenChar === 'B') whitePieces += 3;
        else if (fenChar === 'R') whitePieces += 5;
        else if (fenChar === 'Q') whitePieces += 9;
      });
      const pointsWhite = whitePieces - blackPieces;
      const pointsBlack = blackPieces - whitePieces;
      const isNewScores =
        pointsWhite !== this.piecePointsWhite || pointsBlack !== this.piecePointsBlack;
      if (isNewScores) {
        this.piecePointsWhite = pointsWhite;
        this.piecePointsBlack = pointsBlack;
      }
    },
    updatePiecePlacement() {
      if (this.game !== null) {
        let row = 0;
        let col = 0;
        this.piecePlacement = [
          ['', '', '', '', '', '', '', ''],
          ['', '', '', '', '', '', '', ''],
          ['', '', '', '', '', '', '', ''],
          ['', '', '', '', '', '', '', ''],
          ['', '', '', '', '', '', '', ''],
          ['', '', '', '', '', '', '', ''],
          ['', '', '', '', '', '', '', ''],
          ['', '', '', '', '', '', '', ''],
        ];
        const pieces = this.game.fen.split(' ')[0];
        if (this.black) {
          for (let i = pieces.length - 1; i >= 0; i -= 1) {
            if (pieces.charAt(i) === '/') {
              row += 1;
              col = 0;
            } else if (pieces.charAt(i).match('[rnbqkpRNBQKP]')) {
              this.piecePlacement[row][col] = pieces.charAt(i);
              col += 1;
            } else {
              for (let j = 0; j < Number(pieces.charAt(i)); j += 1) {
                this.piecePlacement[row][col + j] = '';
              }
              col += Number(pieces.charAt(i));
            }
          }
        } else {
          for (let i = 0; i < pieces.length; i += 1) {
            if (pieces.charAt(i) === '/') {
              row += 1;
              col = 0;
            } else if (pieces.charAt(i).match('[rnbqkpRNBQKP]')) {
              this.piecePlacement[row][col] = pieces.charAt(i);
              col += 1;
            } else {
              for (let j = 0; j < Number(pieces.charAt(i)); j += 1) {
                this.piecePlacement[row][col + j] = '';
              }
              col += Number(pieces.charAt(i));
            }
          }
        }
      }
      this.updateScores();
    },
    translateSelectedPiece(row, col) {
      const rank = this.black ? 1 + Number(row) : 8 - Number(row);
      const file = this.black ? this.letters[Number(7 - col)] : this.letters[Number(col)];
      return file.toString() + rank.toString();
    },
    checkSelectedPiece(row, col) {
      if (this.opponent === '') return;
      if (this.piecePlacement[row][col].match('[rnbqkp]') && this.black) {
        this.selectedPiece = row.toString() + col.toString();
      } else if (this.piecePlacement[row][col].match('[RNBQKP]') && this.black === false) {
        this.selectedPiece = row.toString() + col.toString();
      } else if (this.selectedPiece !== '') {
        const y0 = this.selectedPiece.charAt(0);
        const x0 = this.selectedPiece.charAt(1);
        const y1 = row.toString();
        const x1 = col.toString();
        this.startPos = this.translateSelectedPiece(y0, x0);
        this.endPos = this.translateSelectedPiece(y1, x1);
        const promoteToQueen = this.black ? 'q' : 'Q';
        this.movePiece(promoteToQueen);
        this.prepareMove();
      }
    },
    movePiece(piece = undefined) {
      fetch('/api/movePiece', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: this.game.id,
          startPos: this.startPos,
          endPos: this.endPos,
          ...(piece && { promotion: piece }),
        }),
      })
        .then((resp) => {
          if (!resp.ok) {
            throw new Error(`Unexpected failure when moving piece in room: ${this.room}`);
          }
          return resp;
        })
        .catch(console.error);
    },
    stockfishMovePiece(from, to, promotion) {
      fetch('/api/stockfishMovePiece', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: this.game.id,
          from,
          to,
          promotion,
        }),
      })
        .then((resp) => {
          if (!resp.ok) {
            throw new Error(`Unexpected failure when moving piece in room: ${this.room}`);
          }
          return resp;
        })
        .catch(console.error);
    },
    backToMenu() {
      this.$store.state.socket.emit('backToMenu', this.room);
    },
    reconnectionEvents() {
      fetch(`/api/room/${this.room}/join`)
        .then((resp) => {
          if (!resp.ok) {
            this.redirect('list');
          }
          return resp.json();
        })
        .then((data) => {
          this.game = data.game;
          this.timeConstraintForGame = this.game.timeLeft1;
          this.whiteTime = this.getWhiteTime();
          this.blackTime = this.getBlackTime();
          if (data.game.player1 === this.$store.state.cookie.username) {
            this.updatePiecePlacement();
          } else {
            this.black = true;
            this.opponent = data.game.player1;
            this.updatePiecePlacement();
          }
        })
        .catch((err) => {
          console.log('HERE 404', err);
          return;
        });

      this.$store.state.socket.on('backToMenuResponse', () => {
        this.redirect('list');
      });

      this.$store.state.socket.on('getGamePlayers', (players) => {
        if (this.$store.state.cookie.username !== players.player1) {
          this.opponent = players.player1;
          this.black = true;
          this.gameStartAudio.play();
        } else if (this.$store.state.cookie.username !== players.player2) {
          this.opponent = players.player2;
          this.gameStartAudio.play();
        }
      });

      this.$store.state.socket.on('timerGameOver', (fen, isGameWonWithPieces) => {
        this.gameOverWinLose(fen, isGameWonWithPieces);
      });

      this.$store.state.socket.on('surrenderGameOver', (surrenderUser) => {
        this.surrenderGameOver(surrenderUser);
      });

      this.$store.state.socket.on(
        'movePieceResponse',
        (
          newFen,
          timeLeft1,
          timeLeft2,
          isGameOver,
          draw1,
          draw2,
          draw3,
          draw4,
          isCheck,
          isCastle,
          isEnPassant,
          isPromotion,
          isCapture,
          isPlayer1MovingPiece,
        ) => {
          if (isGameOver) {
            this.stopPlayerTimes();
            this.stopFlashingTimeLights();
            if (draw1 || draw2 || draw3 || draw4) {
              this.endGameMsg = 'Draw!';
            } else {
              this.gameOverWinLose(newFen);
            }
          }
          this.game.timeLeft1 = timeLeft1;
          this.game.timeLeft2 = timeLeft2;
          const isLegalMove = this.game.fen !== newFen;
          this.game.fen = newFen;
          this.updatePiecePlacement();
          if (isGameOver) return;
          if (!isLegalMove) {
            if ((isPlayer1MovingPiece && !this.black) || (!isPlayer1MovingPiece && this.black)) {
              this.invalidMoveAudio.src = '/media/invalidAction.b8f64af9.mp3';
              this.invalidMoveAudio.play();
            }
            return;
          }
          const isWhiteTurn = newFen.split(' ')[1] === 'w';
          const disableSelectedPieceColor =
            (isWhiteTurn && this.black) || (!isWhiteTurn && !this.black);
          if (disableSelectedPieceColor) this.selectedPiece = '';
          this.startOpposingTimer(isWhiteTurn);
          if (isCheck) {
            if (this.extraAudio) {
              this.checkExtraAudio.src = '/media/checkExtra.20bca44b.mp3';
              this.checkExtra2Audio.src = '/media/checkExtra2.7fb32fd1.mp3';
              Math.random() > 0.5 ? this.checkExtraAudio.play() : this.checkExtra2Audio.play();
            } else {
              this.checkAudio.src = '/media/check.d8e0e09a.mp3';
              this.checkAudio.play();
            }
          } else if (isEnPassant && this.extraAudio) {
            this.aunPassunAudio.src = '/media/aunPassun.b2755919.mp3';
            this.aunPassunAudio.play();
          } else if (isCapture) {
            this.captureAudio.src = '/media/capture.ef8074e3.mp3';
            this.captureAudio.play();
          } else if (isCastle) {
            this.castleAudio.src = '/media/castle.7bad3985.mp3';
            this.castleAudio.play();
          } else {
            this.moveAudio.src = '/media/move.9707c466.mp3';
            this.moveAudio.play();
          }
        },
      );
    },
    onResize() {
      this.deviceScale = getBoardSize();
    },
    startTimerWarningSound() {
      if (!this.gameOver) {
        this.timerRunningOutAudio.src = '/media/timerRunningOut1.6c28c715.mp3';
        this.timerRunningOutAudio.play();
      }
    },
    startOpposingTimer(isWhiteTurn) {
      const isGameDefined = this.game;
      if (!isGameDefined) return;
      const isWhiteTimerDefined = this.timer1;
      const isBlackTimerDefined = this.timer2;
      if (!isWhiteTurn) {
        this.timer2 = setInterval(() => {
          if (!this.game) return;
          this.game.timeLeft2 -= 1;
          this.blackTime = this.getBlackTime();
          const isOutOfTime = this.game.timeLeft2 <= 0;
          if (isOutOfTime) {
            this.stopPlayerTimes();
            this.stopFlashingTimeLights();
          }
        }, 1000);
        if (this.isTimeAboutToRunOutBlack && this.black) this.startTimerWarningSound();
        if (!isWhiteTimerDefined) return;
        clearInterval(this.timer1);
        this.timer1 = null;
      } else {
        this.timer1 = setInterval(() => {
          if (!this.game) return;
          this.game.timeLeft1 -= 1;
          this.whiteTime = this.getWhiteTime();
          const isOutOfTime = this.game.timeLeft1 <= 0;
          if (isOutOfTime) {
            this.stopPlayerTimes();
            this.stopFlashingTimeLights();
          }
        }, 1000);
        if (this.isTimeAboutToRunOutWhite && !this.black) this.startTimerWarningSound();
        if (!isBlackTimerDefined) return;
        clearInterval(this.timer2);
        this.timer2 = null;
      }
    },
    stopPlayerTimes() {
      clearInterval(this.timer1);
      this.timer1 = null;
      clearInterval(this.timer2);
      this.timer2 = null;
    },
    gameOverWinLose(fen, isGameWonWithPieces = true) {
      const isWhiteTurn = fen.split(' ')[1] === 'w';
      const isBlackTurn = fen.split(' ')[1] === 'b';
      const gameOverMsg = isGameWonWithPieces ? 'Check Mate!\n' : 'Time is out!\n';
      if (isWhiteTurn && this.black) {
        this.endGameMsg = `${gameOverMsg} You win`;
      } else if (isWhiteTurn && this.black === false) {
        this.endGameMsg = `${gameOverMsg} You lose`;
      } else if (isBlackTurn && this.black) {
        this.endGameMsg = `${gameOverMsg} You lose`;
      } else if (isBlackTurn && this.black === false) {
        this.endGameMsg = `${gameOverMsg} You win`;
      }
      this.gameOver = true;
      this.gameOverAudio.play();
    },
    surrenderGameOver(surrenderUser) {
      this.endGameMsg = `${surrenderUser} surrendered!`;
      this.gameOver = true;
      this.gameOverAudio.play();
    },
    getWhiteTime() {
      const isGameDefined = this.game;
      if (!isGameDefined) return '-';
      const time = this.game.timeLeft1;
      if (time < 0) return '0:00';
      const percentageTimeLeft = time / this.timeConstraintForGame;
      this.isTimeAboutToRunOutWhite = percentageTimeLeft < TWENTY_PERCENT;
      const unformattedSec = time % 60;
      const seconds = unformattedSec < 10 ? `0${unformattedSec}` : unformattedSec;
      const minutes = Math.floor(time / 60);
      return `${minutes}:${seconds}`;
    },
    getBlackTime() {
      const isGameDefined = this.game;
      if (!isGameDefined) return '-';
      const time = this.game.timeLeft2;
      if (time < 0) return '0:00';
      const percentageTimeLeft = time / this.timeConstraintForGame;
      this.isTimeAboutToRunOutBlack = percentageTimeLeft < TWENTY_PERCENT;
      const unformattedSec = time % 60;
      const seconds = unformattedSec < 10 ? `0${unformattedSec}` : unformattedSec;
      const minutes = Math.floor(time / 60);
      return `${minutes}:${seconds}`;
    },
    stopFlashingTimeLights() {
      this.isTimeAboutToRunOutWhite = false;
      this.isTimeAboutToRunOutBlack = false;
    },
    surrender() {
      this.stopPlayerTimes();
      this.stopFlashingTimeLights();
      fetch(`/api/surrender`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: this.room,
        }),
      })
        .then((resp) => {
          if (!resp.ok)
            throw new Error(`Unexpected failure when surrendering in room: ${this.room}`);
          return resp;
        })
        .catch(console.error);
    },
    setDefaultConfigs() {
      const skillLevel = 0;
      const contemptConfig = `setoption name Contempt value 0`;
      const skillLevelConfig = `setoption name Skill Level value ${skillLevel}`;
      const maxErrorConfig = `setoption name Skill Level Maximum Error value ${Math.round(
        skillLevel * -0.5 + 10,
      )}`;
      const probabilityConfig = `setoption name Skill Level Probability value ${Math.round(
        skillLevel * 6.35 + 1,
      )}`;
      // const kingSafetyConfig = `setoption name King Safety value 0`;
      stockfishEngine.postMessage(contemptConfig);
      stockfishEngine.postMessage(skillLevelConfig);
      stockfishEngine.postMessage(maxErrorConfig);
      stockfishEngine.postMessage(probabilityConfig);
      // stockfishEngine.postMessage(kingSafetyConfig);
    },
    prepareMove() {
      let moves = '';
      fetch(`/api/stockfishGetHistory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: this.game.id,
        }),
      })
        .then((res) => res.json())
        .then((historyObj) => {
          const { history } = historyObj;
          console.log('HERE HISTORY: ', history);
          history?.forEach((_, i) => {
            const move = history[i];
            moves += ' ' + move.from + move.to + (move.promotion ? move.promotion : '');
          });
          stockfishEngine.postMessage(`position startpos moves ${moves}`);
          const thinkingDepth = 5;
          stockfishEngine.postMessage(
            `go depth ${thinkingDepth} wtime ${this.timeLeftWhite} btime ${this.timeLeftBlack}`,
          );
        });
    },
  },
  created() {
    this.reconnectionEvents();
    this.$store.state.socket.on('connect', this.eventListener);
    this.socket = this.$store.state.socket;
    window.addEventListener(
      'touchstart',
      () => {
        const audioSrc =
          'data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
        this.checkAudio.autoplay = true;
        this.captureAudio.autoplay = true;
        this.castleAudio.autoplay = true;
        this.moveAudio.autoplay = true;
        this.invalidMoveAudio.autoplay = true;
        this.timerRunningOutAudio.autoplay = true;
        this.moveAudio.src = audioSrc;
        this.invalidMoveAudio.src = audioSrc;
        this.checkAudio.src = audioSrc;
        this.captureAudio.src = audioSrc;
        this.castleAudio.src = audioSrc;
        this.timerRunningOutAudio.src = audioSrc;
        if (!this.extraAudio) return;
        this.checkExtraAudio.autoplay = true;
        this.checkExtra2Audio.autoplay = true;
        this.aunPassunAudio.autoplay = true;
        this.checkExtraAudio.src = audioSrc;
        this.checkExtra2Audio.src = audioSrc;
        this.aunPassunAudio.src = audioSrc;
      },
      { once: true },
    );

    stockfishEngine.onmessage = (event) => {
      if (!this.game) return;
      let line;
      if (event && typeof event === 'object') {
        line = event.data;
      } else {
        line = event;
      }
      console.log('Reply: ' + line);
      if (line == 'uciok' || line == 'readyok') return;
      let match = line.match(/^bestmove ([a-h][1-8])([a-h][1-8])([qrbk])?/);
      const isStockfishMakingMove = match;
      if (isStockfishMakingMove) {
        const from = match[1];
        const to = match[2];
        const promotion = match[3];
        this.stockfishMovePiece(from, to, promotion);
      }
      const isGameTurnWhite = this.game.fen.split(' ')[1] === 'w';
      const isScoreFeedback = (match = line.match(/^info .*\bscore (\w+) (-?\d+)/));
      if (!isScoreFeedback) return;
      let score = parseInt(match[2]) * (isGameTurnWhite ? 1 : -1);
      let finalScore = 0;
      const isMeasuringInCentiPawns = match[1] == 'cp';
      const isMateFound = match[1] == 'mate';
      if (isMeasuringInCentiPawns) {
        finalScore = (score / 100.0).toFixed(2);
      } else if (isMateFound) {
        finalScore = 'Mate in ' + Math.abs(score);
      }
      const isScoreBounded = (match = line.match(/\b(upper|lower)bound\b/));
      if (isScoreBounded) {
        finalScore = ((match[1] == 'upper') == isGameTurnWhite ? '<= ' : '>= ') + finalScore;
      }
      console.log('FinalScore: ', finalScore);
    };
    this.setDefaultConfigs();
    stockfishEngine.postMessage('ucinewgame');
    stockfishEngine.postMessage('isready');
  },
  mounted() {
    this.$nextTick(() => {
      window.addEventListener('resize', this.onResize);
    });
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onResize);
    this.socket.off('connect', this.eventListener);
    this.socket.off('backToMenuResponse');
    this.socket.off('getGamePlayers');
    this.socket.off('timerGameOver');
    this.socket.off('surrenderGameOver');
    this.socket.off('movePieceResponse');
    fetch('/api/removeGame', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: this.room,
      }),
    })
      .then((resp) => {
        if (!resp.ok) return;
        return resp;
      })
      .catch(console.error);
  },
};
</script>

<style>
h1,
h2 {
  color: white;
}

.button {
  background: #353432;
  font-size: 2.2rem;
  font-weight: 600;
  line-height: 1.2;
  color: #c1c0c0;
  width: 350px;
  border: none;
}
.button:hover {
  background: #32322f;
  color: white;
}

.gameCodeSection {
  text-align: center;
  padding: 20px;
  border-radius: 10px;
  background: #41403d;
  width: 450px;
  margin: auto auto 25px auto;
}

.chatBox {
  border: 2px solid black;
  width: 350px;
  margin: auto auto 25px auto;
  background: #504f4c;
  border-radius: 5px;
}

#board {
  touch-action: pan-y;
}

@media screen and (max-width: 600px) {
  .gameCodeSection {
    width: 325px;
  }
  .gameCodeBtn {
    width: 280px;
  }
  .chatBox {
    width: 275px;
  }
}

.blinking {
  -webkit-animation: 1s blink ease infinite;
  -moz-animation: 1s blink ease infinite;
  -ms-animation: 1s blink ease infinite;
  -o-animation: 1s blink ease infinite;
  animation: 1s blink ease infinite;
}

@keyframes blink {
  from,
  to {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
}

@-moz-keyframes blink {
  from,
  to {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
}

@-webkit-keyframes blink {
  from,
  to {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
}

@-ms-keyframes blink {
  from,
  to {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
}

@-o-keyframes blink {
  from,
  to {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
}
</style>
