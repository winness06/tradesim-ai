// app/layout.tsx
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/context/ThemeContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChartChamp — AI Trading Simulator | Learn to Trade Risk-Free",
  description: "Practice trading with AI-generated charts and instant AI coaching. Build real trading skills risk-free. Track your rank from Rookie to Master.",
  keywords: ["trading simulator", "AI trading coach", "learn to trade", "trading practice", "paper trading", "chart analysis", "technical analysis"],
  robots: { index: true, follow: true },
  openGraph: {
    title: "ChartChamp — AI Trading Simulator",
    description: "Practice trading with AI-generated charts and instant AI coaching. Build real skills risk-free.",
    url: "https://chartchamp.com.au",
    siteName: "ChartChamp",
    type: "website",
    images: [{ url: "https://chartchamp.com.au/og-image.png", width: 1200, height: 630, alt: "ChartChamp Trading Simulator" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ChartChamp — AI Trading Simulator",
    description: "Practice trading with AI coaching. Build real skills risk-free.",
    images: ["https://chartchamp.com.au/og-image.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
        >
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}