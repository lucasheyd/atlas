"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ethers } from 'ethers';
import { Container } from "@/components/Container";
import { getUserNFTs as getFractalNFTs } from '@/utils/contract';
import { getUserNFTs as getBeraNFTs } from '@/utils/beraContract';
import Image from 'next/image';

export default function GalleryPage() {
  const [userTokens, setUserTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [activeCollection, setActiveCollection] = useState<'fractal' | 'bera'>('fractal');
  const [error, setError] = useState<string | null>(null);
  const [networkSwitching, setNetworkSwitching] = useState(false);

  useEffect(() => {
    const fetchNFTs = async () => {
      // Reset states
      setLoading(true);
      setError(null);
      setNetworkSwitching(true);

      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const web3Provider = new ethers.providers.Web3Provider((window as any).ethereum);
          setProvider(web3Provider);

          // Adicionar um pequeno atraso para garantir a mudança de rede
          await new Promise(resolve => setTimeout(resolve, 1500));

          let nfts: any[] = [];
          
          if (activeCollection === 'fractal') {
            nfts = await getFractalNFTs(web3Provider);
          } else {
            nfts = await getBeraNFTs(web3Provider);
          }
          
          setUserTokens(nfts);
        } catch (fetchError) {
          console.error('Error fetching NFTs:', fetchError);
          setError('Failed to fetch NFTs. Please try again.');
        } finally {
          setLoading(false);
          setNetworkSwitching(false);
        }
      } else {
        setError('Ethereum provider not found. Please install MetaMask.');
        setLoading(false);
        setNetworkSwitching(false);
      }
    };

    fetchNFTs();
  }, [activeCollection]);

  const handleCollectionToggle = (collection: 'fractal' | 'bera') => {
    setActiveCollection(collection);
  };

  return (
    <Container>
      <div className="flex flex-col items-center">
        <div className="flex justify-center mb-6 bg-gray-200 dark:bg-gray-700 rounded-full p-1">
          <button
            onClick={() => handleCollectionToggle('fractal')}
            className={`px-4 py-2 rounded-full transition-colors duration-200 ${
              activeCollection === 'fractal' 
                ? 'bg-indigo-600 text-white' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Fractal Swarm
          </button>
          <button
            onClick={() => handleCollectionToggle('bera')}
            className={`px-4 py-2 rounded-full transition-colors duration-200 ${
              activeCollection === 'bera' 
                ? 'bg-indigo-600 text-white' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Murmuration
          </button>
        </div>
        
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
          {activeCollection === 'fractal' ? 'Fractal Swarm' : 'Murmuration'} Gallery
        </h2>
        
        {networkSwitching ? (
          <p className="text-gray-600 dark:text-gray-300">
            Switching network... Please wait.
          </p>
           ) : loading ? (
          <p className="text-gray-600 dark:text-gray-300">
            Loading your NFTs...
          </p>
        ) : error ? (
          <div className="w-full max-w-md">
            <div className="bg-red-100 dark:bg-red-900/50 p-6 rounded-lg shadow-md">
              <p className="text-red-800 dark:text-red-200 text-center mb-4">
                {error}
              </p>
            </div>
          </div>
        ) : userTokens.length === 0 ? (
          <div className="w-full max-w-md">
            <div className="bg-gray-100 dark:bg-gray-800/50 p-6 rounded-lg shadow-md">
              <p className="text-gray-800 dark:text-white text-center mb-4">
                You don't have any {activeCollection === 'fractal' ? 'Fractal Swarm' : 'Murmuration'} NFTs yet.
              </p>
              <Link 
                href={activeCollection === 'fractal' ? "/mint" : "/murmuration"} 
                className="block text-center"
              >
                <button className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700">
                  Mint Your First NFT
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 justify-center">
            {userTokens.map(token => (
              <Link 
                href={`/view/${activeCollection}/${token.id}`} 
                key={token.id}
              >
                <div className="bg-gray-100 dark:bg-gray-800/50 rounded-lg overflow-hidden shadow-md transform transition-transform duration-200 hover:scale-105">
                  <div className="relative w-full h-0 pb-[100%] mb-3">
                    {token.image ? (
                      <Image 
                        src={token.image}
                        alt={token.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-gray-500 dark:text-gray-400">
                          No Image
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1 truncate">
                      {token.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      ID: {token.id}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}