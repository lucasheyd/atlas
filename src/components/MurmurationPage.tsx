'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import Image from 'next/image';
import { Container } from "@/components/Container";
import { Tab } from '@headlessui/react';
import { NETWORKS } from '@/utils/networks';
import { switchNetwork } from '@/utils/networks';

// ABI specific to your contract based on the Solidity source
const CONTRACT_ABI = [
  // Basic view functions
  "function totalSupply() view returns (uint256)",
  "function maxSupply() view returns (uint256)",
  "function mintPrice() view returns (uint256)",
  "function publicMintActive() view returns (bool)",
  
  // Mint functions from your contract
  "function mint() payable",
  "function mintBatch(uint256 quantity) payable"
];

const MurmurationPage = () => {
  // State for Web3 interaction
  const [connected, setConnected] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0 for mint, 1 for redeem
  const [loadingState, setLoadingState] = useState('initializing');
  const [errorMessage, setErrorMessage] = useState('');
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  
  // Minting states
  const [mintAmount, setMintAmount] = useState(1);
  const [mintPrice, setMintPrice] = useState('0.3');
  const [supplyInfo, setSupplyInfo] = useState({
    minted: 0,
    total: 666
  });
  const [mintLoading, setMintLoading] = useState(false);
  const [mintTxHash, setMintTxHash] = useState<string | null>(null);
  const [networkSwitching, setNetworkSwitching] = useState(false);
  const [isOnBera, setIsOnBera] = useState(false);
  const [currentChainId, setCurrentChainId] = useState<string | null>(null);
  const [isMintActive, setIsMintActive] = useState(false);
  
  // Get contract address from env vars
  const contractAddress = process.env.NEXT_PUBLIC_BERA_CONTRACT_ADDRESS || '0xe16E3753f33A10602177f77fEc769D116fF70A69';
  
  // Safe web3 initialization
  useEffect(() => {
    const initializeWeb3 = async () => {
      try {
        setLoadingState('starting');
        
        // Check if we're in a browser and window.ethereum exists
        if (typeof window === 'undefined') {
          setLoadingState('not-browser');
          return;
        }
        
        if (!window.ethereum) {
          setLoadingState('no-ethereum');
          return;
        }
        
        setLoadingState('ethereum-detected');
        
        // Initialize provider
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(web3Provider);
        
        // Safely try to get accounts but don't prompt connection yet
        try {
          const accounts = await web3Provider.listAccounts();
          setConnected(accounts.length > 0);
          
          if (accounts.length > 0) {
            setLoadingState('account-connected');
            
            // Get network info
            const { chainId } = await web3Provider.getNetwork();
            const chainIdHex = `0x${chainId.toString(16)}`;
            setCurrentChainId(chainIdHex);
            
            // Use the correct Berachain ID from networks.ts
            setIsOnBera(chainIdHex === NETWORKS.bera.chainId);
            
            // If on Bera, get contract info
            if (chainIdHex === NETWORKS.bera.chainId) {
              await getContractInfo(web3Provider);
            }
          } else {
            setLoadingState('no-accounts');
          }
        } catch (accountError) {
          console.log('Error checking accounts:', accountError);
          setLoadingState('account-error');
        }
        
        // Set up event listeners
        window.ethereum.on('accountsChanged', async (accounts: string[]) => {
          setConnected(accounts.length > 0);
          if (accounts.length > 0 && web3Provider) {
            const { chainId } = await web3Provider.getNetwork();
            const chainIdHex = `0x${chainId.toString(16)}`;
            setIsOnBera(chainIdHex === NETWORKS.bera.chainId);
          }
        });
        
        window.ethereum.on('chainChanged', () => {
          window.location.reload();
        });
        
      } catch (error) {
        console.error('Error initializing Web3:', error);
        setErrorMessage(error instanceof Error ? error.message : 'Unknown Web3 initialization error');
        setLoadingState('initialization-error');
      }
    };
    
    initializeWeb3();
    
    // Cleanup event listeners
    return () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
        window.ethereum.removeListener('chainChanged', () => {});
      }
    };
  }, []);
  
  // Get contract information (supply, price, mint status)
  const getContractInfo = async (web3Provider: ethers.providers.Web3Provider) => {
    try {
      const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, web3Provider);
      
      // Get total supply
      const totalSupply = await contract.totalSupply();
      
      // Get max supply
      const maxSupply = await contract.maxSupply();
      
      // Get mint price
      const price = await contract.mintPrice();
      setMintPrice(ethers.utils.formatEther(price));
      
      // Check if minting is active
      try {
        const mintActive = await contract.publicMintActive();
        setIsMintActive(mintActive);
      } catch (e) {
        console.log('publicMintActive function not found or error:', e);
        setIsMintActive(false);
      }
      
      setSupplyInfo({
        minted: totalSupply.toNumber(),
        total: maxSupply.toNumber()
      });
      
    } catch (error) {
      console.error('Error getting contract info:', error);
      // Use default values if error
      setSupplyInfo({
        minted: 0,
        total: 666
      });
    }
  };
  
  // Connect wallet function
  const connectWallet = async () => {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        alert('Web3 wallet not detected. Please install MetaMask.');
        return;
      }
      
      if (!provider) {
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(web3Provider);
      }
      
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setConnected(accounts.length > 0);
      
      if (accounts.length > 0 && provider) {
        // Get chain ID after connection
        const { chainId } = await provider.getNetwork();
        const chainIdHex = `0x${chainId.toString(16)}`;
        setCurrentChainId(chainIdHex);
        setIsOnBera(chainIdHex === NETWORKS.bera.chainId);
        
        // If on Bera, get contract info
        if (chainIdHex === NETWORKS.bera.chainId) {
          await getContractInfo(provider);
        }
      }
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
      if (error.code === 4001) {
        // User rejected request
        setErrorMessage('Please connect your wallet to continue.');
      } else {
        setErrorMessage('Error connecting wallet. Please try again.');
      }
    }
  };
  
  // Switch to Bera network using the existing utility function
  const handleSwitchToBera = async () => {
    if (networkSwitching) return;
    
    try {
      setNetworkSwitching(true);
      
      // Use the utility function from networks.ts
      await switchNetwork('bera');
      
      // Verify the switch worked and get supply info
      if (provider) {
        const { chainId } = await provider.getNetwork();
        const chainIdHex = `0x${chainId.toString(16)}`;
        setCurrentChainId(chainIdHex);
        setIsOnBera(chainIdHex === NETWORKS.bera.chainId);
        
        if (chainIdHex === NETWORKS.bera.chainId) {
          await getContractInfo(provider);
        }
      }
      
    } catch (error) {
      console.error('Error switching network:', error);
      // Don't show an alert if user rejected
      if (error instanceof Error && !error.message.includes('User rejected')) {
        alert('Could not switch to Berachain. Please try manually in your wallet.');
      }
    } finally {
      setNetworkSwitching(false);
    }
  };
  
  // Mint function that matches your contract's functions
  const handleMint = async () => {
    if (!provider || !isOnBera) {
      alert('Please connect to Berachain to mint');
      return;
    }
    
    if (!isMintActive) {
      alert('Public minting is not active yet');
      return;
    }
    
    setMintLoading(true);
    setMintTxHash(null);
    
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
      
      // Calculate price in wei
      const priceInWei = ethers.utils.parseEther(mintPrice);
      const totalPrice = priceInWei.mul(mintAmount);
      
      // Use the right function based on the amount
      let tx;
      if (mintAmount === 1) {
        // Use mint() for a single token
        tx = await contract.mint({
          value: totalPrice,
          gasLimit: 300000 // Explicit gas limit
        });
      } else {
        // Use mintBatch for multiple tokens
        tx = await contract.mintBatch(mintAmount, {
          value: totalPrice,
          gasLimit: 500000 // Higher gas limit for batch minting
        });
      }
      
      // Wait for transaction to confirm
      await tx.wait();
      
      // Update transaction hash
      setMintTxHash(tx.hash);
      
      // Refresh supply after minting
      await getContractInfo(provider);
      
      // Success message
      alert(`Successfully minted ${mintAmount} Murmuration NFT(s)!`);
      
    } catch (error) {
      console.error('Error minting:', error);
      
      // Friendly error message based on the error type
      let errorMsg = "Transaction failed";
      
      if (error.message) {
        if (error.message.includes("execution reverted: Public mint is not active")) {
          errorMsg = "Public minting is not active yet";
        } else if (error.message.includes("insufficient funds")) {
          errorMsg = "Insufficient funds to complete the transaction";
        } else if (error.message.includes("Max supply reached")) {
          errorMsg = "All NFTs have been minted";
        } else if (error.message.includes("user rejected")) {
          errorMsg = "Transaction was rejected in your wallet";
        } else if (error.message.includes("Insufficient payment")) {
          errorMsg = "Insufficient payment amount";
        } else {
          // Include the original error for debugging
          errorMsg = `Error: ${error.message.substring(0, 100)}...`;
        }
      }
      
      alert(`Error minting: ${errorMsg}`);
    } finally {
      setMintLoading(false);
    }
  };
  
  // Calculate total cost
  const totalCost = (parseFloat(mintPrice) * mintAmount).toFixed(5);
  
  // If not connected, show connect wallet prompt
  if (!connected) {
    return (
      <Container>
        <div className="max-w-lg w-full mx-auto px-4">
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800/70 dark:to-gray-900/70 backdrop-blur-md rounded-2xl p-8 shadow-xl text-center border border-gray-300/20 dark:border-gray-600/20">
            <div className="mb-6 relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl opacity-20 blur-lg"></div>
              <div className="relative">
                <Image 
                  src="/murmuration.jpg" 
                  alt="Murmuration 666"
                  width={600}
                  height={600}
                  className="rounded-xl shadow-lg mb-8 mx-auto"
                />
              </div>
            </div>
            
            <div className="mb-6 text-gray-700 dark:text-gray-300">
              Connect your wallet to mint Murmuration NFTs 
            </div>
            
	
          </div>
        </div>
      </Container>
    );
  }
  
  return (
    <Container>
      <div className="max-w-lg w-full mx-auto px-4">
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800/70 dark:to-gray-900/70 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-gray-300/20 dark:border-gray-600/20">
          <div className="mb-8 flex flex-col items-center">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl opacity-20 blur-lg"></div>
              <div className="relative">
                <Image 
                  src="/murmuration.jpg" 
                  alt="Murmuration 666"
                  width={600}
                  height={600}
                  className="rounded-xl shadow-lg mb-4"
                />
              </div>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400 text-center mt-4">
              A mesmerizing on-chain algorithmic animation that's uniquely yours.
            </div>
          </div>
          
          <div className="mb-6">
            <div className="text-xl text-gray-800 dark:text-white mb-2">
              Minted: {supplyInfo.minted} / {supplyInfo.total} NFTs
            </div>
            <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2.5 rounded-full transition-all duration-1000 ease-out" 
                style={{
                  width: `${(supplyInfo.minted / supplyInfo.total) * 100}%`
                }}
              ></div>
            </div>
          </div>

          {/* Network Indicator & Switcher */}
          <div className="flex justify-center items-center mb-6 flex-wrap gap-2">
            <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-800 px-4 py-2 rounded-full flex items-center">
              <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                isOnBera ? 'bg-green-500' : 'bg-red-500'
              }`}></span>
              <span>
                Current Network: <span className="font-bold">
                  {isOnBera ? 'Berachain' : 'Unsupported Network'}
                </span>
              </span>
            </div>
          </div>
          
          {/* Mint status indicator */}
          {isOnBera && !isMintActive && (
            <div className="bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6 text-yellow-800 dark:text-yellow-200 text-center">
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Public minting is not active yet</span>
              </div>
            </div>
          )}
          
          {/* Mint success message */}
          {mintTxHash && (
            <div className="bg-green-100 dark:bg-green-900/50 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6 text-green-800 dark:text-green-200">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Successfully minted {mintAmount} NFT(s)!</span>
              </div>
              <div className="text-sm">
                Transaction hash: 
                <a 
                  href={`${NETWORKS.bera.blockExplorer}/tx/${mintTxHash}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-1 underline hover:text-green-700 dark:hover:text-green-300"
                >
                  {mintTxHash.slice(0, 10)}...{mintTxHash.slice(-8)}
                </a>
              </div>
            </div>
          )}
          
          {/* Tabs for mint options */}
          <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>            
            <Tab.Panels>
              {/* Mint Tab */}
              <Tab.Panel>
                {!isOnBera ? (
                  <div className="text-center p-5 mb-4 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="text-yellow-800 dark:text-yellow-200 mb-3">
                      Please connect to Bera network to mint
                    </div>
                    <button 
                      onClick={handleSwitchToBera}
                      disabled={networkSwitching}
                      className={`px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg shadow-md transition-all
                        ${networkSwitching ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {networkSwitching ? 
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Switching...
                        </span> 
                        : 'Switch to Bera'
                      }
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Mint amount selector */}
                    <div className="flex items-center justify-center mb-6">
                      <label className="mr-4 text-gray-700 dark:text-gray-300 font-medium">Quantity:</label>
                      <div className="flex items-center shadow-md rounded-lg overflow-hidden">
                        <button 
                          onClick={() => setMintAmount(Math.max(1, mintAmount - 1))}
                          className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 font-bold"
                        >
                          -
                        </button>
                        <input 
                          type="number" 
                          value={mintAmount}
                          onChange={(e) => setMintAmount(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-16 text-center bg-white dark:bg-gray-700 text-gray-800 dark:text-white py-2 border-0"
                          min="1"
                          max="10"
                        />
                        <button 
                          onClick={() => setMintAmount(Math.min(10, mintAmount + 1))}
                          className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Price Information */}
                    <div className="flex justify-between items-center mb-6 p-4 bg-gray-200 dark:bg-gray-700/50 rounded-lg">
                      <div className="text-gray-800 dark:text-white">
                        <span className="block text-sm">Price per NFT</span>
                        <span className="font-bold">{mintPrice} BERA</span>
                      </div>
                      <div className="text-right text-gray-800 dark:text-white">
                        <span className="block text-sm">Total</span>
                        <span className="font-bold">{totalCost} BERA</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={handleMint} 
                      disabled={mintLoading || supplyInfo.minted >= supplyInfo.total || !isMintActive}
                      className={`w-full py-3 px-6 rounded-lg flex items-center justify-center font-bold text-white transition-all ${
                        supplyInfo.minted >= supplyInfo.total || !isMintActive
                          ? 'bg-gray-500 cursor-not-allowed' 
                          : mintLoading 
                            ? 'bg-indigo-700 cursor-wait' 
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg'
                      }`}
                    >
                      {mintLoading && (
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {supplyInfo.minted >= supplyInfo.total 
                        ? 'Sold Out' 
                        : !isMintActive
                          ? 'Minting Not Active'
                          : mintLoading 
                            ? 'Processing...' 
                            : `Mint ${mintAmount} NFT${mintAmount > 1 ? 's' : ''}`}
                    </button>
                  </>
                )}
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </Container>
  );
};

export default MurmurationPage;