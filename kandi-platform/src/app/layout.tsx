import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Web3Provider } from "@/components/providers/Web3Provider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "KANDI Music Platform",
  description: "Web3 Music NFT Platform with ERC-222 Standard - Fractional ownership of music rights",
  keywords: ["Web3", "Music", "NFT", "ERC-222", "Blockchain", "KANDI"],
  authors: [{ name: "KANDI Music Team" }],
  creator: "KANDI Music Platform",
  publisher: "KANDI Music Platform",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "KANDI Music Platform",
    description: "Revolutionary Web3 music platform enabling fractional ownership of music rights through ERC-222 standard",
    url: "https://kandimusic.com",
    siteName: "KANDI Music Platform",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "KANDI Music Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KANDI Music Platform",
    description: "Revolutionary Web3 music platform enabling fractional ownership of music rights through ERC-222 standard",
    creator: "@KANDIMusic",
    images: ["/og-image.jpg"],
  },
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
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white min-h-screen`}
      >
        <Web3Provider>
          {/* Background gradient */}
          <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 -z-50" />
          
          {/* Animated background pattern */}
          <div className="fixed inset-0 opacity-10 -z-40">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-2000" />
            <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-4000" />
          </div>
          
          {/* Main content */}
          <div className="relative z-10">
            {children}
          </div>
        </Web3Provider>
      </body>
    </html>
  );
}
