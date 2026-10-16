export interface RgbaColor {
  r: number; // 0 - 255
  g: number; // 0 - 255
  b: number; // 0 - 255
  a: number; // 0 - 1
}

export interface HslColor {
  h: number; // 0 - 360
  s: number; // 0 - 100
  l: number; // 0 - 100
  a: number; // 0 - 1
}

export type ParseColorResult =
  | { ok: true; value: RgbaColor }
  | { ok: false; error: string };

export interface WcagRatingResult {
  normalText: {
    aa: boolean;
    aaa: boolean;
  };
  largeText: {
    aa: boolean;
    aaa: boolean;
  };
  normalAA: boolean;
  normalAAA: boolean;
  largeAA: boolean;
  largeAAA: boolean;
  aa: boolean;
  aaa: boolean;
}

const NAMED_COLORS: Record<string, string> = {
  black: "#000000",
  silver: "#c0c0c0",
  gray: "#808080",
  grey: "#808080",
  white: "#ffffff",
  maroon: "#800000",
  red: "#ff0000",
  purple: "#800080",
  fuchsia: "#ff00ff",
  green: "#008000",
  lime: "#00ff00",
  olive: "#808000",
  yellow: "#ffff00",
  navy: "#000080",
  blue: "#0000ff",
  teal: "#008080",
  aqua: "#00ffff",
  orange: "#ffa500",
  aliceblue: "#f0f8ff",
  antiquewhite: "#faebd7",
  aquamarine: "#7fffd4",
  azure: "#f0ffff",
  beige: "#f5f5dc",
  bisque: "#ffe4c4",
  blanchedalmond: "#ffebcd",
  blueviolet: "#8a2be2",
  brown: "#a52a2a",
  burlywood: "#deb887",
  cadetblue: "#5f9ea0",
  chartreuse: "#7fff00",
  chocolate: "#d2691e",
  coral: "#ff7f50",
  cornflowerblue: "#6495ed",
  cornsilk: "#fff8dc",
  crimson: "#dc143c",
  cyan: "#00ffff",
  darkblue: "#00008b",
  darkcyan: "#008b8b",
  darkgoldenrod: "#b8860b",
  darkgray: "#a9a9a9",
  darkgrey: "#a9a9a9",
  darkgreen: "#006400",
  darkkhaki: "#bdb76b",
  darkmagenta: "#8b008b",
  darkolivegreen: "#556b2f",
  darkorange: "#ff8c00",
  darkorchid: "#9932cc",
  darkred: "#8b0000",
  darksalmon: "#e9967a",
  darkseagreen: "#8fbc8f",
  darkslateblue: "#483d8b",
  darkslategray: "#2f4f4f",
  darkslategrey: "#2f4f4f",
  darkturquoise: "#00ced1",
  darkviolet: "#9400d3",
  deeppink: "#ff1493",
  deepskyblue: "#00bfff",
  dimgray: "#696969",
  dimgrey: "#696969",
  dodgerblue: "#1e90ff",
  firebrick: "#b22222",
  floralwhite: "#fffaf0",
  forestgreen: "#228b22",
  gainsboro: "#dcdcdc",
  ghostwhite: "#f8f8ff",
  gold: "#ffd700",
  goldenrod: "#daa520",
  greenyellow: "#adff2f",
  honeydew: "#f0fff0",
  hotpink: "#ff69b4",
  indianred: "#cd5c5c",
  indigo: "#4b0082",
  ivory: "#fffff0",
  khaki: "#f0e68c",
  lavender: "#e6e6fa",
  lavenderblush: "#fff0f5",
  lawngreen: "#7cfc00",
  lemonchiffon: "#fffacd",
  lightblue: "#add8e6",
  lightcoral: "#f08080",
  lightcyan: "#e0ffff",
  lightgoldenrodyellow: "#fafad2",
  lightgray: "#d3d3d3",
  lightgrey: "#d3d3d3",
  lightgreen: "#90ee90",
  lightpink: "#ffb6c1",
  lightsalmon: "#ffa07a",
  lightseagreen: "#20b2aa",
  lightskyblue: "#87cefa",
  lightslategray: "#778899",
  lightslategrey: "#778899",
  lightsteelblue: "#b0c4de",
  lightyellow: "#ffffe0",
  limegreen: "#32cd32",
  linen: "#faf0e6",
  magenta: "#ff00ff",
  mediumaquamarine: "#66cdaa",
  mediumblue: "#0000cd",
  mediumorchid: "#ba55d3",
  mediumpurple: "#9370db",
  mediumseagreen: "#3cb371",
  mediumslateblue: "#7b68ee",
  mediumspringgreen: "#00fa9a",
  mediumturquoise: "#48d1cc",
  mediumvioletred: "#c71585",
  midnightblue: "#191970",
  mintcream: "#f5fffa",
  mistyrose: "#ffe4e1",
  moccasin: "#ffe4b5",
  navajowhite: "#ffdead",
  oldlace: "#fdf5e6",
  olivedrab: "#6b8e23",
  orangered: "#ff4500",
  orchid: "#da70d6",
  palegoldenrod: "#eee8aa",
  palegreen: "#98fb98",
  paleturquoise: "#afeeee",
  palevioletred: "#db7093",
  papayawhip: "#ffefd5",
  peachpuff: "#ffdab9",
  peru: "#cd853f",
  pink: "#ffc0cb",
  plum: "#dda0dd",
  powderblue: "#b0e0e6",
  rosybrown: "#bc8f8f",
  royalblue: "#4169e1",
  saddlebrown: "#8b4513",
  salmon: "#fa8072",
  sandybrown: "#f4a460",
  seagreen: "#2e8b57",
  seashell: "#fff5ee",
  sienna: "#a0522d",
  skyblue: "#87ceeb",
  slateblue: "#6a5acd",
  slategray: "#708090",
  slategrey: "#708090",
  snow: "#fffafa",
  springgreen: "#00ff7f",
  steelblue: "#4682b4",
  tan: "#d2b48c",
  thistle: "#d8bfd8",
  tomato: "#ff6347",
  turquoise: "#40e0d0",
  violet: "#ee82ee",
  wheat: "#f5deb3",
  whitesmoke: "#f5f5f5",
  yellowgreen: "#9acd32",
  rebeccapurple: "#663399",
};

