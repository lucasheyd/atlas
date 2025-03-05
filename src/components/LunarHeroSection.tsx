'use client';

import React from 'react';
import Link from 'next/link';
import { Container } from "@/components/Container";
import { Button } from "@/components/ui/button";
import { Moon, Stars, RefreshCw, Calendar, Upload, ImageIcon } from 'lucide-react';
import { useMoonPhase } from "../../hooks/useMoonPhase";

export const LunarHeroSection = () => {
const { currentPhaseName } = useMoonPhase();
  return (
    <div className="relative py-20 overflow-hidden bg-gradient-to-b from-indigo-50/30 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      {/* Background elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-br from-blue-200/30 to-indigo-400/30 blur-3xl dark:from-blue-900/20 dark:to-indigo-900/20"></div>
        <div className="absolute top-1/2 -left-24 w-80 h-80 rounded-full bg-gradient-to-br from-purple-200/30 to-indigo-300/30 blur-3xl dark:from-purple-900/20 dark:to-indigo-900/20"></div>
      </div>
      
      <Container className="relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div>
            <div className="inline-flex items-center px-3 py-1 mb-6 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">
              <Moon size={16} className="mr-2" /> 
              Dynamic NFT Collection
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Lunar Chronicles</span> NFT
            </h2>
            
            <div className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              Experience the magic of the moon cycle with our dynamic NFT collection. 
              Each Lunar Chronicles NFT transforms in real-time to reflect the current 
              phase of the moon, creating a living digital artwork.
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="flex items-start">
                <div className="mr-4 flex-shrink-0 mt-1">
                  <Moon size={20} className="text-indigo-500" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">8 Moon Phases</h4>
                  <div className="text-gray-600 dark:text-gray-400 text-sm">
                    Watches the moon cycle and updates automatically
                  </div>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mr-4 flex-shrink-0 mt-1">
                  <ImageIcon size={20} className="text-indigo-500" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">Customizable</h4>
                  <div className="text-gray-600 dark:text-gray-400 text-sm">
                    Set unique images for each moon phase
                  </div>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mr-4 flex-shrink-0 mt-1">
                  <Calendar size={20} className="text-indigo-500" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">Special Events</h4>
                  <div className="text-gray-600 dark:text-gray-400 text-sm">
                    Limited edition appearances during lunar events
                  </div>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mr-4 flex-shrink-0 mt-1">
                  <RefreshCw size={20} className="text-indigo-500" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">Dynamic Content</h4>
                  <div className="text-gray-600 dark:text-gray-400 text-sm">
                    Truly dynamic NFTs changing with time
                  </div>
                </div>
              </div>
            </div>
            
            <Link href="/lunar-chronicles" className="inline-block">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium px-8 py-6 text-lg rounded-xl"
              >
                <Moon className="mr-2" size={20} />
                Mint Your Lunar NFT
              </Button>
            </Link>
          </div>
          
          {/* Right content - Moon phases showcase */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 rounded-3xl"></div>
            <div className="bg-white dark:bg-gray-800/40 rounded-3xl shadow-xl p-6 border border-gray-100 dark:border-gray-700/30">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Dynamic Moon Phases
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                  Your NFT transforms with the real moon cycle
                </p>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                {/* Moon phase examples */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                  <div className="w-full aspect-square bg-gray-100 dark:bg-gray-700 rounded-full mb-2 flex items-center justify-center overflow-hidden">
                    <div className="w-16 h-16 bg-gray-800 dark:bg-gray-900 rounded-full"></div>
                  </div>
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300">New Moon</div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                  <div className="w-full aspect-square bg-gray-100 dark:bg-gray-700 rounded-full mb-2 flex items-center justify-center overflow-hidden">
                    <div className="w-16 h-16 bg-gray-800 dark:bg-gray-900 rounded-full relative right-2"></div>
                  </div>
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Waxing Crescent</div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                  <div className="w-full aspect-square bg-gray-100 dark:bg-gray-700 rounded-full mb-2 flex items-center justify-center overflow-hidden">
                    <div className="w-16 h-16 bg-gray-800 dark:bg-gray-900 rounded-full relative right-4"></div>
                  </div>
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300">First Quarter</div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                  <div className="w-full aspect-square bg-gray-100 dark:bg-gray-700 rounded-full mb-2 flex items-center justify-center overflow-hidden">
                    <div className="w-16 h-16 bg-gray-800 dark:bg-gray-900 rounded-full relative right-6"></div>
                  </div>
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Waxing Gibbous</div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                  <div className="w-full aspect-square bg-gray-100 dark:bg-gray-700 rounded-full mb-2 flex items-center justify-center overflow-hidden">
                    <div className="w-16 h-16 bg-white dark:bg-gray-100 rounded-full"></div>
                  </div>
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Full Moon</div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                  <div className="w-full aspect-square bg-gray-100 dark:bg-gray-700 rounded-full mb-2 flex items-center justify-center overflow-hidden">
                    <div className="w-16 h-16 bg-gray-800 dark:bg-gray-900 rounded-full relative left-6"></div>
                  </div>
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Waning Gibbous</div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                  <div className="w-full aspect-square bg-gray-100 dark:bg-gray-700 rounded-full mb-2 flex items-center justify-center overflow-hidden">
                    <div className="w-16 h-16 bg-gray-800 dark:bg-gray-900 rounded-full relative left-4"></div>
                  </div>
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Last Quarter</div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                  <div className="w-full aspect-square bg-gray-100 dark:bg-gray-700 rounded-full mb-2 flex items-center justify-center overflow-hidden">
                    <div className="w-16 h-16 bg-gray-800 dark:bg-gray-900 rounded-full relative left-2"></div>
                  </div>
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Waning Crescent</div>
                </div>
              </div>
              
              <div className="mt-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 flex items-center">
                <div className="mr-4 p-2 bg-indigo-100 dark:bg-indigo-800/50 rounded-full text-indigo-600 dark:text-indigo-300">
                  <Upload size={18} />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">Fully Customizable</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">
                    Upload your own artwork for each moon phase
                  </p>
                </div>
              </div>
            </div>
            
            {/* Current phase indicator */}
             <div className="absolute -top-4 right-8 bg-white dark:bg-gray-800 shadow-lg rounded-full px-4 py-2 flex items-center border border-indigo-100 dark:border-indigo-900">
           <Stars size={16} className="text-indigo-500 mr-2" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">Current Phase: {currentPhaseName}</span>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default LunarHeroSection;