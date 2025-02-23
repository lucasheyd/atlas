// src/utils/wallet.ts
import { ethers } from 'ethers';

// Base Mainnet chain details
export const BASE_MAINNET = {
  chainId: 8453,
  chainName: 'Base Mainnet',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: ['https://mainnet.base.org'],
  blockExplorerUrls: ['https://basescan.org']
};

// Switch to Base Network
export async function switchToBaseNetwork() {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    try {
      // Request to switch network
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${BASE_MAINNET.chainId.toString(16)}` }]
      });
    } catch (switchError: any) {
      // If network not added, add it
      if (switchError.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [BASE_MAINNET]
          });
        } catch (addError) {
          console.error('Failed to add Base network');
          throw addError;
        }
      }
    }
  }
}

// Connect wallet
export async function connectWallet() {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    try {
      // Request account access
      const accounts = await (window as any).ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      // Switch to Base network
      await switchToBaseNetwork();
      
      // Return first account
      return accounts[0];
    } catch (error) {
      console.error('Wallet connection failed', error);
      throw error;
    }
  } else {
    throw new Error('Ethereum wallet not found');
  }
}

// Check if connected to Base network
export async function isOnBaseNetwork() {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    try {
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const network = await provider.getNetwork();
      return network.chainId === BASE_MAINNET.chainId;
    } catch (error) {
      console.error('Network check failed', error);
      return false;
    }
  }
  return false;
}

// Get provider
export function getProvider() {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    return new ethers.providers.Web3Provider((window as any).ethereum);
  }
  // Fallback to a default provider if window.ethereum is not available
  return new ethers.providers.JsonRpcProvider(BASE_MAINNET.rpcUrls[0]);
}