/**
 * Converts an HSL color to RGBA.
 */
export function hslToRgb(hsl: HslColor): RgbaColor {
  const hNorm = ((hsl.h % 360) + 360) % 360;
  const sNorm = Math.max(0, Math.min(100, hsl.s)) / 100;
  const lNorm = Math.max(0, Math.min(100, hsl.l)) / 100;
  const aNorm = Math.max(0, Math.min(1, hsl.a));

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((hNorm / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;

  if (hNorm < 60) {
    rPrime = c;
    gPrime = x;
    bPrime = 0;
  } else if (hNorm < 120) {
    rPrime = x;
    gPrime = c;
    bPrime = 0;
  } else if (hNorm < 180) {
    rPrime = 0;
    gPrime = c;
    bPrime = x;
  } else if (hNorm < 240) {
    rPrime = 0;
    gPrime = x;
    bPrime = c;
  } else if (hNorm < 300) {
    rPrime = x;
    gPrime = 0;
    bPrime = c;
  } else {
    rPrime = c;
    gPrime = 0;
    bPrime = x;
  }

  return {
    r: Math.round((rPrime + m) * 255),
    g: Math.round((gPrime + m) * 255),
    b: Math.round((bPrime + m) * 255),
    a: aNorm,
  };
}

/**
 * Converts an RGBA color to HSL.
 */
export function rgbToHsl(color: RgbaColor): HslColor {
  const rNorm = Math.max(0, Math.min(255, color.r)) / 255;
  const gNorm = Math.max(0, Math.min(255, color.g)) / 255;
  const bNorm = Math.max(0, Math.min(255, color.b)) / 255;
  const aNorm = Math.max(0, Math.min(1, color.a));

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  const l = (max + min) / 2;
  let s = 0;
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
  }

  let h = 0;
  if (delta !== 0) {
    if (max === rNorm) {
      h = 60 * (((gNorm - bNorm) / delta) % 6);
    } else if (max === gNorm) {
      h = 60 * ((bNorm - rNorm) / delta + 2);
    } else {
      h = 60 * ((rNorm - gNorm) / delta + 4);
    }
  }

  if (h < 0) {
    h += 360;
  }

  return {
    h: Math.round(h) % 360,
    s: Math.round(s * 100),
    l: Math.round(l * 100),
    a: aNorm,
  };
}

function parseHex(raw: string): ParseColorResult {
  const hex = raw.slice(1);
  if (!/^[0-9a-fA-F]+$/.test(hex)) {
    return { ok: false, error: "Invalid hexadecimal characters" };
  }

  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    return { ok: true, value: { r, g, b, a: 1 } };
  }

  if (hex.length === 4) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    const a = parseInt(hex[3] + hex[3], 16) / 255;
    return { ok: true, value: { r, g, b, a } };
  }

  if (hex.length === 6) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return { ok: true, value: { r, g, b, a: 1 } };
  }

  if (hex.length === 8) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const a = parseInt(hex.slice(6, 8), 16) / 255;
    return { ok: true, value: { r, g, b, a } };
  }

  return {
    ok: false,
    error: `Invalid HEX length: #${hex} (expected 3, 4, 6, or 8 characters)`,
  };
}

