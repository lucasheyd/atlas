// utils/wallet.ts
import { ethers } from 'ethers';

// Network definitions
export const NETWORKS = {
  base: {
    chainId: '0x2105', // 8453 em hexadecimal
    chainName: 'Base',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://mainnet.base.org'],
    blockExplorerUrls: ['https://basescan.org']
  },
  baseSepolia: {
    chainId: '0x14a34', // 84532 em hexadecimal
    chainName: 'Base Sepolia',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://sepolia.base.org'],
    blockExplorerUrls: ['https://sepolia.basescan.org']
  },
  bera: {
    chainId: '0x138DE', 
    chainName: 'Berachain',
    nativeCurrency: {
      name: 'BERA',
      symbol: 'BERA',
      decimals: 18
    },
    rpcUrls: ['https://rpc.bera.io'],
    blockExplorerUrls: ['https://berascan.com']
  },
  beraTestnet: {
    chainId: '0x1389e', // 80094 em hexadecimal
    chainName: 'Bera Testnet',
    nativeCurrency: {
      name: 'BERA',
      symbol: 'BERA',
      decimals: 18
    },
    rpcUrls: ['https://artio.rpc.berachain.com/'],
    blockExplorerUrls: ['https://artio.beratrail.io/']
  }
};

// Function to connect wallet
export const connectWallet = async (): Promise<string> => {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('No crypto wallet found. Please install Metamask or other wallet.');
    }

    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    // Create provider and get signer
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    
    return address;
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw new Error('Failed to connect wallet');
  }
};

// Get provider
export const getProvider = (): ethers.providers.Web3Provider | null => {
  if (typeof window !== 'undefined' && window.ethereum) {
    return new ethers.providers.Web3Provider(window.ethereum);
  }
  return null;
};

// Check if on Base network
export const isOnBaseNetwork = async (): Promise<boolean> => {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      return false;
    }
    
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    return chainId === NETWORKS.base.chainId || chainId === NETWORKS.baseSepolia.chainId;
  } catch (error) {
    console.error('Error checking network:', error);
    return false;
  }
};

// Check if on Bera network
export const isOnBeraNetwork = async (): Promise<boolean> => {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      return false;
    }
    
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    return chainId === NETWORKS.bera.chainId || chainId === NETWORKS.beraTestnet.chainId;
  } catch (error) {
    console.error('Error checking network:', error);
    return false;
  }
};

// Switch to Base network
export const switchToBaseNetwork = async (): Promise<void> => {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('No crypto wallet found. Please install Metamask.');
    }
    
    // Try to switch to Base
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NETWORKS.base.chainId }],
      });
    } catch (switchError: any) {
      // If the chain is not added to MetaMask, add it first
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: NETWORKS.base.chainId,
              chainName: NETWORKS.base.chainName,
              nativeCurrency: NETWORKS.base.nativeCurrency,
              rpcUrls: NETWORKS.base.rpcUrls,
              blockExplorerUrls: NETWORKS.base.blockExplorerUrls
            },
          ],
        });
      } else {
        throw switchError;
      }
    }
  } catch (error) {
    console.error('Error switching to Base network:', error);
    throw new Error('Failed to switch to Base network');
  }
};

// Switch to Bera network
export const switchToBeraNetwork = async (): Promise<void> => {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('No crypto wallet found. Please install Metamask.');
    }
    
    // Try to switch to Bera
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NETWORKS.bera.chainId }],
      });
    } catch (switchError: any) {
      // If the chain is not added to MetaMask, add it first
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: NETWORKS.bera.chainId,
              chainName: NETWORKS.bera.chainName,
              nativeCurrency: NETWORKS.bera.nativeCurrency,
              rpcUrls: NETWORKS.bera.rpcUrls,
              blockExplorerUrls: NETWORKS.bera.blockExplorerUrls
            },
          ],
        });
      } else {
        throw switchError;
      }
    }
  } catch (error) {
    console.error('Error switching to Bera network:', error);
    throw new Error('Failed to switch to Bera network');
  }
};

// Get current chain ID
export const getCurrentChainId = async (): Promise<string> => {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('No crypto wallet found');
    }
    
    return await window.ethereum.request({ method: 'eth_chainId' });
  } catch (error) {
    console.error('Error getting chain ID:', error);
    throw new Error('Failed to get chain ID');
  }
};