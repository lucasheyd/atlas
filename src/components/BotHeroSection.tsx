'use client';

import React from 'react';
import Link from 'next/link';
import { Container } from "@/components/Container";
import { Button } from "@/components/ui/button";
import { Rocket, Zap, Shield } from 'lucide-react';

export const BotHeroSection = () => {
  const handleDocumentation = () => {
    if (typeof window !== 'undefined') {
      window.open('https://github.com/your-project', '_blank');
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-indigo-900/20 dark:via-black dark:to-blue-900/20 py-16">
      <Container>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-6">
            Fractal Swarm NFT Minting Bot
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Revolutionize your NFT minting strategy with our cutting-edge automated bot. Maximize efficiency, minimize complexity, and take control of your blockchain investments.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white dark:bg-gray-800/50 p-6 rounded-xl shadow-md hover:shadow-lg transition-all">
              <Rocket className="mx-auto mb-4 text-indigo-600 dark:text-indigo-400" size={48} />
              <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">
                Lightning-Fast Minting
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Execute multiple transactions simultaneously with our parallel processing technology.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800/50 p-6 rounded-xl shadow-md hover:shadow-lg transition-all">
              <Zap className="mx-auto mb-4 text-green-600 dark:text-green-400" size={48} />
              <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">
                Flexible Configuration
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Customize every aspect of your minting strategy with granular network and gas settings.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800/50 p-6 rounded-xl shadow-md hover:shadow-lg transition-all">
              <Shield className="mx-auto mb-4 text-blue-600 dark:text-blue-400" size={48} />
              <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">
                Advanced Security
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Robust error handling, nonce management, and transaction monitoring.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href="/bot" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Rocket className="mr-2" size={20} />
                Launch Minting Bot
              </Button>
            </Link>
          </div>
          
          <div className="mt-12 max-w-2xl mx-auto">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Disclaimer: Bot usage requires technical understanding. Always verify contract details, 
              manage gas fees carefully, and start with small transactions to understand the mechanics.
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
};