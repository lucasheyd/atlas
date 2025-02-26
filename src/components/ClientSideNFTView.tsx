"use client";

import React, { useState, useRef } from 'react';
import { Container } from "@/components/Container";
import { Maximize2, Minimize2 } from 'lucide-react';

interface NFTDetails {
  id: string;
  name: string;
  description: string;
  animationUrl: string;
  traits?: Record<string, string>;
}

export default function ClientSideNFTView({ nftDetails }: { nftDetails: NFTDetails }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  return (
    <Container>
      <div className="max-w-2xl w-full mx-auto px-4">
        <div className="bg-gray-100 dark:bg-gray-800/50 backdrop-blur-md rounded-2xl p-8 shadow-xl">
          <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-6 text-center">
            {nftDetails.name}
          </h2>
          
          <div className="mb-6 flex justify-center relative">
            <div className="w-full" style={{ maxWidth: '1000px' }}>
              <div className="relative">
                <iframe 
                  ref={iframeRef}
                  src={nftDetails.animationUrl}
                  className="w-full rounded-lg"
                  style={{ 
                    height: '1000px',
                    maxWidth: 'none',
                    aspectRatio: '1/1'
                  }}
                  sandbox="allow-scripts" 
                  title={nftDetails.name}
                />
                <button 
                  onClick={toggleFullscreen}
                  className="absolute top-2 right-2 bg-white/20 hover:bg-white/30 p-2 rounded-full z-10"
                >
                  {isFullscreen ? (
                    <Minimize2 className="text-white" size={24} />
                  ) : (
                    <Maximize2 className="text-white" size={24} />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">Token Details</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-2"><strong>Token ID:</strong> {nftDetails.id}</p>
            <p className="text-gray-600 dark:text-gray-300 mb-2"><strong>Description:</strong> {nftDetails.description}</p>
            {nftDetails.traits && (
              <>
                <h4 className="text-xl font-semibold text-gray-800 dark:text-white mt-4 mb-2">Traits</h4>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300">
                  {Object.entries(nftDetails.traits).map(([key, value]) => (
                    <li key={key}>{key}: {value}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
}