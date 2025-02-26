// utils/CrosschainUtils.ts
import { ethers } from 'ethers';
import { NETWORKS } from './networks';

// Define network keys for easier type safety
export type NetworkKey = 'base' | 'bera' | 'ethereum' | 'optimism' | 'linea' | 'soneium';

// Define cross-chain connection status interface
export interface CrossChainStatus {
  connected: boolean;
  currentNetwork: NetworkKey | null;
  availableNetworks: NetworkKey[];
  isCorrectNetwork: boolean;
  targetNetwork: NetworkKey | null;
  switching: boolean;
}

// Default status
const defaultStatus: CrossChainStatus = {
  connected: false,
  currentNetwork: null,
  availableNetworks: ['ethereum', 'base', 'bera', 'optimism', 'linea', 'soneium'],
  isCorrectNetwork: false,
  targetNetwork: null,
  switching: false
};

// Get network key from chain ID
export const getNetworkFromChainId = (chainIdHex: string): NetworkKey | null => {
  for (const [key, network] of Object.entries(NETWORKS)) {
    if (network.chainId === chainIdHex) {
      return key as NetworkKey;
    }
  }
  return null;
};

// Get current connection status
export const getCurrentNetworkStatus = async (targetNetwork?: NetworkKey): Promise<CrossChainStatus> => {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      return { ...defaultStatus };
    }

    // Create provider
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    
    // Check if connected
    const accounts = await provider.listAccounts();
    const connected = accounts.length > 0;
    
    if (!connected) {
      return { ...defaultStatus, connected };
    }
    
    // Get current chain ID
    const { chainId } = await provider.getNetwork();
    const chainIdHex = `0x${chainId.toString(16)}`;
    
    // Determine current network
    const currentNetwork = getNetworkFromChainId(chainIdHex);
    
    // Check if current network matches target
    const isCorrectNetwork = targetNetwork ? currentNetwork === targetNetwork : true;
    
    return {
      connected,
      currentNetwork,
      availableNetworks: Object.keys(NETWORKS) as NetworkKey[],
      isCorrectNetwork,
      targetNetwork: targetNetwork || null,
      switching: false
    };
  } catch (error) {
    console.error('Error getting network status:', error);
    return { ...defaultStatus };
  }
};

// Switch to a specific network
export const switchToNetwork = async (networkKey: NetworkKey): Promise<boolean> => {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      return false;
    }
    
    const network = NETWORKS[networkKey as keyof typeof NETWORKS];
    
    if (!network) {
      console.error(`Network ${networkKey} not found in configuration`);
      return false;
    }
    
    console.log(`Switching to ${network.name} network...`);
    
    try {
      // Try to switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: network.chainId }],
      });
    } catch (switchError: any) {
      // If the network isn't added yet, add it
      if (switchError.code === 4902) {
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
        
        // Try switching again after adding
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: network.chainId }],
        });
      } else {
        throw switchError;
      }
    }
    
    // Verify the switch was successful
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const { chainId } = await provider.getNetwork();
    const chainIdHex = `0x${chainId.toString(16)}`;
    
    if (chainIdHex !== network.chainId) {
      console.warn(`Network switch to ${network.name} may not have completed correctly`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error switching network:', error);
    return false;
  }
};

// Connect wallet
export const connectWallet = async (): Promise<string | null> => {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      console.error('No crypto wallet found. Please install Metamask.');
      return null;
    }
    
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    
    // Request account access
    await provider.send('eth_requestAccounts', []);
    
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    
    return address;
  } catch (error) {
    console.error('Error connecting wallet:', error);
    return null;
  }
};

// Helper function to ensure correct network for a specific operation
export const ensureCorrectNetwork = async (
  operationName: string, 
  requiredNetwork: NetworkKey
): Promise<boolean> => {
  try {
    // Get current status
    const status = await getCurrentNetworkStatus(requiredNetwork);
    
    if (!status.connected) {
      const address = await connectWallet();
      if (!address) {
        console.error(`Cannot perform ${operationName}: Wallet not connected`);
        return false;
      }
    }
    
    // Check if on correct network
    if (!status.isCorrectNetwork) {
      console.log(`${operationName} requires ${requiredNetwork} network. Attempting to switch...`);
      const switched = await switchToNetwork(requiredNetwork);
      
      if (!switched) {
        console.error(`Failed to switch to ${requiredNetwork} network for ${operationName}`);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error(`Error ensuring correct network for ${operationName}:`, error);
    return false;
  }
};

// React hook for network information (can be used in your React components)
export function useCrosschainRedirect(
  requiredNetwork: NetworkKey,
  operationTitle: string = 'this operation'
): {
  redirect: () => Promise<boolean>;
  status: CrossChainStatus;
  refresh: () => Promise<void>;
} {
  // This is a pseudo-implementation since we're not in a React file
  // You would need to implement this with useState and useEffect in a React component
  
  // For now, we'll just return the functions
  return {
    redirect: async () => {
      return await ensureCorrectNetwork(operationTitle, requiredNetwork);
    },
    status: defaultStatus, // In a real hook, this would be state
    refresh: async () => {
      // In a real hook, this would update state
      await getCurrentNetworkStatus(requiredNetwork);
    }
  };
}

export default {
  switchToNetwork,
  getCurrentNetworkStatus,
  connectWallet,
  ensureCorrectNetwork,
  getNetworkFromChainId
};