function parseAlphaToken(token: string): number | null {
  const trimmed = token.trim();
  if (trimmed.endsWith("%")) {
    const num = parseFloat(trimmed.slice(0, -1));
    if (isNaN(num)) return null;
    return Math.max(0, Math.min(1, num / 100));
  }
  const num = parseFloat(trimmed);
  if (isNaN(num)) return null;
  return Math.max(0, Math.min(1, num));
}

function parseRgbComponent(token: string): number | null {
  const trimmed = token.trim();
  if (trimmed.endsWith("%")) {
    const num = parseFloat(trimmed.slice(0, -1));
    if (isNaN(num)) return null;
    return Math.max(0, Math.min(255, (num / 100) * 255));
  }
  const num = parseFloat(trimmed);
  if (isNaN(num)) return null;
  return Math.max(0, Math.min(255, num));
}

function parseRgbTokens(content: string): {
  rStr: string;
  gStr: string;
  bStr: string;
  aStr?: string;
} | null {
  const trimmed = content.trim();
  if (trimmed.includes(",")) {
    const rawParts = trimmed.split(",");
    const parts = rawParts.map((s) => s.trim());
    if (parts.some((p) => p === "")) return null;
    if (parts.length === 3) {
      return { rStr: parts[0], gStr: parts[1], bStr: parts[2] };
    }
    if (parts.length === 4) {
      return { rStr: parts[0], gStr: parts[1], bStr: parts[2], aStr: parts[3] };
    }
    return null;
  }

  if (trimmed.includes("/")) {
    const slashParts = trimmed.split("/");
    if (slashParts.length !== 2) return null;
    const colorTokens = slashParts[0].trim().split(/\s+/);
    if (colorTokens.length !== 3 || colorTokens.some((p) => p === "")) return null;
    const aStr = slashParts[1].trim();
    if (!aStr) return null;
    return {
      rStr: colorTokens[0],
      gStr: colorTokens[1],
      bStr: colorTokens[2],
      aStr,
    };
  }

  const tokens = trimmed.split(/\s+/);
  if (tokens.some((p) => p === "")) return null;
  if (tokens.length === 3) {
    return { rStr: tokens[0], gStr: tokens[1], bStr: tokens[2] };
  }
  if (tokens.length === 4) {
    return { rStr: tokens[0], gStr: tokens[1], bStr: tokens[2], aStr: tokens[3] };
  }
  return null;
}

function parseRgb(content: string): ParseColorResult {
  const tokens = parseRgbTokens(content);
  if (!tokens) {
    return { ok: false, error: "Invalid rgb() syntax" };
  }

  const r = parseRgbComponent(tokens.rStr);
  const g = parseRgbComponent(tokens.gStr);
  const b = parseRgbComponent(tokens.bStr);

  if (r === null || g === null || b === null) {
    return { ok: false, error: "Invalid RGB color values" };
  }

  let a = 1;
  if (tokens.aStr !== undefined) {
    const parsedAlpha = parseAlphaToken(tokens.aStr);
    if (parsedAlpha === null) {
      return { ok: false, error: "Invalid alpha channel value" };
    }
    a = parsedAlpha;
  }

  return {
    ok: true,
    value: {
      r: Math.round(r),
      g: Math.round(g),
      b: Math.round(b),
      a,
    },
  };
}

