"use client";

import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Web3ProviderWrapper } from "@/components/Web3Provider";

const inter = Inter({ subsets: ["latin"] });

// Disable error overlay during development
if (process.env.NODE_ENV !== 'production') {
  const consoleError = console.error;
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('React.Fragment')) {
      return;
    }
    consoleError(...args);
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Web3ProviderWrapper>
          <ThemeProvider attribute="class">
            <Navbar />
            <div>{children}</div>
            <Footer />
          </ThemeProvider>
        </Web3ProviderWrapper>
      </body>
    </html>
  );
}