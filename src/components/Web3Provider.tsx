"use client";

import React, { useEffect, createContext, useContext, useState } from 'react';
import { Web3ReactProvider } from '@web3-react/core';
import { Web3Provider as EthersWeb3Provider } from '@ethersproject/providers';
import Web3ErrorBoundary from './Web3ErrorBoundary';
import { ethers } from 'ethers';

// Create context for network activity data
export interface NetworkActivityData {
  ethereum?: {
    balance: number;
    nftCount: number;
    transactions: number;
    stakedAmount: number;
    lastUpdate: number;
  };
  polygon?: {
    balance: number;
    nftCount: number;
    transactions: number;
    stakedAmount: number;
    lastUpdate: number;
  };
  arbitrum?: {
    balance: number;
    nftCount: number;
    transactions: number;
    stakedAmount: number;
    lastUpdate: number;
  };
  optimism?: {
    balance: number;
    nftCount: number;
    transactions: number;
    stakedAmount: number;
    lastUpdate: number;
  };
  base?: {
    balance: number;
    nftCount: number;
    transactions: number;
    stakedAmount: number;
    lastUpdate: number;
  };
  zksync?: {
    balance: number;
    nftCount: number;
    transactions: number;
    stakedAmount: number;
    lastUpdate: number;
  };
  avalanche?: {
    balance: number;
    nftCount: number;
    transactions: number;
    stakedAmount: number;
    lastUpdate: number;
  };
  [key: string]: any;
}

interface Web3Context {
  account: string | null;
  networkActivity: NetworkActivityData;
  loading: boolean;
  refreshNetworkData: () => Promise<void>;
}

// Create context
const Web3DataContext = createContext<Web3Context>({
  account: null,
  networkActivity: {},
  loading: false,
  refreshNetworkData: async () => {}
});

// Export hook for using the context
export const useWeb3Data = () => useContext(Web3DataContext);

function getLibrary(provider: any) {
  try {
    // Adicionando tratamento de erro mais robusto
    if (!provider) {
      console.debug('Provider was undefined or null');
      return null;
    }
    
    const library = new EthersWeb3Provider(provider);
    library.pollingInterval = 12000;
    
    // Sobrescrever o método detectNetwork para suprimir erros de rede
    const originalDetectNetwork = library.detectNetwork.bind(library);
    library.detectNetwork = async () => {
      try {
        return await originalDetectNetwork();
      } catch (error) {
        console.debug('Network detection error suppressed:', error);
        // Retornar uma rede padrão ou nula, dependendo do seu caso de uso
        return { chainId: 1, name: 'mainnet' }; // Fallback para mainnet
      }
    };
    
    return library;
  } catch (error) {
    console.debug('Error initializing web3 library (suppressed)', error);
    return null;
  }
}

// RPC providers for different networks
const RPC_PROVIDERS = {
  ethereum: new ethers.providers.JsonRpcProvider("https://eth.llamarpc.com"),
  polygon: new ethers.providers.JsonRpcProvider("https://polygon-rpc.com"),
  arbitrum: new ethers.providers.JsonRpcProvider("https://arb1.arbitrum.io/rpc"),
  optimism: new ethers.providers.JsonRpcProvider("https://mainnet.optimism.io"),
  base: new ethers.providers.JsonRpcProvider("https://mainnet.base.org"),
  zksync: new ethers.providers.JsonRpcProvider("https://mainnet.era.zksync.io"),
  avalanche: new ethers.providers.JsonRpcProvider("https://api.avax.network/ext/bc/C/rpc")
};

// ChainId mapping
const CHAIN_ID_MAP: { [chainId: number]: string } = {
  1: 'ethereum',
  137: 'polygon',
  42161: 'arbitrum',
  10: 'optimism',
  8453: 'base',
  324: 'zksync',
  43114: 'avalanche'
};

// Web3 Data Provider component
export function Web3DataProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [networkActivity, setNetworkActivity] = useState<NetworkActivityData>({});
  const [loading, setLoading] = useState(false);

  // Listen for account changes
  useEffect(() => {
    const checkAccount = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            setAccount(accounts[0]);
          }
        } catch (error) {
          console.debug('Failed to get accounts (suppressed)', error);
        }
      }
    };

    checkAccount();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount(null);
        }
      });
    }

    return () => {
      // Clean up listeners
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);

  // Function to fetch balance data from different networks
  const fetchNetworkData = async (account: string) => {
    if (!account) return {};
    
    const networkData: NetworkActivityData = {};
    setLoading(true);
    
    try {
      await Promise.all(
        Object.entries(RPC_PROVIDERS).map(async ([network, provider]) => {
          try {
            // Get basic balance
            const balance = await provider.getBalance(account);
            const formattedBalance = parseFloat(ethers.utils.formatEther(balance));
            
            // Get transaction count (simplified)
            const txCount = await provider.getTransactionCount(account);
            
            // For NFT count and staked amount, we'd typically use a subgraph or API
            // Using placeholders for now
            networkData[network] = {
              balance: formattedBalance,
              nftCount: 0, // Replace with actual NFT count logic
              transactions: txCount,
              stakedAmount: 0, // Replace with actual staking data
              lastUpdate: Math.floor(Date.now() / 1000)
            };
          } catch (error) {
            console.debug(`Error fetching data for ${network} (suppressed):`, error);
            // Set default values on error
            networkData[network] = {
              balance: 0,
              nftCount: 0,
              transactions: 0,
              stakedAmount: 0,
              lastUpdate: Math.floor(Date.now() / 1000)
            };
          }
        })
      );
      
      setNetworkActivity(networkData);
    } catch (error) {
      console.debug('Error fetching network data (suppressed):', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when account changes
  useEffect(() => {
    if (account) {
      fetchNetworkData(account);
    }
  }, [account]);

  // Function to manually refresh network data
  const refreshNetworkData = async () => {
    if (account) {
      await fetchNetworkData(account);
    }
  };

  return (
    <Web3DataContext.Provider value={{ 
      account, 
      networkActivity, 
      loading,
      refreshNetworkData
    }}>
      {children}
    </Web3DataContext.Provider>
  );
}

export function Web3ProviderWrapper({ children }: { children: React.ReactNode }) {
  // Adicionar efeito para capturar erros da biblioteca web3-react
  useEffect(() => {
    // Interceptar erros que possam vir do Web3React
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      // Filtrar erros específicos do Web3React
      const web3ReactErrors = [
        '@web3-react',
        'Web3ReactDeactivate',
        'Web3ReactUpdate',
        'Web3ReactError',
        'ChainIdNotAllowed',
        'UnsupportedChainId',
        'NoEthereumProvider',
        'UserRejected'
      ];
      
      const shouldSuppress = web3ReactErrors.some(errorPattern => 
        args.some(arg => 
          typeof arg === 'string' && arg.includes(errorPattern)
        )
      );
      
      if (!shouldSuppress) {
        originalConsoleError(...args);
      } else {
        console.debug('Web3React error suppressed:', ...args);
      }
    };
    
    return () => {
      console.error = originalConsoleError;
    };
  }, []);
  
  return (
    <Web3ErrorBoundary>
      <Web3ReactProvider getLibrary={getLibrary}>
        <Web3DataProvider>
          {children}
        </Web3DataProvider>
      </Web3ReactProvider>
    </Web3ErrorBoundary>
  );
}