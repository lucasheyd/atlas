"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { getNFTDetails } from '@/utils/contract';

// Define the type for the NFT details based on the return type in contract.ts
type NFTDetails = {
  id: string;
  name: string;
  description?: string;
  image?: string;
  animationUrl?: string;
  attributes?: any[];
};

// Define the type for the params
type ViewNFTPageProps = {
  params: {
    id: string;
  };
};

export default function ViewNFTPage(props: ViewNFTPageProps) {
  // Safely extract tokenId
  const tokenId = props.params?.id ?? '';
  const [nftDetails, setNftDetails] = useState<NFTDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const fetchNFTDetails = async () => {
      if (!tokenId) {
        console.warn('No token ID provided');
        setNftDetails(null);
        setLoading(false);
        return;
      }

      try {
        const details = await getNFTDetails(tokenId);
        console.log('Fetched NFT Details:', details);
        setNftDetails(details);
      } catch (error) {
        console.error('Error fetching NFT details:', error);
        setNftDetails(null);
      } finally {
        setLoading(false);
      }
    };

    fetchNFTDetails();
  }, [tokenId]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (iframeRef.current?.requestFullscreen) {
        iframeRef.current.requestFullscreen();
      } else if (iframeRef.current?.mozRequestFullScreen) {
        iframeRef.current.mozRequestFullScreen();
      } else if (iframeRef.current?.webkitRequestFullscreen) {
        iframeRef.current.webkitRequestFullscreen();
      } else if (iframeRef.current?.msRequestFullscreen) {
        iframeRef.current.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  if (loading) {
    return <div className="mint-container text-white text-center">Loading NFT details...</div>;
  }

  if (!nftDetails) {
    return <div className="mint-container text-white text-center">
      {tokenId ? 'NFT not found or error occurred.' : 'No token ID provided.'}
    </div>;
  }

  // Fallback to image if no animation URL
  const displayUrl = nftDetails.animationUrl || nftDetails.image;

  return (
    <div className="mint-container">
      <div className="max-w-7xl w-full mx-auto px-4">
        <div className="bg-gray-1000/50 backdrop-blur-md rounded-2xl p-8 shadow-xl">
          <h2 className="text-4xl font-bold text-white mb-6 text-center">{nftDetails.name}</h2>
          
          {displayUrl ? (
            <div className="relative w-full" style={{ paddingBottom: '85%' }}>
              <iframe
                ref={iframeRef}
                src={displayUrl}
                className="absolute inset-0 w-full h-full rounded-lg"
                sandbox="allow-scripts"
                title={nftDetails.name}
              />
              <button
                onClick={toggleFullscreen}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 p-2 rounded-full z-10"
              >
                {isFullscreen ? (
                  <Minimize2 className="text-white" size={24} />
                ) : (
                  <Maximize2 className="text-white" size={24} />
                )}
              </button>
            </div>
          ) : (
            <div className="text-center text-white mb-6">No visual content available</div>
          )}

          {nftDetails.description && (
            <div className="mt-6 text-white text-center">
              <p>{nftDetails.description}</p>
            </div>
          )}

          {nftDetails.attributes && nftDetails.attributes.length > 0 && (
            <div className="mt-6">
              <h3 className="text-2xl font-semibold text-white text-center mb-4">Attributes</h3>
              <div className="flex flex-wrap justify-center gap-4">
                {nftDetails.attributes.map((attr, index) => (
                  <div 
                    key={index} 
                    className="bg-white/10 rounded-lg px-4 py-2 text-center"
                  >
                    <p className="text-white opacity-70">{attr.trait_type}</p>
                    <p className="text-white font-semibold">{attr.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}