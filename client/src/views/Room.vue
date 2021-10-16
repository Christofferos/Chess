<template>
  <div style="display: flex; align-content: center; justify-content: center;">
    <div
      style="display: flex; flex-direction: column; justify-content: center; align-items: center"
    >
      <div class="row" style="text-align: center">
        <h1 v-if="this.opponent === ''">Waiting for an opponent...</h1>
        <h1 v-else>
          {{ this.blackTime }} |
          {{ this.black ? this.$store.state.cookie.username : this.opponent }} |
          {{ piecePointsBlack > 0 ? `+${piecePointsBlack}` : piecePointsBlack }}
          <span v-if="black" v-on:click="surrender()" style="cursor: pointer">🏳️</span>
        </h1>
      </div>

      <div
        v-bind:style="{
          display: this.isPawnPromotionTime ? 'flex' : 'none',
          position: 'absolute',
          left: '50%',
          width: '300px',
          height: '300px',
          marginLeft: '-150px',
          marginTop: '-350px',
          overflow: 'auto',
          backgroundColor: 'rgba(205, 133, 63, 0.6)',
          padding: '30px auto',
          textAlign: 'center',
          borderRadius: '5px',
          color: 'black',
          fontSize: '30px',
          zIndex: '11',
          justifyContent: 'center',
          alignItems: 'center',
        }"
        type="text"
      >
        <div v-if="isPromotionColorWhite">
          <img
            v-for="(pieceSrc, piece) in promotionPiecesWhite"
            :key="piece"
            v-on:click="promotePawn(piece)"
            :src="pieceSrc"
            style="width: 150px; cursor: pointer"
          />
        </div>
        <div v-if="!isPromotionColorWhite">
          <img
            v-for="(pieceSrc, piece) in promotionPiecesBlack"
            :key="piece"
            v-on:click="promotePawn(piece)"
            :src="pieceSrc"
            style="width: 150px; cursor: pointer"
          />
        </div>
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
        :class="isTimeAboutToRunOutBlack ? 'blinking' : null"
        v-bind:style="{
          borderBottom: isTimeAboutToRunOutBlack ? '3px solid red' : '',
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
              >{{ 8 - row }}
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
              >{{ letters[col] }}</span
            >
          </span>
        </div>
      </div>
      <div
        :class="isTimeAboutToRunOutWhite ? 'blinking' : null"
        v-bind:style="{
          borderBottom: isTimeAboutToRunOutWhite ? '3px solid red' : '',
          width: '375px',
          height: '3px',
        }"
      />

      <div class="row" style="text-align: center">
        <h1 style="margin-top: 10px">
          {{ this.whiteTime }} |
          {{ this.black ? this.opponent : this.$store.state.cookie.username }} |
          {{ piecePointsWhite > 0 ? `+${piecePointsWhite}` : piecePointsWhite }}
          <span v-if="!black" v-on:click="surrender()" style="cursor: pointer">🏳️</span>
        </h1>
      </div>

      <div class="gameCodeSection">
        <button v-clipboard="() => room" class="well btn btn-default button gameCodeBtn">
          🔗 Game Code
        </button>
        <h1>Chat</h1>
        <form v-on:submit.prevent="send()">
          <input
            v-model="input"
            class="form-control"
            type="text"
            style="margin: 10px auto; font-size: 15px"
            required
            autofocus
            placeholder="Write to your opponent.."
          />
        </form>
        <div class="chatBox">
          <div
            v-for="(entry, index) in entries.slice(0, 10)"
            :key="index"
            style="color: white; text-align: justify; padding: 3px"
          >
            {{ entry }}
            <br />
          </div>
        </div>
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

const TWENTY_PERCENT = 0.2;

