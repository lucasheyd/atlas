'use client';

import React, { useState, useEffect } from 'react';
import { Container } from "@/components/Container";
import { Button } from "@/components/ui/button";
import { ethers } from 'ethers';
import Image from "next/image";
import { 
  AlertCircle, 
  Check, 
  Moon, 
  RefreshCw, 
  Upload, 
  X,
  ChevronDown,
  Info
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { LUNAR_NFT_CONTRACT_ADDRESS, LUNAR_NFT_ABI } from '@/utils/contract';

// Sepolia chain ID
const BASE_SEPOLIA_CHAIN_ID = '0xaa37dc';
const BASE_MAINNET_CHAIN_ID = '0x2105';

// Mock data for example images
const examplePhaseImages = [
  {
    name: "New Moon",
    image: "/img/NewMoon.png" 
  },
  {
    name: "Waxing Crescent",
    image: "/img/WaxingCrescent.png"
  },
  {
    name: "First Quarter",
    image: "/img/FirstQuarter.png"
  },
  {
    name: "Waxing Gibbous",
    image: "/img/WaxingGibbous.png"
  },
  {
    name: "Full Moon",
    image: "/img/FullMoon.png"
  },
  {
    name: "Waning Gibbous",
    image: "/img/WaningGibbous.png"
  },
  {
    name: "Last Quarter",
    image: "/img/LastQuarter2.png"
  },
  {
    name: "Waning Crescent",
    image: "/img/WaningCrescent.png"
  }
];

// Moon phase names for display
const moonPhaseNames = [
  "New Moon",
  "Waxing Crescent",
  "First Quarter",
  "Waxing Gibbous",
  "Full Moon",
  "Waning Gibbous",
  "Last Quarter",
  "Waning Crescent"
];

// Interface for NFT data
interface LunarNFT {
  id: number;
  currentPhase?: string;
  currentImage?: string;
  phases?: {
    [key: number]: {
      ipfsHash: string;
      isCustom: boolean;
    }
  };
}

export default function LunarUpdateComponent() {
  // State variables
  const [account, setAccount] = useState<string>('');
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [nfts, setNfts] = useState<LunarNFT[]>([]);
  const [currentMoonPhase, setCurrentMoonPhase] = useState<number>(0);
  const [currentPhaseName, setCurrentPhaseName] = useState<string>('New Moon');
  const [selectedNft, setSelectedNft] = useState<number | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<number>(0);
  const [ipfsHash, setIpfsHash] = useState<string>('');
  const [ipfsError, setIpfsError] = useState<string>('');
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txMessage, setTxMessage] = useState<string>('');
  const [batchHashes, setBatchHashes] = useState<string[]>(Array(8).fill(''));
  const [previewImages, setPreviewImages] = useState<{[key: number]: string}>({});
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [phaseDropdownOpen, setPhaseDropdownOpen] = useState(false);
  const [showExamples, setShowExamples] = useState<boolean>(true);

  // Check if connected to either Base Mainnet or Base Sepolia
  const isOnCorrectNetwork = async (provider: ethers.providers.Web3Provider): Promise<boolean> => {
    try {
      const { chainId } = await provider.getNetwork();
      const chainIdHex = `0x${chainId.toString(16)}`;
      return chainIdHex === BASE_MAINNET_CHAIN_ID || chainIdHex === BASE_SEPOLIA_CHAIN_ID;
    } catch (error) {
      console.error("Error checking network:", error);
      return false;
    }
  };

  // Initialize connection to contract
  const initializeConnection = async () => {
    if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
      try {
        setLoading(true);
        
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        
        // Check if user is already connected
        const accounts = await web3Provider.listAccounts();
        if (accounts.length === 0) {
          setLoading(false);
          return; // Exit if no accounts found - user needs to connect via navbar first
        }
        
        const address = accounts[0];
        setAccount(address);
        
        // Create contract instance
        const lunarContract = new ethers.Contract(
          LUNAR_NFT_CONTRACT_ADDRESS,
          LUNAR_NFT_ABI,
          web3Provider.getSigner()
        );
        
        setProvider(web3Provider);
        setContract(lunarContract);
        
        // Try to get current moon phase info
        try {
          const phase = await lunarContract.getCurrentMoonPhase();
          const phaseName = await lunarContract.getCurrentMoonPhaseName();
          setCurrentMoonPhase(phase);
          setCurrentPhaseName(phaseName);
          setSelectedPhase(phase); // Default to current phase
        } catch (error) {
          console.warn("Error fetching moon phase (possibly wrong network):", error);
          // Default to New Moon if we can't fetch
          setCurrentMoonPhase(0);
          setCurrentPhaseName("New Moon");
          setSelectedPhase(0);
        }
        
        // Try to get user's NFTs
        try {
          const balance = await lunarContract.balanceOf(address);
         if (balance.toNumber() === 0) {
      setNfts([]);
    setShowExamples(true); // Exibe exemplos se não tiver NFTs
    setLoading(false);
    return;
  }
          
          const nftPromises = [];
          for (let i = 0; i < balance.toNumber(); i++) {
            nftPromises.push(lunarContract.tokenOfOwnerByIndex(address, i));
          }
          
          const tokenIds = await Promise.all(nftPromises);
          
          const nftData: LunarNFT[] = await Promise.all(
            tokenIds.map(async (tokenId) => {
              let currentImage = '';
              try {
                currentImage = await lunarContract.getCurrentTokenIPFSHash(tokenId);
              } catch (error) {
                console.warn(`Error fetching image for token ${tokenId}:`, error);
              }
              
              // Create basic NFT object
              const nft: LunarNFT = {
                id: tokenId.toNumber(),
                currentImage: currentImage ? `ipfs://${currentImage}` : '',
                currentPhase: moonPhaseNames[currentMoonPhase]
              };
              
              return nft;
            })
          );
          
            setNfts(nftData);
  setShowExamples(false); // Esconde exemplos quando temos NFTs
  
  if (nftData.length > 0) {
    setSelectedNft(nftData[0].id);
  }
} catch (error) {
  console.warn("Error fetching NFTs (possibly wrong network):", error);
  // Se ocorrer erro, mantém os exemplos visíveis
  setShowExamples(true);
}
        
      } catch (error) {
        console.error('Error initializing contract:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Mint a new Lunar NFT (free)
  const mintNewNFT = async () => {
    if (!provider) {
      // Connect wallet if not connected
      if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
        try {
          const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
          await web3Provider.send('eth_requestAccounts', []);
          setProvider(web3Provider);
          
          const signer = web3Provider.getSigner();
          const address = await signer.getAddress();
          setAccount(address);
          
          // Create contract instance
          const lunarContract = new ethers.Contract(
            LUNAR_NFT_CONTRACT_ADDRESS,
            LUNAR_NFT_ABI,
            signer
          );
          setContract(lunarContract);
          
          // Now continue with minting
          performMint(lunarContract);
        } catch (error) {
          console.error("Error connecting wallet:", error);
          alert("Please connect your wallet using the connect button in the navbar first.");
        }
      } else {
        alert("Please install MetaMask to use this feature.");
      }
      return;
    }
    
    if (!contract) {
      // Create contract if not existing
      const signer = provider.getSigner();
      const lunarContract = new ethers.Contract(
        LUNAR_NFT_CONTRACT_ADDRESS,
        LUNAR_NFT_ABI,
        signer
      );
      setContract(lunarContract);
      performMint(lunarContract);
    } else {
      performMint(contract);
    }
  };
  
  // Perform the actual minting
  const performMint = async (contractInstance) => {
    setTxStatus('pending');
    setTxMessage('Minting new Lunar Chronicles NFT...');
    
    try {
      const tx = await contractInstance.mint();
      setTxMessage('Transaction submitted. Waiting for confirmation...');
      await tx.wait();
      
      setTxStatus('success');
      setTxMessage('NFT minted successfully! Refreshing your collection...');
      
      // Refresh NFTs
      try {
        if (account) {
          const balance = await contractInstance.balanceOf(account);
          
          if (balance.toNumber() === 0) {
            setNfts([]);
            return;
          }
          
          const nftPromises = [];
          for (let i = 0; i < balance.toNumber(); i++) {
            nftPromises.push(contractInstance.tokenOfOwnerByIndex(account, i));
          }
          
          const tokenIds = await Promise.all(nftPromises);
          
          const nftData: LunarNFT[] = await Promise.all(
            tokenIds.map(async (tokenId) => {
              let currentImage = '';
              try {
                currentImage = await contractInstance.getCurrentTokenIPFSHash(tokenId);
              } catch (error) {
                console.warn(`Error fetching image for token ${tokenId}:`, error);
              }
              
              // Create basic NFT object
              const nft: LunarNFT = {
                id: tokenId.toNumber(),
                currentImage: currentImage ? `ipfs://${currentImage}` : '',
                currentPhase: moonPhaseNames[currentMoonPhase]
              };
              
              return nft;
            })
          );
          
          setNfts(nftData);
          setShowExamples(false);
          
          if (nftData.length > 0 && !selectedNft) {
            setSelectedNft(nftData[0].id);
          }
        }
      } catch (error) {
        console.warn("Error refreshing NFTs after mint:", error);
      }
      
    } catch (error: any) {
      console.error('Error minting NFT:', error);
      setTxStatus('error');
      setTxMessage(`Error: ${error.message || 'Transaction failed'}`);
    }
  };

  // Validate IPFS hash format
  const validateIpfsHash = (hash: string): boolean => {
    // Check if the hash is empty
    if (!hash.trim()) return true; // Empty is valid for this use case (revert to default)
    
    // Simple validation for IPFS CID format
    // CIDv0: Qm... (46 characters)
    // CIDv1: bafy... (59 characters)
    const cidv0Regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
    const cidv1Regex = /^bafy[a-zA-Z0-9]{55}$/i;
    
    return cidv0Regex.test(hash) || cidv1Regex.test(hash);
  };

  // Handle single phase update
  const handleUpdatePhase = async () => {
    if (!contract || selectedNft === null) return;
    
    // Validate input
    if (!validateIpfsHash(ipfsHash)) {
      setIpfsError('Invalid IPFS hash format. Please enter a valid CIDv0 or CIDv1 hash.');
      return;
    }
    
    setIpfsError('');
    setTxStatus('pending');
    setTxMessage('Updating moon phase image...');
    
    try {
      const tx = await contract.updatePhaseMetadata(
        selectedNft,
        selectedPhase,
        ipfsHash
      );
      
      setTxMessage('Transaction submitted. Waiting for confirmation...');
      await tx.wait();
      
      setTxStatus('success');
      setTxMessage('Moon phase image updated successfully!');
      
      // Update the NFT in state with the new image
      const updatedNfts = [...nfts];
      const nftIndex = updatedNfts.findIndex(nft => nft.id === selectedNft);
      
      if (nftIndex !== -1) {
        // If the updated phase is the current phase, update the current image
        if (selectedPhase === currentMoonPhase) {
          updatedNfts[nftIndex].currentImage = `ipfs://${ipfsHash}`;
        }
        
        // Initialize phases object if it doesn't exist
        if (!updatedNfts[nftIndex].phases) {
          updatedNfts[nftIndex].phases = {};
        }
        
        // Update the phase data
        updatedNfts[nftIndex].phases![selectedPhase] = {
          ipfsHash,
          isCustom: true
        };
        
        setNfts(updatedNfts);
      }
      
      // Add preview image
      setPreviewImages({
        ...previewImages,
        [selectedPhase]: ipfsHash
      });
      
      // Clear input
      setIpfsHash('');
      
    } catch (error: any) {
      console.error('Error updating phase:', error);
      setTxStatus('error');
      setTxMessage(`Error: ${error.message || 'Transaction failed'}`);
    }
  };

  // Handle batch update for all phases
  const handleBatchUpdate = async () => {
    if (!contract || selectedNft === null) return;
    
    // Validate all hashes
    const invalidHashes = batchHashes.filter(hash => hash.trim() !== '' && !validateIpfsHash(hash));
    if (invalidHashes.length > 0) {
      setIpfsError('One or more IPFS hashes are invalid. Please check your input.');
      return;
    }
    
    setIpfsError('');
    setTxStatus('pending');
    setTxMessage('Updating all moon phases...');
    
    try {
      const tx = await contract.batchUpdatePhaseMetadata(
        selectedNft,
        batchHashes
      );
      
      setTxMessage('Transaction submitted. Waiting for confirmation...');
      await tx.wait();
      
      setTxStatus('success');
      setTxMessage('All moon phases updated successfully!');
      
      // Update the NFT in state
      const updatedNfts = [...nfts];
      const nftIndex = updatedNfts.findIndex(nft => nft.id === selectedNft);
      
      if (nftIndex !== -1) {
        // If one of the updated phases is the current phase, update the current image
        updatedNfts[nftIndex].currentImage = `ipfs://${batchHashes[currentMoonPhase]}`;
        
        // Initialize phases object if it doesn't exist
        if (!updatedNfts[nftIndex].phases) {
          updatedNfts[nftIndex].phases = {};
        }
        
        // Update all phase data
        batchHashes.forEach((hash, index) => {
          if (hash.trim() !== '') {
            updatedNfts[nftIndex].phases![index] = {
              ipfsHash: hash,
              isCustom: true
            };
          }
        });
        
        setNfts(updatedNfts);
      }
      
      // Update preview images
      const newPreviewImages = { ...previewImages };
      batchHashes.forEach((hash, index) => {
        if (hash.trim() !== '') {
          newPreviewImages[index] = hash;
        }
      });
      setPreviewImages(newPreviewImages);
      
      // Clear inputs
      setBatchHashes(Array(8).fill(''));
      
    } catch (error: any) {
      console.error('Error batch updating phases:', error);
      setTxStatus('error');
      setTxMessage(`Error: ${error.message || 'Transaction failed'}`);
    }
  };

  // Update batch hash at a specific index
  const updateBatchHash = (index: number, value: string) => {
    const newBatchHashes = [...batchHashes];
    newBatchHashes[index] = value;
    setBatchHashes(newBatchHashes);
  };

  // Reset transaction status
  const resetTxStatus = () => {
    setTxStatus('idle');
    setTxMessage('');
  };

// UseEffect para calcular a fase da lua atual
useEffect(() => {
  // Função para calcular a fase da lua atual
  const calculateMoonPhase = () => {
    const secondsSinceEpoch = Math.floor(Date.now() / 1000);
    // Duração do ciclo lunar em segundos (29.5 dias)
    const lunarCycle = 29.5 * 24 * 60 * 60;
    // Calcula o índice da fase com base no timestamp atual
    const phaseIndex = Math.floor((secondsSinceEpoch % lunarCycle) * 8 / lunarCycle);
    
    setCurrentMoonPhase(phaseIndex);
    setCurrentPhaseName(moonPhaseNames[phaseIndex]);
  };
  
  // Calcula a fase inicial
  calculateMoonPhase();
  
  // Define um intervalo para atualizar (a cada hora)
  const interval = setInterval(calculateMoonPhase, 60 * 60 * 1000);
  
  // Limpa o intervalo quando o componente é desmontado
  return () => clearInterval(interval);
}, []);

  // Effect to initialize and handle wallet changes
  useEffect(() => {
    initializeConnection();
    
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        initializeConnection();
      } else {
        setAccount('');
        setNfts([]);
        setContract(null);
        setShowExamples(true);
      }
    };

    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => {
        // Handle chain changes by re-initializing
        initializeConnection();
      });
    }

    return () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', () => {});
      }
    };
  }, []);

  // Render image preview based on IPFS hash
  const renderImagePreview = (hash: string) => {
    if (!hash) return null;
    
    // Using a gateway for preview
    const gatewayUrl = `https://ipfs.io/ipfs/${hash}`;
    
    return (
      <div className="mt-2 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <img 
          src={gatewayUrl} 
          alt="IPFS Preview" 
          className="w-full h-auto object-cover"
          onError={(e) => {
            // Fallback to placeholder image
            e.currentTarget.src = '/img/NewMoon.png';
            e.currentTarget.alt = 'Preview unavailable';
          }}
        />
      </div>
    );
  };

 return (
    <>
      {/* Hero Section */}
      <div className="relative py-24 overflow-hidden bg-gradient-to-b from-blue-50/40 via-indigo-50/20 to-white dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-gray-900">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-br from-blue-200/30 to-indigo-400/30 blur-3xl dark:from-blue-900/20 dark:to-indigo-900/20"></div>
          <div className="absolute top-1/2 -left-24 w-80 h-80 rounded-full bg-gradient-to-br from-indigo-200/30 to-purple-300/30 blur-3xl dark:from-indigo-900/20 dark:to-purple-900/20"></div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3/4 h-1/2 bg-gradient-to-t from-white to-transparent dark:from-gray-900 dark:to-transparent"></div>
        </div>

        <Container className="relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-1.5 mb-8 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 shadow-sm">
              <Moon size={16} className="mr-2" />
              <span>Dynamic NFT Collection</span>
              <div className="w-2 h-2 rounded-full bg-blue-500 ml-2 animate-pulse"></div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Lunar Chronicles <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Image Customizer</span>
            </h1>
            
            <div className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
              Personalize your Lunar Chronicles NFT by setting custom images for each moon phase.
              Your NFT will dynamically change appearance as the moon cycles through its phases.
            </div>
            
            {/* Current Moon Phase Display - Enhanced */}
            {currentPhaseName && (
              <div className="relative max-w-md mx-auto mb-12">
                <div className="flex flex-col items-center px-8 py-6 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 shadow-lg border border-blue-100 dark:border-blue-800/30">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">Current Moon Phase</div>
                  <div className="flex items-center">
                    <Moon size={28} className="text-blue-600 dark:text-blue-400 mr-3" />
                    <span className="text-2xl font-medium text-gray-900 dark:text-white">{currentPhaseName}</span>
                  </div>
                  
                  {/* Small moon phase image */}
                  <div className="mt-4 w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-md">
                    <img 
                      src={`/img/${currentPhaseName.replace(/\s+/g, '')}.png`}
                      alt={currentPhaseName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/img/NewMoon.png';
                      }}
                    />
                  </div>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-blue-400 dark:bg-blue-500"></div>
                <div className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-indigo-400 dark:bg-indigo-500"></div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              {/* Mint Button - Enhanced */}
              <Button 
                onClick={mintNewNFT}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-lg px-10 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 min-w-[200px]"
                disabled={txStatus === 'pending'}
              >
                {txStatus === 'pending' ? (
                  <>
                    <RefreshCw size={20} className="mr-2 animate-spin" />
                    Minting...
                  </>
                ) : (
                  <>
                    <Moon size={20} className="mr-2" />
                    Mint Your Lunar NFT
                  </>
                )}
              </Button>
              
              {/* Reload button if user is connected */}
              {account && (
                <Button 
                  onClick={initializeConnection}
                  size="lg"
                  variant="outline"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800/30 dark:text-blue-400 dark:hover:bg-blue-900/20 font-medium rounded-xl px-6 py-6"
                >
                  <RefreshCw size={18} className="mr-2" />
                  Refresh NFTs
                </Button>
              )}
            </div>
          </div>
        </Container>
      </div>
      
      {/* Main Content Area - Enhanced */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800/20">
        <Container>
          {/* Example Moon Phases Section - Enhanced */}
          {showExamples && (
            <div className="mb-20">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                  Moon Phase <span className="text-blue-600 dark:text-blue-400">Examples</span>
                </h2>
                <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Your Lunar Chronicles NFT dynamically changes its appearance to match the current phase of the moon.
                  Here are examples of how your NFT could look during each phase.
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                {examplePhaseImages.map((phase, index) => (
                  <div key={index} className="group bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-blue-100 dark:border-blue-800/30">
                    <div className="aspect-square relative overflow-hidden">
                      <img 
                        src={phase.image} 
                        alt={phase.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/70 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <div className="text-white text-center text-sm font-medium">{phase.name}</div>
                      </div>
                    </div>
                    <div className="p-3 text-center">
                      <h3 className="font-medium text-gray-900 dark:text-white">{phase.name}</h3>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30 shadow-md max-w-3xl mx-auto">
                <div className="flex items-start">
                  <Info size={24} className="text-blue-500 mr-4 mt-1" />
                  <div>
                    <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">How Lunar Chronicles NFTs Work</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Lunar Chronicles NFTs automatically change their appearance based on the current phase of the moon.
                      When you mint an NFT, you can customize each of the 8 moon phases with your own custom images.
                      You only need to provide the IPFS hash of your images, and the NFT will display them at the right time!
                    </p>
                    
                    <div className="flex flex-wrap gap-4 mt-6">
                      <div className="flex items-center rounded-full px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm">
                        <Moon size={14} className="mr-1.5" />
                        8 Moon Phases
                      </div>
                      <div className="flex items-center rounded-full px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-sm">
                        <Upload size={14} className="mr-1.5" />
                        IPFS Integration
                      </div>
                      <div className="flex items-center rounded-full px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 text-sm">
                        <RefreshCw size={14} className="mr-1.5" />
                        Auto-updates
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* User's NFTs Section - Enhanced */}
          {nfts.length > 0 && (
            <div>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                  Customize Your <span className="text-blue-600 dark:text-blue-400">Lunar NFT</span>
                </h2>
                <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Select your NFT and update its images for each moon phase. Your changes will be stored on the blockchain
                  and will affect how your NFT appears throughout the lunar cycle.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
                {/* NFT Selection and Preview */}
                <div>
                  <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-blue-100 dark:border-blue-800/30 shadow-lg overflow-hidden rounded-xl">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-b border-blue-100 dark:border-blue-800/30 pb-4">
                      <CardTitle className="text-blue-800 dark:text-blue-300 flex items-center">
                        <Moon size={18} className="mr-2 text-blue-600 dark:text-blue-400" />
                        Your Lunar Chronicles NFTs
                      </CardTitle>
                      <CardDescription className="text-blue-700/70 dark:text-blue-400/70">
                        Select an NFT to customize its moon phase images
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="mb-6">
                        <Label htmlFor="nft-select" className="text-gray-700 dark:text-gray-300 mb-1.5 block">Select NFT</Label>
                        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="outline" 
                              className="w-full justify-between bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800/30 text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                            >
                              {selectedNft !== null ? `Lunar Chronicles #${selectedNft}` : "Select NFT"}
                              <ChevronDown className={`h-4 w-4 ml-2 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-full">
                            {nfts.map((nft) => (
                              <DropdownMenuItem 
                                key={nft.id}
                                onClick={() => {
                                  setSelectedNft(nft.id);
                                  setDropdownOpen(false);
                                }}
                              >
                                Lunar Chronicles #{nft.id}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      {selectedNft !== null && (
                        <div>
                          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center">
                            <Moon size={14} className="mr-1.5 text-blue-500" />
                            Current Appearance ({currentPhaseName})
                          </div>
                          <div className="rounded-xl border border-blue-100 dark:border-blue-800/30 overflow-hidden bg-white dark:bg-gray-800 shadow-md">
                            {nfts.find(nft => nft.id === selectedNft)?.currentImage ? (
                              <img 
                                src={nfts.find(nft => nft.id === selectedNft)?.currentImage?.replace('ipfs://', 'https://ipfs.io/ipfs/')} 
                                alt={`Lunar NFT #${selectedNft}`}
                                className="w-full h-auto object-cover"
                                onError={(e) => {
                                  // Use a imagem padrão para a fase atual
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
                                  e.currentTarget.src = phaseImages[currentPhaseName] || '/img/NewMoon.png';
                                  e.currentTarget.alt = 'Default phase image';
                                }}
                              />
                            ) : (
                              <div className="aspect-square flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-700 p-4">
                                <Moon size={48} className="text-blue-400/50 dark:text-blue-500/30 mb-3" />
                                <span className="text-gray-400 dark:text-gray-500 text-center">No custom image set.<br />Default phase image will be used.</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-4 text-center">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-gray-600 dark:text-gray-400">
                              This is how your NFT currently appears in the {currentPhaseName} phase. Update it using the customization tools.
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                {/* Customization Interface */}
                <div>
                  <Tabs defaultValue="single" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4">
                      <TabsTrigger 
                        value="single" 
                        className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm px-4 py-2"
                      >
                        Single Phase
                      </TabsTrigger>
                      <TabsTrigger 
                        value="batch" 
                        className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm px-4 py-2"
                      >
                        All Phases
                      </TabsTrigger>
                    </TabsList>
                    
                    {/* Single Phase Update - Enhanced */}
                    <TabsContent value="single">
                      <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-blue-100 dark:border-blue-800/30 shadow-lg overflow-hidden rounded-xl">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-b border-blue-100 dark:border-blue-800/30 pb-4">
                          <CardTitle className="text-blue-800 dark:text-blue-300 flex items-center">
                            <Upload size={18} className="mr-2 text-blue-600 dark:text-blue-400" />
                            Update Single Phase
                          </CardTitle>
                          <CardDescription className="text-blue-700/70 dark:text-blue-400/70">
                            Set a custom image for a specific moon phase
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <div className="space-y-5">
                            <div>
                              <Label htmlFor="phase-select" className="text-gray-700 dark:text-gray-300 mb-1.5 block">Select Moon Phase</Label>
                              <DropdownMenu open={phaseDropdownOpen} onOpenChange={setPhaseDropdownOpen}>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    className="w-full justify-between bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800/30 text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                  >
                                    <div className="flex items-center">
                                      <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-2">
                                        <Moon size={12} className="text-blue-600 dark:text-blue-400" />
                                      </div>
                                      {moonPhaseNames[selectedPhase]} {selectedPhase === currentMoonPhase ? '(Current)' : ''}
                                    </div>
                                    <ChevronDown className={`h-4 w-4 ml-2 transition-transform duration-200 ${phaseDropdownOpen ? 'rotate-180' : ''}`} />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56">
                                  {moonPhaseNames.map((name, index) => (
                                    <DropdownMenuItem 
                                      key={index}
                                      onClick={() => {
                                        setSelectedPhase(index);
                                        setPhaseDropdownOpen(false);
                                      }}
                                      className="flex items-center"
                                    >
                                      <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-2">
                                        <Moon size={12} className="text-blue-600 dark:text-blue-400" />
                                      </div>
                                      {name} {index === currentMoonPhase ? '(Current)' : ''}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            
                            <div>
                              <Label htmlFor="ipfs-hash" className="text-gray-700 dark:text-gray-300 mb-1.5 block">IPFS Hash</Label>
                              <div className="flex">
                                <Input 
                                  id="ipfs-hash"
                                  placeholder="QmYourIPFSHash..." 
                                  value={ipfsHash}
                                  onChange={(e) => {
                                    setIpfsHash(e.target.value);
                                    setIpfsError('');
                                  }}
                                  className={`bg-white dark:bg-gray-800 border ${ipfsError ? 'border-red-500' : 'border-blue-200 dark:border-blue-800/30'} rounded-lg`}
                                />
                              </div>
                              {ipfsError && (
                                <div className="text-red-500 text-sm mt-1 flex items-center">
                                  <X size={14} className="mr-1" />
                                  {ipfsError}
                                </div>
                              )}
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                                <Info size={12} className="mr-1" />
                                Enter the IPFS CID of your image (e.g., Qm... or bafy...)
                              </div>
                            </div>
                            
                            {/* Image preview with improved styling */}
                            {ipfsHash && renderImagePreview(ipfsHash)}
                          </div>
                        </CardContent>
                        <CardFooter className="border-t border-blue-100 dark:border-blue-800/30 bg-gray-50 dark:bg-gray-800/50">
                          <Button 
                            onClick={handleUpdatePhase}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg border-0"
                            disabled={!account || !selectedNft || txStatus === 'pending'}
                          >
                            {txStatus === 'pending' ? (
                              <>
                                <RefreshCw size={16} className="mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Upload size={16} className="mr-2" />
                                Update Phase
                              </>
                            )}
                          </Button>
                        </CardFooter>
                      </Card>
                    </TabsContent>
                    
                    {/* Batch Update - Enhanced */}
                    <TabsContent value="batch">
                      <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-blue-100 dark:border-blue-800/30 shadow-lg overflow-hidden rounded-xl">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-b border-blue-100 dark:border-blue-800/30 pb-4">
                          <CardTitle className="text-blue-800 dark:text-blue-300 flex items-center">
                            <Upload size={18} className="mr-2 text-blue-600 dark:text-blue-400" />
                            Update All Phases
                          </CardTitle>
                          <CardDescription className="text-blue-700/70 dark:text-blue-400/70">
                            Set custom images for all eight moon phases at once
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 max-h-[500px] overflow-y-auto">
                          <div className="space-y-4">
                            {moonPhaseNames.map((name, index) => (
                              <div key={index} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-blue-100 dark:border-blue-800/30">
                                <div className="flex items-center mb-3">
                                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-2">
                                    <Moon size={14} className="text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <Label htmlFor={`phase-${index}`} className="text-gray-700 dark:text-gray-300 font-medium">
                                    {name} {index === currentMoonPhase ? (
                                      <span className="ml-1.5 text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full">Current</span>
                                    ) : null}
                                  </Label>
                                </div>
                                
                                <Input 
                                  id={`phase-${index}`}
                                  placeholder="QmYourIPFSHash..." 
                                  value={batchHashes[index]}
                                  onChange={(e) => {
                                    updateBatchHash(index, e.target.value);
                                    setIpfsError('');
                                  }}
                                  className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800/30 rounded-lg mb-2"
                                />
                                
                                {/* Small image preview */}
                                {batchHashes[index] && renderImagePreview(batchHashes[index])}
                              </div>
                            ))}
                            
                            {ipfsError && (
                              <div className="text-red-500 text-sm mt-1 flex items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <X size={16} className="mr-2" />
                                {ipfsError}
                              </div>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter className="border-t border-blue-100 dark:border-blue-800/30 bg-gray-50 dark:bg-gray-800/50">
                          <Button 
                            onClick={handleBatchUpdate}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg border-0"
                            disabled={!account || !selectedNft || txStatus === 'pending'}
                          >
                            {txStatus === 'pending' ? (
                              <>
                                <RefreshCw size={16} className="mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Upload size={16} className="mr-2" />
                                Update All Phases
                              </>
                            )}
                          </Button>
                        </CardFooter>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          )}
          
          {/* No NFTs but wallet connected message */}
          {account && nfts.length === 0 && !showExamples && (
            <div className="text-center p-6 mb-8">
              <Alert className="max-w-lg mx-auto bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/30">
                <AlertCircle className="h-5 w-5 text-blue-500" />
                <AlertTitle className="text-blue-800 dark:text-blue-300 text-lg font-medium">No Lunar Chronicles NFTs Found</AlertTitle>
                <AlertDescription className="text-blue-700/80 dark:text-blue-400/80">
                  You don't own any Lunar Chronicles NFTs in this wallet. 
                  Click the mint button above to get your first Lunar NFT!
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          {/* Transaction Status */}
          {txStatus !== 'idle' && (
            <div className="mt-8 max-w-3xl mx-auto">
              <Alert 
                variant={
                  txStatus === 'pending' ? 'default' : 
                  txStatus === 'success' ? 'default' : 
                  'destructive'
                }
                className={
                  txStatus === 'pending' ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/30' :
                  txStatus === 'success' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800/30' : 
                  'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/30'
                }
              >
                <div className="flex items-start">
                  {txStatus === 'pending' && <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin mr-3 mt-0.5" />}
                  {txStatus === 'success' && <Check className="h-5 w-5 text-green-600 dark:text-green-400 mr-3 mt-0.5" />}
                  {txStatus === 'error' && <X className="h-5 w-5 text-red-600 dark:text-red-400 mr-3 mt-0.5" />}
                  
                  <div className="flex-1">
                    <AlertTitle className={
                      txStatus === 'pending' ? 'text-blue-800 dark:text-blue-300' :
                      txStatus === 'success' ? 'text-green-800 dark:text-green-300' :
                      'text-red-800 dark:text-red-300'
                    }>
                      {txStatus === 'pending' && 'Transaction in Progress'}
                      {txStatus === 'success' && 'Success!'}
                      {txStatus === 'error' && 'Transaction Failed'}
                    </AlertTitle>
                    
                    <AlertDescription className={
                      txStatus === 'pending' ? 'text-blue-700/70 dark:text-blue-400/70' :
                      txStatus === 'success' ? 'text-green-700/70 dark:text-green-400/70' :
                      'text-red-700/70 dark:text-red-400/70'
                    }>
                      <p className="mb-4">{txMessage}</p>
                      
                      {txStatus !== 'pending' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={resetTxStatus} 
                          className={
                            txStatus === 'success' ? 'border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800/30 dark:text-green-400 dark:hover:bg-green-900/20' :
                            'border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800/30 dark:text-red-400 dark:hover:bg-red-900/20'
                          }
                        >
                          Dismiss
                        </Button>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            </div>
          )}
        </Container>
      </section>
      
      {/* Information Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <Container>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
              How It <span className="text-blue-600 dark:text-blue-400">Works</span>
            </h2>
            
            <div className="grid gap-8">
              <div className="flex items-start bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-blue-100 dark:border-blue-800/30">
                <div className="mr-4 flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-lg font-semibold">
                    1
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Upload Your Images to IPFS</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Create custom images for each moon phase and upload them to IPFS using services like 
                    Pinata or NFT.Storage. Copy the IPFS hash for each image.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-blue-100 dark:border-blue-800/30">
                <div className="mr-4 flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-lg font-semibold">
                    2
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Choose Your NFT and Phases</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Select which NFT you want to customize and which moon phases should display your custom images.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-blue-100 dark:border-blue-800/30">
                <div className="mr-4 flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-lg font-semibold">
                    3
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Submit Your Changes</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Enter the IPFS hashes and submit your changes. Your NFT will now dynamically change 
                    appearance based on the current moon phase.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-blue-100 dark:border-blue-800/30">
                <div className="mr-4 flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-lg font-semibold">
                    4
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Watch Your NFT Transform</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    As the moon goes through its cycle, your NFT's appearance will change automatically 
                    to match the current phase.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-12 p-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30 shadow-md">
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <Info size={20} className="text-blue-500 mr-2" />
                Tips for Best Results
              </h3>
              <ul className="grid gap-3 text-gray-600 dark:text-gray-400">
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    <div className="w-1.5 h-1.5 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
                  </div>
                  Use square images (1:1 aspect ratio) for the best display
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    <div className="w-1.5 h-1.5 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
                  </div>
                  Make sure your images are permanently pinned on IPFS
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    <div className="w-1.5 h-1.5 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
                  </div>
                  Consider creating a cohesive set of images that transition well between phases
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    <div className="w-1.5 h-1.5 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
                  </div>
                  You can update your images any time by repeating this process
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}