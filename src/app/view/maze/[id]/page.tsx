'use client';

import React, { useState, useEffect } from 'react';
import { Container } from "@/components/Container";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { ethers } from 'ethers';
import { getMazeNFTDetails } from '@/utils/mazeContract';
import { Loader2, Trophy, Award, Gamepad2 } from 'lucide-react';

export default function MazeNFTView({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [nft, setNft] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNFT() {
      try {
        const nftData = await getMazeNFTDetails(parseInt(params.id));
        setNft(nftData);
      } catch (err: any) {
        setError(err.message || 'Failed to load NFT data');
      } finally {
        setLoading(false);
      }
    }

    fetchNFT();
  }, [params.id]);

  // Helper function to format time nicely
  const formatTime = (seconds: number | null) => {
    if (seconds === null) return 'Not completed';
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        <span className="ml-2 text-lg">Loading Maze NFT data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <Link href="/maze-puzzle">
          <Button variant="outline">Back to Maze Collection</Button>
        </Link>
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-gray-600 dark:text-gray-300 mb-4">NFT not found</div>
        <Link href="/maze-puzzle">
          <Button variant="outline">Back to Maze Collection</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="py-12">
      <Container>
        <div className="flex flex-col lg:flex-row gap-12">
          {/* NFT Image */}
          <div className="flex-1">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 shadow-md">
              {nft.image && (
                <div className="relative aspect-square w-full rounded-lg overflow-hidden">
                  <Image 
                    src={nft.image}
                    alt={nft.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* NFT Details */}
          <div className="flex-1">
            <div className="mb-6">
              <div className="inline-block px-3 py-1 text-sm font-medium bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full mb-3">
                Maze Puzzle NFT
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">{nft.name}</h1>
              <div className="text-gray-600 dark:text-gray-300">
                {nft.description}
              </div>
            </div>
            
            {/* Traits */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-3">NFT Traits</h2>
              <div className="grid grid-cols-2 gap-4">
                {nft.traits && (
                  <>
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Player Shape</div>
                      <div className="font-medium">{nft.traits.playerShape}</div>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Goal Shape</div>
                      <div className="font-medium">{nft.traits.goalShape}</div>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Trail Color</div>
                      <div className="font-medium">{nft.traits.trailColor}</div>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                      <div className="text-sm text-gray-500 dark:text-gray-400">UI Theme</div>
                      <div className="font-medium">{nft.traits.uiTheme}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Game Stats */}
            {nft.gameData && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-3">Game Progress</h2>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
                      <span className="font-medium">Current Level:</span>
                    </div>
                    <span className="bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 px-3 py-1 rounded-full font-medium">
                      {nft.gameData.currentLevel === 1 && 'Easy (1/3)'}
                      {nft.gameData.currentLevel === 2 && 'Medium (2/3)'}
                      {nft.gameData.currentLevel === 3 && 'Hard (3/3)'}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Award className="h-4 w-4 text-teal-500 mr-2" />
                        <span>Level 1 (Easy):</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">{formatTime(nft.gameData.bestTimes[0])}</span>
                        {nft.gameData.bestMoves[0] !== null && (
                          <span className="text-gray-500 dark:text-gray-400 ml-2">
                            ({nft.gameData.bestMoves[0]} moves)
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Award className="h-4 w-4 text-teal-500 mr-2" />
                        <span>Level 2 (Medium):</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">{formatTime(nft.gameData.bestTimes[1])}</span>
                        {nft.gameData.bestMoves[1] !== null && (
                          <span className="text-gray-500 dark:text-gray-400 ml-2">
                            ({nft.gameData.bestMoves[1]} moves)
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Award className="h-4 w-4 text-teal-500 mr-2" />
                        <span>Level 3 (Hard):</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">{formatTime(nft.gameData.bestTimes[2])}</span>
                        {nft.gameData.bestMoves[2] !== null && (
                          <span className="text-gray-500 dark:text-gray-400 ml-2">
                            ({nft.gameData.bestMoves[2]} moves)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Play Button */}
            {nft.id && (
  <Link href={`/game?tokenId=${nft.id}`}>
    <Button size="lg" className="w-full bg-teal-600 hover:bg-teal-700">
      <Gamepad2 className="mr-2 h-5 w-5" />
      Play Maze Game
    </Button>
  </Link>
)}
            
            {/* Back Button */}
            <Link href="/maze-puzzle">
              <Button variant="outline" className="w-full">
                Back to Maze Collection
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}