import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://colordrop.art3hub.xyz"

  return {
    title: "Color Drop Tournament - Match Colors, Win CELO",
    description: "Ultra-fast color matching tournament on Celo. 12 players compete, top 3 win prizes. Entry fee: 0.1 CELO.",
    icons: {
      icon: "/icon.png",
    },
    openGraph: {
      title: "Color Drop Tournament",
      description: "Match colors, win CELO prizes. 12-player tournament with instant gameplay.",
      images: [`${appUrl}/og-image.png`],
    },
    twitter: {
      card: "summary_large_image",
      title: "Color Drop Tournament",
      description: "Match colors, win CELO prizes",
      images: [`${appUrl}/og-image.png`],
    },
    other: {
      "fc:frame": JSON.stringify({
        version: "next",
        imageUrl: `${appUrl}/og-image.png`,
        aspectRatio: "1:1",
        button: {
          title: "Play Color Drop",
          action: {
            type: "launch_frame",
            name: "Color Drop Tournament",
            url: appUrl,
            splashImageUrl: `${appUrl}/splash.png`,
            splashBackgroundColor: "#7c3aed",
          },
        },
      }),
    },
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
