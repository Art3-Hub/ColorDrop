/**
 * Platform Detection Utility
 * Detects if app is running in browser, Farcaster Mini App, or Base Mini App
 */

export type Platform = 'browser' | 'farcaster' | 'base';

/**
 * Detect current platform using Farcaster SDK context
 * This is called after SDK initialization to get accurate platform info
 */
export async function detectPlatformAsync(): Promise<{
  platform: Platform;
  isInMiniApp: boolean;
  hasFarcasterUser: boolean;
  fid?: number;
}> {
  if (typeof window === 'undefined') {
    return { platform: 'browser', isInMiniApp: false, hasFarcasterUser: false };
  }

  try {
    const { sdk } = await import('@farcaster/miniapp-sdk');
    const isInMiniApp = await sdk.isInMiniApp();
    const context = await sdk.context;

    if (!isInMiniApp) {
      return { platform: 'browser', isInMiniApp: false, hasFarcasterUser: false };
    }

    const clientPlatform = context?.client?.platform;
    const hasFarcasterUser = !!(context?.user?.fid && context.user.fid > 0);
    const fid = context?.user?.fid;

    // Platform detection logic:
    // 1. If we have a Farcaster user (fid > 0), it's definitely Farcaster
    // 2. If platform is explicitly 'base', it's Base
    // 3. If in iframe with no platform and no Farcaster user, assume Base
    if (hasFarcasterUser || (clientPlatform !== 'base' && clientPlatform !== undefined)) {
      return { platform: 'farcaster', isInMiniApp: true, hasFarcasterUser, fid };
    }

    if (clientPlatform === 'base' || (!hasFarcasterUser && !clientPlatform && window.top !== window.self)) {
      return { platform: 'base', isInMiniApp: true, hasFarcasterUser: false };
    }

    return { platform: 'browser', isInMiniApp: false, hasFarcasterUser: false };
  } catch (error) {
    console.warn('[Platform] Failed to detect platform:', error);
    return { platform: 'browser', isInMiniApp: false, hasFarcasterUser: false };
  }
}

/**
 * Synchronous platform detection (basic, for initial render)
 * Use detectPlatformAsync() for accurate detection after SDK loads
 */
export function detectPlatform(): Platform {
  if (typeof window === 'undefined') {
    return 'browser'; // SSR default
  }

  // Check if running in iframe (could be Farcaster or Base)
  const isInIframe = window.parent !== window || window.top !== window.self;

  // Check for Farcaster-specific navigator properties
  const hasFarcasterSDK = typeof (window as unknown as { ethereum?: { isFarcaster?: boolean } }).ethereum !== 'undefined' &&
    (window as unknown as { ethereum?: { isFarcaster?: boolean } }).ethereum?.isFarcaster === true;

  // Check URL parameters (Farcaster often adds fc-* params)
  const urlParams = new URLSearchParams(window.location.search);
  const hasFarcasterParams = urlParams.has('fc-context') || urlParams.has('fc-user');

  if (hasFarcasterSDK || hasFarcasterParams) {
    return 'farcaster';
  }

  // If in iframe but no Farcaster indicators, could be Base
  if (isInIframe) {
    return 'farcaster'; // Default to farcaster for iframes, AutoConnect will refine
  }

  return 'browser';
}

/**
 * Check if currently in any Mini App (Farcaster or Base)
 */
export function isInMiniApp(): boolean {
  const platform = detectPlatform();
  return platform === 'farcaster' || platform === 'base';
}

/**
 * Check if currently in Farcaster Mini App
 */
export function isFarcaster(): boolean {
  return detectPlatform() === 'farcaster';
}

/**
 * Check if currently in Base Mini App
 */
export function isBase(): boolean {
  return detectPlatform() === 'base';
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
    isBase: platform === 'base',
    isBrowser: platform === 'browser',
    isMiniApp: platform === 'farcaster' || platform === 'base',
    features: {
      farcasterAuth: platform === 'farcaster',
      baseAuth: platform === 'base',
      walletConnect: platform === 'browser',
      nativeSharing: platform === 'farcaster' || platform === 'base',
      notifications: platform === 'farcaster',
    },
  };
}
