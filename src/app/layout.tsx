"use client";

import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Web3ProviderWrapper } from "@/components/Web3Provider";
import { useEffect } from "react";
import { suppressConsoleErrors, suppressWeb3Errors } from "@/utils/errorSuppress";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

// Apply error suppression
if (typeof window !== 'undefined') {
  suppressConsoleErrors();
  suppressWeb3Errors(); // Adiciona supressão específica para web3
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Add error handling logic
  useEffect(() => {
    // This runs only on the client side
    if (typeof window !== 'undefined') {
      // Suppress web3 errors on component mount
      suppressWeb3Errors();
      
      // Create a more specific error handler for React components
      const handleError = (event: ErrorEvent) => {
        const web3ErrorPatterns = [
          'web3', 'ethereum', 'metamask', 'wallet', 'transaction', 
          'contract', 'blockchain', 'ether', 'rpc', 'provider'
        ];
        
        const isWeb3Error = web3ErrorPatterns.some(pattern => 
          event.error && 
          ((typeof event.error.message === 'string' && 
            event.error.message.toLowerCase().includes(pattern)) ||
           (typeof event.message === 'string' && 
            event.message.toLowerCase().includes(pattern)))
        );
        
        if (isWeb3Error) {
          event.preventDefault();
          console.debug('Web3 error suppressed:', event.error || event.message);
          return false;
        }
        
        return true;
      };
      
      window.addEventListener('error', handleError);
      
      // Cleanup
      return () => {
        window.removeEventListener('error', handleError);
      };
    }
  }, []);

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
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}