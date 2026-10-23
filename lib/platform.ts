import { useSyncExternalStore } from "react";

/**
 * Detects whether the current platform is macOS / iOS.
 * Accepts an optional override string (e.g. for testing with custom navigator.platform/userAgent).
 */
export function detectIsMac(platformOverride?: string): boolean {
  if (typeof platformOverride === "string") {
    return /Mac|iPhone|iPad|iPod/i.test(platformOverride);
  }
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const nav = navigator as unknown as { userAgentData?: { platform?: string } };
  const platform =
    nav.userAgentData?.platform || navigator.platform || navigator.userAgent || "";
  return /Mac|iPhone|iPad|iPod/i.test(platform);
}

export function formatModKey(key: string, isMac: boolean): string {
  return isMac ? `⌘${key}` : `Ctrl+${key}`;
}

export function formatModShiftKey(key: string, isMac: boolean): string {
  return isMac ? `⌘⇧${key}` : `Ctrl+Shift+${key}`;
}

export interface PlatformInfo {
  isMac: boolean;
  modKey: "⌘" | "Ctrl";
  shiftKey: "⇧" | "Shift";
}

const emptySubscribe = () => () => {};

/**
 * Shared client-safe platform detection hook.
 *
 * To prevent hydration mismatch warnings, the server snapshot always returns
 * a consistent initial state (isMac: false). After client mount, it evaluates
 * detectIsMac() to switch to macOS shortcuts if running on Apple platforms.
 */
export function usePlatform(): PlatformInfo {
  const isMac = useSyncExternalStore(
    emptySubscribe,
    () => detectIsMac(),
    () => false
  );

  return {
    isMac,
    modKey: isMac ? "⌘" : "Ctrl",
    shiftKey: isMac ? "⇧" : "Shift",
  };
}
