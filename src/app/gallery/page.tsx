"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ethers } from 'ethers';
import { Container } from "@/components/Container";
import { getUserNFTs } from '@/utils/contract';
import Image from 'next/image';

export default function GalleryPage() {
  const [userTokens, setUserTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);

  useEffect(() => {
    const fetchNFTs = async () => {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const web3Provider = new ethers.providers.Web3Provider((window as any).ethereum);
        setProvider(web3Provider);

        try {
          const nfts = await getUserNFTs(web3Provider);
          setUserTokens(nfts);
        } catch (error) {
          console.error('Error fetching NFTs:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchNFTs();
  }, []);

  return (
    <Container>
      <div className="flex flex-col items-center">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
          My NFT Gallery
        </h2>
        
        {loading ? (
          <p className="text-gray-600 dark:text-gray-300">
            Loading your NFTs...
          </p>
        ) : userTokens.length === 0 ? (
          <div className="w-full max-w-md">
            <div className="bg-gray-100 dark:bg-gray-800/50 p-6 rounded-lg shadow-md">
              <p className="text-gray-800 dark:text-white text-center mb-4">
                You don't have any NFTs yet.
              </p>
              <Link 
                href="/mint" 
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
       <Link href={`/view/${token.id}`} key={token.id}>
       <div className="bg-gray-100 dark:bg-gray-800/50 rounded-lg overflow-hidden shadow-md transform transition-transform   duration-200 hover:scale-105">
         <div className="relative w-full h-0 pb-[100%] mb-3">
           {token.image && (
            <Image 
               src={token.image}
               alt={token.name}
               fill
               className="object-cover"
           />
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