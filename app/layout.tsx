import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "TransitOps — Smart Transport Operations Platform",
  description:
    "A centralized platform to manage the complete lifecycle of transport operations — vehicle registry, driver management, dispatching, maintenance, fuel logging, and analytics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-[#0a0a0f] text-gray-100`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

