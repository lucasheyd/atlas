"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Define the context type
interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

// Create the context
const WalletContext = createContext<WalletContextType>({
  address: null,
  isConnected: false,
  connectWallet: async () => {},
  disconnectWallet: () => {}
});

// Provider component
export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Connect wallet function
  const connectWallet = async () => {
    if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
      try {
        // Request account access
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });

        // Set the first account
        setAddress(ethers.utils.getAddress(accounts[0]));
        setIsConnected(true);
      } catch (error) {
        console.error('Error connecting wallet:', error);
        setAddress(null);
        setIsConnected(false);
      }
    } else {
      console.warn('MetaMask not detected');
    }
  };

  // Disconnect wallet function
  const disconnectWallet = () => {
    setAddress(null);
    setIsConnected(false);
  };

  // Check connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts',
          });

          if (accounts.length > 0) {
            setAddress(ethers.utils.getAddress(accounts[0]));
            setIsConnected(true);
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };

    checkConnection();

    // Handle account changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAddress(ethers.utils.getAddress(accounts[0]));
        setIsConnected(true);
      } else {
        setAddress(null);
        setIsConnected(false);
      }
    };

    // Handle network changes
    const handleChainChanged = () => {
      window.location.reload();
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    // Cleanup listeners
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  // Render the provider with context values
  return (
    <WalletContext.Provider 
      value={{ 
        address, 
        isConnected, 
        connectWallet, 
        disconnectWallet 
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

// Custom hook to use the wallet context
export const useWallet = () => useContext(WalletContext);

// Optional: Connect Wallet Button Component
export const ConnectWalletButton: React.FC = () => {
  const { address, isConnected, connectWallet } = useWallet();

  if (isConnected) {
    return (
      <div className="px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-green-200 dark:border-green-800/30 shadow-sm">
        {address?.substring(0, 6)}...{address?.substring(address.length - 4)}
      </div>
    );
  }

  return (
    <button 
      onClick={connectWallet}
      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl shadow-md"
    >
      Connect Wallet
    </button>
  );
};