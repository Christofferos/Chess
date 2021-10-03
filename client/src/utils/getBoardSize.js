export const getBoardSize = () => {
  return Math.min(Math.floor(window.innerWidth / 8), Math.floor(window.innerHeight / 10));
};
