'use client';

import { sdk } from '@farcaster/miniapp-sdk';

export type FarcasterUser = {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
};

// Use SDK types - these match the actual MiniAppContext from the SDK
export type FarcasterClient = {
  clientFid: number;
};

export type FarcasterContext = {
  user: FarcasterUser;
  location?: {
    type: string;
    castId?: string;
  };
  client: FarcasterClient;
};

/**
 * Initialize Farcaster SDK and check if in Mini App environment
 * Also calls sdk.actions.ready() to signal the app is ready
 */
export async function initializeFarcaster(): Promise<boolean> {
  try {
    const isInMiniApp = await sdk.isInMiniApp();

    if (!isInMiniApp) {
      console.log('Not in Farcaster Mini App environment');
      return false;
    }

    // IMPORTANT: Call ready() early to signal to Farcaster that the app is ready
    // This also triggers the wallet connector to become available
    try {
      sdk.actions.ready();
      console.log('✅ Farcaster SDK ready() called - splash screen hidden');
    } catch (readyError) {
      console.warn('⚠️ Failed to call sdk.actions.ready():', readyError);
    }

    console.log('✅ Farcaster SDK initialized');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Farcaster SDK:', error);
    return false;
  }
}

/**
 * Get Farcaster context (user, location, client info)
 * Context is automatically available, no auth needed
 */
export async function getFarcasterContext(): Promise<FarcasterContext | null> {
  try {
    const context = await sdk.context;
    return context as FarcasterContext;
  } catch (error) {
    console.error('Failed to get Farcaster context:', error);
    return null;
  }
}

/**
 * Get current user from context (no auth needed)
 */
export async function getCurrentUser(): Promise<FarcasterUser | null> {
  try {
    const context = await getFarcasterContext();
    if (!context?.user) return null;

    return {
      fid: context.user.fid,
      username: context.user.username,
      displayName: context.user.displayName,
      pfpUrl: context.user.pfpUrl,
    };
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}

/**
 * Verify user is authenticated via context
 * In Farcaster Mini Apps, user is automatically available from context
 */
export async function isUserAuthenticated(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return !!user;
  } catch (error) {
    console.error('Auth check failed:', error);
    return false;
  }
}

/**
 * Open URL in Farcaster
 */
export async function openUrl(url: string) {
  try {
    await sdk.actions.openUrl(url);
  } catch (error) {
    console.error('Failed to open URL:', error);
    throw error;
  }
}

/**
 * Close Mini App
 */
export async function closeMiniApp() {
  try {
    await sdk.actions.close();
  } catch (error) {
    console.error('Failed to close Mini App:', error);
  }
}

/**
 * Check if running on mobile
 * Note: Platform detection not available in context, use user agent instead
 */
export function isMobilePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  return /Mobile|Android|iPhone/i.test(navigator.userAgent);
}

/**
 * Check if haptics are supported
 * Note: Haptics support detection via SDK capabilities when available
 */
export async function hasHaptics(): Promise<boolean> {
  // Placeholder - implement when SDK provides haptics API
  return false;
}

/**
 * Trigger haptic feedback (mobile only)
 */
export async function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'medium') {
  try {
    const supportsHaptics = await hasHaptics();
    if (!supportsHaptics) return;

    // Note: Implement actual haptics API when available
    console.log(`Haptic feedback: ${type}`);
  } catch (error) {
    console.error('Haptic feedback failed:', error);
  }
}
