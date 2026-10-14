import { describe, expect, it } from "vitest";
import {
  detectIsMac,
  getModifierKey,
  getShiftKey,
  formatModKey,
  formatModShiftKey,
} from "../platform";

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

  describe("getModifierKey", () => {
    it("returns ⌘ on macOS and Ctrl elsewhere", () => {
      expect(getModifierKey(true)).toBe("⌘");
      expect(getModifierKey(false)).toBe("Ctrl");
    });
  });

  describe("getShiftKey", () => {
    it("returns ⇧ on macOS and Shift elsewhere", () => {
      expect(getShiftKey(true)).toBe("⇧");
      expect(getShiftKey(false)).toBe("Shift");
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

  describe("Command palette and JSON formatter shortcuts", () => {
    it("formats Clear all shortcut as Mod+Shift+K (⌘⇧K on macOS, Ctrl+Shift+K elsewhere)", () => {
      const macKeys = [getModifierKey(true), getShiftKey(true), "K"];
      const nonMacKeys = [getModifierKey(false), getShiftKey(false), "K"];

      expect(macKeys).toEqual(["⌘", "⇧", "K"]);
      expect(nonMacKeys).toEqual(["Ctrl", "Shift", "K"]);
      expect(formatModShiftKey("K", true)).toBe("⌘⇧K");
      expect(formatModShiftKey("K", false)).toBe("Ctrl+Shift+K");
    });

    it("preserves Mod+K for opening the command palette", () => {
      const macToggle = [getModifierKey(true), "K"];
      const nonMacToggle = [getModifierKey(false), "K"];

      expect(macToggle).toEqual(["⌘", "K"]);
      expect(nonMacToggle).toEqual(["Ctrl", "K"]);

      // Verify that Clear all (Mod+Shift+K) does not clash with Command palette toggle (Mod+K)
      expect(macToggle).not.toEqual([getModifierKey(true), getShiftKey(true), "K"]);
      expect(nonMacToggle).not.toEqual([getModifierKey(false), getShiftKey(false), "K"]);
    });

    it("formats Find in input tooltip dynamically", () => {
      expect(`Find in input (${formatModKey("F", true)})`).toBe("Find in input (⌘F)");
      expect(`Find in input (${formatModKey("F", false)})`).toBe("Find in input (Ctrl+F)");
    });
  });

  describe("Shortcuts popover items for JSON Formatter and Base64", () => {
    it("generates correct JSON Formatter shortcuts legend on macOS and non-macOS", () => {
      const getJsonShortcuts = (isMac: boolean) => {
        const modKey = getModifierKey(isMac);
        const shiftKey = getShiftKey(isMac);
        return [
          { keys: [modKey, "Enter"], label: "Format" },
          { keys: [modKey, "M"], label: "Minify" },
          { keys: [modKey, "F"], label: "Find in input" },
          { keys: [modKey, shiftKey, "S"], label: "Sort keys" },
          { keys: [modKey, shiftKey, "K"], label: "Clear all" },
          { keys: [modKey, "D"], label: "Download" },
          { keys: [modKey, "K"], label: "Command palette" },
        ];
      };

      const macShortcuts = getJsonShortcuts(true);
      expect(macShortcuts).toEqual([
        { keys: ["⌘", "Enter"], label: "Format" },
        { keys: ["⌘", "M"], label: "Minify" },
        { keys: ["⌘", "F"], label: "Find in input" },
        { keys: ["⌘", "⇧", "S"], label: "Sort keys" },
        { keys: ["⌘", "⇧", "K"], label: "Clear all" },
        { keys: ["⌘", "D"], label: "Download" },
        { keys: ["⌘", "K"], label: "Command palette" },
      ]);

      const nonMacShortcuts = getJsonShortcuts(false);
      expect(nonMacShortcuts).toEqual([
        { keys: ["Ctrl", "Enter"], label: "Format" },
        { keys: ["Ctrl", "M"], label: "Minify" },
        { keys: ["Ctrl", "F"], label: "Find in input" },
        { keys: ["Ctrl", "Shift", "S"], label: "Sort keys" },
        { keys: ["Ctrl", "Shift", "K"], label: "Clear all" },
        { keys: ["Ctrl", "D"], label: "Download" },
        { keys: ["Ctrl", "K"], label: "Command palette" },
      ]);
    });

    it("generates correct Base64 shortcuts legend on macOS and non-macOS", () => {
      const getBase64Shortcuts = (isMac: boolean) => {
        const modKey = getModifierKey(isMac);
        const shiftKey = getShiftKey(isMac);
        return [
          { keys: [modKey, "Enter"], label: "Encode/Decode" },
          { keys: [modKey, shiftKey, "S"], label: "Swap direction" },
          { keys: [modKey, shiftKey, "K"], label: "Clear" },
          { keys: [modKey, "K"], label: "Command palette" },
        ];
      };

      const macShortcuts = getBase64Shortcuts(true);
      expect(macShortcuts).toEqual([
        { keys: ["⌘", "Enter"], label: "Encode/Decode" },
        { keys: ["⌘", "⇧", "S"], label: "Swap direction" },
        { keys: ["⌘", "⇧", "K"], label: "Clear" },
        { keys: ["⌘", "K"], label: "Command palette" },
      ]);

      const nonMacShortcuts = getBase64Shortcuts(false);
      expect(nonMacShortcuts).toEqual([
        { keys: ["Ctrl", "Enter"], label: "Encode/Decode" },
        { keys: ["Ctrl", "Shift", "S"], label: "Swap direction" },
        { keys: ["Ctrl", "Shift", "K"], label: "Clear" },
        { keys: ["Ctrl", "K"], label: "Command palette" },
      ]);
    });

    it("formats Base64 Swap direction tooltip dynamically", () => {
      expect(`Swap direction (${formatModShiftKey("S", true)})`).toBe("Swap direction (⌘⇧S)");
      expect(`Swap direction (${formatModShiftKey("S", false)})`).toBe("Swap direction (Ctrl+Shift+S)");
    });
  });

  describe("Server/Client consistency and hydration safety", () => {
    it("returns consistent default state initially (isMac: false, modKey: Ctrl, shiftKey: Shift)", () => {
      // In server or initial hydration state, isMac is false
      expect(getModifierKey(false)).toBe("Ctrl");
      expect(getShiftKey(false)).toBe("Shift");
      expect(formatModKey("K", false)).toBe("Ctrl+K");
      expect(formatModShiftKey("K", false)).toBe("Ctrl+Shift+K");
    });
  });
});
