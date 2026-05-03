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
