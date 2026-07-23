import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { SwRegister } from "@/components/sw-register";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "ThriveDeck",
  description: "Your metabolic health, in one place.",
  applicationName: "ThriveDeck",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ThriveDeck",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  // og:image / twitter:image are wired automatically from the
  // opengraph-image.png / twitter-image.png files in this directory.
  openGraph: {
    type: "website",
    siteName: "ThriveDeck",
    title: "ThriveDeck — Train. Fuel. Recover. Perform.",
    description: "Your metabolic health, in one place.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ThriveDeck — Train. Fuel. Recover. Perform.",
    description: "Your metabolic health, in one place.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0F14" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <ThemeProvider>{children}</ThemeProvider>
        <SwRegister />
      </body>
    </html>
  );
}
