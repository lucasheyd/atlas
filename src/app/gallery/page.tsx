"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ethers } from 'ethers';
import { Container } from "@/components/Container";
import { getUserNFTs as getFractalNFTs } from '@/utils/contract';
import Image from 'next/image';
import { NETWORKS } from '@/utils/networks';

// Constants
const MURMURATION_CONTRACT_ADDRESS = '0xe16e3753f33a10602177f77fec769d116ff70a69';

// ABI for ERC-721 enumeration (to get user tokens)
const ERC721_ENUMERABLE_ABI = [
  // Standard ERC-721 functions
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function ownerOf(uint256 tokenId) view returns (address)'
];

export default function GalleryPage() {
  const [userTokens, setUserTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [activeCollection, setActiveCollection] = useState<'fractal' | 'bera'>('fractal');
  const [error, setError] = useState<string | null>(null);
  const [currentChainId, setCurrentChainId] = useState<string | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);

  // Check current network
  const checkCurrentNetwork = async () => {
    if (typeof window === 'undefined' || !window.ethereum) return null;
    
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      console.log("Current chainId:", chainId);
      setCurrentChainId(chainId);
      return chainId;
    } catch (error) {
      console.error('Error checking network:', error);
      return null;
    }
  };

  // Check if on correct network
  const isOnCorrectNetwork = (collection: 'fractal' | 'bera'): boolean => {
    if (!currentChainId) return false;
    
    if (collection === 'fractal') {
      return currentChainId.toLowerCase() === NETWORKS.base.chainId.toLowerCase();
    } else {
      return currentChainId.toLowerCase() === NETWORKS.bera.chainId.toLowerCase();
    }
  };

  // Connect wallet
  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('No crypto wallet found. Please install MetaMask.');
      return;
    }

    try {
      setLoading(true);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length > 0) {
        setWalletConnected(true);
        setUserAddress(accounts[0]);
        
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(web3Provider);
        
        // Check current network
        await checkCurrentNetwork();
        
        // Load NFTs for active collection
        await fetchCollectionData(activeCollection);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError('Failed to connect wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Check wallet connection on initial load
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setWalletConnected(true);
            setUserAddress(accounts[0]);
            
            const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
            setProvider(web3Provider);
            
            // Check current network
            await checkCurrentNetwork();
            
            // Initial load of NFTs for active collection
            setTimeout(() => {
              fetchCollectionData(activeCollection);
            }, 500);
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    checkConnection();
  }, []);

  // Set up event listeners for account and network changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = async (accounts: string[]) => {
        setWalletConnected(accounts.length > 0);
        if (accounts.length === 0) {
          setUserTokens([]);
          setUserAddress(null);
        } else {
          setUserAddress(accounts[0]);
          if (provider) {
            await checkCurrentNetwork();
            await fetchCollectionData(activeCollection);
          }
        }
      };

      const handleChainChanged = async (chainId: string) => {
        // Update chainId without reloading the page
        console.log("Chain changed to:", chainId);
        setCurrentChainId(chainId);
        
        if (walletConnected) {
          // Update provider with new network
          const updatedProvider = new ethers.providers.Web3Provider(window.ethereum);
          setProvider(updatedProvider);
          
          // Clear tokens and fetch again
          setUserTokens([]);
          setTimeout(() => {
            fetchCollectionData(activeCollection);
          }, 500);
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [provider, activeCollection, walletConnected]);

  // Handle collection toggle
  const handleCollectionToggle = async (collection: 'fractal' | 'bera') => {
    if (!walletConnected) {
      await connectWallet();
      setActiveCollection(collection);
      return;
    }
    
    setActiveCollection(collection);
    setLoading(true);
    setError(null);
    
    // Fetch the data for this collection
    await fetchCollectionData(collection);
  };

  // Function to fetch Murmuration NFTs owned by the user
  const getMurmurationNFTs = async (provider: ethers.providers.Web3Provider, userAddress: string) => {
    try {
      // Create contract instance
      const contract = new ethers.Contract(
        MURMURATION_CONTRACT_ADDRESS,
        ERC721_ENUMERABLE_ABI,
        provider
      );

      // Get user's balance (number of NFTs owned)
      const balance = await contract.balanceOf(userAddress);
      console.log(`User has ${balance.toString()} Murmuration NFTs`);

      const tokens = [];
      // Iterate through each NFT owned by user
      for (let i = 0; i < balance.toNumber(); i++) {
        try {
          // Get token ID for this index
          const tokenId = await contract.tokenOfOwnerByIndex(userAddress, i);
          
          // Get token URI if possible
          let tokenURI;
          try {
            tokenURI = await contract.tokenURI(tokenId);
          } catch (uriError) {
            console.log(`Could not get URI for token ${tokenId}:`, uriError);
            tokenURI = null;
          }
          
          // Extract metadata if available
          let metadata = null;
          if (tokenURI) {
            try {
              // Handle base64 encoded metadata
              if (tokenURI.startsWith('data:application/json;base64,')) {
                const base64Data = tokenURI.split(',')[1];
                metadata = JSON.parse(atob(base64Data));
              }
              // Handle HTTP URI
              else if (tokenURI.startsWith('http')) {
                const response = await fetch(tokenURI);
                metadata = await response.json();
              }
            } catch (metadataError) {
              console.log(`Error parsing metadata for token ${tokenId}:`, metadataError);
            }
          }
          
          // Add token to the list with available info
          tokens.push({
            id: tokenId.toString(),
            name: metadata?.name || `Murmuration #${tokenId}`,
            image: metadata?.image || "/murmurations.png",
            description: metadata?.description || "A Murmuration NFT"
          });
          
        } catch (tokenError) {
          console.error(`Error fetching token at index ${i}:`, tokenError);
        }
      }

      return tokens;
    } catch (error) {
      console.error("Error in getMurmurationNFTs:", error);
      throw error;
    }
  };

  // Fetch collection data
  const fetchCollectionData = async (collection: 'fractal' | 'bera') => {
    if (!walletConnected || !provider || !userAddress) return;
    
    setLoading(true);
    setError(null);
    
    try {
      if (collection === 'fractal') {
        // For Fractal Swarm, verify network
        const onBase = isOnCorrectNetwork('fractal');
        
        if (!onBase) {
          setError("Please connect to Base network to view your Fractal Swarm NFTs.");
          setLoading(false);
          return;
        }
        
        try {
          const nfts = await getFractalNFTs(provider);
          console.log(`Found ${nfts.length} Fractal NFTs`);
          setUserTokens(nfts);
        } catch (fractalError) {
          console.error("Error fetching Fractal NFTs:", fractalError);
          setError("Failed to fetch Fractal Swarm NFTs. Please try again.");
          setLoading(false);
        }
      } else {
        // For Murmuration, verify network
        const onBera = isOnCorrectNetwork('bera');
        
        if (!onBera) {
          setError("Please connect to Berachain network to view your Murmuration NFTs.");
          setLoading(false);
          return;
        }
        
        try {
          // Fetch actual user-owned Murmuration NFTs
          const nfts = await getMurmurationNFTs(provider, userAddress);
          console.log(`Found ${nfts.length} Murmuration NFTs`);
          setUserTokens(nfts);
        } catch (murError) {
          console.error("Error fetching Murmuration NFTs:", murError);
          setError("Failed to fetch Murmuration NFTs. Please try again.");
          setLoading(false);
        }
      }
    } catch (error) {
      console.error(`Error fetching ${collection} data:`, error);
      setError(`Failed to load your ${collection === 'fractal' ? 'Fractal Swarm' : 'Murmuration'} NFTs. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  // Switch to a specific network
  const switchNetwork = async (networkName: 'base' | 'bera') => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    
    setLoading(true);
    setError(null);
    
    const network = NETWORKS[networkName];
    
    try {
      console.log(`Switching to ${network.name} network...`);
      
      // Try switching network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: network.chainId }],
      });
      
      // Network switch is handled by the chainChanged event listener
      
    } catch (switchError: any) {
      console.log('Switch error:', switchError);
      
      // If network doesn't exist, try adding it
      if (switchError.code === 4902) {
        try {
          console.log(`Adding ${network.name} to wallet...`);
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: network.chainId,
                chainName: network.name,
                nativeCurrency: {
                  name: network.currency,
                  symbol: network.currency,
                  decimals: 18
                },
                rpcUrls: [network.rpcUrl],
                blockExplorerUrls: [network.blockExplorer]
              },
            ],
          });
          
          // Try switching again after adding
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: network.chainId }],
          });
          
          // Network switch is handled by the chainChanged event listener
          
        } catch (addError) {
          console.error(`Failed to add ${network.name} network`, addError);
          setError(`Could not add the ${network.name} network. Please add it manually to your wallet.`);
          setLoading(false);
        }
      } else if (switchError.code === 4001) {
        // User rejected the switch
        setError('You rejected the network switch request.');
        setLoading(false);
      } else {
        setError(`Error switching to ${network.name} network. Please try switching manually in your wallet.`);
        setLoading(false);
      }
    }
  };

  // Handle refresh button
  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    
    // Check network first
    await checkCurrentNetwork();
    
    // Fetch current collection data
    setTimeout(() => {
      fetchCollectionData(activeCollection);
    }, 500);
  };

  // Show connect button if not connected
  if (!walletConnected && !loading) {
    return (
      <Container>
        <div className="w-full max-w-md mx-auto mt-10">
          <div className="bg-gray-100 dark:bg-gray-800/50 p-8 rounded-xl shadow-lg text-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              Connect Your Wallet
            </h2>
            <div className="text-gray-600 dark:text-gray-300 mb-6">
              Please connect your wallet to view your NFT collection.
            </div>
            <button 
              onClick={connectWallet}
              className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-6 rounded-lg transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </Container>
    );
  }

  // Display network name helper
  const getNetworkName = (chainId: string | null): string => {
    if (!chainId) return 'Disconnected';
    
    const normalizedChainId = chainId.toLowerCase();
    
    if (normalizedChainId === NETWORKS.base.chainId.toLowerCase()) return 'Base';
    if (normalizedChainId === NETWORKS.bera.chainId.toLowerCase()) return 'Berachain';
    if (normalizedChainId === NETWORKS.ethereum.chainId.toLowerCase()) return 'Ethereum';
    
    return 'Unknown Network';
  };

  return (
    <Container>
      <div className="flex flex-col items-center">
        {/* Collection selector */}
        <div className="flex justify-center mb-6 bg-gray-200 dark:bg-gray-700 rounded-full p-1">
          <button
            onClick={() => handleCollectionToggle('fractal')}
            className={`px-4 py-2 rounded-full transition-colors duration-200 ${
              activeCollection === 'fractal' 
                ? 'bg-indigo-600 text-white' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Fractal Swarm
          </button>
          <button
            onClick={() => handleCollectionToggle('bera')}
            className={`px-4 py-2 rounded-full transition-colors duration-200 ${
              activeCollection === 'bera' 
                ? 'bg-indigo-600 text-white' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Murmuration
          </button>
        </div>
        
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
          {activeCollection === 'fractal' ? 'Fractal Swarm' : 'Murmuration'} Gallery
        </h2>
        
        {/* Current network indicator */}
        <div className="mb-6 text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Current Network: {getNetworkName(currentChainId)}
          </div>
          
          {/* Network switching buttons */}
          <div className="flex justify-center gap-3 mb-4">
            {activeCollection === 'fractal' && !isOnCorrectNetwork('fractal') && (
              <button
                onClick={() => switchNetwork('base')}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1 rounded text-sm disabled:opacity-50"
              >
                Switch to Base
              </button>
            )}
            
            {activeCollection === 'bera' && !isOnCorrectNetwork('bera') && (
              <button
                onClick={() => switchNetwork('bera')}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1 rounded text-sm disabled:opacity-50"
              >
                Switch to Berachain
              </button>
            )}
            
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-1 rounded text-sm disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </div>
        
        {/* Loading and error states */}
        {loading ? (
          <div className="w-full max-w-md p-6 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
            <div className="text-gray-600 dark:text-gray-300 text-center flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading your NFTs...
            </div>
          </div>
        ) : error ? (
          <div className="w-full max-w-md">
            <div className="bg-red-100 dark:bg-red-900/50 p-6 rounded-lg shadow-md">
              <div className="text-red-800 dark:text-red-200 text-center mb-4">
                {error}
              </div>
              

            </div>
          </div>
        ) : userTokens.length === 0 ? (
          <div className="w-full max-w-md">
            <div className="bg-gray-100 dark:bg-gray-800/50 p-6 rounded-lg shadow-md">
              <div className="text-gray-800 dark:text-white text-center mb-4">
                You don't have any {activeCollection === 'fractal' ? 'Fractal Swarm' : 'Murmuration'} NFTs yet.
              </div>
              <div className="flex justify-center space-x-4">
                <Link 
                  href={activeCollection === 'fractal' ? "/mint" : "/murmuration"} 
                  className="block"
                >
                  <button className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700">
                    Mint Your First NFT
                  </button>
                </Link>
                
                <button
                  onClick={handleRefresh}
                  className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-md"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        ) : (
          // NFT grid
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {userTokens.map(token => (
              <Link 
                href={`/view/${activeCollection === 'fractal' ? 'fractal' : 'bera'}/${token.id}`} 
                key={token.id}
                className="block"
              >
                <div className="bg-gray-100 dark:bg-gray-800/50 rounded-lg overflow-hidden shadow-md transform transition-transform duration-200 hover:scale-105 h-full flex flex-col">
                  <div className="relative w-full pt-[100%]">
                    {token.image ? (
                      <Image 
                        src={token.image}
                        alt={token.name || `Token #${token.id}`}
                        fill
                        className="object-cover absolute top-0 left-0"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-gray-500 dark:text-gray-400">
                          No Image
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-grow">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1 truncate">
                      {token.name || `Token #${token.id}`}
                    </h3>
                    <div className="text-gray-600 dark:text-gray-300 text-sm">
                      ID: {token.id}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}