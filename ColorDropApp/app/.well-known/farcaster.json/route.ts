export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://colordrop.art3hub.xyz"

  return Response.json({
    accountAssociation: {
      // Generate these at https://base.dev/preview?tab=account
      // 1. Connect your wallet (use 0xc2564e41b7f5cb66d2d99466450cfebce9e8228f - deployer wallet)
      // 2. Sign the message for domain: colordrop.art3hub.xyz
      // 3. Copy the header, payload, and signature values here
      header: "PLACEHOLDER_HEADER_GENERATE_AT_BASE_DEV",
      payload: "PLACEHOLDER_PAYLOAD_GENERATE_AT_BASE_DEV",
      signature: "PLACEHOLDER_SIGNATURE_GENERATE_AT_BASE_DEV"
    },
    miniapp: {
      version: "1",
      name: "Color Drop Tournament",
      homeUrl: appUrl,
      iconUrl: `${appUrl}/icon.png`,
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#7c3aed", // Purple brand color
      subtitle: "Match colors, win CELO prizes",
      description:
        "Ultra-fast color matching tournament on Celo. 12 players compete in real-time, top 3 winners split the prize pool. Entry fee: 0.1 CELO. Built on Farcaster.",
      screenshotUrls: [
        `${appUrl}/screenshot1.png`,
        `${appUrl}/screenshot2.png`,
        `${appUrl}/screenshot3.png`
      ],
      primaryCategory: "games",
      tags: ["games", "tournament", "celo", "competition", "prizes"],
      heroImageUrl: `${appUrl}/og-image.png`,
      tagline: "Match colors, win CELO",
      ogTitle: "Color Drop Tournament in CELO",
      ogDescription: "Ultra-fast color matching game. 12 players compete, top 3 win prizes. Entry: 0.1 CELO",
      ogImageUrl: `${appUrl}/og-image.png`,
      noindex: false,
    },
  })
}
