# Color Drop Tournament - Frontend App

Next.js 15 Farcaster Mini App for Color Drop Tournament on Celo.

## 🎯 Overview

React-based Farcaster Mini App with App Router, Tailwind CSS, Shadcn UI, and Wagmi for Celo blockchain integration.

## 🏗️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn UI
- **Blockchain:** Wagmi + Viem (Celo)
- **Farcaster:** @farcaster/miniapp-sdk
- **State Management:** Zustand
- **Queries:** TanStack React Query

## 🚀 Getting Started

### Prerequisites

- Node.js 22.11.0+
- npm or pnpm
- Farcaster account for testing

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Edit .env.local with your values
```

### Environment Configuration

```env
NEXT_PUBLIC_APP_NAME="Color Drop Tournament"
NEXT_PUBLIC_APP_URL=https://colordrop.app

# Contract addresses (from Contracts deployment)
NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET=0x...
NEXT_PUBLIC_CONTRACT_ADDRESS_ALFAJORES=0x...

# Network RPCs
NEXT_PUBLIC_CELO_RPC_URL=https://forno.celo.org
NEXT_PUBLIC_ALFAJORES_RPC_URL=https://alfajores-forno.celo-testnet.org

NEXT_PUBLIC_ENV=development
```

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## 📦 Project Structure

```
app/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Home page
│   ├── providers.tsx      # Wagmi + React Query providers
│   └── globals.css        # Global styles
├── components/            # React components
│   └── ui/               # Shadcn UI components
├── lib/                   # Utility libraries
│   ├── wagmi.ts          # Wagmi configuration
│   ├── farcaster.ts      # Farcaster SDK helpers
│   └── utils.ts          # Shadcn utils
├── public/
│   └── .well-known/
│       └── farcaster.json # Farcaster Mini App manifest
└── hooks/                # Custom React hooks
```

## 🎨 Farcaster Mini App Setup

### Manifest Configuration

The app includes a Farcaster manifest at `public/.well-known/farcaster.json`:

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
    "imageUrl": "https://colordrop.app/preview.png",
    "buttonTitle": "Play Now (1 CELO)"
  }
}
```

**Important:** Update `accountAssociation` with your domain verification.

### Farcaster SDK Integration

The app uses `@farcaster/miniapp-sdk` for:

- **Authentication:** One-tap sign-in with Farcaster
- **Sharing:** Native cast composer integration
- **Notifications:** Player updates and pool status
- **Navigation:** In-app routing and deep links

Example usage in `lib/farcaster.ts`:

```typescript
import { SDK } from '@farcaster/miniapp-sdk';

export const farcasterSDK = new SDK();

// Authenticate user
const user = await farcasterSDK.actions.signIn();

// Share result
await farcasterSDK.actions.openComposer({
  text: "Just won 10 CELO in Color Drop!",
  embeds: ["https://colordrop.app/pool/123"]
});
```

## 🔗 Wagmi + Celo Integration

### Wallet Configuration

`lib/wagmi.ts` configures Wagmi for Celo networks:

```typescript
import { createConfig, http } from 'wagmi';
import { celo, celoAlfajores } from 'wagmi/chains';
import { miniapp } from '@farcaster/miniapp-sdk/connectors';

export const config = createConfig({
  chains: [celo, celoAlfajores],
  connectors: [miniapp()],
  transports: {
    [celo.id]: http(process.env.NEXT_PUBLIC_CELO_RPC_URL),
    [celoAlfajores.id]: http(process.env.NEXT_PUBLIC_ALFAJORES_RPC_URL),
  },
});
```

### Contract Interaction Example

```typescript
import { useWriteContract } from 'wagmi';

function JoinPool() {
  const { writeContract } = useWriteContract();

  const joinPool = async (fid: number) => {
    await writeContract({
      address: CONTRACT_ADDRESS,
      abi: ColorDropPoolABI,
      functionName: 'joinPool',
      args: [fid],
      value: parseEther('1'), // 1 CELO
    });
  };

  return <button onClick={() => joinPool(12345)}>Join Pool</button>;
}
```

## 🎮 Core Features to Implement

### 1. Pool Lobby
- [ ] Real-time player list (21 max)
- [ ] WebSocket updates for new joins
- [ ] Pool status indicator (12/21)
- [ ] Auto-start when full

### 2. Color Matching Game
- [ ] HSL slider controls
- [ ] 8-second countdown timer
- [ ] Target color display
- [ ] Player color preview
- [ ] Lock-in button

### 3. Results Screen
- [ ] Leaderboard (sorted by accuracy)
- [ ] Prize distribution display
- [ ] Share to Farcaster button
- [ ] Play again CTA

### 4. User Profile
- [ ] Farcaster profile integration
- [ ] Game stats (wins, total pools)
- [ ] Streak tracking
- [ ] Collectible colors (NFTs)

## 🎨 Shadcn Components

Install components as needed:

```bash
# Button
npx shadcn@latest add button

# Card
npx shadcn@latest add card

# Slider (for color controls)
npx shadcn@latest add slider

# Avatar
npx shadcn@latest add avatar

# Badge
npx shadcn@latest add badge
```

## 📱 Mobile Optimization

The app is optimized for Farcaster's mobile modal:

- Vertical layout (max-width: 600px)
- Touch-friendly controls
- Optimized for 8-second gameplay
- Native mobile gestures

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### Environment Variables

Set in Vercel dashboard:
- `NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET`
- `NEXT_PUBLIC_CONTRACT_ADDRESS_ALFAJORES`
- All other `NEXT_PUBLIC_*` vars from `.env.example`

### Custom Domain

1. Add domain in Vercel
2. Update DNS records
3. Update `NEXT_PUBLIC_APP_URL`
4. Regenerate Farcaster manifest with new domain

## 🧪 Testing

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Build test
npm run build
```

## 🔐 Security

- Private keys NEVER exposed to frontend
- All transactions user-initiated
- Contract addresses from env vars only
- No sensitive data in localStorage
- CSP headers for production

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Farcaster Mini Apps](https://docs.farcaster.xyz/developers/mini-apps)
- [Wagmi Documentation](https://wagmi.sh)
- [Shadcn UI](https://ui.shadcn.com)
- [Celo Documentation](https://docs.celo.org)

## 🐛 Troubleshooting

### "Module not found" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### Farcaster SDK issues
Ensure you're testing in a Farcaster client (Warpcast) or use the test environment

### Wagmi connection errors
Check RPC URLs and network configuration in `lib/wagmi.ts`

## 📞 Support

For frontend issues:
- GitHub Issues
- Email: dev@colordrop.app

---

**License:** MIT
