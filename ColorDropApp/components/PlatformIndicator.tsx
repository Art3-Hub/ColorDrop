'use client';

import { useFarcaster } from '@/contexts/FarcasterContext';

export function PlatformIndicator() {
  const { isInMiniApp, loading } = useFarcaster();

  // Don't show anything while loading to avoid flash
  if (loading) return null;

  return (
    <div className="fixed top-[60px] left-4 px-3 py-1.5 bg-black/80 text-white text-xs rounded-full backdrop-blur-sm shadow-lg z-40">
      {isInMiniApp ? '🟣 Farcaster Mode' : '🌐 Browser Mode'}
    </div>
  );
}
