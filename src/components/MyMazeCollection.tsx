'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getUserMazeNFTs } from '@/utils/mazeContract';
import { switchToNetwork, getCurrentNetwork } from '@/utils/networkSwitcher';
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import Image from 'next/image';
import { Gamepad2, Loader2, ExternalLink, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

export const MyMazeCollection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nfts, setNfts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [networkWarning, setNetworkWarning] = useState<string | null>(null);

  // Check connection and load NFTs when connected
  useEffect(() => {
    const checkConnectionAndLoadNFTs = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setIsConnected(true);
            fetchUserNFTs();
          } else {
            setIsConnected(false);
          }
        } catch (err) {
          console.error("Error checking connection:", err);
        }
      }
    };

    checkConnectionAndLoadNFTs();
    
    // Listen for account or network changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        setIsConnected(accounts.length > 0);
        if (accounts.length > 0) {
          fetchUserNFTs();
        } else {
          setNfts([]);
        }
      });
      
      window.ethereum.on('chainChanged', () => {
        fetchUserNFTs();
      });
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);
  
  // Function to fetch user's NFTs
  const fetchUserNFTs = async () => {
    setLoading(true);
    setError(null);
    setNetworkWarning(null);
    
    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        
        // Check if we're on a Base network
        const network = await getCurrentNetwork();
        if (network !== 'base' && network !== 'baseSepolia') {
          setNetworkWarning(`You're currently on a non-Base network. For the best experience, please switch to Base or Base Sepolia.`);
        }
        
        try {
          const userNFTs = await getUserMazeNFTs(provider);
          setNfts(userNFTs);
        } catch (fetchError: any) {
          console.error("Error fetching NFTs:", fetchError);
          // If we can't fetch NFTs but we're connected, suggest switching networks
          if (network !== 'base' && network !== 'baseSepolia') {
            setError(`Unable to load your NFTs. Try switching to Base Sepolia network.`);
          } else {
            setError(fetchError.message || "Failed to load your NFTs");
          }
        }
      }
    } catch (err: any) {
      console.error("Error setting up provider:", err);
      setError(err.message || "Failed to connect to wallet");
    } finally {
      setLoading(false);
    }
  };
  
  // Connect wallet function
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        setIsConnected(accounts.length > 0);
        if (accounts.length > 0) {
          fetchUserNFTs();
        }
      } catch (err) {
        console.error("Error connecting wallet:", err);
      }
    } else {
      alert("Please install MetaMask to use this feature");
    }
  };

  // Switch network function
  const handleSwitchNetwork = async () => {
    try {
      const success = await switchToNetwork('baseSepolia');
      if (success) {
        setNetworkWarning(null);
        fetchUserNFTs();
      }
    } catch (error) {
      console.error("Failed to switch network:", error);
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-0">
          Your Maze Puzzle Collection
        </h2>
        
        {isConnected ? (
          <Button 
            variant="outline" 
            onClick={fetchUserNFTs} 
            disabled={loading}
            className="w-full md:w-auto"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Refresh Collection
          </Button>
        ) : (
          <Button 
            onClick={connectWallet} 
            className="w-full md:w-auto bg-teal-600 hover:bg-teal-700 text-white"
          >
            Connect Wallet
          </Button>
        )}
      </div>
      
      {networkWarning && (
        <Alert variant="warning" className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/30">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span>{networkWarning}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSwitchNetwork}
              className="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700 hover:bg-yellow-200 dark:hover:bg-yellow-900/60"
            >
              Switch to Base Sepolia
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {error && (
        <div className="p-4 mb-6 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg border border-red-200 dark:border-red-800/30">
          {error}
        </div>
      )}
      
      {isConnected ? (
        loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            <span className="ml-2">Loading your NFTs...</span>
          </div>
        ) : (
          nfts.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {nfts.map((nft) => (
                <div 
                  key={nft.id} 
                  className="bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <div className="relative aspect-square w-full overflow-hidden">
                    {nft.image ? (
                      <Image 
                        src={nft.image} 
                        alt={nft.name || `Maze NFT #${nft.id}`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                        <span className="text-gray-500 dark:text-gray-400">No image</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {nft.name || `Maze NFT #${nft.id}`}
                    </h3>
                    
                    {nft.gameData ? (
                      <div className="mb-4 text-sm">
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Current Level:</span>
                          <span className="font-medium">
                            {nft.gameData.currentLevel === 1 && 'Easy (1/3)'}
                            {nft.gameData.currentLevel === 2 && 'Medium (2/3)'}
                            {nft.gameData.currentLevel === 3 && 'Hard (3/3)'}
                            {nft.gameData.currentLevel > 3 && `Completed!`}
                          </span>
                        </div>
                        
                        {nft.gameData.bestTimes[0] !== null && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Best Time (Lvl 1):</span>
                            <span className="font-medium">{nft.gameData.bestTimes[0]}s</span>
                          </div>
                        )}
                      </div>
                    ) : null}
                    
                    <div className="flex flex-col space-y-2">
                      <Link href={`/view/maze/${nft.id}`}>
                        <Button variant="outline" className="w-full">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                      </Link>
                      
                      {nft.animationUrl && (
                        <Link href={nft.animationUrl} target="_blank" rel="noopener noreferrer">
                          <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                            <Gamepad2 className="mr-2 h-4 w-4" />
                            Play Game
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="text-gray-500 dark:text-gray-400 mb-4">
                You don't have any Maze Puzzle NFTs yet
              </div>
              <Button 
                className="bg-teal-600 hover:bg-teal-700 text-white"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                Mint Your First Maze
              </Button>
            </div>
          )
        )
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="text-gray-500 dark:text-gray-400 mb-4">
            Connect your wallet to view your Maze Puzzle NFTs
          </div>
          <Button 
            onClick={connectWallet}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            Connect Wallet
          </Button>
        </div>
      )}
    </div>
  );
};

export default MyMazeCollection;