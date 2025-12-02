'use client';

import { useEffect, useState } from 'react';
import { getPlatformConfig } from '@/lib/platform';

export function PlatformIndicator() {
  const [config, setConfig] = useState<ReturnType<typeof getPlatformConfig> | null>(null);

  useEffect(() => {
    setConfig(getPlatformConfig());
  }, []);

  if (!config) return null;

  return (
    <div className="fixed top-[70px] left-4 px-3 py-1.5 bg-black/80 text-white text-xs rounded-full backdrop-blur-sm shadow-lg z-40">
      {config.isFarcaster ? '🟣 Farcaster Mode' : '🌐 Browser Mode'}
    </div>
  );
}
