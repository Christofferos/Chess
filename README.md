<h1 align="center">
    ChessOnline ♟️
</h1>
<p align="center">I use it to challenge my friends in chess</p>
<p align="center"><b><a href="https://chessbattle.herokuapp.com">Play the game</a></b></p>

<p align="center">
	![chessOnlineInAction](https://user-images.githubusercontent.com/42782387/151063507-78661cad-f10b-4aa3-b159-38c54da6d5be.jpg)
</p>

![bild](https://user-images.githubusercontent.com/42782387/134075059-34b31eac-2c56-4468-8585-f90f7980e200.png)

<p float="left">
<img src="https://user-images.githubusercontent.com/42782387/134075012-e344be22-49fc-4d95-aed9-8b064a79909a.png" width="342" />
  <img src="https://user-images.githubusercontent.com/42782387/134074848-bc23ccf3-c178-4333-b256-6e02fc0b4898.png" width="390" />
  <img src="https://user-images.githubusercontent.com/42782387/134074992-e7e3917c-96cf-4ef8-8fd6-145501b22711.png" width="345" /> 
  <img src="https://user-images.githubusercontent.com/42782387/134975449-b8f8cd94-a71d-4b41-8454-29e3197b6ab7.png" width="430" /> 
</p>

GCP has also been used to deploy the frontend & backend. The App Engine together with other services offer more scalability than Heroku can. 
* Link to deployed GCP version:
https://eitcbmdemotest-63867.ew.r.appspot.com/#/login   



**TODO-LIST**:

| Tasks                                                                         | Done |
| ----------------------------------------------------------------------------- | ---- |
| 1. Fix pawn promotion for UI and logic                                        | ✔️   |
| 2. Add user-online field in database & display in UI                          | ✔️   |
| 3. Add a create game modal with invite options                                | ✔️   |
| 4. Add a leaderboard - experience in amount of games                          | ✔️   |
| 5. Add device scaling of the board                                            | ✔️   |
| 6. Add timers in game                                                         | ✔️   |
| 7. Fix re-routing to correct http/https link after connection loss            | ✔️   |
| 8. Fix bug that cause no live updates to happen in game                       | ✔️   |
| 9. Add a new game mode - Crazy Chess                                          | ✔️   |
| 10. Points you have during a match                                            | ✔️   |
| 11. Make web app a Progressive Web App (PWA)                                  | ✔️   |
| 12. Add surrender button                                                      | ✔️   |
| 13. Sort out all the confusion about multiple sessions/sockets from same user | ✔️   |
| 14. Signing out should result in being removed from the Online Users list     | ✔️   |
| 15. Add a create game time limit selection & invite player                    | ✔️    |
| 16. Delete liveGames older than 1 day - to maintain database data quality     | ✔️   |
| 17. -                                                                         | -    |
| 18. Throttle audio                                                            | ✔️   |
| 19. Match analysis after game (Stockfish)                                     | ✔️   |
| 20. Flashing red light when near loss due to lack of time (<20% time)         | ✔️   |
| 21. Server restart does not affect users that play a game of chess            | ✔️   |
| 22. Add VueDraggable (React Konva) for drag-n-drop of pieces                  | -    |
| 23. Add move, over, start, check, castle, capture sound effects               | ✔️   |
| 24. Add invalid move and entertaining sound effects                           | ✔️   |
| 25. Implement ability to rotate board                                         | ✔️   |
| 26. Implement ability to ask for a redo move (Crazy Chess)                    | ✔️   |
| 27. Implement ability to make a random move for opponent (Crazy Chess)        | ✔️   |
| 28. Implement ability to see historic moves after game                        | -    |
| 29. Selected pieces are not unselected upon opponent move                     | ✔️   |
| 30. Pre-moving                                                                | -    |
| 31. Move animation                                                            | -    |
| 32. Add an invite opponent/player process after creating game                 | ✔️   |
| 33. Color the last move piece from and to squares                             | -    |
| 34. Local 2 player chess                                                      | ✔️   |
| 35. Roadblock powerup (Crazy Chess)                                           | ✔️   |
| 36. Time cut off powerup (Crazy Chess)                                        | ✔️   |
| 37. Immune to captures powerup (Crazy Chess)                                  | ✔️   |
| 38. Spawn friendly pawn (Crazy Chess)                                         | ✔️   |
| 39. Omega piece upgrade (Crazy Chess)                                         | ✔️   |
| 40. Fog of war (Crazy Chess)                                                  | ✔️   |

**_---------------_**

<details>
<summary>
<strong>Extra Notes: (Click here)</strong>
</summary>
  
Easter egg: Powers that were planned to be included in the game
* 💣 Explosive Pawn - Explodes on death, kills capturing piece, except king
* 🌌 King Teleportation - Teleport two steps in any direction
* 🏎️ Racecar Pawn - Permanent 2 step ability on one pawn, cannot move past enemy pieces
* 🚀 Missle Launch - Select target square for explosion in 3 turns, can only select unoccupied squares
* 🥶 Piece Freeze - Freeze piece for 2 turns, selected piece is invincible until unfrozen
* ❄️ Snow Storm - All pieces can move a maximum of 1 square except horses - duration is 3 turns

  
[9]. (Squares fall off the board, disco board, rotating board, have to solve puzzles before you can
move - Mario Cart mechanics if ahead it gets more difficult, if you are behind you get one square
where you can upgrade the horse to Bishop/Rook)

[11]. On iOS safari go to brower then press the middle far-down button Share > "Add to Home Screen"

[13]. (BUG - might be linked to having to **unsubscribe from socket listeners** in FE)
https://dev.to/bravemaster619/how-to-prevent-multiple-socket-connections-and-events-in-react-531d

[18]. Guide:
https://stackoverflow.com/questions/54141738/how-can-i-use-throttling-with-getting-an-event-target

[19]. Stockfish Guide (Felsökare - enginegame - Evaluation):
http://www.netreal.de/stockfish.js/example/index.html

[22]. Implemented vue vanilla drag & drop but it only worked for desktop:
https://www.w3schools.com/html/html5_draganddrop.asp React Konva disables scroll on mobile and
places canvas behind all chess pieces. It requries pieces to be stored in state - works well on
mobile. VueDraggable: https://github.com/SortableJS/Vue.Draggable

[24]. Enable entertaining sound effects via profile page switch/toggle. Put in context and adjust
in Room.vue

</details>

**_---------------_**

### The application consists of the following screens:

- Sign in/Sign up screen
- Profile screen (match history)
- Leaderboard screen
- Create/join game screen
- Online game screen
- Stockfish AI game screen
- Local 2 player game screen
- Crazy chess game screen

### The application database is:

- Firebase (persistance)

### The application server host is:

- Heroku

### The application frontend is served by:

- Express (in NodeJs)

### The application websocket library is:

- SocketIO (enables near real time updates ~50-150ms)

### The application uses server side authentication with:

- CA-signed certificate (Secure connection with HTTPS)
- Article to help you make your own certificate:
  https://flaviocopes.com/express-https-self-signed-certificate/

### The application remembers your game:

- If the server crashes or goes down, your game will persist and you can return to the game as it
  was when the server goes back online.

**Note:**
(1) Chess logic made possible through Chess.js by Jeff Hlywa (jhlywa@gmail.com) Copyright (c) 2021, All rights reserved.
(2) Chess engine, Stockfish.js made possibly through (http://github.com/nmrugg/stockfish.js) licensed GPL.
