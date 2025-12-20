import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://colordrop.art3hub.xyz";
  const appName = "Color Drop Tournament";
  const appDescription = "Test your color perception in this fast-paced 16-player tournament on Celo. Match colors in 10 seconds, compete for CELO prizes. Top 3 players win!";
  const shortDescription = "Match colors, win CELO prizes. 16-player tournament with 10-second gameplay.";

  return {
    // Basic metadata
    title: {
      default: `${appName} - Match Colors, Win CELO`,
      template: `%s | ${appName}`,
    },
    description: appDescription,
    applicationName: appName,

    // Keywords for search engines
    keywords: [
      "color matching game",
      "crypto game",
      "CELO blockchain",
      "Farcaster mini app",
      "color perception",
      "tournament game",
      "web3 gaming",
      "blockchain game",
      "skill-based game",
      "color drop",
      "win crypto",
      "play to earn",
    ],

    // Authors and creator
    authors: [{ name: "Art3Hub", url: "https://art3hub.xyz" }],
    creator: "Art3Hub",
    publisher: "Art3Hub",

    // Robots and indexing
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },

    // Icons - favicon.ico for browser tab, icon.png for app icons
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/icon.png", sizes: "32x32", type: "image/png" },
        { url: "/icon.png", sizes: "192x192", type: "image/png" },
      ],
      apple: [
        { url: "/icon.png", sizes: "180x180", type: "image/png" },
      ],
      shortcut: "/favicon.ico",
    },

    // Manifest for PWA
    manifest: "/manifest.json",

    // Open Graph metadata
    openGraph: {
      type: "website",
      locale: "en_US",
      url: appUrl,
      siteName: appName,
      title: `${appName} - Match Colors, Win CELO`,
      description: shortDescription,
      images: [
        {
          url: `${appUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: `${appName} - Color Matching Tournament on Celo`,
          type: "image/png",
        },
        {
          url: `${appUrl}/logo.png`,
          width: 512,
          height: 512,
          alt: `${appName} Logo`,
          type: "image/png",
        },
      ],
    },

    // Twitter Card metadata
    twitter: {
      card: "summary_large_image",
      site: "@art3hub",
      creator: "@art3hub",
      title: `${appName} - Match Colors, Win CELO`,
      description: shortDescription,
      images: {
        url: `${appUrl}/og-image.png`,
        alt: `${appName} - Color Matching Tournament`,
      },
    },

    // App-specific metadata
    appleWebApp: {
      capable: true,
      title: appName,
      statusBarStyle: "black-translucent",
    },

    // Format detection
    formatDetection: {
      telephone: false,
      email: false,
      address: false,
    },

    // Canonical URL
    alternates: {
      canonical: appUrl,
    },

    // Category
    category: "game",

    // Farcaster Frame metadata
    other: {
      // Farcaster Mini App frame
      "fc:frame": JSON.stringify({
        version: "next",
        imageUrl: `${appUrl}/banner2.png`,
        aspectRatio: "1:1",
        button: {
          title: "Play Color Drop",
          action: {
            type: "launch_frame",
            name: appName,
            url: appUrl,
            splashImageUrl: `${appUrl}/splash.png`,
            splashBackgroundColor: "#F6F3EC",
          },
        },
      }),
      // Mobile web app capable
      "mobile-web-app-capable": "yes",
      // Theme color for browsers
      "theme-color": "#4E632A",
      // MS Application Tile
      "msapplication-TileColor": "#4E632A",
      "msapplication-TileImage": `${appUrl}/icon.png`,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetBrainsMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
