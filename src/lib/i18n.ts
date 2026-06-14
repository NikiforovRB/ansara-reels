/**
 * Russian plural form: ['рилс', 'рилса', 'рилсов'] → "1 рилс", "2 рилса", "5 рилсов"
 */
export function pluralRu(
  n: number,
  forms: [string, string, string],
): string {
  const abs = Math.abs(n) % 100;
  const n1 = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (n1 > 1 && n1 < 5) return forms[1];
  if (n1 === 1) return forms[0];
  return forms[2];
}

export const REELS_FORMS: [string, string, string] = ["рилс", "рилса", "рилсов"];

export function reelsCountLabel(n: number): string {
  return `${n} ${pluralRu(n, REELS_FORMS)}`;
}

export const VIDEO_FORMS: [string, string, string] = [
  "видео",
  "видео",
  "видео",
];

export const PROJECT_FORMS: [string, string, string] = [
  "проект",
  "проекта",
  "проектов",
];

/** Human-readable file size, e.g. 1.5 МБ, 820 КБ, 2.1 ГБ. */
export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 Б";
  const units = ["Б", "КБ", "МБ", "ГБ", "ТБ"];
  const i = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  const value = bytes / Math.pow(1024, i);
  const rounded = value >= 100 || i === 0 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded} ${units[i]}`;
}

const RU_MONTHS_GENITIVE = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];
const RU_WEEKDAYS_SHORT = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** "5 мая, вт" */
export function formatDateRu(value: Date | string | number): string {
  const d = value instanceof Date ? value : new Date(value);
  return `${d.getDate()} ${RU_MONTHS_GENITIVE[d.getMonth()]}, ${RU_WEEKDAYS_SHORT[d.getDay()]}`;
}

/** "5 мая, вт, 17:30" */
export function formatDateTimeRu(value: Date | string | number): string {
  const d = value instanceof Date ? value : new Date(value);
  return `${formatDateRu(d)}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
