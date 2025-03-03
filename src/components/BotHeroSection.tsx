'use client';

import React from 'react';
import Link from 'next/link';
import { Container } from "@/components/Container";
import { Button } from "@/components/ui/button";
import { Rocket, Zap, Shield, Code, Layers, BarChart3 } from 'lucide-react';

export const BotHeroSection = () => {
  return (
    <div className="relative py-20 overflow-hidden">
      {/* Background gradient and pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950 z-0"></div>
      <div className="absolute inset-0 bg-grid-pattern opacity-5 z-0"></div>
      
      {/* Animated background shapes */}
      <div className="absolute top-20 right-20 w-64 h-64 bg-indigo-300/20 dark:bg-indigo-700/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-300/20 dark:bg-purple-700/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/3 w-56 h-56 bg-blue-300/20 dark:bg-blue-700/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      
      <Container className="relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            {/* Badge */}
            <div className="inline-flex items-center px-3 py-1 mb-6 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">
              <Rocket size={16} className="mr-2" /> 
              Advanced Trading Tools
            </div>
            
            {/* Heading */}
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Fractal Swarm <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">NFT Minting Bot</span>
            </h2>
            
            {/* Description */}
            <div className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
              Revolutionize your NFT minting strategy with our cutting-edge automated bot. 
              Maximize efficiency, minimize gas costs, and take full control of your blockchain investments.
            </div>
          </div>
          
          {/* Features grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="group bg-white dark:bg-gray-800/50 p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700/30">
              <div className="mb-5 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white dark:group-hover:bg-indigo-600 transition-colors duration-300">
                <Rocket size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                Lightning-Fast Minting
              </h3>
              <div className="text-gray-600 dark:text-gray-300">
                Execute multiple transactions simultaneously with our parallel processing technology for maximum efficiency.
              </div>
            </div>
            
            <div className="group bg-white dark:bg-gray-800/50 p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700/30">
              <div className="mb-5 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 group-hover:bg-green-600 group-hover:text-white dark:group-hover:bg-green-600 transition-colors duration-300">
                <Code size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                Flexible Configuration
              </h3>
              <div className="text-gray-600 dark:text-gray-300">
                Customize every aspect of your minting strategy with granular network and gas optimization settings.
              </div>
            </div>
            
            <div className="group bg-white dark:bg-gray-800/50 p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700/30">
              <div className="mb-5 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white dark:group-hover:bg-blue-600 transition-colors duration-300">
                <Shield size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                Advanced Security
              </h3>
              <div className="text-gray-600 dark:text-gray-300">
                Deploy with confidence using robust error handling, nonce management, and real-time transaction monitoring.
              </div>
            </div>
          </div>
          
          {/* Additional features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="flex items-start">
              <div className="mr-4 flex-shrink-0 mt-1">
                <Layers size={20} className="text-indigo-500" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">Multi-chain Support</h4>
                <div className="text-gray-600 dark:text-gray-400 text-sm">Support for Base, Bera, and other EVM-compatible chains</div>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-4 flex-shrink-0 mt-1">
                <Zap size={20} className="text-indigo-500" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">Gas Optimization</h4>
                <div className="text-gray-600 dark:text-gray-400 text-sm">Advanced algorithms to minimize gas fees and maximize success rates</div>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-4 flex-shrink-0 mt-1">
                <BarChart3 size={20} className="text-indigo-500" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">Analytics Dashboard</h4>
                <div className="text-gray-600 dark:text-gray-400 text-sm">Real-time performance metrics and transaction history</div>
              </div>
            </div>
          </div>
          
          {/* CTA */}
          <div className="text-center">
            <Link href="/bot" className="inline-block">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <Rocket className="mr-2" size={20} />
                Launch Minting Bot
              </Button>
            </Link>
            
            <div className="mt-8 text-sm text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              <div className="italic">
                Disclaimer: Bot usage requires technical understanding. Always verify contract details, 
                manage gas fees carefully, and start with small transactions to understand the mechanics.
              </div>
            </div>
          </div>
        </div>
      </Container>
      
      {/* Add some custom CSS for animations */}
      <style jsx global>{`
        .bg-grid-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};