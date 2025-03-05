'use client';

import React from 'react';
import { Container } from "@/components/Container";
import { LunarFeatureCard } from "@/components/LunarFeatureCard";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from 'lucide-react';

export const CollectionsSection = () => {
  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900">
      <Container>
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-3 py-1 mb-6 rounded-full text-sm font-medium bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 dark:from-indigo-900/50 dark:to-purple-900/50 dark:text-indigo-300">
            <Sparkles size={16} className="mr-2" /> 
            NFT Collections
          </div>
          
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Discover Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">NFT Collections</span>
          </h2>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Explore our diverse range of innovative NFT collections, each with unique features and capabilities.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* Lunar Chronicles Card */}
          <LunarFeatureCard />
          
          {/* Fractal Swarm Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group">
            <div className="relative h-48 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20"></div>
              
              {/* Fractal visualization placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-lg transform rotate-45"></div>
                <div className="absolute w-16 h-16 bg-gradient-to-br from-purple-500/40 to-pink-500/40 rounded-lg transform rotate-45"></div>
                <div className="absolute w-8 h-8 bg-gradient-to-br from-purple-500/50 to-pink-500/50 rounded-lg transform rotate-45"></div>
              </div>
              
              <div className="absolute top-4 left-4 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 rounded-full px-3 py-1 text-sm font-medium flex items-center">
                <Sparkles size={14} className="mr-1" />
                Algorithmic Art
              </div>
            </div>
            
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Fractal Swarm NFT
              </h3>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Discover unique generative artworks with over 2 million possible combinations, 
                eternally captured on the Base blockchain.
              </p>
              
              <div className="flex flex-wrap gap-3 mb-6">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                  12 Connection Styles
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300">
                  18 Color Schemes
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                  Interactive
                </span>
              </div>
              
              <Link href="/fractal-swarm" className="inline-block w-full">
                <Button 
                  className="w-full group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300 justify-between"
                  variant="outline"
                >
                  <span>Explore Fractal Swarm</span>
                  <ArrowRight size={16} className="ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Bot Tools Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group">
            <div className="relative h-48 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20"></div>
              
              {/* Bot visualization */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-20 rounded-lg border-2 border-blue-500/30 flex items-center justify-center">
                  <div className="font-mono text-blue-600 dark:text-blue-400 text-xs">{">"} mint.execute()</div>
                </div>
              </div>
              
              <div className="absolute top-4 left-4 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full px-3 py-1 text-sm font-medium flex items-center">
                <svg className="mr-1 h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M8 12h8M16 8v8" />
                </svg>
                Trading Tools
              </div>
            </div>
            
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                NFT Minting Bot
              </h3>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Revolutionize your NFT minting strategy with our cutting-edge automated bot. 
                Maximize efficiency and minimize gas costs.
              </p>
              
              <div className="flex flex-wrap gap-3 mb-6">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  Multi-chain
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  Advanced Security
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  Gas Optimization
                </span>
              </div>
              
              <Link href="/bot" className="inline-block w-full">
                <Button 
                  className="w-full group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 justify-between"
                  variant="outline"
                >
                  <span>Launch Minting Bot</span>
                  <ArrowRight size={16} className="ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <Link href="/collections">
            <Button variant="outline" size="lg" className="px-8 font-medium">
              View All Collections
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </Link>
        </div>
      </Container>
    </section>
  );
};

export default CollectionsSection;