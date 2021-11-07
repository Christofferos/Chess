<template>
  <div class="flexCenter">
    <div class="flexCenterCol">
      <div class="row" style="text-align: center">
        <h1 v-if="this.opponent === ''">Waiting for an opponent...</h1>
        <h1 v-else>
          {{ this.black ? this.whiteTime : this.blackTime }} | {{ this.opponent }} |
          {{ this.black ? piecePointsWhite : piecePointsBlack }}
        </h1>
      </div>

      <div
        class="pawnPromotionModal"
        v-bind:style="{
          display: this.isPawnPromotionTime ? 'flex' : 'none',
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
        class="endGameMessageModal"
        v-bind:style="{
          display: this.endGameMsg === '' ? 'none' : 'flex',
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
        v-on:click="
          (event) => {
            let rowId;
            let columnId;
            const isIdInParentNode = !isNaN(event.target.id) && event.target.id !== '';
            if (isIdInParentNode) {
              rowId = event.target.parentElement.id;
              columnId = event.target.id;
            } else {
              rowId = event.target.parentElement.parentElement.id;
              columnId = event.target.parentElement.id;
            }
            if (isPieceSpawnEnabled && selectedPiece === '') spawnFriendlyPiece(rowId, columnId);
            if (!isDisableSelectEnabled) return;
            disableSelectedCell(rowId, columnId);
          }
        "
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
            v-on:click="
              () => {
                checkSelectedPiece(row, col);
              }
            "
            v-bind:style="{
              background: cellBackgroundColor(row, col),
              display: 'flex',
              justifyContent: 'space-between',
              height: `${deviceScale}px`,
              width: `${deviceScale}px`,
              cursor: 'pointer',
            }"
          >
            <img
              v-if="conditionallyRenderPiece(row, col)"
              :src="pieces[piecePlacement[row][col]]"
              v-bind:style="{ width: `${deviceScale}px`, position: 'absolute' }"
            />
            <img
              v-if="goldBoltPlacement === `${row}${col}`"
              :src="goldBolt"
              v-bind:style="{ width: `${deviceScale}px`, position: 'absolute' }"
            />

            <img
              v-if="disabledCells.includes(row + '' + col)"
              :src="roadblock"
              v-bind:style="{ width: `${deviceScale}px`, position: 'absolute' }"
            />
            <span
              v-bind:style="{
                opacity: col === 0 ? 1 : 0,
                color: row % 2 === 0 ? cellGreenColor : cellWhiteColor,
                fontWeight: 800,
                zIndex: 10,
              }"
              >{{ black ? row + 1 : 8 - row }}
            </span>

            <span
              v-bind:style="{
                display: 'flex',
                alignItems: isOmegaPieceUpgradeEnabled ? 'space-between' : 'flex-end',
                justifyContent: isOmegaPieceUpgradeEnabled ? 'space-between' : 'flex-end',
                flexDirection: 'column',
              }"
            >
              <span
                v-if="checkOmegaPieceUpgradePieces(row, col)"
                v-bind:style="{
                  fontSize: '13px',
                }"
                >🧬</span
              >
              <span v-else></span>
              <span
                v-if="row === 7"
                v-bind:style="{
                  display: 'flex',
                  alignItems: 'flex-end',
                  color: col % 2 !== 0 ? cellGreenColor : cellWhiteColor,
                  fontWeight: 1000,
                  paddingRight: '3px',
                }"
                >{{ black ? letters[7 - col] : letters[col] }}</span
              >
            </span>
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

      <div
        class="gameCodeSection"
        v-on:click="
          (event) => {
            if (isIncrementPowerFreq) incrementPowerFreq(event);
          }
        "
      >
        <p style="font-size: 36px; color: white">Powers</p>
        <button
          v-if="powersAvailable.includes(RANDOM_KEY)"
          v-on:click="opponentRandomMove()"
          class="well btn btn-default button gameCodeBtn"
          v-bind:style="{
            backgroundColor: this.isIncrementPowerFreq ? this.cellGreenColor : '#353432',
          }"
          v-bind:id="RANDOM_KEY"
        >
          🔀
          <span class="powerText"
            >Random Move ({{ powersAvailable.filter((x) => x === RANDOM_KEY).length }})</span
          >
        </button>
        <button
          v-if="powersAvailable.includes(UNDO_KEY)"
          v-on:click="undoMove()"
          class="well btn btn-default button gameCodeBtn"
          v-bind:style="{
            backgroundColor: this.isIncrementPowerFreq ? this.cellGreenColor : '#353432',
          }"
          v-bind:id="UNDO_KEY"
        >
          🔙
          <span class="powerText"
            >Undo Move ({{ powersAvailable.filter((x) => x === UNDO_KEY).length }})</span
          >
        </button>
        <button
          v-if="powersAvailable.includes(DISABLE_KEY)"
          v-on:click="
            () => {
              if (isIncrementPowerFreq) return;
              isDisableSelectEnabled = true;
              powersAvailable = removeItemOnce(powersAvailable, DISABLE_KEY);
            }
          "
          class="well btn btn-default button gameCodeBtn"
          v-bind:style="{
            backgroundColor: this.isIncrementPowerFreq ? this.cellGreenColor : '#353432',
          }"
          v-bind:id="DISABLE_KEY"
        >
          🚧
          <span class="powerText"
            >Disable Selected Cell ({{
              powersAvailable.filter((x) => x === DISABLE_KEY).length
            }})</span
          >
        </button>
        <button
          v-if="powersAvailable.includes(IMMUNE_KEY)"
          v-on:click="activeCaptureImmunity()"
          class="well btn btn-default button gameCodeBtn"
          v-bind:style="{
            backgroundColor: this.isIncrementPowerFreq ? this.cellGreenColor : '#353432',
          }"
          v-bind:id="IMMUNE_KEY"
        >
          💎
          <span class="powerText"
            >Immune to Captures ({{
              powersAvailable.filter((x) => x === IMMUNE_KEY).length
            }})</span
          >
        </button>
        <button
          v-if="powersAvailable.includes(CUTDOWN_KEY)"
          v-on:click="cutDownOpponentTime()"
          class="well btn btn-default button gameCodeBtn"
          v-bind:style="{
            backgroundColor: this.isIncrementPowerFreq ? this.cellGreenColor : '#353432',
          }"
          v-bind:id="CUTDOWN_KEY"
        >
          🛠️
          <span class="powerText"
            >Cut Down Time ({{ powersAvailable.filter((x) => x === CUTDOWN_KEY).length }})</span
          >
        </button>
        <button
          v-if="powersAvailable.includes(SPAWN_KEY)"
          v-on:click="
            () => {
              if (isIncrementPowerFreq) return;
              isPieceSpawnEnabled = true;
              selectedPiece = '';
              powersAvailable = removeItemOnce(powersAvailable, SPAWN_KEY);
            }
          "
          class="well btn btn-default button gameCodeBtn"
          v-bind:style="{
            backgroundColor: this.isIncrementPowerFreq ? this.cellGreenColor : '#353432',
          }"
          v-bind:id="SPAWN_KEY"
        >
          🧙
          <span class="powerText"
            >Spawn Friendly Piece ({{
              powersAvailable.filter((x) => x === SPAWN_KEY).length
            }})</span
          >
        </button>
        <button
          v-if="powersAvailable.includes(UPGRADE_KEY)"
          v-on:click="
            () => {
              if (isIncrementPowerFreq) return;
              isOmegaPieceUpgradeEnabled = true;
              powersAvailable = removeItemOnce(powersAvailable, UPGRADE_KEY);
            }
          "
          class="well btn btn-default button gameCodeBtn"
          v-bind:style="{
            backgroundColor: this.isIncrementPowerFreq ? this.cellGreenColor : '#353432',
          }"
          v-bind:id="UPGRADE_KEY"
        >
          🧬
          <span class="powerText"
            >Omega Piece Upgrade ({{
              powersAvailable.filter((x) => x === UPGRADE_KEY).length
            }})</span
          >
        </button>
        <button
          v-if="powersAvailable.includes(FOG_KEY)"
          v-on:click="fogOfWar()"
          class="well btn btn-default button gameCodeBtn"
          v-bind:style="{
            backgroundColor: this.isIncrementPowerFreq ? this.cellGreenColor : '#353432',
          }"
          v-bind:id="FOG_KEY"
        >
          🔦
          <span class="powerText"
            >Fog of War ({{ powersAvailable.filter((x) => x === FOG_KEY).length }})</span
          >
        </button>
        <!-- <button v-on:click="playTwice()" class="well btn btn-default button gameCodeBtn">
          ⚡ <span class="powerText">Play Twice</span>
        </button> -->
        <!-- .load(fen) -->
        <!-- 
          <<< Max 3 powers at a time >>>
        <button v-clipboard="() => room" class="well btn btn-default button gameCodeBtn">
          🚀 <span class="powerText">Missle Launch</span>
          (.load(fen))
        </button>
        <button v-clipboard="() => room" class="well btn btn-default button gameCodeBtn">
          🕹️ <span class="powerText">Opponent Puzzle</span>
        </button>
        ---
        <button v-clipboard="() => chooseOnePawnOnEachSideToDie" class="well btn btn-default button gameCodeBtn">
          ⚔️ <span class="powerText">One Piece of Each Die</span>
        </button>
        <button v-clipboard="() => room" class="well btn btn-default button gameCodeBtn">
          ☠️ <span class="powerText">Kill Enemy Pawn</span>
        </button>
        <button v-clipboard="() => room" class="well btn btn-default button gameCodeBtn">
          👾 <span class="powerText">Swap Piece Appearance</span>
        </button>
        <button v-clipboard="() => room" class="well btn btn-default button gameCodeBtn">
          🧭 <span class="powerText">Swap Orientation</span>
        </button>
        -->
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
import roadblock from '../assets/roadblock.png';
import goldBolt from '../assets/goldBolt150.png';
import { getBoardSize } from '../utils/getBoardSize';

