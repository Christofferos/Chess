<template>
  <div class="container">
    <section
      class="col-md-10 col-md-offset-1"
      style="display: flex; flex-direction: column; justify-content: center; align-items: center"
    >
      <div class="row" style="text-align: center">
        <h1 v-if="this.opponent === ''">Waiting for an opponent...</h1>
        <h1 v-else>
          {{ this.black ? this.$store.state.cookie.username : this.opponent }}
        </h1>
      </div>

      <div
        v-bind:style="{
          display: this.isPawnPromotionTime ? 'block' : 'none',
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '300px',
          height: '300px',
          marginLeft: '-150px',
          marginTop: '-300px',
          overflow: 'auto',
          backgroundColor: 'rgba(205, 133, 63, 0.6)',
          padding: '30px auto',
          textAlign: 'center',
          borderRadius: '5px',
          color: 'black',
          fontSize: '30px',
          zIndex: '11',
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
          display: this.endGameMsg === '' ? 'none' : 'block',
          width: '300px',
          height: '150px',
          position: 'absolute',
          backgroundColor: 'rgba(205, 133, 63, 0.6)',
          top: '33%',
          left: '33%',
          padding: '30px auto',
          textAlign: 'center',
          borderRadius: '5px',
          color: 'black',
          fontSize: '30px',
          zIndex: '11',
        }"
        type="text"
      >
        <div v-bind:style="{ marignBottom: '10px' }">{{ this.endGameMsg }}</div>
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

      <div id="board" style="display: inline-block; vertical-align: bottom">
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
              height: '100px',
              width: '100px',
              cursor: 'pointer',
            }"
          >
            <img
              v-if="piecePlacement[row][col] !== ''"
              :src="pieces[piecePlacement[row][col]]"
              style="width: 100px; position: absolute"
            />
            <span
              v-bind:style="{
                opacity: col === 0 ? 1 : 0,
                color: row % 2 === 0 ? '#58793B' : '#E2E5BE',
                fontWeight: 800,
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

      <div class="row" style="text-align: center">
        <h1>
          {{ this.black ? this.opponent : this.$store.state.cookie.username }}
        </h1>
      </div>

      <div
        style="
          text-align: center;
          padding: 20px;
          border-radius: 10px;
          background: #41403d;
          width: 450px;
          margin: auto auto 25px auto;
        "
      >
        <button v-clipboard="() => room" class="well btn btn-default button">🔗 Game Code</button>

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
        <div
          style="
            border: 2px solid black;
            width: 350px;
            margin: auto auto 25px auto;
            background: #504f4c;
            border-radius: 5px;
          "
        >
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
    </section>
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

export default {
  name: 'Room',
  components: {},
  data() {
    return {
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
    };
  },
  methods: {
    debug() {
      console.log('Debug');
    },
    redirect(name) {
      this.$router.push(`/${name}`);
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
            throw new Error(`Unexpected failure when joining room: ${this.room}`);
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
      this.$root.socket.emit('backToMenu', this.room);
    },
    reconnectionEvents() {
      fetch(`/api/room/${this.room}/join`)
        .then((resp) => {
          if (!resp.ok) {
            throw new Error(`Unexpected failure when joining room: ${this.room}`);
          }
          return resp.json();
        })
        .then((data) => {
          this.game = data.game;
          if (data.game.player1 === this.$store.state.cookie.username) {
            this.opponent = data.game.player2;
          } else if (data.game.player2 === this.$store.state.cookie.username) {
            this.opponent = data.game.player1;
            this.black = true;
          }
          this.updatePiecePlacement();
        })
        .catch((err) => {
          throw new Error(`Error in join room ${err}`);
        });

      this.$root.socket.on('msg', (msg) => {
        this.entries = [msg, ...this.entries];
      });

      this.$root.socket.on('backToMenuResponse', () => {
        this.redirect('list');
      });

      this.$root.socket.on('getGamePlayers', (players) => {
        if (this.$store.state.cookie.username !== players.player1) {
          this.opponent = players.player1;
          this.black = true;
        } else if (this.$store.state.cookie.username !== players.player2) {
          this.opponent = players.player2;
        }
      });

      this.$root.socket.on('movePieceResponse', (newFen, gameOver, draw1, draw2, draw3, draw4) => {
        if (gameOver) {
          if (draw1 || draw2 || draw3 || draw4) {
            this.endGameMsg = 'Draw!';
          } else if (newFen.split(' ')[1] === 'w' && this.black) {
            this.endGameMsg = 'Check Mate!\n You win';
          } else if (newFen.split(' ')[1] === 'w' && this.black === false) {
            this.endGameMsg = 'Check Mate!\n You lose';
          } else if (newFen.split(' ')[1] === 'b' && this.black) {
            this.endGameMsg = 'Check Mate!\n You lose';
          } else if (newFen.split(' ')[1] === 'b' && this.black === false) {
            this.endGameMsg = 'Check Mate!\n You win';
          }
        }
        this.selectedPiece = '';
        this.game.fen = newFen;
        this.updatePiecePlacement();
      });
    },
  },
  created() {
    this.reconnectionEvents();

    this.$root.socket.on('connect', () => {
      this.reconnectionEvents();
    });
    this.$root.socket.on('disconnect', () => {
      this.$root.socket.off('connect_error');
    });
    this.$root.socket.on('connect_error', (err) => {
      console.log(`Connection error: ${err}`);
    });
  },
  beforeDestroy() {
    if (this.opponent === '') {
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
          if (!resp.ok) {
            throw new Error(`Unexpected failure when joining room: ${this.room}`);
          }
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
</style>
