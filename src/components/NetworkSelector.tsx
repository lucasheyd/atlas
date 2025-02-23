// components/NetworkSelector.tsx
import React from 'react';
import Image from 'next/image';
import { NETWORKS, NetworkKey, switchNetwork } from '@/utils/networks';

interface NetworkSelectorProps {
  selectedNetwork: NetworkKey;
  onNetworkChange: (network: NetworkKey) => void;
}

export const NetworkSelector = ({ selectedNetwork, onNetworkChange }: NetworkSelectorProps) => {
  const handleNetworkChange = async (network: NetworkKey) => {
    try {
      await switchNetwork(network);
      onNetworkChange(network);
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {(Object.keys(NETWORKS) as NetworkKey[]).map((networkKey) => {
        const network = NETWORKS[networkKey];
        return (
          <button
            key={networkKey}
            onClick={() => handleNetworkChange(networkKey)}
            className={`p-4 rounded-lg border ${
              selectedNetwork === networkKey
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
            } transition-colors`}
          >
            <div className="flex items-center space-x-3">
              {network.icon && (
                <Image
                  src={network.icon}
                  alt={network.name}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              )}
              <span className="font-medium text-sm">{network.name}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};