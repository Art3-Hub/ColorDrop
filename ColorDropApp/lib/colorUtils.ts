import type { HSLColor } from '@/components/game/ColorPicker';

/**
 * Convert HSL to RGB
 */
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

/**
 * Convert RGB to LAB color space (for CIEDE2000)
 */
export function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  // Convert RGB to XYZ
  let rNorm = r / 255;
  let gNorm = g / 255;
  let bNorm = b / 255;

  rNorm = rNorm > 0.04045 ? Math.pow((rNorm + 0.055) / 1.055, 2.4) : rNorm / 12.92;
  gNorm = gNorm > 0.04045 ? Math.pow((gNorm + 0.055) / 1.055, 2.4) : gNorm / 12.92;
  bNorm = bNorm > 0.04045 ? Math.pow((bNorm + 0.055) / 1.055, 2.4) : bNorm / 12.92;

  const x = rNorm * 0.4124564 + gNorm * 0.3575761 + bNorm * 0.1804375;
  const y = rNorm * 0.2126729 + gNorm * 0.7151522 + bNorm * 0.0721750;
  const z = rNorm * 0.0193339 + gNorm * 0.1191920 + bNorm * 0.9503041;

  // Convert XYZ to LAB (D65 illuminant)
  const xn = 0.95047;
  const yn = 1.00000;
  const zn = 1.08883;

  let xr = x / xn;
  let yr = y / yn;
  let zr = z / zn;

  xr = xr > 0.008856 ? Math.pow(xr, 1/3) : (7.787 * xr + 16/116);
  yr = yr > 0.008856 ? Math.pow(yr, 1/3) : (7.787 * yr + 16/116);
  zr = zr > 0.008856 ? Math.pow(zr, 1/3) : (7.787 * zr + 16/116);

  const L = (116 * yr) - 16;
  const a = 500 * (xr - yr);
  const b_val = 200 * (yr - zr);

  return [L, a, b_val];
}

/**
 * Simplified CIEDE2000 color difference calculation
 * Returns a value between 0-100 (0 = identical, 100 = maximum difference)
 * This is a simplified version for game purposes
 */
export function calculateColorDifference(color1: HSLColor, color2: HSLColor): number {
  const [r1, g1, b1] = hslToRgb(color1.h, color1.s, color1.l);
  const [r2, g2, b2] = hslToRgb(color2.h, color2.s, color2.l);

  const [L1, a1, b1_lab] = rgbToLab(r1, g1, b1);
  const [L2, a2, b2_lab] = rgbToLab(r2, g2, b2);

  // Simplified Euclidean distance in LAB space
  const deltaL = L1 - L2;
  const deltaA = a1 - a2;
  const deltaB = b1_lab - b2_lab;

  const distance = Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);

  // Normalize to 0-100 range (max LAB distance is ~177)
  return Math.min(100, (distance / 177) * 100);
}

/**
 * Calculate accuracy percentage (0-100%)
 * 100% = perfect match, 0% = worst possible match
 */
export function calculateAccuracy(userColor: HSLColor, targetColor: HSLColor): number {
  const difference = calculateColorDifference(userColor, targetColor);
  return Math.max(0, 100 - difference);
}

/**
 * Get accuracy tier for display
 */
export function getAccuracyTier(accuracy: number): {
  tier: string;
  color: string;
  emoji: string;
} {
  if (accuracy >= 95) return { tier: 'Perfect!', color: 'text-purple-600', emoji: '🌟' };
  if (accuracy >= 90) return { tier: 'Excellent', color: 'text-blue-600', emoji: '💎' };
  if (accuracy >= 80) return { tier: 'Great', color: 'text-green-600', emoji: '✨' };
  if (accuracy >= 70) return { tier: 'Good', color: 'text-yellow-600', emoji: '👍' };
  if (accuracy >= 60) return { tier: 'Okay', color: 'text-orange-600', emoji: '👌' };
  return { tier: 'Try Again', color: 'text-red-600', emoji: '🎯' };
}

/**
 * Generate a random target color
 */
export function generateRandomColor(): HSLColor {
  return {
    h: Math.floor(Math.random() * 361),
    s: Math.floor(Math.random() * 101),
    l: Math.floor(Math.random() * 101),
  };
}
