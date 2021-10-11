# Chess

Play online via this link: https://chessbattle.herokuapp.com

![bild](https://user-images.githubusercontent.com/42782387/134075059-34b31eac-2c56-4468-8585-f90f7980e200.png)

<p float="left">
<img src="https://user-images.githubusercontent.com/42782387/134075012-e344be22-49fc-4d95-aed9-8b064a79909a.png" width="342" />
  <img src="https://user-images.githubusercontent.com/42782387/134074848-bc23ccf3-c178-4333-b256-6e02fc0b4898.png" width="390" />
  <img src="https://user-images.githubusercontent.com/42782387/134074992-e7e3917c-96cf-4ef8-8fd6-145501b22711.png" width="365" /> 
  <img src="https://user-images.githubusercontent.com/42782387/134975449-b8f8cd94-a71d-4b41-8454-29e3197b6ab7.png" width="460" /> 
</p>

TODO LIST:

1. Fix pawn promotion for UI and logic ✔️
2. Add user-online field in database & display in UI ✔️
3. Add a create game modal with invite options ✔️
4. Add a leaderboard - experience in amount of games ✔️
5. Add device scaling of the board ✔️
6. Add timers in game ✔️
7. (Fix re-routing to correct https-link when loss of connection) ✔️
8. (Fix bug that cause no live updates to happen in game) ✔️
9. Add a new game mode - Crazy Chess (Squares fall off the board, disco board, rotating board, have
   to solve puzzles before you can move - Mario Cart mechanics if ahead it gets more difficult, if
   you are behind you get one square where you can upgrade the horse to Bishop/Rook)
10. Points you have during a match ✔️
11. Make web app a Progressive Web App (WIP)
12. Add surrender button ✔️
13. Sort out all the confusion about multiple sessions/sockets from same user (BUG - might be
    linked to having to **unsubscribe from socket listeners** in FE) ✔️
    https://dev.to/bravemaster619/how-to-prevent-multiple-socket-connections-and-events-in-react-531d
14. Signing out should result in being removed from the Online Users list ✔️

15. Add a create game time limit selection & an unlimited time option.
16. Delete liveGames older than 1 day - to maintain database data quality ✔️
17. Add a pause / resume button for chess timer - in case players have to eat dinner with family
18. Throttle audio - Guide:
    https://stackoverflow.com/questions/54141738/how-can-i-use-throttling-with-getting-an-event-target
    ✔️
19. Match analysis after game?
20. Flashing red light when near loss due to lack of time (<20% time) ✔️

🕹️▶️⏸️🔙
