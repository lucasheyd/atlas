"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
  redeemBurnedTokens,
  redeemBurnedTokensWithMerkle,
  loadMerkleProofs,
  isOnBeraNetwork,
  isOnBaseNetwork,
  switchToBeraNetwork,
  switchToBaseNetwork,
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
  const [tokenIds, setTokenIds] = useState('');
  const [redemptionRate, setRedemptionRate] = useState(25);
  const [connected, setConnected] = useState(false);
  const [networkSwitching, setNetworkSwitching] = useState(false);
  
  // States for burn tracking
  const [burnedTokens, setBurnedTokens] = useState<number[]>([]);
  const [burnTxHash, setBurnTxHash] = useState('');

  // Network states
  const [isOnBera, setIsOnBera] = useState(false);
  const [isOnBase, setIsOnBase] = useState(false);

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
    // Verificar se já temos provas no localStorage
    const proofs = localStorage.getItem('merkleProofs');
    const lastLoaded = localStorage.getItem('merkleProofsLastLoaded');
    
    const needsRefresh = !proofs || !lastLoaded || 
      // Recarregar se a última carga foi há mais de 2 horas
      (new Date().getTime() - new Date(lastLoaded).getTime() > 2 * 60 * 60 * 1000);
    
    if (needsRefresh) {
      console.log('Carregando provas Merkle do servidor...');
      await loadMerkleProofs();
    } else {
      console.log('Usando provas Merkle do armazenamento local');
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
    
    // Use the new switching function
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
    try {
      const txHash = await mintMurmuration(provider, mintAmount);
      
      // Refresh supply after minting
      const updatedSupply = await getMurmurationSupply(provider);
      setSupplyInfo(updatedSupply);
      
      alert(`Successfully minted ${mintAmount} Murmuration NFT(s)! Transaction hash: ${txHash}`);
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
  
  // Update token IDs input field for redemption
  setTokenIds(burnedTokenIds.join(', '));
};


  // Parse token IDs from input
  const parseTokenIds = (): number[] => {
    if (!tokenIds.trim()) return [];
    
    try {
      // Handle various formats: comma-separated, space-separated, or JSON array
      if (tokenIds.includes('[') && tokenIds.includes(']')) {
        return JSON.parse(tokenIds);
      } else {
        return tokenIds
          .split(/[\s,]+/) // Split by commas or whitespace
          .map(id => id.trim())
          .filter(id => id !== '')
          .map(id => parseInt(id));
      }
    } catch (error) {
      console.error('Error parsing token IDs:', error);
      return [];
    }
  };

  // Burn and Redeem
 // Updated Burn and Redeem function without network check
const handleRedeemBurned = async () => {
  if (!provider) return;
  
  if (!burnTxHash) {
    alert('Por favor, insira o hash da transação de queima');
    return;
  }
  
  setRedeemLoading(true);
  setBurnStatus('Verificando transação de queima...');
  
  try {
    // Primeiro, verificar se as provas Merkle existem
    const proofs = localStorage.getItem('merkleProofs');
    if (!proofs) {
      await loadMerkleProofs(); // Carregar caso não existam
    }
    
    // Buscar tokens queimados automaticamente
    const burnResult = await fetchBurnedTokensFromTx(burnTxHash);
    
    if (!burnResult.success || burnResult.tokenIds.length === 0) {
      setBurnStatus('❌ Não foi possível verificar os tokens queimados');
      setRedeemLoading(false);
      return;
    }
    
    // Verificar se o número de tokens corresponde à taxa de resgate
    if (burnResult.tokenIds.length !== redemptionRate) {
      setBurnStatus(`❌ Número incorreto de tokens. Necessário: ${redemptionRate}, Encontrados: ${burnResult.tokenIds.length}`);
      setRedeemLoading(false);
      return;
    }
    
    // Executar resgate com Merkle proof
    const txHash = await redeemBurnedTokensWithMerkle(
      provider, 
      burnResult.tokenIds, 
      burnTxHash
    );
    
    // Atualizar informações de suprimento
    const updatedSupply = await getMurmurationSupply(provider);
    setSupplyInfo(updatedSupply);
    
    setBurnStatus(`✅ Resgate bem-sucedido! TX: ${txHash.slice(0, 10)}...`);
    
    // Limpar campos
    setTokenIds('');
    setBurnTxHash('');
  } catch (error) {
    console.error('Erro no resgate:', error);
    setBurnStatus(`❌ Erro: ${error.message || 'Falha no resgate'}`);
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
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl text-center">
            An algorithmic art collection of 666 murmurations - the magical formations of starling flocks in flight.
          </p>
        </div>

        <div className="max-w-lg w-full mx-auto px-4">
          <div className="bg-gray-100 dark:bg-gray-800/50 backdrop-blur-md rounded-2xl p-8 shadow-xl text-center">
            <Image 
              src="/murmurations.png" 
              alt="Murmuration 666"
              width={256}
              height={256}
              className="rounded-xl shadow-lg mb-8 mx-auto"
            />
            
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              Connect your wallet to mint Murmuration NFTs or redeem burned Fractal tokens.
            </p>
            
            <button 
              onClick={connectWallet}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
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
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl text-center">
          An algorithmic art collection of 666 murmurations - the magical formations of starling flocks in flight.
        </p>
      </div>

      <div className="max-w-lg w-full mx-auto px-4">
        <div className="bg-gray-100 dark:bg-gray-800/50 backdrop-blur-md rounded-2xl p-8 shadow-xl">
          <div className="mb-8 flex flex-col items-center">
            <Image 
              src="/murmurations.png" // Replace with your image
              alt="Murmuration 666"
              width={256}
              height={256}
              className="rounded-xl shadow-lg mb-4"
            />
            
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              A mesmerizing on-chain algorithmic animation that's uniquely yours.
            </p>
          </div>
          
          <div className="mb-6">
            <p className="text-xl text-gray-800 dark:text-white">
              Minted: {supplyInfo.minted} / {supplyInfo.total} NFTs
            </p>
            <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-2.5 mt-2">
              <div 
                className="bg-indigo-600 h-2.5 rounded-full" 
                style={{
                  width: `${(supplyInfo.minted / supplyInfo.total) * 100}%`
                }}
              ></div>
            </div>
          </div>

          {/* Network Indicator & Switcher */}
          <div className="flex justify-center items-center mb-4 flex-wrap gap-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Current Network: <span className="font-bold">
                {isOnBera ? 'Berachain' : 
                 isOnBase ? 'Base' : 
                 currentChainId ? 'Unsupported Network' : 'Not Connected'}
              </span>
            </span>
          </div>
          
          {/* Tabs for different mint options */}
           <Tab.Group>
  {/*           <Tab.List className="flex rounded-xl bg-gray-200 dark:bg-gray-700 p-1 mb-6">                 */}
  {/*             <Tab className={({ selected }) => `w-full rounded-lg py-2 text-sm font-medium leading-5     */}
 {/*                ${selected      */} 
  {/*                 ? 'bg-indigo-600 text-white shadow' */}
  {/*                 : 'text-gray-700 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'}`}     */} 
   {/*            >  */}
   {/*              Mint */}
 {/*              </Tab>   */}
 {/*              <Tab className={({ selected }) => `w-full rounded-lg py-2 text-sm font-medium leading-5  */}
 {/*               ${selected  */}
 {/*                 ? 'bg-indigo-600 text-white shadow'  */}
  {/*                : 'text-gray-700 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'}`} */}
 {/*             > */}
  {/*              Redeem Burned Tokens */}
{/*              </Tab> */} 
{/*            </Tab.List> */}
            
            <Tab.Panels>
              {/* Mint Tab */}
              <Tab.Panel>
                {!isOnBera ? (
                  <div className="text-center p-4 mb-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                    <p className="text-yellow-800 dark:text-yellow-200">
                      Please connect to Bera network to mint
                    </p>
                    <button 
                      onClick={() => handleSwitchNetwork('bera')}
                      disabled={networkSwitching}
                      className={`mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 
                        ${networkSwitching ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {networkSwitching ? 'Switching...' : 'Switch to Bera'}
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Mint amount selector */}
                    <div className="flex items-center justify-center mb-4">
                      <div className="flex items-center">
                        <button 
                          onClick={() => setMintAmount(Math.max(1, mintAmount - 1))}
                          className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-3 py-1 rounded-l"
                        >
                          -
                        </button>
                        <input 
                          type="number" 
                          value={mintAmount}
                          onChange={(e) => setMintAmount(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-16 text-center bg-white dark:bg-gray-700 text-gray-800 dark:text-white p-1 border-t border-b border-gray-300 dark:border-gray-600"
                        />
                        <button 
                          onClick={() => setMintAmount(mintAmount + 1)}
                          className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-3 py-1 rounded-r"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Price Information */}
                    <div className="text-center mb-4">
                      <p className="text-gray-800 dark:text-white">
                        Price per NFT: {mintPrice} BERA
                      </p>
                      <p className="text-gray-800 dark:text-white font-bold">
                        Total Cost: {totalCost} BERA
                      </p>
                    </div>
                    
                    <button 
                      onClick={handleMint} 
                      disabled={mintLoading || supplyInfo.minted >= supplyInfo.total}
                      className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {mintLoading 
                        ? 'Minting...' 
                        : supplyInfo.minted >= supplyInfo.total 
                          ? 'Sold Out' 
                          : `Mint ${mintAmount} Murmuration NFT(s)`}
                    </button>
                  </>
                )}
              </Tab.Panel>
              
              {/* Burn Redemption Tab */}
              <Tab.Panel>
                <div className="space-y-4">
                  {/* Instructions */}
                  <div className="p-4 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-2">
                      Cross-Chain Redemption
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Burn {redemptionRate} Fractal tokens on Base network to mint 1 Murmuration NFT on Berachain.
                    </p>
                  </div>
                  
                  {/* Step 1: Select and Burn Tokens (on Base) */}
                  <div className="border-b border-gray-300 dark:border-gray-700 pb-6">
                    <h4 className="font-medium text-gray-800 dark:text-white mb-3">
                      Step 1: Select and Burn Tokens (Base Network)
                    </h4>
                    
                    <FractalTokenSelection 
                      redemptionRate={redemptionRate}
                      onBurnComplete={handleBurnComplete}
                      onNetworkChange={(isOnBase) => setIsOnBase(isOnBase)}
                    />
                  </div>
                  
                  {/* Step 2: Redeem for Murmuration (on Bera) */}
                  <div className="pt-4">
                    <h4 className="font-medium text-gray-800 dark:text-white mb-3">
                      Step 2: Redeem for Murmuration NFT (Bera Network)
                    </h4>
                       <div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
    Burn Transaction Hash
  </label>
  <input
    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
    placeholder="0x..."
    value={burnTxHash}
    onChange={(e) => setBurnTxHash(e.target.value)}
  />
  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
    Enter the transaction hash where you burned your tokens on Base Network
  </p>
</div>

                    
                    {!isOnBera ? (
                      <div className="text-center p-4 mb-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                        <p className="text-yellow-800 dark:text-yellow-200">
                          Please connect to Bera network to redeem burned tokens
                        </p>
<button 
  onClick={handleRedeemBurned} 
  disabled={redeemLoading || !burnTxHash}
  className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
>
  {redeemLoading 
    ? 'Processing...' 
    : `Verify and Redeem NFT`}
</button>                      <button 
                          onClick={() => handleSwitchNetwork('bera')}
                          disabled={networkSwitching}
                          className={`mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700
                            ${networkSwitching ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {networkSwitching ? 'Switching...' : 'Switch to Bera'}
                        </button>
                      </div>
                    ) : (
                      <>
                        {burnStatus && (
                          <div className={`p-3 rounded-lg text-sm mb-4 ${
                            burnStatus.includes('✅') 
                              ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200' 
                              : burnStatus.includes('❌') 
                                ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'
                                : 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200'
                          }`}>
                            {burnStatus}
                          </div>
                        )}
                        
                        <div className="space-y-4">
                          <div>
                    
<button 
  onClick={handleRedeemBurned} 
  disabled={redeemLoading || !burnTxHash}
  className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
>
  {redeemLoading 
    ? 'Processing...' 
    : `Redeem NFT`}
</button>       
                          </div>
        
                          
                          <p className="text-center text-gray-500 dark:text-gray-400 text-xs">
                            Note: You must have already burned your Fractal tokens on Base network.
                          </p>
                        </div>
                      </>
                    )}
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