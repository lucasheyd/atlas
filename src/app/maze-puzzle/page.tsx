'use client';

import React, { useState, useEffect } from 'react';
import { Container } from "@/components/Container";
import { SectionTitle } from "@/components/SectionTitle";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Layers, PenTool, Sparkles, Gamepad2, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { ethers } from 'ethers';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MyMazeCollection } from "@/components/MyMazeCollection";

const MAZE_CONTRACT_ADDRESS = '0x1C1A06210cC1760335bB5906Ef23eE793465ad8B';

const BASE_CHAIN_ID = '0x2105';

export default function MazePuzzlePage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [account, setAccount] = useState("");
  const [mintPrice, setMintPrice] = useState("0.0");
  const [isMinting, setIsMinting] = useState(false);
  const [mintTxHash, setMintTxHash] = useState("");
  const [error, setError] = useState("");
  
  // Check if wallet is connected
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          // Get connected accounts
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          
          if (accounts.length > 0) {
            setIsConnected(true);
            setAccount(accounts[0]);
            
            // Check if on correct network
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            setIsCorrectNetwork(chainId === BASE_CHAIN_ID);
          }
        } catch (error) {
          console.error("Error checking connection:", error);
        }
      }
    };
    
    checkConnection();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        setIsConnected(accounts.length > 0);
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount("");
        }
      });
      
      window.ethereum.on('chainChanged', (chainId: string) => {
        setIsCorrectNetwork(chainId === BASE_CHAIN_ID);
        window.location.reload();
      });
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  // Connect wallet function
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        setIsConnected(accounts.length > 0);
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        }
        
        // Check network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        setIsCorrectNetwork(chainId === BASE_CHAIN_ID);
        
        if (chainId !== BASE_CHAIN_ID) {
          try {
            // Try to switch to Base Sepolia
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: BASE_CHAIN_ID }]
            });
            setIsCorrectNetwork(true);
          } catch (switchError: any) {
            // If the chain is not added to MetaMask
            if (switchError.code === 4902) {
              try {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: BASE_CHAIN_ID,
                    chainName: 'Base Sepolia',
                    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                    rpcUrls: ['https://mainnet.base.org'],
                    blockExplorerUrls: ['https://basescan.org']
                  }]
                });
                setIsCorrectNetwork(true);
              } catch (addError) {
                console.error("Error adding chain:", addError);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    } else {
      alert("Please install MetaMask to use this feature");
    }
  };
  
  // Function to handle mint price input change
  const handleMintPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMintPrice(e.target.value);
  };

  // Function to handle minting
  const handleMint = async () => {
    setIsMinting(true);
    setError("");
    setMintTxHash("");
    
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error("Please install MetaMask to mint NFTs");
      }
      
      // Connect to provider
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      
      // Basic ABI for mint function
      const contractABI = ['function mint() payable returns (uint256)'];
      const contract = new ethers.Contract(MAZE_CONTRACT_ADDRESS, contractABI, signer);
      
      // Execute mint transaction
      const tx = await contract.mint({ 
        value: ethers.utils.parseEther(mintPrice || "0") 
      });
      
      // Wait for transaction to be mined
      await tx.wait();
      
      // Set transaction hash for success message
      setMintTxHash(tx.hash);
    } catch (err: any) {
      console.error("Mint error:", err);
      setError(err.message || "Failed to mint NFT");
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-teal-50/30 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <Container>
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 max-w-2xl">
              <div className="inline-block px-3 py-1 mb-6 text-sm font-medium text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/30 rounded-full">
                Interactive NFT Game
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white mb-6">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400">
                  Maze Puzzle:
                </span>{" "}
                Navigate the Labyrinth
              </h1>
              <div className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                An on-chain interactive NFT where each token is a playable maze puzzle with 
                unique traits. Navigate through increasingly difficult mazes, track your best times, 
                and compete for the fastest completion.
              </div>

              <div className="mt-8">
                {!isConnected ? (
                  <Button 
                    onClick={connectWallet} 
                    size="lg" 
                    className="w-full md:w-auto bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    Connect Wallet to Mint
                  </Button>
                ) : !isCorrectNetwork ? (
                  <div className="space-y-4">
                    <Alert variant="warning" className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/30">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Please switch to Base network to mint
                      </AlertDescription>
                    </Alert>
                    <Button 
                      onClick={connectWallet} 
                      className="w-full md:w-auto bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      Switch Network
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {mintTxHash && (
                      <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/30">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <AlertDescription>
                          Successfully minted! Transaction: {mintTxHash.slice(0, 6)}...{mintTxHash.slice(-4)}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {error && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          {error}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="flex flex-wrap gap-6 items-end">
                      <div className="space-y-2">
                        <label className="text-sm text-gray-600 dark:text-gray-300">
                          Mint Price (ETH) - Optional
                        </label>
                        <div className="flex items-center">
                          <input 
                            type="number" 
                            value={mintPrice}
                            onChange={handleMintPriceChange}
                            min="0" 
                            step="0.001"
                            className="w-36 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100"
                            placeholder="0.000"
                          />
                          <div className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                            {parseFloat(mintPrice) >= 0.001 ? 
                              "Random traits enabled!" : 
                              "Free mint (default traits)"}
                          </div>
                        </div>
                      </div>

                      <Button 
                        onClick={handleMint}
                        disabled={isMinting}
                        className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white"
                      >
                        {isMinting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Minting...
                          </>
                        ) : (
                          <>
                            <Gamepad2 className="mr-2 h-5 w-5" />
                            Mint Your Maze
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30 rounded-lg">
                      <div className="flex items-start">
                        <div className="mr-3 mt-1 text-yellow-600 dark:text-yellow-400">
                          <Sparkles size={20} />
                        </div>
                        <div className="text-sm text-yellow-800 dark:text-yellow-200">
                          <strong>Mint with at least 0.001 ETH</strong> to receive random traits for your maze! 
                          Free mints receive default traits (circle player/goal, purple trail, green theme).
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1 w-full max-w-lg">
              <div className="relative">
                {/* Decorative elements around the image */}
                <div className="absolute -top-6 -left-6 w-24 h-24 bg-teal-100 dark:bg-teal-900/30 rounded-full blur-xl"></div>
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-emerald-100 dark:bg-emerald-900/30 rounded-full blur-xl"></div>
                
                <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
                  <Image
                    src="/maze-preview.jpg"
                    width={600}
                    height={600}
                    className="w-full h-auto object-cover rounded-2xl transform transition-transform hover:scale-102"
                    alt="Maze Puzzle NFT Preview"
                    priority
                  />
                  
                  {/* Animated overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-teal-600/10 to-emerald-600/10 dark:from-teal-700/20 dark:to-emerald-700/20"></div>
                </div>
                
                {/* Stats */}
                <div className="absolute -bottom-8 -right-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Player/Goal</div>
                    <div className="font-bold text-teal-600 dark:text-teal-400">6 Shapes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Trail Colors</div>
                    <div className="font-bold text-teal-600 dark:text-teal-400">6 Options</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400">UI Themes</div>
                    <div className="font-bold text-teal-600 dark:text-teal-400">6 Styles</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
      
      {/* Your Collection Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800/30">
        <Container>
          <SectionTitle
            preTitle="Your NFTs"
            title="Your Maze Collection"
          >
            <div className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-12">
              View and play your minted Maze Puzzle NFTs. Each maze has unique traits and stores your game progress on-chain.
            </div>
          </SectionTitle>
          
          <MyMazeCollection />
        </Container>
      </section>
      
      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <Container>
          <SectionTitle
            preTitle="Features"
            title="What Makes Maze Puzzle Special?"
          >
            <div className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-12">
              Our NFT combines unique traits, interactive gameplay, and on-chain progress tracking 
              for a truly engaging blockchain experience.
            </div>
          </SectionTitle>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
              <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center text-teal-600 dark:text-teal-400 mb-6">
                <Gamepad2 size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Interactive Gameplay</h3>
              <div className="text-gray-600 dark:text-gray-300">
                Each NFT is a playable maze puzzle where you navigate through increasingly difficult levels, 
                with progress and best times stored on-chain.
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
              <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center text-teal-600 dark:text-teal-400 mb-6">
                <PenTool size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Unique Traits</h3>
              <div className="text-gray-600 dark:text-gray-300">
                Your maze includes unique traits like player shape, goal shape, trail color, and UI theme,
                with premium traits for those who donate at least 0.001 ETH.
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
              <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center text-teal-600 dark:text-teal-400 mb-6">
                <Layers size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">On-Chain Storage</h3>
              <div className="text-gray-600 dark:text-gray-300">
                All game data is stored on the blockchain, including your progress, best completion times, 
                and move counts for each level you complete.
              </div>
            </div>
          </div>
        </Container>
      </section>      
      {/* Gameplay Information */}
      <section className="py-20 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/50 dark:to-emerald-950/50">
        <Container>
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 lg:order-2">
              <div className="relative">
                {/* Game Preview */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-xl p-4">
                  <div className="aspect-square w-full bg-black rounded-lg overflow-hidden">
                    <Image
                      src="/maze-preview3.jpg"
                      width={600}
                      height={600}
                      className="w-full h-auto object-cover"
                      alt="Maze Puzzle Gameplay"
                    />
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Level 2 (Medium)</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Best time: 48s</div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                      <div className="w-4 h-4 rounded-full bg-teal-500"></div>
                      <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    </div>
                  </div>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute -top-6 -left-6 w-24 h-24 bg-teal-100 dark:bg-teal-900/30 rounded-full blur-xl -z-10"></div>
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-emerald-100 dark:bg-emerald-900/30 rounded-full blur-xl -z-10"></div>
              </div>
            </div>
            
            <div className="flex-1 lg:order-1">
              <div className="inline-block px-3 py-1 mb-6 text-sm font-medium text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/30 rounded-full">
                Game Mechanics
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                How to Play Your <span className="text-teal-600 dark:text-teal-400">Maze Puzzle</span>
              </h2>
              <div className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Navigate through procedurally generated mazes that become progressively more challenging.
                Each NFT includes three difficulty levels that unlock as you complete each stage.
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 mr-4 mt-1">
                    1
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Navigate the Maze</h3>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">
                      Use arrow keys or on-screen controls to move your character from the start position 
                      to the goal at the other end of the maze.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 mr-4 mt-1">
                    2
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Complete the Levels</h3>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">
                      Start with Easy mode and progress through Medium and Hard difficulties as you complete each level.
                      Your progress is automatically saved on-chain.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 mr-4 mt-1">
                    3
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Track Your Progress</h3>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">
                      Your best completion times and move counts are tracked for each level. Try to improve your 
                      times and compete for the most efficient solutions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
      
      {/* Traits Showcase */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <Container>
          <SectionTitle
            preTitle="NFT Traits"
            title="Customize Your Maze Experience"
          >
            <div className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-12">
              Mint with at least 0.001 ETH to receive random traits for your maze NFT.
              Each trait combination creates a unique gameplay experience.
            </div>
          </SectionTitle>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden shadow-md">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Player Shapes</h3>
                <div className="grid grid-cols-3 gap-4">
                  {['Circle', 'Star', 'Heart', 'Diamond', 'Triangle', 'Square'].map((shape) => (
                    <div key={shape} className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-sm text-gray-800 dark:text-gray-200">
                      {shape}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden shadow-md">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Goal Shapes</h3>
                <div className="grid grid-cols-3 gap-4">
                  {['Circle', 'Star', 'Heart', 'Diamond', 'Triangle', 'Square'].map((shape) => (
                    <div key={shape} className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-sm text-gray-800 dark:text-gray-200">
                      {shape}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden shadow-md">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Trail Colors</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="aspect-square bg-purple-500 rounded-lg flex items-center justify-center text-xs text-white">Purple</div>
                  <div className="aspect-square bg-pink-500 rounded-lg flex items-center justify-center text-xs text-white">Hot Pink</div>
                  <div className="aspect-square bg-blue-400 rounded-lg flex items-center justify-center text-xs text-white">Sky Blue</div>
                  <div className="aspect-square bg-yellow-400 rounded-lg flex items-center justify-center text-xs text-black">Gold</div>
                  <div className="aspect-square bg-green-500 rounded-lg flex items-center justify-center text-xs text-white">Lime</div>
                  <div className="aspect-square bg-orange-400 rounded-lg flex items-center justify-center text-xs text-white">Coral</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden shadow-md">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">UI Themes</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="aspect-square bg-black rounded-lg p-2 flex items-center justify-center">
                    <div className="w-full h-full border border-green-500 text-green-500 flex items-center justify-center text-xs">Neon Green</div>
                  </div>
                  <div className="aspect-square bg-gray-900 rounded-lg p-2 flex items-center justify-center">
                    <div className="w-full h-full border border-cyan-500 text-cyan-500 flex items-center justify-center text-xs">Cyber Blue</div>
                  </div>
                  <div className="aspect-square bg-gray-900 rounded-lg p-2 flex items-center justify-center">
                    <div className="w-full h-full border border-pink-500 text-pink-500 flex items-center justify-center text-xs">Digital Pink</div>
                  </div>
                  <div className="aspect-square bg-gray-900 rounded-lg p-2 flex items-center justify-center">
                    <div className="w-full h-full border border-orange-500 text-orange-500 flex items-center justify-center text-xs">Retro Orange</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-900 dark:to-emerald-900">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Test Your Maze Navigation Skills?
            </h2>
            <div className="text-xl text-teal-100 mb-8">
              Mint your unique Maze Puzzle NFT today and see if you can conquer all three levels!
            </div>
            <Link href="#" className="inline-block">
              <Button size="lg" className="bg-white hover:bg-gray-100 text-teal-800 font-medium px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all">
                <Gamepad2 className="mr-2 h-5 w-5" />
                Mint Your Maze NFT
              </Button>
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}