function parseHue(token: string): number | null {
  const lower = token.trim().toLowerCase();
  let h: number;
  if (lower.endsWith("deg")) {
    h = parseFloat(lower.slice(0, -3));
  } else if (lower.endsWith("grad")) {
    h = (parseFloat(lower.slice(0, -4)) * 360) / 400;
  } else if (lower.endsWith("rad")) {
    h = (parseFloat(lower.slice(0, -3)) * 180) / Math.PI;
  } else if (lower.endsWith("turn")) {
    h = parseFloat(lower.slice(0, -4)) * 360;
  } else {
    h = parseFloat(lower);
  }

  if (isNaN(h)) return null;
  return ((h % 360) + 360) % 360;
}

function parseHsl(content: string): ParseColorResult {
  const tokens = parseRgbTokens(content);
  if (!tokens) {
    return { ok: false, error: "Invalid hsl() syntax" };
  }

  const h = parseHue(tokens.rStr);
  if (h === null) {
    return { ok: false, error: "Invalid hue value" };
  }

  const sStr = tokens.gStr.trim();
  const sNum = parseFloat(sStr.endsWith("%") ? sStr.slice(0, -1) : sStr);
  if (isNaN(sNum)) {
    return { ok: false, error: "Invalid saturation value" };
  }
  const s = Math.max(0, Math.min(100, sNum));

  const lStr = tokens.bStr.trim();
  const lNum = parseFloat(lStr.endsWith("%") ? lStr.slice(0, -1) : lStr);
  if (isNaN(lNum)) {
    return { ok: false, error: "Invalid lightness value" };
  }
  const l = Math.max(0, Math.min(100, lNum));

  let a = 1;
  if (tokens.aStr !== undefined) {
    const parsedAlpha = parseAlphaToken(tokens.aStr);
    if (parsedAlpha === null) {
      return { ok: false, error: "Invalid alpha channel value" };
    }
    a = parsedAlpha;
  }

  const rgb = hslToRgb({ h, s, l, a });
  return { ok: true, value: rgb };
}

/**
 * Parses a color string in HEX (#rgb, #rgba, #rrggbb, #rrggbbaa),
 * RGB / RGBA (comma or space syntax), HSL / HSLA (comma or space syntax),
 * or standard named color.
 *
 * Normalizes alpha to [0, 1] and returns { ok: false, error: string } for invalid inputs.
 */
export function parseColor(input: string): ParseColorResult {
  if (!input || typeof input !== "string") {
    return { ok: false, error: "Input is empty or not a string" };
  }

  const str = input.trim();
  if (str === "") {
    return { ok: false, error: "Input is empty" };
  }

  // Hex
  if (str.startsWith("#")) {
    return parseHex(str);
  }

  // RGB / RGBA
  const rgbMatch = str.match(/^rgba?\s*\((.*)\)$/i);
  if (rgbMatch) {
    return parseRgb(rgbMatch[1]);
  }

  // HSL / HSLA
  const hslMatch = str.match(/^hsla?\s*\((.*)\)$/i);
  if (hslMatch) {
    return parseHsl(hslMatch[1]);
  }

  // Named colors
  const lower = str.toLowerCase();
  if (lower === "transparent") {
    return { ok: true, value: { r: 0, g: 0, b: 0, a: 0 } };
  }
  if (NAMED_COLORS[lower]) {
    return parseHex(NAMED_COLORS[lower]);
  }

  return {
    ok: false,
    error: `Unrecognized color format: "${input}". Expected #HEX, rgb(), rgba(), hsl(), hsla(), or named color.`,
  };
}

/**
 * Formats an RGBA color as a lowercase HEX string.
 * Emits 6 digits (#rrggbb) if alpha is 1, or 8 digits (#rrggbbaa) if alpha < 1.
 */
export function toHex(color: RgbaColor, options?: { forceAlpha?: boolean }): string {
  const r = Math.round(Math.max(0, Math.min(255, color.r)))
    .toString(16)
    .padStart(2, "0");
  const g = Math.round(Math.max(0, Math.min(255, color.g)))
    .toString(16)
    .padStart(2, "0");
  const b = Math.round(Math.max(0, Math.min(255, color.b)))
    .toString(16)
    .padStart(2, "0");
  const aNorm = Math.max(0, Math.min(1, color.a));

  if (options?.forceAlpha || aNorm < 1) {
    const a = Math.round(aNorm * 255)
      .toString(16)
      .padStart(2, "0");
    return `#${r}${g}${b}${a}`;
  }
  return `#${r}${g}${b}`;
}

