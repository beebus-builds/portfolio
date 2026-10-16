const WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
  "twenty",
];

/**
 * Spells a small count out for use in prose ("Eight clusters"), so copy that
 * quotes a data length never drifts away from the data it describes.
 * Beyond the table it falls back to digits.
 */
export function numberWord(count: number): string {
  return WORDS[count] ?? String(count);
}
