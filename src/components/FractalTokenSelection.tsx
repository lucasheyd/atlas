import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Image from 'next/image';
import { 
  getFractalTokens, 
  burnTokensSimplified,
  isOnBaseNetwork, 
  switchToBaseNetwork 
} from '@/utils/murmurationContract';

interface FractalTokenSelectionProps {
  redemptionRate: number;
  onBurnComplete?: (txHash: string, tokenIds: number[]) => void;
  onNetworkChange?: (isOnBase: boolean) => void;
}

const FractalTokenSelection: React.FC<FractalTokenSelectionProps> = ({ 
  redemptionRate, 
  onBurnComplete, 
  onNetworkChange 
}) => {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [userTokens, setUserTokens] = useState<number[]>([]);
  const [selectedTokens, setSelectedTokens] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isOnBase, setIsOnBase] = useState(false);
  const [networkSwitching, setNetworkSwitching] = useState(false);
  const [manualTokensInput, setManualTokensInput] = useState('');

  // Initialize provider
  useEffect(() => {
  if (typeof window !== 'undefined' && window.ethereum) {
    const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(web3Provider);
    
    // Check if on Base network
    checkNetwork(web3Provider);
    
    // Função para lidar com mudanças de rede
    const handleChainChanged = () => {
      console.log("Network changed, updating provider...");
      // Limpar seleções atuais
      setSelectedTokens([]);
      setSuccessMessage('');
      
      // Importante: criar um novo provider após a mudança de rede
      setTimeout(() => {
        const updatedProvider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(updatedProvider);
        checkNetwork(updatedProvider);
      }, 500);
    };
    
    // Função para lidar com mudanças de conta
    const handleAccountsChanged = () => {
      console.log("Account changed, refreshing tokens...");
      // Limpar seleções atuais
      setSelectedTokens([]);
      setSuccessMessage('');
      
      setTimeout(() => {
        const updatedProvider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(updatedProvider);
        loadUserTokens(updatedProvider);
      }, 500);
    };
    
    // Adicionar listeners
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    
    return () => {
      // Remover listeners de forma correta
      window.ethereum.removeListener('chainChanged', handleChainChanged);
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }
}, []);
  
  // Check if connected to Base network
  const checkNetwork = async (web3Provider: ethers.providers.Web3Provider) => {
  try {
    // Limpar mensagens
    setErrorMessage('');
    
    const baseNetwork = await isOnBaseNetwork(web3Provider);
    setIsOnBase(baseNetwork);
    
    if (onNetworkChange) {
      onNetworkChange(baseNetwork);
    }
    
    if (baseNetwork) {
      // Se estiver na Base, carregar tokens depois de um breve atraso para permitir que a rede estabilize
      setTimeout(() => {
        loadUserTokens(web3Provider);
      }, 500);
    } else {
      // Se não estiver na Base, limpar tokens
      setUserTokens([]);
    }
  } catch (error) {
    console.error("Error checking network:", error);
    setIsOnBase(false);
    setUserTokens([]);
  }
};
  
  // Switch to Base network
  const handleSwitchNetwork = async () => {
  if (networkSwitching || !provider) return;
  
  try {
    setNetworkSwitching(true);
    setErrorMessage('');
    
    const success = await switchToBaseNetwork(provider);
    
    if (success) {
      console.log("Switched to Base network successfully");
      
      // Aguardar para permitir que a rede estabilize
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Usar o ethereum global para garantir que temos o estado mais recente
      if (window.ethereum) {
        const updatedProvider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(updatedProvider);
        await checkNetwork(updatedProvider);
      }
    } else {
      // O usuário pode ter cancelado a troca
      console.log("Network switch canceled or failed");
      setErrorMessage("Couldn't switch to Base network. Please try manually in your wallet.");
    }
  } catch (error: any) {
    console.error("Failed to switch network:", error);
    setErrorMessage(error.message || "Failed to switch to Base network");
  } finally {
    setNetworkSwitching(false);
  }
};

  // Load user tokens from the contract
const loadUserTokens = async (providerInstance: ethers.providers.Web3Provider | null = null) => {
  try {
    setTokenLoading(true);
    setErrorMessage("");
    
    const currentProvider = providerInstance || provider;
    
    if (!currentProvider) {
      setErrorMessage("Provider not available. Please connect your wallet.");
      setTokenLoading(false);
      return;
    }
    
    // Verificar a rede e tentar lidar com a mudança 
    const baseConnected = await isOnBaseNetwork(currentProvider);
    setIsOnBase(baseConnected);
    
    if (!baseConnected) {
      console.log("Not on Base network. Please switch networks.");
      setErrorMessage("Please connect to Base network to view your tokens");
      setUserTokens([]);
      setTokenLoading(false);
      return;
    }
    
    // Obter tokens apenas se estiver na Base
    try {
      const tokenIds = await getFractalTokens(currentProvider);
      
      if (tokenIds.length === 0) {
        setErrorMessage("No Fractal tokens found in your wallet");
      } else {
        setUserTokens(tokenIds);
        setErrorMessage("");
      }
    } catch (contractError) {
      console.error("Error fetching tokens:", contractError);
      setErrorMessage("Failed to load tokens from contract");
    }
  } catch (error) {
    console.error("Error loading tokens:", error);
    setErrorMessage("Failed to load tokens. Please try again.");
  } finally {
    setTokenLoading(false);
  }
};

  // Handle token selection
  const toggleTokenSelection = (tokenId: number) => {
    if (selectedTokens.includes(tokenId)) {
      // Remove token from selection
      setSelectedTokens(selectedTokens.filter(id => id !== tokenId));
    } else {
      // Check if we've already selected the max number of tokens
      if (selectedTokens.length < redemptionRate) {
        // Add token to selection
        setSelectedTokens([...selectedTokens, tokenId]);
      }
    }
  };
  
  // Select tokens automatically
  const handleAutoSelect = () => {
    if (userTokens.length >= redemptionRate) {
      setSelectedTokens(userTokens.slice(0, redemptionRate));
    } else {
      setSelectedTokens([...userTokens]);
    }
  };
  
  // Parse and set manual token IDs
  const handleManualTokensSubmit = () => {
    try {
      const tokenIds = parseManualTokens(manualTokensInput);
      
      // Validate tokens are in the correct format and valid
      if (tokenIds.length === 0) {
        setErrorMessage("Please enter valid token IDs");
        return;
      }
      
      if (tokenIds.length > redemptionRate) {
        setErrorMessage(`You can only select up to ${redemptionRate} tokens`);
        return;
      }
      
      // Set the selected tokens
      setSelectedTokens(tokenIds);
      setSuccessMessage(`Selected ${tokenIds.length} tokens: ${tokenIds.join(', ')}`);
    } catch (error: any) {
      setErrorMessage(error.message || "Invalid token ID format");
    }
  };


  
  // Parse manual tokens input
  const parseManualTokens = (input: string): number[] => {
    if (!input.trim()) return [];
    
    try {
      // Handle various formats: comma-separated, space-separated, or JSON array
      if (input.includes('[') && input.includes(']')) {
        return JSON.parse(input);
      } else {
        const ids = input
          .split(/[\s,]+/) // Split by commas or whitespace
          .map(id => id.trim())
          .filter(id => id !== '')
          .map(id => parseInt(id));
          
        // Check if all values are valid numbers
        if (ids.some(isNaN)) {
          throw new Error("Some token IDs are not valid numbers");
        }
        
        return ids;
      }
    } catch (error) {
      console.error('Error parsing token IDs:', error);
      throw error;
    }
  };
  
  // Clear selection
  const handleClearSelection = () => {
    setSelectedTokens([]);
    setManualTokensInput('');
    setSuccessMessage('');
    setErrorMessage('');
  };

  // Burn selected tokens using the simplified approach
  const handleBurnTokens = async () => {
    try {
      setIsLoading(true);
      
      // Check if exactly 25 tokens are selected
      if (selectedTokens.length !== redemptionRate) {
        setErrorMessage(`You must select exactly ${redemptionRate} tokens for redemption`);
        setIsLoading(false);
        return;
      }
      
      // Call the simplified burn function
      const result = await burnTokensSimplified(provider!, selectedTokens);
      
      if (result.success) {
        const successMsg = `All ${selectedTokens.length} tokens were successfully burned!`;
        setSuccessMessage(successMsg);
        
        // Callback with transaction hash
        if (onBurnComplete) {
          onBurnComplete(result.txHash, selectedTokens);
        }
        
        // Clear selection
        setSelectedTokens([]);
      } else {
        setErrorMessage(result.errorMessage || 'Failed to burn tokens');
      }
    } catch (error) {
      console.error('Complete burn error:', error);
      setErrorMessage('Unexpected error while burning tokens');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!isOnBase ? (
        <div className="text-center p-4 mb-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
          <p className="text-yellow-800 dark:text-yellow-200 mb-2">
            Please connect to Base network to select and burn tokens
          </p>
          <button 
            onClick={handleSwitchNetwork}
            disabled={networkSwitching}
            className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
              ${networkSwitching ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {networkSwitching ? 'Switching...' : 'Switch to Base Network'}
          </button>
        </div>
      ) : (
        <>
          {errorMessage && (
            <div className="p-3 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded-lg text-sm">
              {errorMessage}
            </div>
          )}
          
          {successMessage && (
            <div className="p-3 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded-lg text-sm">
              {successMessage}
            </div>
          )}
          
          <div className="p-4 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
            <h3 className="font-bold text-gray-800 dark:text-white mb-2">
              Select Fractal Tokens to Burn
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Select {redemptionRate} tokens to burn for redemption on Berachain. Tokens will be permanently destroyed.
            </p>
          </div>
          
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              You own {userTokens.length} tokens
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Selected: {selectedTokens.length} / {redemptionRate}
            </span>
          </div>
          
          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              onClick={handleAutoSelect}
              disabled={userTokens.length < 1 || isLoading}
              className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Auto-Select {Math.min(userTokens.length, redemptionRate)} Tokens
            </button>
            
            <button
              onClick={handleClearSelection}
              disabled={selectedTokens.length === 0 || isLoading}
              className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Clear Selection
            </button>
            
            <button
              onClick={() => loadUserTokens(provider!)}
              disabled={!provider || isLoading || tokenLoading}
              className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              {tokenLoading ? 'Loading...' : 'Refresh Tokens'}
            </button>
          </div>
          
          {/* Manual token ID input */}
          <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Manually Enter Token IDs (comma separated)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualTokensInput}
                onChange={(e) => setManualTokensInput(e.target.value)}
                placeholder="e.g. 123, 456, 789"
                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                disabled={isLoading}
              />
              <button
                onClick={handleManualTokensSubmit}
                disabled={!manualTokensInput.trim() || isLoading}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Select
              </button>
            </div>
          </div>
          
          {/* Token grid */}
          {tokenLoading ? (
            <div className="text-center p-4">
              <p className="text-gray-500 dark:text-gray-400">Loading your tokens...</p>
            </div>
          ) : userTokens.length === 0 ? (
            <div className="text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">You don't own any Fractal tokens to burn</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-60 overflow-y-auto p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              {userTokens.map(tokenId => (
                <div
                  key={tokenId}
                  onClick={() => toggleTokenSelection(tokenId)}
                  className={`p-2 text-center rounded cursor-pointer transition ${
                    selectedTokens.includes(tokenId)
                      ? 'bg-blue-500 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-blue-100 dark:hover:bg-blue-900/30'
                  }`}
                >
                  #{tokenId}
                </div>
              ))}
            </div>
          )}
          
          {/* Selected tokens summary */}
          {selectedTokens.length > 0 && (
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm">
              <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                Selected Tokens:
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                {selectedTokens.map(id => `#${id}`).join(', ')}
              </div>
            </div>
          )}
          
          {/* Burn button */}
          <button
            onClick={handleBurnTokens}
            disabled={isLoading || selectedTokens.length !== redemptionRate}
            className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading 
              ? 'Processing...' 
              : selectedTokens.length === redemptionRate 
                ? `Burn ${selectedTokens.length} Tokens for Redemption` 
                : `Burn ${selectedTokens.length} Tokens (Need ${redemptionRate})`}
          </button>
          
          <p className="text-center text-gray-500 dark:text-gray-400 text-xs">
            Warning: This action cannot be undone. Tokens will be permanently burned.
          </p>
        </>
      )}
    </div>
  );
};

export default FractalTokenSelection;