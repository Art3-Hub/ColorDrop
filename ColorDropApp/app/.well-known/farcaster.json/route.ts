export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://colordrop.art3hub.xyz"

  return Response.json({
    accountAssociation: {
      // Generate these at https://base.dev/preview?tab=account
      // 1. Connect your wallet (use 0xc2564e41b7f5cb66d2d99466450cfebce9e8228f - deployer wallet)
      // 2. Sign the message for domain: colordrop.art3hub.xyz
      // 3. Copy the header, payload, and signature values here
      header: "eyJmaWQiOjIxMDY3MSwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDIxNDA3YjkzZTcyQ2Q5RkUxMkI0ZmMyZmM0NzRDNjE0ZUZkYmFERmMifQ",
      payload: "eyJkb21haW4iOiJjb2xvcmRyb3AuYXJ0M2h1Yi54eXoifQ",
      signature: "6TazEOgXkW+IcFTV50ZUF4JZufxJ17BXsQOJR+cTpoVog3/m8ta00eB6JaQkUyKQW5LYlJZgIR9HiELV/bfBDRs="
    },
    miniapp: {
      version: "1",
      name: "Color Drop Tournament",
      homeUrl: appUrl,
      iconUrl: `${appUrl}/logo.png`,
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#7c3aed", // Purple brand color
      subtitle: "Match colors, win CELO prizes",
      description:
        "Ultra-fast color matching tournament on Celo. 16 players compete in real-time, top 3 winners split the prize pool (3.5, 2.5, 1.25 CELO). Entry fee: 0.5 CELO. Built on Farcaster.",
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
      ogDescription: "Ultra-fast color matching game. 16 players compete, top 3 win prizes (3.5, 2.5, 1.25 CELO). Entry: 0.5 CELO",
      ogImageUrl: `${appUrl}/og-image.png`,
      noindex: false,
    },
  })
}
