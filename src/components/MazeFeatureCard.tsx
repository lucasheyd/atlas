import React from 'react';
import Image from "next/image";
import Link from "next/link";
import { Gamepad2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

export const MazeFeatureCard = () => {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group flex flex-col h-full">
      <div className="relative h-60 overflow-hidden">
        <Image 
          src="/maze-preview2.jpg" 
          alt="Maze Puzzle Collection"
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-4 left-4 text-white">
          <h3 className="text-2xl font-bold">Maze Puzzle</h3>
          <div className="text-gray-200">Interactive maze game</div>
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center">
            <Gamepad2 size={16} className="text-teal-500 mr-2" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Playable NFT</span>
          </div>
          <div className="flex items-center">
            <Layers size={16} className="text-teal-500 mr-2" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Unique Traits</span>
          </div>
        </div>
        <div className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">
          Navigate through procedurally generated mazes with your unique character, 
          tracking your best times and move counts on the blockchain.
        </div>
        <div className="flex gap-2">
          <Link href="/maze-puzzle" className="flex-1">
            <Button className="w-full bg-teal-600 hover:bg-teal-700">
              Explore Maze Puzzle
            </Button>
          </Link>
          <Link 
            href="https://opensea.io/collection/maze-puzzle" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button 
              variant="outline" 
              className="p-2 bg-teal-600 hover:bg-teal-700 border-teal-600 flex items-center justify-center"
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

export default MazeFeatureCard;