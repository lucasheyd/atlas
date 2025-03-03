"use client";

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Container } from "@/components/Container";
import { mintNFT, getTotalSupply, getMintPrice, isOnBaseNetwork, checkAndSwitchNetwork } from '@/utils/contract';
import Image from 'next/image';
import Link from 'next/link';

export default function MintPage() {
  const [mintAmount, setMintAmount] = useState(1);
  const [mintLoading, setMintLoading] = useState(false);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [supplyInfo, setSupplyInfo] = useState({
    minted: 0,
    total: 10000
  });
  const [mintPrice, setMintPrice] = useState('0');
  const [walletConnected, setWalletConnected] = useState(false);
  const [onCorrectNetwork, setOnCorrectNetwork] = useState(false);
  const [networkSwitching, setNetworkSwitching] = useState(false);
  const [mintStatus, setMintStatus] = useState<{
    success: boolean;
    message: string;
    txHash?: string;
  } | null>(null);

  // Initialize provider and check wallet connection
  useEffect(() => {
    const initializeWeb3 = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          // Check if already connected
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setWalletConnected(true);
            
            const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
            setProvider(web3Provider);
            
            // Check if on correct network
            const onBase = await isOnBaseNetwork(web3Provider);
            setOnCorrectNetwork(onBase);
            
            if (onBase) {
              fetchContractData(web3Provider);
            }
          }
          
          // Set up event listeners
          window.ethereum.on('accountsChanged', (newAccounts: string[]) => {
            setWalletConnected(newAccounts.length > 0);
            if (newAccounts.length === 0) {
              setOnCorrectNetwork(false);
            } else {
              checkNetworkAndFetchData();
            }
          });
          
          window.ethereum.on('chainChanged', () => {
            // Reload the page on chain change
            window.location.reload();
          });
          
        } catch (error) {
          console.error('Error initializing Web3:', error);
        }
      }
    };
    
    initializeWeb3();
    
    // Cleanup function
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
        window.ethereum.removeListener('chainChanged', () => {});
      }
    };
  }, []);
  
  // Fetch contract data
  const fetchContractData = async (web3Provider: ethers.providers.Web3Provider) => {
    try {
      const supply = await getTotalSupply(web3Provider);
      const price = await getMintPrice(web3Provider);
      
      setSupplyInfo(supply);
      setMintPrice(price);
    } catch (error) {
      console.error('Error fetching supply or price:', error);
    }
  };
  
  // Check network and fetch data
  const checkNetworkAndFetchData = async () => {
    if (!provider) return;
    
    try {
      const onBase = await isOnBaseNetwork(provider);
      setOnCorrectNetwork(onBase);
      
      if (onBase) {
        fetchContractData(provider);
      }
    } catch (error) {
      console.error('Error checking network:', error);
    }
  };

  // Connect wallet
  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('Please install MetaMask to mint NFTs!');
      return;
    }
    
    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWalletConnected(true);
      
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(web3Provider);
      
      // Check network after connection
      checkNetworkAndFetchData();
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };
  
  // Switch to Base network
  const switchToBaseNetwork = async () => {
    if (!provider) return;
    
    setNetworkSwitching(true);
    try {
      const success = await checkAndSwitchNetwork(provider);
      if (success) {
        setOnCorrectNetwork(true);
        fetchContractData(provider);
      }
    } catch (error) {
      console.error('Error switching network:', error);
    } finally {
      setNetworkSwitching(false);
    }
  };

  // Mint NFTs
  const handleMint = async () => {
    if (!provider || !onCorrectNetwork) return;

    setMintLoading(true);
    setMintStatus(null);
    
    try {
      const txHash = await mintNFT(provider, mintAmount);
      
      // Refresh supply after minting
      const updatedSupply = await getTotalSupply(provider);
      setSupplyInfo(updatedSupply);
      
      setMintStatus({
        success: true,
        message: `Successfully minted ${mintAmount} NFT(s)!`,
        txHash
      });
      
    } catch (error: any) {
      console.error('Minting error:', error);
      
      let errorMessage = 'Error minting NFT(s). Please try again.';
      
      if (error.code === 'INSUFFICIENT_FUNDS') {
        errorMessage = 'Insufficient funds to complete the transaction.';
      } else if (error.message) {
        errorMessage = error.message.includes('user rejected') 
          ? 'Transaction was rejected.'
          : `Error: ${error.message}`;
      }
      
      setMintStatus({
        success: false,
        message: errorMessage
      });
      
    } finally {
      setMintLoading(false);
    }
  };

  // Calculate total cost
  const totalCost = (parseFloat(mintPrice) * mintAmount).toFixed(5);
  
  // Calculate progress percentage
  const progressPercentage = (supplyInfo.minted / supplyInfo.total) * 100;
  const isSoldOut = supplyInfo.minted >= supplyInfo.total;

  return (
    <Container>
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gray-800 dark:text-white">
            Mint Fractal Swarm NFT
          </h1>
          <div className="text-xl text-gray-600 dark:text-gray-300">
            Each Fractal Swarm NFT features a unique algorithmic particle simulation with over 2 million possible combinations.
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-100 dark:bg-gray-800/50 backdrop-blur-md rounded-2xl p-8 shadow-xl order-2 md:order-1">
            {/* Mint Status */}
            {mintStatus && (
              <div className={`mb-6 p-4 rounded-lg ${
                mintStatus.success 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
                  : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
              }`}>
                <p className="mb-2">{mintStatus.message}</p>
                {mintStatus.success && mintStatus.txHash && (
                  <a 
                    href={`https://basescan.org/tx/${mintStatus.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="text-blue-600 dark:text-blue-400 underline text-sm"
                  >
                    View transaction on BaseScan
                  </a>
                )}
              </div>
            )}
            
            {/* Supply Info */}
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-800 dark:text-white font-medium">Collection Progress</span>
                <span className="text-gray-800 dark:text-white font-medium">
                  {supplyInfo.minted} / {supplyInfo.total}
                </span>
              </div>
              <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              {isSoldOut && (
                <p className="mt-2 text-red-600 dark:text-red-400 font-medium">
                  Sold Out!
                </p>
              )}
            </div>
            
            {!walletConnected ? (
              <div className="text-center">
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  Connect your wallet to mint your Fractal Swarm NFT
                </p>
                <button 
                  onClick={connectWallet}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-8 rounded-lg transition-colors w-full"
                >
                  Connect Wallet
                </button>
              </div>
            ) : !onCorrectNetwork ? (
              <div className="text-center">
                <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-lg">
                  Please switch to Base network to mint
                </div>
                <button 
                  onClick={switchToBaseNetwork}
                  disabled={networkSwitching}
                  className={`bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-8 rounded-lg transition-colors w-full ${
                    networkSwitching ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {networkSwitching ? 'Switching...' : 'Switch to Base Network'}
                </button>
              </div>
            ) : (
              <>
                {/* Mint Controls */}
                <div className="mb-6">
                  <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                    Select Amount to Mint
                  </label>
                  <div className="flex items-center justify-center mb-4">
                    <div className="flex items-center shadow-md rounded-lg overflow-hidden">
                      <button 
                        onClick={() => setMintAmount(Math.max(1, mintAmount - 1))}
                        className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 text-xl font-bold"
                      >
                        -
                      </button>
                      <input 
                        type="number" 
                        value={mintAmount}
                        onChange={(e) => setMintAmount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                        className="w-16 text-center bg-white dark:bg-gray-700 text-gray-800 dark:text-white py-2 border-0"
                        min="1"
                        max="10"
                      />
                      <button 
                        onClick={() => setMintAmount(Math.min(10, mintAmount + 1))}
                        className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 text-xl font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Price Information */}
                <div className="flex justify-between mb-6 p-4 bg-gray-200 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-gray-800 dark:text-white">
                    <span className="block text-sm">Price per NFT</span>
                    <span className="font-bold">{mintPrice} ETH</span>
                  </div>
                  <div className="text-right text-gray-800 dark:text-white">
                    <span className="block text-sm">Total</span>
                    <span className="font-bold">{totalCost} ETH</span>
                  </div>
                </div>
                
                <button 
                  onClick={handleMint} 
                  disabled={mintLoading || isSoldOut}
                  className={`w-full py-3 px-6 rounded-lg flex items-center justify-center font-bold text-white transition-all ${
                    isSoldOut 
                      ? 'bg-gray-500 cursor-not-allowed' 
                      : mintLoading 
                        ? 'bg-indigo-700 cursor-wait' 
                        : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg'
                  }`}
                >
                  {mintLoading && (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isSoldOut 
                    ? 'Sold Out' 
                    : mintLoading 
                      ? 'Processing...' 
                      : `Mint ${mintAmount} NFT${mintAmount > 1 ? 's' : ''}`}
                </button>
                
                <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                  Already have NFTs? <Link href="/gallery" className="text-indigo-600 dark:text-indigo-400 hover:underline">View your collection</Link>
                </div>
              </>
            )}
          </div>
          
          <div className="order-1 md:order-2">
            <div className="bg-gradient-to-br from-indigo-50/70 to-purple-50/70 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-2xl shadow-xl">
              <div className="relative aspect-square w-full rounded-xl overflow-hidden shadow-lg mb-6 transform hover:scale-[1.02] transition-all duration-300">
                <Image 
                  src="/fractal.png"
                  alt="Fractal Swarm NFT"
                  fill
                  className="object-cover"
                />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Fractal Swarm NFT Features:</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-indigo-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">Unique particle-based algorithm with over 2 million combinations</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-indigo-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">12 connection styles, 18 color schemes, 8 density levels</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-indigo-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">Interactive animations that respond to user interaction</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-indigo-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">On-chain metadata for true decentralization</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Additional Information */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-white dark:bg-gray-800/50 p-6 rounded-xl shadow">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">How It Works</h3>
            <div className="text-gray-600 dark:text-gray-300">
              Each Fractal Swarm NFT features a unique algorithmic particle simulation with traits stored on-chain. Your NFT comes with an interactive experience that responds to user input.
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800/50 p-6 rounded-xl shadow">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">View Your Collection</h3>
            <div className="text-gray-600 dark:text-gray-300 mb-4">
              After minting, visit our gallery to view and interact with your unique Fractal Swarm NFTs.
            </div>
            <Link href="/gallery">
              <button className="text-indigo-600 dark:text-indigo-400 hover:underline">
                Visit Gallery →
              </button>
            </Link>
          </div>
          
          <div className="bg-white dark:bg-gray-800/50 p-6 rounded-xl shadow">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Try The Generator</h3>
            <div className="text-gray-600 dark:text-gray-300 mb-4">
              Create your own unique fractal tree with our interactive generator. Customize and mint as an NFT.
            </div>
            <Link href="/fractal-generator">
              <button className="text-indigo-600 dark:text-indigo-400 hover:underline">
                Try Generator →
              </button>
            </Link>
          </div>
        </div>
      </div>
    </Container>
  );
}