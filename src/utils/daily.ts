import WORDS_DB from './words.json';

export const getLocalTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDailyWords = () => {
  const dateStr = getLocalTodayString();
  let seed = 0;
  for (let i = 0; i < dateStr.length; i++) seed += dateStr.charCodeAt(i);
  const db = (WORDS_DB as any)['Intermediate'];
  return [0, 1, 2, 3, 4].map(i => db[(seed + i * 31) % db.length]);
};
