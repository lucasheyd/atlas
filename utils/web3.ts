"use client";
import React, { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';

// Replace with your contract details
const CONTRACT_ADDRESS = '0xcfc07303a4e916663259c3283a191b3c92a4af2c'; // Your contract address
const CONTRACT_ABI = [
  // Your contract ABI here
  {
    "inputs": [],
    "name": "yourReadFunction",
    "outputs": [{"type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

export const Web3Interaction: React.FC = () => {
  const { activate, active, library, account, deactivate } = useWeb3React();
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [contractData, setContractData] = useState<string | null>(null);

  // Initialize contract when wallet is connected
  useEffect(() => {
    if (library && account) {
      try {
        const signer = library.getSigner();
        const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        setContract(contractInstance);
      } catch (error) {
        console.error('Error initializing contract', error);
      }
    }
  }, [library, account]);

  // Function to connect wallet
  const connectWallet = async () => {
    try {
      const { InjectedConnector } = await import('@web3-react/injected-connector');
      const injected = new InjectedConnector({
        supportedChainIds: [1, 3, 4, 5, 42, 1337]
      });
      await activate(injected);
    } catch (error) {
      console.error('Wallet connection error', error);
    }
  };

  // Function to read contract data
  const readContractData = async () => {
    if (contract) {
      try {
        // Replace 'yourReadFunction' with an actual function from your contract
        const data = await contract.yourReadFunction();
        setContractData(data.toString());
      } catch (error) {
        console.error('Error reading contract', error);
      }
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
        Web3 Contract Interaction
      </h2>

      {!active ? (
        <button 
          onClick={connectWallet}
          className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition"
        >
          Connect Wallet
        </button>
      ) : (
        <div>
          <div className="mb-4">
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              Connected Account:
            </p>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-md overflow-hidden text-ellipsis">
              {account}
            </div>
          </div>

          <button 
            onClick={readContractData}
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition mb-4"
          >
            Read Contract Data
          </button>

          {contractData && (
            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-md mb-4">
              Contract Data: {contractData}
            </div>
          )}

          <button 
            onClick={() => deactivate()}
            className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600 transition"
          >
            Disconnect Wallet
          </button>
        </div>
      )}
    </div>
  );
};