/**
 * Formats an RGBA color as an rgb() or rgba() string.
 */
export function toRgbString(color: RgbaColor): string {
  const r = Math.round(Math.max(0, Math.min(255, color.r)));
  const g = Math.round(Math.max(0, Math.min(255, color.g)));
  const b = Math.round(Math.max(0, Math.min(255, color.b)));
  const aNorm = Math.max(0, Math.min(1, color.a));

  if (aNorm < 1) {
    const aFormatted = parseFloat(aNorm.toFixed(4)).toString();
    return `rgba(${r}, ${g}, ${b}, ${aFormatted})`;
  }
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Formats an RGBA or HSL color as an hsl() or hsla() string.
 */
export function toHslString(color: RgbaColor | HslColor): string {
  const hsl = "h" in color && "s" in color && "l" in color ? color : rgbToHsl(color);
  const h = Math.round(((hsl.h % 360) + 360) % 360);
  const s = Math.round(Math.max(0, Math.min(100, hsl.s)));
  const l = Math.round(Math.max(0, Math.min(100, hsl.l)));
  const aNorm = Math.max(0, Math.min(1, hsl.a));

  if (aNorm < 1) {
    const aFormatted = parseFloat(aNorm.toFixed(4)).toString();
    return `hsla(${h}, ${s}%, ${l}%, ${aFormatted})`;
  }
  return `hsl(${h}, ${s}%, ${l}%)`;
}

/**
 * Calculates the relative luminance of an sRGB color per WCAG 2.1 specs.
 */
export function relativeLuminance(color: RgbaColor): number {
  const rNorm = Math.max(0, Math.min(255, color.r)) / 255;
  const gNorm = Math.max(0, Math.min(255, color.g)) / 255;
  const bNorm = Math.max(0, Math.min(255, color.b)) / 255;

  const R = rNorm <= 0.04045 ? rNorm / 12.92 : Math.pow((rNorm + 0.055) / 1.055, 2.4);
  const G = gNorm <= 0.04045 ? gNorm / 12.92 : Math.pow((gNorm + 0.055) / 1.055, 2.4);
  const B = bNorm <= 0.04045 ? bNorm / 12.92 : Math.pow((bNorm + 0.055) / 1.055, 2.4);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Calculates the WCAG 2.1 contrast ratio between two colors (ranging from 1 to 21).
 * If color1 has an alpha channel < 1, it is blended over color2 before computing luminance.
 */
export function contrastRatio(color1: RgbaColor, color2: RgbaColor): number {
  let fg = color1;
  if (fg.a < 1) {
    const bg = color2.a < 1 ? { r: 255, g: 255, b: 255, a: 1 } : color2;
    fg = {
      r: fg.r * fg.a + bg.r * (1 - fg.a),
      g: fg.g * fg.a + bg.g * (1 - fg.a),
      b: fg.b * fg.a + bg.b * (1 - fg.a),
      a: 1,
    };
  }

  const bg = color2.a < 1 ? {
    r: color2.r * color2.a + 255 * (1 - color2.a),
    g: color2.g * color2.a + 255 * (1 - color2.a),
    b: color2.b * color2.a + 255 * (1 - color2.a),
    a: 1,
  } : color2;

  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Computes WCAG 2.1 AA and AAA compliance ratings for normal and large text.
 */
export function wcagRating(ratio: number): WcagRatingResult;
export function wcagRating(
  ratio: number,
  textSize: "normal" | "large"
): { aa: boolean; aaa: boolean };
export function wcagRating(
  ratio: number,
  textSize?: "normal" | "large"
): WcagRatingResult | { aa: boolean; aaa: boolean } {
  const normalAA = ratio >= 4.5;
  const normalAAA = ratio >= 7;
  const largeAA = ratio >= 3;
  const largeAAA = ratio >= 4.5;

  if (textSize === "large") {
    return { aa: largeAA, aaa: largeAAA };
  }
  if (textSize === "normal") {
    return { aa: normalAA, aaa: normalAAA };
  }

  return {
    normalText: { aa: normalAA, aaa: normalAAA },
    largeText: { aa: largeAA, aaa: largeAAA },
    normalAA,
    normalAAA,
    largeAA,
    largeAAA,
    aa: normalAA,
    aaa: normalAAA,
  };
}
