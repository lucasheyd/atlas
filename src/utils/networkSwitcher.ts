// utils/networkSwitcher.ts

import { ethers } from 'ethers';
import { NETWORKS } from './networks';

// Add Base Sepolia to networks if it doesn't exist
if (!NETWORKS.baseSepolia) {
  NETWORKS.baseSepolia = {
    name: 'Base Sepolia',
    chainId: '0x14a34',
    currency: 'ETH',
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org'
  };
}

// Helper function to switch networks without using ethers.js for verification
export async function switchToNetwork(networkName: 'base' | 'bera' | 'baseSepolia'): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ethereum) {
    console.error('No crypto wallet found. Please install Metamask.');
    return false;
  }
  
  const network = NETWORKS[networkName];
  console.log(`Attempting to switch to ${network.name}...`);
  
  try {
    // Try to switch to the network
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: network.chainId }],
    });
    
    // If we get here, the request didn't throw, so it was likely successful
    console.log(`Switch request to ${network.name} was successful`);
    return true;
    
  } catch (switchError: any) {
    console.log(`Switch error (code: ${switchError.code}):`, switchError);
    
    // If the chain is not added to MetaMask (code 4902), add it
    if (switchError.code === 4902) {
      try {
        console.log(`${network.name} not found in wallet, attempting to add it...`);
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
        
        console.log(`${network.name} network added, now trying to switch...`);
        
        // Try switching again after adding
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: network.chainId }],
        });
        
        console.log(`Switch request to ${network.name} after adding was successful`);
        return true;
        
      } catch (addError) {
        console.error(`Failed to add ${network.name} network`, addError);
        return false;
      }
    } 
    // Handle user rejection separately
    else if (switchError.code === 4001) {
      console.log("User rejected the network switch request");
      return false;
    } 
    // Handle other errors
    else {
      console.error(`Failed to switch to ${network.name}`, switchError);
      return false;
    }
  }
}

// Check which network we're currently on using window.ethereum directly
export async function getCurrentNetwork(): Promise<'bera' | 'base' | 'baseSepolia' | 'unknown'> {
  if (typeof window === 'undefined' || !window.ethereum) {
    return 'unknown';
  }
  
  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    
    if (chainId === NETWORKS.bera.chainId) {
      return 'bera';
    } else if (chainId === NETWORKS.base.chainId) {
      return 'base';
    } else if (chainId === NETWORKS.baseSepolia.chainId) {
      return 'baseSepolia';
    } else {
      return 'unknown';
    }
  } catch (error) {
    console.error("Error getting current network:", error);
    return 'unknown';
  }
}

// Check if the network is Base or Base Sepolia
export function isBaseNetwork(chainId: string): boolean {
  return chainId === NETWORKS.base.chainId || chainId === NETWORKS.baseSepolia.chainId;
}

// Get network name from chain ID
export function getNetworkName(chainId: string): string {
  if (chainId === NETWORKS.bera.chainId) {
    return NETWORKS.bera.name;
  } else if (chainId === NETWORKS.base.chainId) {
    return NETWORKS.base.name;
  } else if (chainId === NETWORKS.baseSepolia.chainId) {
    return NETWORKS.baseSepolia.name;
  } else {
    return 'Unknown Network';
  }
}

// Function to check and switch network for compatibility with both old and new code
export const checkAndSwitchNetwork = async (
  provider: ethers.providers.Web3Provider,
  networkName: 'base' | 'bera' | 'baseSepolia'
): Promise<boolean> => {
  return switchToNetwork(networkName);
};