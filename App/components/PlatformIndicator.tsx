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
    <div className="fixed bottom-4 left-4 px-3 py-1 bg-black/80 text-white text-xs rounded-full">
      {config.isFarcaster ? '🟣 Farcaster Mode' : '🌐 Browser Mode'}
    </div>
  );
}
