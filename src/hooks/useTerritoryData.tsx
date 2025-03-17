// src/hooks/useTerritoryData.tsx
import { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { ethers } from 'ethers';
import { ActivityData } from '../Maps3d/types/ActivityData';
import { Territory } from '../Maps3d/types/Territory';

// Function to generate mock data (fallback)
const generateMockData = (tokenId: number, networkId: string): ActivityData => {
  const seed = tokenId * networkId.length;
  const randomValue = (min: number, max: number) => {
    const x = Math.sin(seed * 0.1) * 10000;
    const r = x - Math.floor(x);
    return min + Math.floor(r * (max - min));
  };
  
  return {
    balance: randomValue(0, 10) + randomValue(0, 100) / 100,
    nftCount: randomValue(0, 20),
    transactions: randomValue(10, 500),
    stakedAmount: randomValue(0, 5) + randomValue(0, 100) / 100,
    lastUpdate: Math.floor(Date.now() / 1000) - randomValue(0, 86400 * 7)
  };
};

// RPC URLs for different networks
const RPC_URLS = {
  ethereum: 'https://eth.llamarpc.com',
  polygon: 'https://polygon-rpc.com',
  arbitrum: 'https://arb1.arbitrum.io/rpc',
  optimism: 'https://mainnet.optimism.io',
  base: 'https://mainnet.base.org',
  zksync: 'https://mainnet.era.zksync.io',
  avalanche: 'https://api.avax.network/ext/bc/C/rpc'
};

export function useTerritoryData(territory: Territory | null, tokenId: string) {
  const { active, account } = useWeb3React<Web3Provider>();
  const [activityData, setActivityData] = useState<ActivityData | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!territory) return;

    const fetchData = async () => {
      // Always generate mock data first as fallback
      const mockData = generateMockData(parseInt(tokenId), territory.id);
      
      // If not connected, just use mock data
      if (!active || !account) {
        setActivityData(mockData);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Get RPC URL for the network
        const rpcUrl = RPC_URLS[territory.id];
        if (!rpcUrl) {
          throw new Error(`No RPC URL for network: ${territory.id}`);
        }
        
        // Create provider
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        
        // Get balance
        const balance = await provider.getBalance(account).catch(() => ethers.BigNumber.from(0));
        
        // Get transaction count
        const txCount = await provider.getTransactionCount(account).catch(() => 0);
        
        // Set data
        setActivityData({
          balance: parseFloat(ethers.utils.formatEther(balance)),
          nftCount: mockData.nftCount, // We'll keep using mock data for NFTs
          transactions: txCount,
          stakedAmount: mockData.stakedAmount, // We'll keep using mock data for staking
          lastUpdate: Math.floor(Date.now() / 1000)
        });
      } catch (err) {
        console.debug('Error fetching blockchain data:', err);
        setError('Failed to fetch blockchain data');
        
        // Use mock data as fallback
        setActivityData(mockData);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [territory, active, account, tokenId]);

  return { activityData, loading, error };
}