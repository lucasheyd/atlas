"use client";

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Container } from "@/components/Container";
import { mintNFT, getTotalSupply, getMintPrice } from '@/utils/contract';
import Image from 'next/image';

export default function MintPage() {
  const [mintAmount, setMintAmount] = useState(1);
  const [mintLoading, setMintLoading] = useState(false);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [supplyInfo, setSupplyInfo] = useState({
    minted: 0,
    total: 10000
  });
  const [mintPrice, setMintPrice] = useState('0');

  // Initialize provider and fetch initial data
useEffect(() => {
  const initializeWeb3 = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const web3Provider = new ethers.providers.Web3Provider((window as any).ethereum);
      setProvider(web3Provider);

      try {
        const supply = await getTotalSupply(web3Provider);
        const price = await getMintPrice(web3Provider);
        
        setSupplyInfo(supply); // Change this line
        setMintPrice(price);
      } catch (error) {
        console.error('Error fetching supply or price:', error);
      }
    }
  };

  initializeWeb3();
}, []);

  // Mint NFTs
const handleMint = async () => {
  if (!provider) return;

  setMintLoading(true);
  try {
    const txHash = await mintNFT(provider, mintAmount);
    
    // Refresh supply after minting
    const updatedSupply = await getTotalSupply(provider);
    setSupplyInfo(updatedSupply);
    
    alert(`Successfully minted ${mintAmount} NFT(s)! Transaction hash: ${txHash}`);
  } catch (error) {
    console.error('Minting error:', error);
    alert('Error minting NFT(s). Please try again.');
  } finally {
    setMintLoading(false);
  }
};

  // Total cost calculation
  const totalCost = (parseFloat(mintPrice) * mintAmount).toFixed(5);

  return (
    <Container>
      <div className="max-w-lg w-full mx-auto px-4">
        <div className="bg-gray-100 dark:bg-gray-800/50 backdrop-blur-md rounded-2xl p-8 shadow-xl">
          <div className="mb-8 flex flex-col items-center">
            <h2 className="text-4xl font-bold mb-4 text-gray-800 dark:text-white">
              Mint Fractal Swarm
            </h2>
            <Image 
 		 src="/fractal.png"
 		 alt="Fractal Swarm NFT"
		  width={256}
 		 height={256}
		  className="rounded-xl shadow-lg"
	    />
          </div>
          
          <div className="mb-6">
            <p className="text-xl text-gray-800 dark:text-white">
              Minted: {supplyInfo.minted} / {supplyInfo.total} NFTs
            </p>
            <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-2.5 mt-2">
              <div 
                className="bg-indigo-600 h-2.5 rounded-full" 
                style={{
                  width: `${(supplyInfo.minted / supplyInfo.total) * 100}%`
                }}
              ></div>
            </div>
          </div>
          
          {/* Mint amount selector */}
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center">
              <button 
                onClick={() => setMintAmount(Math.max(1, mintAmount - 1))}
                className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-2 py-1 rounded-l"
              >
                -
              </button>
              <input 
                type="number" 
                value={mintAmount}
                onChange={(e) => setMintAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 text-center bg-white dark:bg-gray-700 text-gray-800 dark:text-white p-1 border-t border-b border-gray-300 dark:border-gray-600"
              />
              <button 
                onClick={() => setMintAmount(mintAmount + 1)}
                className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-2 py-1 rounded-r"
              >
                +
              </button>
            </div>
          </div>

          {/* Price Information */}
          <div className="text-center mb-4">
            <p className="text-gray-800 dark:text-white">
              Price per NFT: {mintPrice} ETH
            </p>
            <p className="text-gray-800 dark:text-white font-bold">
              Total Cost: {totalCost} ETH
            </p>
          </div>
          
          <button 
            onClick={handleMint} 
            disabled={mintLoading || supplyInfo.minted >= supplyInfo.total}
            className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {mintLoading 
              ? 'Minting...' 
              : supplyInfo.minted >= supplyInfo.total 
                ? 'Sold Out' 
                : `Mint ${mintAmount} NFT(s)`}
          </button>
        </div>
      </div>
    </Container>
  );
}