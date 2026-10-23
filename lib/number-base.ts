// Integer conversion between bases 2 to 36, plus two's complement. Everything
// is BigInt: nothing goes through Number or parseInt, so values above 2^53 stay
// exact.

const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";
// BigInt() calls instead of literals like 0n: the tsconfig target is ES2017.
const ZERO = BigInt(0);
const ONE = BigInt(1);

export const MIN_BASE = 2;
export const MAX_BASE = 36;
export const TWOS_COMPLEMENT_WIDTHS = [8, 16, 32, 64] as const;

const PREFIXES: Record<string, number> = { "0b": 2, "0o": 8, "0x": 16 };

/** A parse or range error. `position` is 1-based and counts characters, when the error is about one. */
export class NumberBaseError extends Error {
  constructor(
    message: string,
    readonly position?: number
  ) {
    super(message);
    this.name = "NumberBaseError";
  }
}

function assertBase(base: number): void {
  if (!Number.isInteger(base) || base < MIN_BASE || base > MAX_BASE) {
    throw new NumberBaseError(`Base must be a whole number from ${MIN_BASE} to ${MAX_BASE}, got ${base}`);
  }
}

function assertWidth(bits: number): void {
  if (!Number.isInteger(bits) || bits < 1) {
    throw new NumberBaseError(`Bit width must be a positive whole number, got ${bits}`);
  }
}

/**
 * Reads an integer. A leading "-" or "+" comes first, then an optional 0b, 0o
 * or 0x prefix. Without a base the prefix picks it (decimal otherwise). With a
 * base, only that base's own prefix is skipped, so "0b1" in base 16 is the
 * digits 0, b and 1. "_" and spaces between digits are ignored.
 */
export function parseInteger(input: string, base?: number): bigint {
  if (base !== undefined) assertBase(base);
  const chars = Array.from(input.trim());
  if (chars.length === 0) throw new NumberBaseError("Enter a number");
  // Positions in errors count from the first character of the untrimmed input.
  const offset = Array.from(input).length - Array.from(input.trimStart()).length;

  let i = 0;
  let negative = false;
  if (chars[0] === "-" || chars[0] === "+") {
    negative = chars[0] === "-";
    i = 1;
  }

  let radix = base ?? 10;
  const prefix = chars.slice(i, i + 2).join("").toLowerCase();
  const prefixBase = PREFIXES[prefix];
  if (prefixBase !== undefined && (base === undefined || base === prefixBase)) {
    radix = prefixBase;
    i += 2;
  }

  const bigRadix = BigInt(radix);
  let value = ZERO;
  let digits = 0;
  for (; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === "_" || ch === " ") continue;
    const digit = DIGITS.indexOf(ch.toLowerCase());
    if (digit < 0 || digit >= radix) {
      const position = offset + i + 1;
      throw new NumberBaseError(`"${ch}" at position ${position} is not a base ${radix} digit`, position);
    }
    value = value * bigRadix + BigInt(digit);
    digits++;
  }
  if (digits === 0) throw new NumberBaseError("No digits to convert");
  return negative ? -value : value;
}

export interface FormatOptions {
  /** Letters A to Z instead of a to z for digits above 9. */
  uppercase?: boolean;
  /** Put a separator every this many digits, counted from the right. */
  groupSize?: number;
  /** The group separator. "_" by default, which parseInteger reads back. */
  separator?: string;
}

/** Writes an integer in a base from 2 to 36. */
export function formatInteger(value: bigint, base: number, options: FormatOptions = {}): string {
  assertBase(base);
  const { uppercase = false, groupSize, separator = "_" } = options;
  const negative = value < ZERO;
  let digits = (negative ? -value : value).toString(base);
  if (uppercase) digits = digits.toUpperCase();
  if (groupSize && groupSize > 0 && digits.length > groupSize) {
    const groups: string[] = [];
    for (let end = digits.length; end > 0; end -= groupSize) {
      groups.unshift(digits.slice(Math.max(0, end - groupSize), end));
    }
    digits = groups.join(separator);
  }
  return negative ? `-${digits}` : digits;
}

/** The smallest and largest values a signed `bits`-bit integer holds. */
export function signedRange(bits: number): { min: bigint; max: bigint } {
  assertWidth(bits);
  const half = ONE << BigInt(bits - 1);
  return { min: -half, max: half - ONE };
}

/** The `bits`-bit two's complement of a value, as binary digits. Throws when it doesn't fit. */
export function toTwosComplement(value: bigint, bits: number): string {
  const { min, max } = signedRange(bits);
  if (value < min || value > max) {
    throw new NumberBaseError(`${value} doesn't fit in a signed ${bits}-bit integer (${min} to ${max})`);
  }
  const unsigned = value < ZERO ? (ONE << BigInt(bits)) + value : value;
  return unsigned.toString(2).padStart(bits, "0");
}

/**
 * Reads binary digits as a `bits`-bit two's complement value: a leading 1 makes
 * it negative. Shorter input is padded with zeros on the left.
 */
export function fromTwosComplement(binary: string, bits: number): bigint {
  assertWidth(bits);
  const trimmed = binary.trim();
  if (trimmed.startsWith("-") || trimmed.startsWith("+")) {
    throw new NumberBaseError("Two's complement bits have no sign. Enter only 0 and 1");
  }
  const unsigned = parseInteger(trimmed, 2);
  const length = trimmed.replace(/^0b/i, "").replace(/[_ ]/g, "").length;
  if (length > bits) {
    throw new NumberBaseError(`${length} bits don't fit in ${bits} bits`);
  }
  return unsigned >= ONE << BigInt(bits - 1) ? unsigned - (ONE << BigInt(bits)) : unsigned;
}
