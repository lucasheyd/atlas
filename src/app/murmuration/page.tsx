"use client";

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Container } from "@/components/Container";
import Image from 'next/image';
import { Tab } from '@headlessui/react';
import { NETWORKS } from '@/utils/networks';

// Dynamically import components/utils that use ethers.js
// This ensures they only load on the client side
const MurmurationContent = dynamic(() => import('@/components/MurmurationContent'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center min-h-[400px]">
      <div className="animate-pulse text-gray-600 dark:text-gray-400">
        Loading web3 components...
      </div>
    </div>
  )
});

export default function MurmurationPage() {
  return (
    <Container>
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-4xl font-bold mb-2 text-gray-800 dark:text-white">Murmuration 666</h1>
        <div className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl text-center">
          An algorithmic art collection of 666 murmurations - the magical formations of starling flocks in flight.
        </div>
      </div>
      
      {/* Dynamically loaded component with all the web3 functionality */}
      <MurmurationContent />
    </Container>
  );
}