// Atualizações para MyMazeCollection.tsx

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getUserMazeNFTs, getDemoMazeNFTs, NETWORK_CONFIG, ACTIVE_NETWORK } from '@/utils/mazeContract';
import { switchToNetwork, getCurrentNetwork } from '@/utils/networkSwitcher';
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import Image from 'next/image';
import { Gamepad2, Loader2, ExternalLink, AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

export const MyMazeCollection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nfts, setNfts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [networkWarning, setNetworkWarning] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

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
          setDemoMode(false); // Exit demo mode when wallet connects
        } else {
          setNfts([]);
        }
      });
      
      window.ethereum.on('chainChanged', () => {
        if (isConnected) {
          fetchUserNFTs();
        }
      });
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, [isConnected]);
  
  // Function to fetch user's NFTs with better error handling
  const fetchUserNFTs = async () => {

  // Suprimir temporariamente erros de console durante esta função
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  console.error = () => {};
  console.warn = () => {};

  if (demoMode) {
    setDemoMode(false); // Exit demo mode when fetching real NFTs
  }
  
  setLoading(true);
  setError(null);
  setNetworkWarning(null);
  
  try {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      
      // Check if we're on the correct network
      const network = await getCurrentNetwork();
      const targetNetwork = ACTIVE_NETWORK === 'mainnet' ? 'base' : 'baseSepolia';
      
      if (network !== targetNetwork) {
        setNetworkWarning(`You're currently on the ${network || 'unknown'} network. Please switch to ${NETWORK_CONFIG[ACTIVE_NETWORK].name} for the best experience.`);
      }
      
      try {
        const result = await getUserMazeNFTs(provider);
        
        if (result.networkError) {
          setNetworkWarning(result.message || "Please switch to the correct network.");
          setNfts([]);
        } else if (result.contractError) {
          setError(result.message || "Unable to load your NFTs.");
          setNfts([]);
        } else if (result.error) {
          setError(result.message || "Error loading NFTs.");
          setNfts([]);
        } else {
          setNfts(result.tokens || []);
          
          // Se não tem NFTs, sugerir modo demo
          if (result.tokens.length === 0) {
            setError("You don't have any Maze Puzzle NFTs in this wallet. Would you like to see demo NFTs instead?");
          }
        }
      } catch (fetchError) {
        console.error("Error in fetch process:", fetchError);
        setError("Unable to load your NFTs. Would you like to see demo NFTs instead?");
        setNfts([]);
      }
    }
  } catch (err) {
    console.error("Error setting up provider:", err);
    setError("Failed to connect to wallet. Would you like to see demo NFTs instead?");
  } finally {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
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
        // Suggeset demo mode if wallet connection fails
        setError("Could not connect to wallet. Would you like to see demo NFTs instead?");
      }
    } else {
      setError("No Web3 wallet detected. Would you like to see demo NFTs instead?");
    }
  };

  // Switch network function
  const handleSwitchNetwork = async () => {
    try {
      const targetNetwork = ACTIVE_NETWORK === 'mainnet' ? 'base' : 'baseSepolia';
      const success = await switchToNetwork(targetNetwork);
      if (success) {
        setNetworkWarning(null);
        fetchUserNFTs();
      }
    } catch (error) {
      console.error("Failed to switch network:", error);
    }
  };
  
  // Show demo NFTs
  const showDemoNFTs = () => {
    setDemoMode(true);
    setNfts(getDemoMazeNFTs());
    setError(null);
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
        ) : demoMode ? (
          <Button 
            onClick={connectWallet} 
            className="w-full md:w-auto bg-teal-600 hover:bg-teal-700 text-white"
          >
            Connect Wallet for Real NFTs
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
      
      {/* Demo Mode Indicator */}
      {demoMode && (
        <Alert className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="text-blue-800 dark:text-blue-200">You're viewing demo NFTs. These are not real and just for preview.</span>
            {!isConnected && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={connectWallet}
                className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700"
              >
                Connect Wallet
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Network Warning */}
      {networkWarning && !demoMode && (
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
              Switch to {NETWORK_CONFIG[ACTIVE_NETWORK].name}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Error Message */}
      {error && !demoMode && (
        <div className="p-4 mb-6 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg border border-red-200 dark:border-red-800/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>{error}</div>
            {!demoMode && (
              <Button 
                onClick={showDemoNFTs}
                size="sm"
                className="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700"
              >
                View Demo NFTs
              </Button>
            )}
          </div>
        </div>
      )}
      
      {/* NFT Display */}
      {!loading ? (
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
                  
                  {/* Demo Badge */}
                  {nft.demo && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      DEMO
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
                    {!nft.demo ? (
                      <Link href={`/view/maze/${nft.id}`}>
                        <Button variant="outline" className="w-full">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="outline" className="w-full" disabled>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Demo Details
                      </Button>
                    )}
                    
                    {nft.id && (
  <Link href={`/game?tokenId=${nft.id}`}>
    <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white">
      <Gamepad2 className="mr-2 h-4 w-4" />
      Play Game{nft.demo ? " (Demo)" : ""}
    </Button>
  </Link>
)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !isConnected && !demoMode ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              Connect your wallet to view your Maze Puzzle NFTs
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={connectWallet}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                Connect Wallet
              </Button>
              <Button 
                onClick={showDemoNFTs}
                variant="outline"
              >
                View Demo NFTs
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              {isConnected ? "You don't have any Maze Puzzle NFTs yet" : "No NFTs to display"}
            </div>
            {isConnected ? (
              <Button 
                className="bg-teal-600 hover:bg-teal-700 text-white mr-4"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                Mint Your First Maze
              </Button>
            ) : (
              <Button 
                onClick={showDemoNFTs}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                View Demo NFTs
              </Button>
            )}
          </div>
        )
      ) : (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <span className="ml-2">Loading your NFTs...</span>
        </div>
      )}
    </div>
  );
};

export default MyMazeCollection;