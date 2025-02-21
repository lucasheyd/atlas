"use client";

import React from 'react';
import { Web3ReactProvider } from '@web3-react/core';
import { Web3Provider as EthersWeb3Provider } from '@ethersproject/providers';

function getLibrary(provider: any) {
  try {
    const library = new EthersWeb3Provider(provider);
    library.pollingInterval = 12000;
    return library;
  } catch (error) {
    console.error('Error initializing web3 library', error);
    return null;
  }
}

export function Web3ProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      {children}
    </Web3ReactProvider>
  );
}