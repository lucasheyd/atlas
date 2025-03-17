// src/hooks/useWeb3Data.ts
import { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { ethers } from 'ethers';
import { ActivityData } from '../Maps3d/types/ActivityData';

// Simplified RPC endpoints - use public endpoints
const RPC_ENDPOINTS = {
  ethereum: 'https://eth.llamarpc.com',
  polygon: 'https://polygon-rpc.com',
  arbitrum: 'https://arb1.arbitrum.io/rpc',
  optimism: 'https://mainnet.optimism.io',
  base: 'https://mainnet.base.org',
  zksync: 'https://mainnet.era.zksync.io',
  avalanche: 'https://api.avax.network/ext/bc/C/rpc'
};

export function useWeb3Data(networkId?: string) {
  const { account, active, library } = useWeb3React<Web3Provider>();
  const [loading, setLoading] = useState(false);
  const [activityData, setActivityData] = useState<ActivityData | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active || !account || !networkId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Choose the right endpoint based on network ID
        const endpoint = RPC_ENDPOINTS[networkId];
        if (!endpoint) {
          throw new Error(`No RPC endpoint configured for network: ${networkId}`);
        }
        
        // Create a provider for the specific network
        const provider = new ethers.providers.JsonRpcProvider(endpoint);
        
        // Get balance
        const balance = await provider.getBalance(account).catch(() => ethers.BigNumber.from(0));
        
        // Get transaction count
        const txCount = await provider.getTransactionCount(account).catch(() => 0);
        
        // Set activity data
        setActivityData({
          balance: parseFloat(ethers.utils.formatEther(balance)),
          nftCount: 0, // This needs a more complex implementation with NFT APIs
          transactions: txCount,
          stakedAmount: 0, // This would require checking specific staking contracts
          lastUpdate: Math.floor(Date.now() / 1000)
        });
      } catch (err) {
        console.debug('Error fetching web3 data (suppressed):', err);
        setError('Could not fetch blockchain data');
        
        // Set default empty data
        setActivityData({
          balance: 0,
          nftCount: 0,
          transactions: 0,
          stakedAmount: 0,
          lastUpdate: Math.floor(Date.now() / 1000)
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [account, active, networkId]);

  return {
    loading,
    activityData,
    error,
    isConnected: active && !!account
  };
}