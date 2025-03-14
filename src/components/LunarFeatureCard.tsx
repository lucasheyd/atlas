'use client';

import React from 'react';
import Link from 'next/link';
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Moon, Layers } from 'lucide-react';
import { useMoonPhase } from "../hooks/useMoonPhase";

export const LunarChroniclesCard = () => {
  const { currentPhase, currentPhaseName, moonPhaseImage } = useMoonPhase();
  
  // Mapeamento de imagens para cada fase da lua
  const phaseImages = {
    "New Moon": "/img/NewMoon.png",
    "Waxing Crescent": "/img/WaxingCrescent.png",
    "First Quarter": "/img/FirstQuarter.png",
    "Waxing Gibbous": "/img/WaxingGibbous.png",
    "Full Moon": "/img/FullMoon.png",
    "Waning Gibbous": "/img/WaningGibbous.png",
    "Last Quarter": "/img/LastQuarter2.png",
    "Waning Crescent": "/img/WaningCrescent.png"
  };
  
  // Seleciona a imagem correta com base na fase atual
  const currentImage = phaseImages[currentPhaseName] || "/img/NewMoon.png";
  
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group flex flex-col h-full">
      <div className="relative h-60 overflow-hidden">
        <Image 
          src={currentImage}
          alt={`Lunar Chronicles - ${currentPhaseName}`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            // Em caso de erro, usar a mesma imagem atual, não uma fixa
            e.currentTarget.src = currentImage;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute top-3 right-3 bg-blue-600/80 text-white text-xs font-medium px-2 py-1 rounded-full">
          {currentPhaseName}
        </div>
        <div className="absolute bottom-4 left-4 text-white">
          <h3 className="text-2xl font-bold">Lunar Chronicles</h3>
          <div className="text-gray-200">Dynamic Moon Phase NFTs</div>
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center">
            <Moon size={16} className="text-blue-500 mr-2" />
            <span className="text-sm text-gray-600 dark:text-gray-300">8 Phases</span>
          </div>
          <div className="flex items-center">
            <Layers size={16} className="text-blue-500 mr-2" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Customizable</span>
          </div>
        </div>
        <div className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">
          NFTs that dynamically transform with the real lunar cycle. Each token reflects 
          the current phase of the moon with customizable imagery.
        </div>
        <div className="flex gap-2">
          <Link href="/lunar-update" className="flex-1">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              Mint Lunar NFT
            </Button>
          </Link>
          <Link 
            href="https://opensea.io/collection/dynamic-lunar-chronicles" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button 
              variant="outline" 
              className="p-2 bg-blue-600 hover:bg-blue-700 border-blue-600 flex items-center justify-center"
            >
              <Image 
                src="/icons/openseatransparent.svg" 
                alt="OpenSea" 
                width={20} 
                height={20} 
              />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LunarChroniclesCard;