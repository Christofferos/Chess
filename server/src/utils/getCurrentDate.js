export const currentDate = () => {
  return new Date()
    .toJSON()
    .slice(0, 10)
    .replace(/-/g, '/');
};
