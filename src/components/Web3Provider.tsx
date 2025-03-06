"use client";

import React, { useEffect } from 'react';
import { Web3ReactProvider } from '@web3-react/core';
import { Web3Provider as EthersWeb3Provider } from '@ethersproject/providers';
import Web3ErrorBoundary from './Web3ErrorBoundary';

function getLibrary(provider: any) {
  try {
    // Adicionando tratamento de erro mais robusto
    if (!provider) {
      console.debug('Provider was undefined or null');
      return null;
    }
    
    const library = new EthersWeb3Provider(provider);
    library.pollingInterval = 12000;
    
    // Sobrescrever o método detectNetwork para suprimir erros de rede
    const originalDetectNetwork = library.detectNetwork.bind(library);
    library.detectNetwork = async () => {
      try {
        return await originalDetectNetwork();
      } catch (error) {
        console.debug('Network detection error suppressed:', error);
        // Retornar uma rede padrão ou nula, dependendo do seu caso de uso
        return { chainId: 1, name: 'mainnet' }; // Fallback para mainnet
      }
    };
    
    return library;
  } catch (error) {
    console.debug('Error initializing web3 library (suppressed)', error);
    return null;
  }
}

export function Web3ProviderWrapper({ children }: { children: React.ReactNode }) {
  // Adicionar efeito para capturar erros da biblioteca web3-react
  useEffect(() => {
    // Interceptar erros que possam vir do Web3React
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      // Filtrar erros específicos do Web3React
      const web3ReactErrors = [
        '@web3-react',
        'Web3ReactDeactivate',
        'Web3ReactUpdate',
        'Web3ReactError',
        'ChainIdNotAllowed',
        'UnsupportedChainId',
        'NoEthereumProvider',
        'UserRejected'
      ];
      
      const shouldSuppress = web3ReactErrors.some(errorPattern => 
        args.some(arg => 
          typeof arg === 'string' && arg.includes(errorPattern)
        )
      );
      
      if (!shouldSuppress) {
        originalConsoleError(...args);
      } else {
        console.debug('Web3React error suppressed:', ...args);
      }
    };
    
    return () => {
      console.error = originalConsoleError;
    };
  }, []);
  
  return (
    <Web3ErrorBoundary>
      <Web3ReactProvider getLibrary={getLibrary}>
        {children}
      </Web3ReactProvider>
    </Web3ErrorBoundary>
  );
}