export default {
  name: 'Room',
  components: {},
  data() {
    return {
      deviceScale: getBoardSize(),
      room: this.$route.params.roomName,
      game: null,
      entries: [],
      socket: null,
      input: '',
      opponent: '',
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
      isCapture: false,
      msgAudio: new Audio(require('../assets/messageNotification.mp3')),
      gameStartAudio: new Audio(require('../assets/gameStart.mp3')),
      moveAudio: new Audio(require('../assets/move.mp3')),
      checkAudio: new Audio(require('../assets/check.mp3')),
      timerRunningOutAudio: new Audio(require('../assets/timerRunningOut1.mp3')),
      gameOverAudio: new Audio(require('../assets/gameOver.mp3')),
      captureAudio: new Audio(require('../assets/capture.mp3')),
      castleAudio: new Audio(require('../assets/castle.mp3')),
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
        this.isCapture = true;
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
      this.updateScores();
    },
    translateSelectedPiece(row, col) {
      const rank = 8 - Number(row);
      const file = this.letters[Number(col)];
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
        const piece = this.piecePlacement[y0][x0];
        const isPromoteSelection = this.checkPawnPromotion(piece, y1);
        if (isPromoteSelection) return;
        this.movePiece();
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
    checkPawnPromotion(piece, y1) {
      const isPawn = piece === 'p' || piece === 'P';
      if (!isPawn) return;
      const isBlackPawnAdvanced = piece === 'p' && Number(y1) === 7;
      const isWhitePawnAdvanced = piece === 'P' && Number(y1) === 0;
      if (isWhitePawnAdvanced) {
        this.isPromotionColorWhite = true;
      } else if (isBlackPawnAdvanced) {
        this.isPromotionColorWhite = false;
      }
      if (isWhitePawnAdvanced || isBlackPawnAdvanced) {
        this.isPawnPromotionTime = true;
        return true;
      }
    },
    promotePawn(piece) {
      this.isPawnPromotionTime = false;
      this.movePiece(piece);
    },
    backToMenu() {
      this.$store.state.socket.emit('backToMenu', this.room);
    },
    throttle(delay, fn) {
      let lastCall = 0;
      const saveMsg = (msg) => {
        this.entries = [msg, ...this.entries];
      };
      return function wrapper(...args) {
        const msg = String(...args);
        saveMsg(msg);
        const now = new Date().getTime();
        if (now - lastCall < delay) {
          return;
        }
        lastCall = now;
        return fn(...args);
      };
    },
    handleRecieveMessageEvent(msg) {
      if (msg.includes(this.$store.state.cookie.username) || msg.includes('joined')) return;
      this.msgAudio.play();
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
            this.opponent = data.game.player2;
          } else if (data.game.player2 === this.$store.state.cookie.username) {
            this.opponent = data.game.player1;
            this.black = true;
          }
          this.updatePiecePlacement();
        })
        .catch((err) => {
          return;
        });

      const THROTTLE_DELAY = 5000;
      this.$store.state.socket.on(
        'msg',
        this.throttle(THROTTLE_DELAY, this.handleRecieveMessageEvent),
      );

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
          this.selectedPiece = '';
          this.game.timeLeft1 = timeLeft1;
          this.game.timeLeft2 = timeLeft2;
          const isLegalMove = this.game.fen !== newFen;
          this.game.fen = newFen;
          this.updatePiecePlacement();
          const isWhiteTurn = newFen.split(' ')[1] === 'w';
          if (!isGameOver && isLegalMove) {
            this.startOpposingTimer(isWhiteTurn);
            if (isCheck) {
              this.checkAudio.play();
            } else if (this.isCapture) {
              this.captureAudio.play();
              this.isCapture = false;
            } else if (isCastle) {
              this.castleAudio.play();
            } else {
              this.moveAudio.play();
            }
          }
        },
      );
    },
    onResize() {
      this.deviceScale = getBoardSize();
    },
    startTimerWarningSound() {
      if (!this.gameOver) this.timerRunningOutAudio.play();
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
  },
  created() {
    this.reconnectionEvents();
    this.$store.state.socket.on('connect', this.eventListener);
    this.socket = this.$store.state.socket;

    window.addEventListener('touchstart', () => {
      this.moveAudio.play();
      new Audio('../assets/move.mp3').play();
    });
  },
  mounted() {
    this.$nextTick(() => {
      window.addEventListener('resize', this.onResize);
    });
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onResize);
    this.socket.off('connect', this.eventListener);
    this.socket.off('msg');
    this.socket.off('backToMenuResponse');
    this.socket.off('getGamePlayers');
    this.socket.off('timerGameOver');
    this.socket.off('surrenderGameOver');
    this.socket.off('movePieceResponse');
    const isUserLeavingEmptyRoom = this.opponent === '';
    if (isUserLeavingEmptyRoom) {
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
    }
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
