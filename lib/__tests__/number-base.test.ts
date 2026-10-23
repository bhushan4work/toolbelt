import { describe, expect, it } from "vitest";
import {
  formatInteger,
  fromTwosComplement,
  NumberBaseError,
  parseInteger,
  signedRange,
  toTwosComplement,
} from "@/lib/number-base";

// BigInt() instead of literals like 255n: the tsconfig target is ES2017.
const big = (value: string | number) => BigInt(value);

describe("parseInteger", () => {
  it("detects the 0x, 0o and 0b prefixes when no base is given", () => {
    expect(parseInteger("0xff")).toBe(big(255));
    expect(parseInteger("0XFF")).toBe(big(255));
    expect(parseInteger("0o17")).toBe(big(15));
    expect(parseInteger("0b1010")).toBe(big(10));
    expect(parseInteger("42")).toBe(big(42));
  });

  it("reads _ and spaces as separators", () => {
    expect(parseInteger("1111_1111", 2)).toBe(big(255));
    expect(parseInteger("1111 1111", 2)).toBe(big(255));
    expect(parseInteger("1_000_000")).toBe(big(1000000));
  });

  it("reads the sign before the prefix", () => {
    expect(parseInteger("-0b1010")).toBe(big(-10));
    expect(parseInteger("+0x10")).toBe(big(16));
    expect(parseInteger("-42")).toBe(big(-42));
  });

  it("keeps values above 2^53 exact", () => {
    expect(parseInteger("18446744073709551616")).toBe(big(2) ** big(64));
    expect(parseInteger("9007199254740993")).toBe(big("9007199254740993"));
  });

  it("reads bases up to 36, in either case", () => {
    expect(parseInteger("zz", 36)).toBe(big(1295));
    expect(parseInteger("ZZ", 36)).toBe(big(1295));
  });

  it("only skips the prefix of the base it was given", () => {
    expect(parseInteger("0x1f", 16)).toBe(big(31));
    // In base 16, "0b1" is the digits 0, b and 1.
    expect(parseInteger("0b1", 16)).toBe(big(0xb1));
  });

  it("names the bad character and where it is", () => {
    expect(() => parseInteger("0b102")).toThrow('"2" at position 5 is not a base 2 digit');
    expect(() => parseInteger("12a4")).toThrow('"a" at position 3 is not a base 10 digit');
    // Leading spaces count toward the position.
    expect(() => parseInteger("  9", 8)).toThrow('"9" at position 3 is not a base 8 digit');
    try {
      parseInteger("0b102");
    } catch (err) {
      expect(err).toBeInstanceOf(NumberBaseError);
      expect((err as NumberBaseError).position).toBe(5);
    }
  });

  it("rejects empty input, a lone prefix and a bad base", () => {
    expect(() => parseInteger("   ")).toThrow("Enter a number");
    expect(() => parseInteger("-")).toThrow("No digits to convert");
    expect(() => parseInteger("0x")).toThrow("No digits to convert");
    expect(() => parseInteger("1", 1)).toThrow("Base must be a whole number from 2 to 36");
    expect(() => parseInteger("1", 37)).toThrow("Base must be a whole number from 2 to 36");
  });
});

describe("formatInteger", () => {
  it("writes 2^64 in hex exactly", () => {
    expect(formatInteger(big(2) ** big(64), 16)).toBe("10000000000000000");
  });

  it("writes any base from 2 to 36", () => {
    expect(formatInteger(big(255), 2)).toBe("11111111");
    expect(formatInteger(big(255), 8)).toBe("377");
    expect(formatInteger(big(1295), 36)).toBe("zz");
    expect(formatInteger(big(0), 2)).toBe("0");
  });

  it("uppercases letters and keeps the sign in front", () => {
    expect(formatInteger(big(255), 16, { uppercase: true })).toBe("FF");
    expect(formatInteger(big(-255), 16)).toBe("-ff");
  });

  it("groups digits from the right", () => {
    expect(formatInteger(big(255), 2, { groupSize: 4 })).toBe("1111_1111");
    expect(formatInteger(big(1000000), 10, { groupSize: 3 })).toBe("1_000_000");
    expect(formatInteger(big(-1234), 10, { groupSize: 3, separator: " " })).toBe("-1 234");
    expect(formatInteger(big(12), 10, { groupSize: 3 })).toBe("12");
  });

  it("round-trips through parseInteger", () => {
    const value = big("-123456789012345678901234567890");
    for (const base of [2, 8, 10, 16, 36]) {
      expect(parseInteger(formatInteger(value, base, { groupSize: 4 }), base)).toBe(value);
    }
  });
});

describe("two's complement", () => {
  it("writes negative values with the high bit set", () => {
    expect(toTwosComplement(big(-1), 8)).toBe("11111111");
    expect(toTwosComplement(big(-128), 8)).toBe("10000000");
    expect(toTwosComplement(big(5), 8)).toBe("00000101");
    expect(toTwosComplement(big(-1), 64)).toBe("1".repeat(64));
  });

  it("throws when the value doesn't fit the width", () => {
    expect(() => toTwosComplement(big(128), 8)).toThrow("128 doesn't fit in a signed 8-bit integer (-128 to 127)");
    expect(() => toTwosComplement(big(-129), 8)).toThrow(NumberBaseError);
    expect(() => toTwosComplement(big(2) ** big(63), 64)).toThrow(NumberBaseError);
  });

  it("knows the signed range of each width", () => {
    expect(signedRange(8)).toEqual({ min: big(-128), max: big(127) });
    expect(signedRange(32)).toEqual({ min: big(-2147483648), max: big(2147483647) });
  });

  it("reads bits back as a signed value", () => {
    expect(fromTwosComplement("11111111", 8)).toBe(big(-1));
    expect(fromTwosComplement("1000_0000", 8)).toBe(big(-128));
    expect(fromTwosComplement("0b0111_1111", 8)).toBe(big(127));
    // Shorter input is padded with zeros, so it stays positive.
    expect(fromTwosComplement("1111", 8)).toBe(big(15));
  });

  it("round-trips every width", () => {
    for (const bits of [8, 16, 32, 64]) {
      const { min, max } = signedRange(bits);
      for (const value of [min, big(-1), big(0), max]) {
        expect(fromTwosComplement(toTwosComplement(value, bits), bits)).toBe(value);
      }
    }
  });

  it("rejects a sign, too many bits and digits that aren't 0 or 1", () => {
    expect(() => fromTwosComplement("-101", 8)).toThrow("Two's complement bits have no sign");
    expect(() => fromTwosComplement("111111111", 8)).toThrow("9 bits don't fit in 8 bits");
    expect(() => fromTwosComplement("102", 8)).toThrow('"2" at position 3 is not a base 2 digit');
  });
});
