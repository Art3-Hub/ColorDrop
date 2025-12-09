# Dual-Platform Setup Guide

Color Drop Tournament runs on **both Browser and Farcaster Mini App** with automatic platform detection.

---

## 🎯 Platform Detection

The app automatically detects the environment:

- **Browser Mode**: Standard web browser with WalletConnect (Reown)
- **Farcaster Mode**: Inside Farcaster client with native SDK integration

Detection logic in [lib/platform.ts](lib/platform.ts):

```typescript
import { detectPlatform, isFarcaster, isBrowser } from '@/lib/platform';

const platform = detectPlatform(); // 'browser' | 'farcaster'
```

---

## 🌐 Browser Mode (Reown/WalletConnect)

### Features
- WalletConnect v3 (Reown) for mobile wallets
- Injected wallets (MetaMask, Coinbase Wallet, etc.)
- Standard web3 experience

### Setup

1. **Get WalletConnect Project ID**
   ```bash
   # Visit https://cloud.reown.com
   # Create new project
   # Copy Project ID
   ```

2. **Configure Environment**
   ```env
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
   NEXT_PUBLIC_APP_URL=https://colordrop.app
   ```

3. **Connect Wallet**
   ```typescript
   import { ConnectButton } from '@/components/ConnectButton';

   // In browser: Shows "Connect Wallet"
   <ConnectButton />
   ```

### Connectors

**WalletConnect (Primary)**:
- Mobile wallets via QR code
- 300+ wallets supported
- Cross-device pairing

**Injected (Fallback)**:
- MetaMask
- Coinbase Wallet
- Brave Wallet
- Any EIP-1193 provider

---

## 🟣 Farcaster Mode (Mini App SDK)

### Features
- One-tap Farcaster authentication
- No external wallet needed
- Native sharing to casts
- Notifications support
- Profile integration

### Setup

1. **Farcaster Manifest**

   Located at `public/.well-known/farcaster.json`:

   ```json
   {
     "accountAssociation": {
       "header": "...",
       "payload": "...",
       "signature": "..."
     },
     "frame": {
       "name": "Color Drop Tournament",
       "iconUrl": "https://colordrop.app/icon.png",
       "homeUrl": "https://colordrop.app",
       "buttonTitle": "Play Now (1 CELO)"
     }
   }
   ```

2. **Generate Account Association**

   Follow [Farcaster Mini App docs](https://docs.farcaster.xyz/developers/mini-apps) to generate signature.

3. **Test in Farcaster**

   - Open Warpcast app
   - Navigate to your deployed URL
   - App runs in modal with Farcaster SDK

### Authentication Flow

```typescript
import { authenticateUser } from '@/lib/farcaster';

// Only works in Farcaster context
const user = await authenticateUser();
// Returns: { fid, username, displayName, pfpUrl }
```

### Sharing Results

```typescript
import { shareToFarcaster } from '@/lib/farcaster';

await shareToFarcaster(
  "Just won 10 CELO in Color Drop! 🎨",
  ["https://colordrop.app/pool/123"]
);
```

---

## 🔀 Dual-Mode Component Example

```typescript
'use client';

import { ConnectButton } from '@/components/ConnectButton';
import { isFarcaster } from '@/lib/platform';

export function MyComponent() {
  const platformIsFarcaster = isFarcaster();

  return (
    <div>
      {/* Automatic platform handling */}
      <ConnectButton />

      {/* Conditional features */}
      {platformIsFarcaster && (
        <ShareButton text="Check out Color Drop!" />
      )}

      {/* Platform indicator (dev only) */}
      {process.env.NODE_ENV === 'development' && (
        <PlatformIndicator />
      )}
    </div>
  );
}
```

---

## 🛠️ Platform Configuration

Get current platform config:

```typescript
import { getPlatformConfig } from '@/lib/platform';

const config = getPlatformConfig();
/*
{
  platform: 'browser' | 'farcaster',
  isFarcaster: boolean,
  isBrowser: boolean,
  features: {
    farcasterAuth: boolean,
    walletConnect: boolean,
    nativeSharing: boolean,
    notifications: boolean,
  }
}
*/
```

---

## 📱 Testing Both Modes

### Browser Testing

```bash
npm run dev
# Open http://localhost:3000
# Should show "🌐 Browser Mode"
```

### Farcaster Testing

1. **Local Tunnel** (ngrok/localtunnel)
   ```bash
   npm run dev
   npx localtunnel --port 3000
   # Get public URL (e.g., https://abc123.loca.lt)
   ```

2. **Update Manifest**
   ```json
   {
     "frame": {
       "homeUrl": "https://abc123.loca.lt"
     }
   }
   ```

3. **Test in Warpcast**
   - Open Warpcast app
   - Navigate to tunnel URL
   - Should show "🟣 Farcaster Mode"

---

## 🚀 Deployment Checklist

### Browser Mode
- [ ] WalletConnect Project ID configured
- [ ] App URL set correctly
- [ ] Wallet connectors tested
- [ ] Mobile wallets working via QR

### Farcaster Mode
- [ ] Manifest hosted at `/.well-known/farcaster.json`
- [ ] Account association signature valid
- [ ] Domain verified with Farcaster
- [ ] SDK initialization working
- [ ] Authentication flow tested
- [ ] Sharing functionality working

### Both Modes
- [ ] Platform detection working
- [ ] Wagmi config correct for both
- [ ] Contract interactions work
- [ ] Error handling for platform-specific features
- [ ] Analytics tracking both platforms separately

---

## 🐛 Troubleshooting

### "Farcaster SDK not available" in browser
✅ **Expected behavior** - SDK only loads in Farcaster context

### WalletConnect not showing in Farcaster
✅ **Expected behavior** - Farcaster uses injected provider

### Platform detection wrong
Check:
- `window.parent !== window` (iframe detection)
- URL parameters (`fc-context`, `fc-user`)
- Ethereum provider flags

### Manifest not loading
- Verify HTTPS (required for Farcaster)
- Check `/.well-known/farcaster.json` is accessible
- Validate JSON syntax
- Ensure CORS headers allow Farcaster domains

---

## 📚 Resources

- [Reown (WalletConnect) Docs](https://docs.reown.com)
- [Farcaster Mini Apps](https://docs.farcaster.xyz/developers/mini-apps)
- [Wagmi Documentation](https://wagmi.sh)
- [Celo Network Info](https://docs.celo.org)

---

**Next Steps**: Build game components that work seamlessly in both modes! 🎨
