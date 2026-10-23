import { describe, expect, it } from "vitest";
import { detectIsMac, formatModKey, formatModShiftKey } from "../platform";

describe("platform detection helper", () => {
  describe("detectIsMac", () => {
    it("identifies macOS and iOS platforms correctly", () => {
      expect(detectIsMac("MacIntel")).toBe(true);
      expect(detectIsMac("MacPPC")).toBe(true);
      expect(detectIsMac("Mac68K")).toBe(true);
      expect(detectIsMac("iPhone")).toBe(true);
      expect(detectIsMac("iPad")).toBe(true);
      expect(detectIsMac("iPod")).toBe(true);
      expect(detectIsMac("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")).toBe(true);
    });

    it("identifies non-macOS platforms correctly", () => {
      expect(detectIsMac("Win32")).toBe(false);
      expect(detectIsMac("Win64")).toBe(false);
      expect(detectIsMac("Windows")).toBe(false);
      expect(detectIsMac("Linux x86_64")).toBe(false);
      expect(detectIsMac("Linux armv8l")).toBe(false);
      expect(detectIsMac("Android")).toBe(false);
      expect(detectIsMac("")).toBe(false);
    });
  });

  describe("formatModKey and formatModShiftKey", () => {
    it("formats single modifier shortcuts", () => {
      expect(formatModKey("F", true)).toBe("⌘F");
      expect(formatModKey("F", false)).toBe("Ctrl+F");
      expect(formatModKey("K", true)).toBe("⌘K");
      expect(formatModKey("K", false)).toBe("Ctrl+K");
    });

    it("formats modifier + shift shortcuts", () => {
      expect(formatModShiftKey("S", true)).toBe("⌘⇧S");
      expect(formatModShiftKey("S", false)).toBe("Ctrl+Shift+S");
      expect(formatModShiftKey("K", true)).toBe("⌘⇧K");
      expect(formatModShiftKey("K", false)).toBe("Ctrl+Shift+K");
    });
  });
});
