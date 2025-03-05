'use client';

import React from 'react';
import { Container } from "@/components/Container";
import { Moon, PenTool, Sparkles, Layers } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { useMoonPhase } from "../hooks/useMoonPhase";

export const LunarFeatureSection = () => {
  const { currentPhase, currentPhaseName, moonPhaseImage } = useMoonPhase();
  
  return (
    <section className="py-20 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
      <Container>
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1">
            <div className="inline-block px-3 py-1 mb-6 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Moon size={14} className="inline-block mr-1" /> Dynamic NFT Collection
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              <span className="text-blue-600 dark:text-blue-400">Lunar Chronicles</span> NFT
            </h2>
            <div className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Experience the magic of the moon cycle with our dynamic NFT collection that transforms
              in real-time to reflect the current phase of the moon.
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="flex items-start">
                <div className="mr-3 mt-1 text-blue-500">
                  <Moon size={20} />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">8 Moon Phases</h4>
                  <div className="text-gray-600 dark:text-gray-400">Your NFT updates automatically with the real lunar cycle</div>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mr-3 mt-1 text-blue-500">
                  <PenTool size={20} />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Fully Customizable</h4>
                  <div className="text-gray-600 dark:text-gray-400">Set unique images for each moon phase</div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="flex items-start">
                <div className="mr-3 mt-1 text-blue-500">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Special Events</h4>
                  <div className="text-gray-600 dark:text-gray-400">Limited edition appearances during lunar events</div>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mr-3 mt-1 text-blue-500">
                  <Layers size={20} />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">On-chain Metadata</h4>
                  <div className="text-gray-600 dark:text-gray-400">Securely stored on the Base blockchain</div>
                </div>
              </div>
            </div>
            
            <Link href="/lunar-update">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium px-8 py-6 text-lg rounded-xl">
                Mint Your Lunar NFT
              </Button>
            </Link>
          </div>
          
          <div className="flex-1 relative">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl">
              <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-4">
                Moon Phases Showcase
              </h3>
              
              <div className="grid grid-cols-4 gap-4 mb-6">
                {/* Moon phase images using existing files */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 text-center">
                  <div className="w-full aspect-square rounded-lg overflow-hidden">
                    <Image 
                      src="/img/NewMoon.png" 
                      alt="New Moon" 
                      width={120}
                      height={120}
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="text-xs mt-2 font-medium text-gray-600 dark:text-gray-300">New Moon</div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 text-center">
                  <div className="w-full aspect-square rounded-lg overflow-hidden">
                    <Image 
                      src="/img/FirstQuarter.png" 
                      alt="First Quarter" 
                      width={120}
                      height={120}
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="text-xs mt-2 font-medium text-gray-600 dark:text-gray-300">First Quarter</div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 text-center">
                  <div className="w-full aspect-square rounded-lg overflow-hidden">
                    <Image 
                      src="/img/FullMoon.png" 
                      alt="Full Moon" 
                      width={120}
                      height={120}
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="text-xs mt-2 font-medium text-gray-600 dark:text-gray-300">Full Moon</div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 text-center">
                  <div className="w-full aspect-square rounded-lg overflow-hidden">
                    <Image 
                      src="/img/LastQuarter2.png" 
                      alt="Last Quarter" 
                      width={120}
                      height={120}
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="text-xs mt-2 font-medium text-gray-600 dark:text-gray-300">Last Quarter</div>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="text-center text-gray-800 dark:text-gray-200">
                  <span className="font-medium">Current Moon Phase</span>
                  <div className="flex items-center justify-center mt-2">
                    <Moon className="text-blue-600 dark:text-blue-400 mr-2" size={20} />
                    <span>{currentPhaseName}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-center">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 w-40 h-40">
                  <div className="w-full h-full rounded-lg overflow-hidden flex items-center justify-center">
                    {/* Exibir imagem da fase atual da lua */}
                    <Image 
                      src={moonPhaseImage}
                      alt={currentPhaseName}
                      width={130}
                      height={130}
                      className="w-full h-auto"
                      onError={(e) => {
                        // Fallback para a imagem da New Moon se houver erro
                        e.currentTarget.src = '/img/NewMoon.png';
                      }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Each Lunar Chronicles NFT updates automatically with the current moon phase,
                  creating a living digital collectible.
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-blue-100 dark:bg-blue-900/30 rounded-full blur-xl -z-10"></div>
            <div className="absolute -top-6 -left-6 w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-full blur-xl -z-10"></div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default LunarFeatureSection;