// app/layout.tsx
import type { Metadata } from "next";
import { ClerkProvider, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import ClientWrapper from "@/components/ClientWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TradeSim AI",
  description: "Test your trading skills with AI coaching.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider publishableKey={process.env.pk_live_Y2xlcmsuY2hhcnRjaGFtcC5jb20uYXUk}>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-900 text-white min-h-screen`}
        >
          <header className="bg-gray-800 p-4 flex justify-between items-center border-b border-gray-700">
            <Link href="/" className="text-xl font-bold hover:text-green-400">
              TradeSim AI
            </Link>

            <nav className="space-x-4">
              <Link href="/" className="hover:text-green-400">Home</Link>
              <Link href="/upgrade" className="hover:text-green-400">Upgrade</Link>
              <Link href="/referrals" className="hover:text-green-400">Referrals</Link>
            </nav>

            <div>
              <SignedIn>
                <UserButton />
              </SignedIn>
              <SignedOut>
                <Link href="/sign-in" className="text-blue-500 ml-4">Sign In</Link>
              </SignedOut>
            </div>
          </header>

          <ClientWrapper>{children}</ClientWrapper>
        </body>
      </html>
    </ClerkProvider>
  );
}
