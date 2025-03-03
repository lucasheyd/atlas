"use client";

import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Web3ProviderWrapper } from "@/components/Web3Provider";

const inter = Inter({ subsets: ["latin"] });

// Improved error handling
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    // Filter out specific warnings
    const suppressedWarnings = [
      'React.Fragment',
      'A param property was accessed directly',
      'params is now a Promise'
    ];

    const shouldSuppress = suppressedWarnings.some(warning => 
      args.some(arg => 
        typeof arg === 'string' && arg.includes(warning)
      )
    );

    if (!shouldSuppress) {
      originalConsoleError(...args);
    }
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