const TWENTY_PERCENT = 0.2;

export default {
  name: 'CrazyChessRoom',
  components: {},
  data() {
    return {
      powersAvailable: [],
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
      isPieceSpawnEnabled: false,
      isDisableSelectEnabled: false,
      isOmegaPieceUpgradeEnabled: false,
      isFogOfWarEnabled: false,
      isIncrementPowerFreq: false,
      disabledCells: [],
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
      captureImmunityAudio: new Audio(require('../assets/captureImmunity.mp3')),
      roadblock: roadblock,
      goldBolt: goldBolt,
      goldBoltPlacement: null,
      cellWhiteColor: '#E2E5BE',
      cellGreenColor: '#58793B',
      isReadyToRenderPieces: false,
      RANDOM_KEY: 'random',
      UNDO_KEY: 'undo',
      DISABLE_KEY: 'disable',
      IMMUNE_KEY: 'immune',
      CUTDOWN_KEY: 'cutdown',
      SPAWN_KEY: 'spawn',
      UPGRADE_KEY: 'upgrade',
      FOG_KEY: 'fog',
    };
  },
  methods: {
    debug(msg) {
      console.log('Debug', msg);
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
    translateIndices(rowTemp, colTemp) {
      const row = this.black ? 7 - Number(rowTemp) : Number(rowTemp);
      const col = this.black ? Number(7 - Number(colTemp)) : Number(colTemp);
      return { row, col };
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
        if (this.isOmegaPieceUpgradeEnabled) this.omegaPieceUpgrade();
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
      const isBlackPawnAdvanced = piece === 'p' && Number(y1) === 0;
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
            this.updatePiecePlacement();
          } else {
            this.black = true;
            this.opponent = data.game.player1;
            this.updatePiecePlacement();
            return;
          }
        })
        .then(() => {
          this.getDisabledCells();
        })
        .catch((err) => {
          console.log('Joining game failed: ', err);
          return;
        });

      fetch(`/api/checkFogOfWar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: this.room,
        }),
      })
        .then((resp) => {
          return resp.json();
        })
        .then(({ isFogOfWar }) => {
          this.isFogOfWarEnabled = isFogOfWar;
          this.isReadyToRenderPieces = true;
        })
        .catch((err) => {
          console.log('/checkFogOfWar failed', err);
          return;
        });

      fetch(`/api/startingPowers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: this.room,
        }),
      })
        .then((resp) => {
          return resp.json();
        })
        .then(({ powers }) => {
          if (!powers) return;
          if (this.powersAvailable) this.powersAvailable = powers;
        })
        .catch((err) => {
          console.log('/startingPowers failed', err);
          return;
        });

      fetch(`/api/goldBoltPlacement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: this.room,
        }),
      })
        .then((resp) => {
          return resp.json();
        })
        .then(({ goldBolt }) => {
          if (!goldBolt || goldBolt === '') return;
          const rowTemp = goldBolt[0];
          const colTemp = goldBolt[1];
          const { row, col } = this.translateIndices(rowTemp, colTemp);
          this.goldBoltPlacement = `${row}${col}`;
        })
        .catch((err) => {
          console.log('/goldBoltPlacement failed', err);
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
        'undoMove',
        (newFen, isCheck, isCastle, isEnPassant, isPromotion, isCapture) => {
          this.game.fen = newFen;
          this.updatePiecePlacement();
          const isWhiteTurn = newFen.split(' ')[1] === 'w';
          this.startOpposingTimer(isWhiteTurn);
          this.playAudio(isCheck, isCastle, isEnPassant, isPromotion, isCapture);
        },
      );

      this.$store.state.socket.on('disableSelectedCell', (rowMsg, colMsg) => {
        this.isDisableSelectEnabled = false;
        const { row, col } = this.translateIndices(rowMsg, colMsg);
        this.addDisabledCells(row, col);
      });

      this.$store.state.socket.on('captureImmune', () => {
        this.captureImmunityAudio.src = '/media/captureImmunity.62ef9201.mp3';
        this.captureImmunityAudio.play();
      });

      this.$store.state.socket.on('pieceSpawn', (newFen, username) => {
        this.game.fen = newFen;
        this.updatePiecePlacement();
        if (username === this.$store.state.cookie.username) this.isPieceSpawnEnabled = false;
        // Audio to queue attention
      });

      this.$store.state.socket.on('omegaPieceUpgrade', (username) => {
        if (username === this.$store.state.cookie.username)
          this.isOmegaPieceUpgradeEnabled = false;
        // Audio to queue attention
      });

      this.$store.state.socket.on('fogOfWarEnable', (color) => {
        if (color === 'b' && this.black) {
          this.powersAvailable = this.removeItemOnce(this.powersAvailable, this.FOG_KEY);
          this.isFogOfWarEnabled = true;
        } else if (color === 'w' && !this.black) {
          this.powersAvailable = this.removeItemOnce(this.powersAvailable, this.FOG_KEY);
          this.isFogOfWarEnabled = true;
        }
      });

      this.$store.state.socket.on('fogOfWarDisable', (color) => {
        if (this.black && color === 'b') this.isFogOfWarEnabled = false;
        if (!this.black && color === 'w') this.isFogOfWarEnabled = false;
      });

      this.$store.state.socket.on('updatedPowers', (powersP1, powersP2) => {
        if (!this.black) this.powersAvailable = powersP1;
        else if (this.black) this.powersAvailable = powersP2;
      });

      this.$store.state.socket.on('spawnGoldBolt', (rowTemp, colTemp) => {
        const { row, col } = this.translateIndices(rowTemp, colTemp);
        this.goldBoltPlacement = `${row}${col}`;
      });

      this.$store.state.socket.on('consumeGoldBolt', (isPlayer1, isPlayer2) => {
        this.goldBoltPlacement = '';
        if (this.black && isPlayer2) this.isIncrementPowerFreq = true;
        else if (!this.black && isPlayer1) this.isIncrementPowerFreq = true;
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
              console.log('Invalid move apparently');
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
          this.playAudio(isCheck, isCastle, isEnPassant, isPromotion, isCapture);
        },
      );
    },
    playAudio(isCheck, isCastle, isEnPassant, isPromotion, isCapture) {
      if (isCheck) {
        if (this.extraAudio) {
          this.checkExtra2Audio.src = '/media/checkExtra2.7fb32fd1.mp3';
          this.checkExtra2Audio.play();
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
          const isLowTimeReached =
            this.game.timeLeft2 / this.timeConstraintForGame === TWENTY_PERCENT;
          if (isLowTimeReached) {
            this.startTimerWarningSound();
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
          const isLowTimeReached =
            this.game.timeLeft1 / this.timeConstraintForGame === TWENTY_PERCENT;
          if (isLowTimeReached) {
            this.startTimerWarningSound();
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
    opponentRandomMove() {
      if (this.isIncrementPowerFreq) return;
      this.powersAvailable = this.removeItemOnce(this.powersAvailable, this.RANDOM_KEY);
      fetch(`/api/randomMoveOpponent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: this.room,
        }),
      }).catch((err) => {
        console.log('/randomMoveOpponent failed', err);
      });
    },
    undoMove() {
      if (this.isIncrementPowerFreq) return;

      this.powersAvailable = this.removeItemOnce(this.powersAvailable, this.UNDO_KEY);
      fetch(`/api/undoMove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: this.room,
        }),
      }).catch((err) => {
        console.log('/undoMove failed', err);
      });
    },
    disableSelectedCell(rowTemp, colTemp) {
      const { row, col } = this.translateIndices(rowTemp, colTemp);
      fetch(`/api/disableSelectedCell`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: this.room,
          row,
          col,
        }),
      }).catch((err) => {
        console.log('/disableSelectedCell failed', err);
      });
    },
    addDisabledCells(row, col) {
      const rowColCombined = row + '' + col;
      const isUnique = this.disabledCells.indexOf(rowColCombined) === -1;
      if (isUnique) this.disabledCells.push(rowColCombined);
    },
    activeCaptureImmunity() {
      if (this.isIncrementPowerFreq) return;

      this.powersAvailable = this.removeItemOnce(this.powersAvailable, this.IMMUNE_KEY);
      fetch(`/api/captureImmunity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: this.room,
        }),
      }).catch((err) => {
        console.log('/captureImmunity failed', err);
      });
    },
    cutDownOpponentTime() {
      if (this.isIncrementPowerFreq) return;
      this.powersAvailable = this.removeItemOnce(this.powersAvailable, this.CUTDOWN_KEY);
      fetch(`/api/cutDownOpponentTime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: this.room,
        }),
      }).catch((err) => {
        console.log('/cutDownOpponentTime failed', err);
      });
    },
    spawnFriendlyPiece(row, col) {
      const spawnCell = this.translateSelectedPiece(row, col);
      fetch(`/api/spawnFriendlyPiece`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: this.room,
          spawnCell,
        }),
      }).catch((err) => {
        console.log('/spawnFriendlyPiece failed', err);
      });
    },
    omegaPieceUpgrade() {
      fetch(`/api/omegaPieceUpgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: this.room,
        }),
      }).catch((err) => {
        console.log('/omegaPieceUpgrade failed', err);
      });
    },
    checkOmegaPieceUpgradePieces(row, col) {
      const isCorrectPiecesMarked =
        (!this.black &&
          (this.piecePlacement[row][col] === 'P' || this.piecePlacement[row][col] === 'N')) ||
        (this.black &&
          (this.piecePlacement[row][col] === 'p' || this.piecePlacement[row][col] === 'n'));
      const isPieceEligibleForUpgrade = this.isOmegaPieceUpgradeEnabled && isCorrectPiecesMarked;
      return isPieceEligibleForUpgrade;
    },
    playTwice() {
      console.log('Play Twice - Countered by undo move');
      fetch(`/api/playTwice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: this.room,
        }),
      }).catch((err) => {
        console.log('/playTwice failed', err);
      });
    },
    fogOfWar() {
      if (this.isIncrementPowerFreq) return;

      fetch(`/api/fogOfWar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: this.room,
        }),
      }).catch((err) => {
        console.log('/fogOfWar failed', err);
      });
    },
    conditionallyRenderPiece(row, col) {
      const isPieceOnCell = this.piecePlacement[row][col] !== '';
      const isOwnerOfPiece =
        (this.black && this.piecePlacement[row][col].match('[rnbqkp]')) ||
        (!this.black && this.piecePlacement[row][col].match('[RNBQKP]'));
      const isFriendlySide = row >= 4;
      if (!this.isReadyToRenderPieces) return;
      if (!this.isFogOfWarEnabled && isPieceOnCell) return true;
      else if (this.isFogOfWarEnabled && isFriendlySide) return true;
      else if (this.isFogOfWarEnabled && !isFriendlySide && isOwnerOfPiece) return true;
      return false;
    },
    cellBackgroundColor(row, col) {
      const omegaUpgradeWhiteGreen = '#A6E5A0';
      const omegaUpgradeLightGreen = '#58B23B';
      const fogOfWarDarkGreen = '#3B4B2B';
      const fogOfWarDarkWhite = '#777769';
      const isOpponentSide = row <= 3;
      const isOwnerOfPiece =
        (this.black && this.piecePlacement[row][col].match('[rnbqkp]')) ||
        (!this.black && this.piecePlacement[row][col].match('[RNBQKP]'));
      if (this.selectedPiece === row.toString() + col.toString()) {
        return 'yellow';
      }
      if ((col + row) % 2 === 0) {
        if (this.isPieceSpawnEnabled && row === 5) return omegaUpgradeWhiteGreen;
        else if (this.isFogOfWarEnabled && !isOwnerOfPiece && isOpponentSide)
          return fogOfWarDarkWhite;
        else return this.cellWhiteColor;
      } else {
        if (this.isPieceSpawnEnabled && row === 5) return omegaUpgradeLightGreen;
        else if (this.isFogOfWarEnabled && !isOwnerOfPiece && isOpponentSide)
          return fogOfWarDarkGreen;
        else return this.cellGreenColor;
      }
    },
    incrementPowerFreq(event) {
      let id = event.target.id;
      if (!event.target.id) id = event.target.parentElement.id;
      if (!id) return;
      this.isIncrementPowerFreq = false;
      fetch(`/api/incrementPowerFreq`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: this.room,
          powerIncrement: id,
        }),
      })
        .then((resp) => {
          if (resp.ok) this.powersAvailable.push(id);
          return;
        })
        .catch((err) => {
          console.log('/incrementPowerFreq failed', err);
          return;
        });
    },
    removeItemOnce(arr, value) {
      var index = arr.indexOf(value);
      if (index > -1) {
        arr.splice(index, 1);
      }
      return arr;
    },
    getDisabledCells() {
      fetch(`/api/disabledCells`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: this.room,
        }),
      })
        .then((resp) => {
          return resp.json();
        })
        .then((data) => {
          data.roadblocks?.forEach((roadblock) => {
            const rowMsg = roadblock.charAt(0);
            const colMsg = roadblock.charAt(1);
            const { row, col } = this.translateIndices(rowMsg, colMsg);
            this.addDisabledCells(row, col);
          });
        })
        .catch((err) => {
          console.log('/disabledCells failed', err);
          return;
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
        this.captureImmunityAudio.autoplay = true;
        this.moveAudio.src = audioSrc;
        this.invalidMoveAudio.src = audioSrc;
        this.checkAudio.src = audioSrc;
        this.captureAudio.src = audioSrc;
        this.castleAudio.src = audioSrc;
        this.timerRunningOutAudio.src = audioSrc;
        this.captureImmunityAudio.src = audioSrc;
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
    this.socket.off('undoMove');
    this.socket.off('disableSelectedCell');
    this.socket.off('captureImmune');
    this.socket.off('pieceSpawn');
    this.socket.off('omegaPieceUpgrade');
    this.socket.off('fogOfWarEnable');
    this.socket.off('fogOfWarDisable');
    this.socket.off('updatedPowers');
    this.socket.off('spawnGoldBolt');
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

/* .col:after {
  content: '';
  display: block;
  position: absolute;
  width: 100px;
  height: 100px;
  background: rgba(0, 255, 0, 0.8);
} */

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

.flexCenter {
  display: flex;
  align-content: center;
  justify-content: center;
}

.flexCenterCol {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
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

.endGameMessageModal {
  position: absolute;
  top: 33%;
  margin: 0 auto;
  width: 300px;
  height: 150px;
  font-size: 30px;
  justify-content: center;
  align-items: center;
  text-align: center;
  flex-direction: column;
  color: black;
  background-color: rgba(205, 133, 63, 0.6);
  padding: 30px auto;
  border-radius: 5px;
  z-index: 11;
}

.pawnPromotionModal {
  position: absolute;
  left: 50%;
  width: 300px;
  height: 300px;
  margin-left: -150px;
  margin-top: -350px;
  overflow: auto;
  background-color: rgba(205, 133, 63, 0.6);
  padding: 30px auto;
  text-align: center;
  border-radius: 5px;
  color: black;
  font-size: 30px;
  z-index: 11;
  justify-content: center;
  align-items: center;
}

@media screen and (max-width: 600px) {
  .gameCodeSection {
    width: 325px;
  }
  .gameCodeBtn {
    width: 280px;
  }
  .powerText {
    font-size: 18px;
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
