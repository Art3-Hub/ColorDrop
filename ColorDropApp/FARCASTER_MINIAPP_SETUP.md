# Farcaster Mini App Setup Guide

## Current Status
✅ Farcaster Mini App configuration created
✅ Metadata and frame configuration added to layout
✅ Reown AppKit integration for wallet connections
✅ Placeholder images created

## Required: Generate Account Association

To enable your Mini App in Farcaster, you must generate an account association:

### Steps:

1. **Visit Base Developer Portal**
   - Go to: https://base.dev/preview?tab=account

2. **Connect Your Deployer Wallet**
   - Use wallet: `0xc2564e41b7f5cb66d2d99466450cfebce9e8228f`
   - This is your ColorDrop contract deployer wallet

3. **Sign the Message**
   - Enter your domain: `colordrop.art3hub.xyz`
   - Sign the message with your wallet

4. **Copy the Values**
   You'll receive three values:
   - `header` - Base64 encoded header
   - `payload` - Base64 encoded payload
   - `signature` - Cryptographic signature

5. **Update the Route Handler**
   - File: `app/.well-known/farcaster.json/route.ts`
   - Replace the placeholder values at lines 9-11:

   ```typescript
   accountAssociation: {
     header: "YOUR_ACTUAL_HEADER_FROM_BASE_DEV",
     payload: "YOUR_ACTUAL_PAYLOAD_FROM_BASE_DEV",
     signature: "YOUR_ACTUAL_SIGNATURE_FROM_BASE_DEV"
   },
   ```

## Environment Variables

Make sure these are set in your `.env`:

```bash
NEXT_PUBLIC_APP_URL=https://colordrop.art3hub.xyz  # Production URL (also used for local dev)
NEXT_PUBLIC_APP_URL="Color Drop Tournament"
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=0f36d6452f568ad5e1f5b479361e95de
```

## Testing the Mini App

### 1. Local Testing
```bash
npm run dev
```

Visit: http://localhost:3000/.well-known/farcaster.json

You should see the full Mini App manifest with `miniapp` and `accountAssociation` fields.

### 2. Test in Farcaster (Development)

Once deployed to a public URL:

1. **Share your URL in Farcaster**
   - Create a cast with your app URL
   - Farcaster will detect the Mini App metadata

2. **Expected Behavior**
   - App opens as a Mini App (not browser)
   - Wallet automatically connects via Farcaster's injected provider
   - User sees their Farcaster profile
   - Can interact with smart contracts using their Farcaster wallet

### 3. Verify Mini App Manifest

Check these endpoints work:
- `https://your-domain.com/.well-known/farcaster.json` - Mini App manifest
- `https://your-domain.com/icon.png` - App icon
- `https://your-domain.com/splash.png` - Splash screen

## Image Requirements

The following images are required (currently using placeholder Logo.png):

1. **icon.png** (512x512px recommended)
   - App icon shown in Farcaster directory

2. **splash.png** (1200x630px recommended)
   - Shown while Mini App loads
   - Should match splashBackgroundColor: #7c3aed (purple)

3. **og-image.png** (1200x630px)
   - Open Graph preview image
   - Used in social shares

4. **screenshot1.png, screenshot2.png, screenshot3.png** (750x1334px recommended)
   - App screenshots for Farcaster directory listing

## Deployment Checklist

Before deploying to production:

- [ ] Generate account association at base.dev
- [ ] Update route.ts with real account association values
- [ ] Update `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Replace placeholder images with proper app images
- [ ] Test `/.well-known/farcaster.json` endpoint is accessible
- [ ] Deploy to production (Vercel/Netlify/etc)
- [ ] Verify Mini App opens in Farcaster mobile app
- [ ] Test wallet connection works in Farcaster
- [ ] Test game functionality end-to-end

## Troubleshooting

### Mini App doesn't open in Farcaster
- Verify `/.well-known/farcaster.json` is accessible
- Check account association is generated correctly
- Ensure domain matches the one signed in account association

### Wallet doesn't connect
- Check Reown Project ID is correct
- Verify network configuration (Celo Sepolia/Mainnet)
- Check browser console for errors

### Images don't load
- Verify all image paths in farcaster.json route
- Ensure images are in `/public` directory
- Check image file names match exactly (case-sensitive)

## Resources

- Farcaster Mini App Docs: https://docs.farcaster.xyz/developers/frames/mini-apps
- Base Developer Portal: https://base.dev/preview
- Reown AppKit Docs: https://docs.reown.com/appkit/next/core/installation
- Celo Documentation: https://docs.celo.org/

## Current Configuration

**Mini App Route**: `app/.well-known/farcaster.json/route.ts`
**Metadata**: `app/layout.tsx` (generateMetadata function)
**Wallet Config**: `lib/wagmi.ts` (Reown AppKit + WagmiAdapter)
**Providers**: `app/providers.tsx` (createAppKit initialization)

Status: ⚠️ **Action Required** - Generate account association to activate Mini App
