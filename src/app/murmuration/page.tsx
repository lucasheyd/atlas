"use client";

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { ethers } from 'ethers';
import { Container } from "@/components/Container";
import Image from 'next/image';
import { Tab } from '@headlessui/react';
import { NETWORKS } from '@/utils/networks';
import FractalTokenSelection from '@/components/FractalTokenSelection';
import { switchToNetwork, getCurrentNetwork } from '@/utils/networkSwitcher';
import { 
  mintMurmuration, 
  getMurmurationSupply, 
  getMurmurationPrice, 
  redeemBurnedTokensWithMerkle,
  loadMerkleProofs,
  isOnBeraNetwork,
  isOnBaseNetwork,
  getRedemptionRate,
  fetchBurnedTokensFromTx
} from '@/utils/murmurationContract';


export default function MurmurationPage() {
  // States for mint
  const [mintAmount, setMintAmount] = useState(1);
  const [mintLoading, setMintLoading] = useState(false);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [supplyInfo, setSupplyInfo] = useState({
    minted: 0,
    total: 666
  });
  const [mintPrice, setMintPrice] = useState('1');
  const [currentChainId, setCurrentChainId] = useState<string | null>(null);
  
  // States for burn redemption
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [burnStatus, setBurnStatus] = useState('');
  const [redemptionRate, setRedemptionRate] = useState(25);
  const [connected, setConnected] = useState(false);
  const [networkSwitching, setNetworkSwitching] = useState(false);
  
  // States for burn tracking
  const [burnedTokens, setBurnedTokens] = useState<number[]>([]);
  const [burnTxHash, setBurnTxHash] = useState('');
  const [activeTab, setActiveTab] = useState(0); // 0 for mint, 1 for redeem

  // Network states
  const [isOnBera, setIsOnBera] = useState(false);
  const [isOnBase, setIsOnBase] = useState(false);
  const [mintTxHash, setMintTxHash] = useState<string | null>(null);

  // Function to update data based on current network
  const updateDataForCurrentNetwork = useCallback(async (web3Provider: ethers.providers.Web3Provider) => {
    try {
      const beraConnected = await isOnBeraNetwork(web3Provider);
      setIsOnBera(beraConnected);
      
      const baseConnected = await isOnBaseNetwork(web3Provider);
      setIsOnBase(baseConnected);
      
      if (beraConnected) {
        console.log('Updating data for Bera network');
        const supply = await getMurmurationSupply(web3Provider);
        const price = await getMurmurationPrice(web3Provider);
        const rate = await getRedemptionRate(web3Provider);
        
        setSupplyInfo(supply);
        setMintPrice(price);
        setRedemptionRate(rate);
      }
      
      // Update chainId
      const { chainId } = await web3Provider.getNetwork();
      const chainIdHex = `0x${chainId.toString(16)}`;
      setCurrentChainId(chainIdHex);
      
    } catch (error) {
      console.error('Error updating network data:', error);
    }
  }, []);

  // Initialize provider and detect current network
  useEffect(() => {
    const initializeMerkleProofs = async () => {
      // Check if we already have proofs in localStorage
      const proofs = localStorage.getItem('merkleProofs');
      const lastLoaded = localStorage.getItem('merkleProofsLastLoaded');
      
      const needsRefresh = !proofs || !lastLoaded || 
        // Reload if last load was more than 2 hours ago
        (new Date().getTime() - new Date(lastLoaded).getTime() > 2 * 60 * 60 * 1000);
      
      if (needsRefresh) {
        console.log('Loading Merkle proofs from server...');
        await loadMerkleProofs();
      } else {
        console.log('Using Merkle proofs from local storage');
      }
    };
    
    initializeMerkleProofs();

    const initializeProvider = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(web3Provider);

        // Check current connection state
        const accounts = await web3Provider.listAccounts();
        setConnected(accounts.length > 0);

        if (accounts.length > 0) {
          // Get current network info
          await updateDataForCurrentNetwork(web3Provider);
        }
        
        // Set up event listeners
        window.ethereum.on('chainChanged', async () => {
          const updatedProvider = new ethers.providers.Web3Provider(window.ethereum);
          setProvider(updatedProvider);
          await updateDataForCurrentNetwork(updatedProvider);
        });
        
        window.ethereum.on('accountsChanged', async (accounts: string[]) => {
          setConnected(accounts.length > 0);
          if (accounts.length > 0) {
            await updateDataForCurrentNetwork(web3Provider);
          }
        });
        
        return () => {
          window.ethereum.removeListener('chainChanged', () => {});
          window.ethereum.removeListener('accountsChanged', () => {});
        };
      }
    };

    initializeProvider();
  }, [updateDataForCurrentNetwork]);

  // Connect wallet
  const connectWallet = async () => {
    if (!provider) return;
    
    try {
      await provider.send('eth_requestAccounts', []);
      setConnected(true);
      
      // Update network info after connection
      await updateDataForCurrentNetwork(provider);
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  // Switch to specific network
  const handleSwitchNetwork = async (networkKey: 'base' | 'bera') => {
    if (networkSwitching) return;
    
    try {
      setNetworkSwitching(true);
      console.log(`Attempting to switch to network: ${networkKey}`);
      
      // Use the network switching function
      const success = await switchToNetwork(networkKey);
      
      if (success) {
        console.log(`Successfully switched to ${networkKey}`);
        
        // Refresh provider after network switch
        if (window.ethereum) {
          try {
            const updatedProvider = new ethers.providers.Web3Provider(window.ethereum);
            setProvider(updatedProvider);
            
            // Check which network we're on now
            const currentNetwork = await getCurrentNetwork();
            setIsOnBera(currentNetwork === 'bera');
            setIsOnBase(currentNetwork === 'base');
            
            // Update other data if needed
            if (updatedProvider) {
              await updateDataForCurrentNetwork(updatedProvider);
            }
          } catch (providerError) {
            console.warn("Error refreshing provider after network switch:", providerError);
            // We still consider the switch successful even if refreshing the provider fails
          }
        }
      } else {
        console.warn(`User may have canceled switch to ${NETWORKS[networkKey].name} network`);
        // Don't show an alert if the user canceled
      }
    } catch (error) {
      console.error('Error in handleSwitchNetwork:', error);
      // Only show alert for errors that aren't user-cancelations
      if (error instanceof Error && !error.message.includes('User rejected')) {
        alert(`Could not switch to ${NETWORKS[networkKey].name} network. Please try manually in your wallet.`);
      }
    } finally {
      setNetworkSwitching(false);
    }
  };

  // Mint Murmuration NFTs
  const handleMint = async () => {
    if (!provider || !isOnBera) {
      alert('Please connect to Bera network to mint');
      return;
    }

    setMintLoading(true);
    setMintTxHash(null);
    
    try {
      const txHash = await mintMurmuration(provider, mintAmount);
      
      // Refresh supply after minting
      const updatedSupply = await getMurmurationSupply(provider);
      setSupplyInfo(updatedSupply);
      
      // Display success
      setMintTxHash(txHash);
    } catch (error: any) {
      console.error('Minting error:', error);
      alert(`Error minting NFT(s): ${error.message || 'Please try again'}`);
    } finally {
      setMintLoading(false);
    }
  };

  // Handle burn completion from FractalTokenSelection
  const handleBurnComplete = (txHash: string, burnedTokenIds: number[]) => {
    console.log(`Burn complete: ${txHash} for tokens: ${burnedTokenIds.join(', ')}`);
    setBurnTxHash(txHash);
    setBurnedTokens(burnedTokenIds);
    setBurnStatus(`✅ Successfully burned ${burnedTokenIds.length} tokens! You can now redeem them for a Murmuration NFT.`);
  };

  // Burn and Redeem
  const handleRedeemBurned = async () => {
    if (!provider) return;
    
    if (!burnTxHash) {
      alert('Please enter the burn transaction hash');
      return;
    }
    
    setRedeemLoading(true);
    setBurnStatus('Verifying burn transaction...');
    
    try {
      // First, check if Merkle proofs exist
      const proofs = localStorage.getItem('merkleProofs');
      if (!proofs) {
        await loadMerkleProofs(); // Load if they don't exist
      }
      
      // Fetch burned tokens automatically
      const burnResult = await fetchBurnedTokensFromTx(burnTxHash);
      
      if (!burnResult.success || burnResult.tokenIds.length === 0) {
        setBurnStatus('❌ Could not verify burned tokens');
        setRedeemLoading(false);
        return;
      }
      
      // Verify token count matches redemption rate
      if (burnResult.tokenIds.length !== redemptionRate) {
        setBurnStatus(`❌ Incorrect number of tokens. Required: ${redemptionRate}, Found: ${burnResult.tokenIds.length}`);
        setRedeemLoading(false);
        return;
      }
      
      // Execute redemption with Merkle proof
      const txHash = await redeemBurnedTokensWithMerkle(
        provider, 
        burnResult.tokenIds, 
        burnTxHash
      );
      
      // Update supply information
      const updatedSupply = await getMurmurationSupply(provider);
      setSupplyInfo(updatedSupply);
      
      setBurnStatus(`✅ Redemption successful! TX: ${txHash.slice(0, 10)}...`);
      
      // Clear fields
      setBurnTxHash('');
    } catch (error) {
      console.error('Redemption error:', error);
      setBurnStatus(`❌ Error: ${error.message || 'Redemption failed'}`);
    } finally {
      setRedeemLoading(false);
    }
  };

  // Total cost calculation
  const totalCost = (parseFloat(mintPrice) * mintAmount).toFixed(5);

  // Render wallet connection prompt if not connected
  if (!connected) {
    return (
      <Container>
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gray-800 dark:text-white">Murmuration 666</h1>
          <div className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl text-center">
            An algorithmic art collection of 666 murmurations - the magical formations of starling flocks in flight.
          </div>
        </div>

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
                  className="rounded-xl shadow-lg mb-8 mx-auto transform hover:scale-102 transition-transform duration-300"
                />
              </div>
            </div>
            
            <div className="mb-6 text-gray-700 dark:text-gray-300">
              Connect your wallet to mint Murmuration NFTs or redeem burned Fractal tokens.
            </div>
            
            <button 
              onClick={connectWallet}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-lg font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-4xl font-bold mb-2 text-gray-800 dark:text-white">Murmuration 666</h1>
        <div className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl text-center">
          An algorithmic art collection of 666 murmurations - the magical formations of starling flocks in flight.
        </div>
      </div>

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
                  className="rounded-xl shadow-lg mb-4 transform hover:scale-102 transition-transform duration-300"
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
                isOnBera ? 'bg-green-500' : isOnBase ? 'bg-blue-500' : 'bg-red-500'
              }`}></span>
              <span>
                Current Network: <span className="font-bold">
                  {isOnBera ? 'Berachain' : 
                  isOnBase ? 'Base' : 
                  currentChainId ? 'Unsupported Network' : 'Not Connected'}
                </span>
              </span>
            </div>
          </div>
          
          {/* Tabs for different mint options */}
          <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
            <Tab.List className="flex rounded-xl bg-gray-200 dark:bg-gray-700 p-1 mb-6">
              <Tab className={({ selected }) => `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
                ${selected 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow' 
                  : 'text-gray-700 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
              >
                Mint
              </Tab>
            </Tab.List>
            
            <Tab.Panels>
              {/* Mint Tab */}
              <Tab.Panel>
                {!isOnBera ? (
                  <div className="text-center p-5 mb-4 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="text-yellow-800 dark:text-yellow-200 mb-3">
                      Please connect to Bera network to mint
                    </div>
                    <button 
                      onClick={() => handleSwitchNetwork('bera')}
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
                            href={`https://berascan.com/tx/${mintTxHash}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ml-1 underline hover:text-green-700 dark:hover:text-green-300"
                          >
                            {mintTxHash.slice(0, 10)}...{mintTxHash.slice(-8)}
                          </a>
                        </div>
                      </div>
                    )}
                    
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
                      disabled={mintLoading || supplyInfo.minted >= supplyInfo.total}
                      className={`w-full py-3 px-6 rounded-lg flex items-center justify-center font-bold text-white transition-all ${
                        supplyInfo.minted >= supplyInfo.total 
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
                        : mintLoading 
                          ? 'Processing...' 
                          : `Mint ${mintAmount} NFT${mintAmount > 1 ? 's' : ''}`}
                    </button>
                  </>
                )}
              </Tab.Panel>
              
              {/* Burn Redemption Tab */}
              <Tab.Panel>
                <div className="space-y-6">
                  {/* Instructions */}
                  <div className="p-5 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg border border-indigo-200 dark:border-indigo-800/50">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-2">
                      Cross-Chain Redemption
                    </h3>
                    <div className="text-gray-700 dark:text-gray-300">
                      Burn {redemptionRate} Fractal tokens on Base network to mint 1 Murmuration NFT on Berachain.
                    </div>
                  </div>
                  
                  {/* Step 1: Select and Burn Tokens (on Base) */}
                  <div className="border-b border-gray-300 dark:border-gray-700 pb-6">
                    <h4 className="font-medium text-gray-800 dark:text-white mb-3 flex items-center">
                      <span className="bg-blue-600 text-white w-6 h-6 rounded-full inline-flex items-center justify-center mr-2 text-sm">1</span>
                      Select and Burn Tokens (Base Network)
                    </h4>
                    
                    <FractalTokenSelection 
                      redemptionRate={redemptionRate}
                      onBurnComplete={handleBurnComplete}
                      onNetworkChange={(isOnBase) => setIsOnBase(isOnBase)}
                    />
                  </div>
                  
                  {/* Step 2: Redeem for Murmuration (on Bera) */}
                  <div className="pt-4">
                    <h4 className="font-medium text-gray-800 dark:text-white mb-3 flex items-center">
                      <span className="bg-purple-600 text-white w-6 h-6 rounded-full inline-flex items-center justify-center mr-2 text-sm">2</span>
                      Redeem for Murmuration NFT (Bera Network)
                    </h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Burn Transaction Hash
                        </label>
                        <input
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                          placeholder="0x..."
                          value={burnTxHash}
                          onChange={(e) => setBurnTxHash(e.target.value)}
                        />
                        <div className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                          Enter the transaction hash where you burned your tokens on Base Network
                        </div>
                      </div>
                    
                      {!isOnBera ? (
                        <div className="text-center p-5 mb-4 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <div className="text-yellow-800 dark:text-yellow-200 mb-3">
                            Please connect to Bera network to redeem burned tokens
                          </div>
                          <button 
                            onClick={() => handleSwitchNetwork('bera')}
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
                          <button 
                            onClick={handleRedeemBurned} 
                            disabled={redeemLoading || !burnTxHash}
                            className="mt-3 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-2.5 rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {redeemLoading 
                              ? <span className="flex items-center justify-center">
                                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Processing...
                                </span>
                              : `Verify and Redeem NFT`
                            }
                          </button>
                        </div>
                      ) : (
                        <>
                          {burnStatus && (
                            <div className={`p-4 rounded-lg text-sm mb-4 ${
                              burnStatus.includes('✅') 
                                ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800/50' 
                                : burnStatus.includes('❌') 
                                  ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800/50'
                                  : 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800/50'
                            }`}>
                              {burnStatus}
                            </div>
                          )}
                          
                          <button 
                            onClick={handleRedeemBurned} 
                            disabled={redeemLoading || !burnTxHash}
                            className={`w-full py-3 px-6 rounded-lg flex items-center justify-center font-bold text-white transition-all ${
                              !burnTxHash
                                ? 'bg-gray-500 cursor-not-allowed' 
                                : redeemLoading 
                                  ? 'bg-indigo-700 cursor-wait' 
                                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg'
                            }`}
                          >
                            {redeemLoading && (
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            )}
                            {redeemLoading 
                              ? 'Processing...' 
                              : `Redeem NFT`
                            }
                          </button>
                          
                          <div className="mt-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                            Note: You must have already burned your Fractal tokens on Base network.
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </Container>
  );
}