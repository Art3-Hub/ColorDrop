/**
 * Platform Detection Utility
 * Detects if app is running in browser or Farcaster Mini App
 */

export type Platform = 'browser' | 'farcaster';

/**
 * Detect current platform
 * Farcaster Mini Apps inject window.parent !== window and specific SDK
 */
export function detectPlatform(): Platform {
  if (typeof window === 'undefined') {
    return 'browser'; // SSR default
  }

  // Check if running in Farcaster iframe
  const isFarcasterFrame = window.parent !== window;

  // Check for Farcaster-specific navigator properties
  const hasFarcasterSDK = typeof (window as any).ethereum !== 'undefined' &&
    (window as any).ethereum?.isFarcaster === true;

  // Check URL parameters (Farcaster often adds fc-* params)
  const urlParams = new URLSearchParams(window.location.search);
  const hasFarcasterParams = urlParams.has('fc-context') || urlParams.has('fc-user');

  if (isFarcasterFrame || hasFarcasterSDK || hasFarcasterParams) {
    return 'farcaster';
  }

  return 'browser';
}

/**
 * Check if currently in Farcaster Mini App
 */
export function isFarcaster(): boolean {
  return detectPlatform() === 'farcaster';
}

/**
 * Check if currently in browser
 */
export function isBrowser(): boolean {
  return detectPlatform() === 'browser';
}

/**
 * Get platform-specific configuration
 */
export function getPlatformConfig() {
  const platform = detectPlatform();

  return {
    platform,
    isFarcaster: platform === 'farcaster',
    isBrowser: platform === 'browser',
    features: {
      farcasterAuth: platform === 'farcaster',
      walletConnect: platform === 'browser',
      nativeSharing: platform === 'farcaster',
      notifications: platform === 'farcaster',
    },
  };
}
