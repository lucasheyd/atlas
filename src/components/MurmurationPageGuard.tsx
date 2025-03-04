'use client';

import React, { useState, useEffect } from 'react';
import { Container } from "@/components/Container";
import Image from 'next/image';
import MurmurationPage from '@/components/MurmurationPage'; // Importar diretamente

export default function MurmurationPageGuard() {
  const [isClient, setIsClient] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingStep, setLoadingStep] = useState('initializing');
  
  // Detecta se estamos no ambiente cliente
  useEffect(() => {
    try {
      // Marcar que estamos no cliente
      setIsClient(true);
      setLoadingStep('client-detected');
      
      // Verificar se window existe
      if (typeof window !== 'undefined') {
        setLoadingStep('window-exists');
        
        // Verificar se ethereum existe
        if (window.ethereum) {
          setLoadingStep('ethereum-exists');
        } else {
          setLoadingStep('no-ethereum');
        }
      }
    } catch (err) {
      console.error("Erro na inicialização:", err);
      setIsError(true);
      setErrorMessage(err instanceof Error ? err.message : 'Erro desconhecido na inicialização');
    }
  }, []);

  // Mostra um placeholder enquanto o componente não está carregado no cliente
  if (!isClient) {
    return (
      <Container>
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gray-800 dark:text-white">Murmuration 666</h1>
          <div className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl text-center">
            An algorithmic art collection of 666 murmurations - the magical formations of starling flocks in flight.
          </div>
        </div>

        <div className="max-w-lg w-full mx-auto px-4">
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800/70 dark:to-gray-900/70 backdrop-blur-md rounded-2xl p-8 shadow-xl text-center border border-gray-300/20 dark:border-gray-600/20">
            <div className="relative">
              <Image 
                src="/murmuration.jpg" 
                alt="Murmuration 666"
                width={600}
                height={600}
                className="rounded-xl shadow-lg mb-8 mx-auto"
              />
            </div>
            
            <div className="mb-6 text-gray-700 dark:text-gray-300">
              Loading Web3 components... Status: {loadingStep}
            </div>
            
            {/* Spinner de carregamento */}
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  // Se houve erro no carregamento
  if (isError) {
    return (
      <Container>
        <div className="max-w-lg w-full mx-auto px-4 text-center">
          <div className="bg-red-100 dark:bg-red-900/30 p-6 rounded-lg border border-red-200 dark:border-red-800/50">
            <h2 className="text-xl font-semibold text-red-700 dark:text-red-300 mb-2">
              Ops! Tivemos um problema
            </h2>
            <p className="text-red-600 dark:text-red-400 mb-4">
              Houve um erro ao carregar os componentes Web3. Por favor, tente novamente mais tarde ou entre em contato com o suporte.
            </p>
            <div className="text-sm text-left p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800/30 overflow-auto">
              <p>Detalhes: {errorMessage}</p>
              <p>Etapa de carregamento: {loadingStep}</p>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  // Verificação específica para Ethereum
  if (loadingStep === 'no-ethereum') {
    return (
      <Container>
        <div className="max-w-lg w-full mx-auto px-4 text-center">
          <div className="bg-yellow-100 dark:bg-yellow-900/30 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800/50">
            <h2 className="text-xl font-semibold text-yellow-700 dark:text-yellow-300 mb-2">
              Carteira não detectada
            </h2>
            <p className="text-yellow-600 dark:text-yellow-400 mb-4">
              Para interagir com esta página, você precisa de uma carteira de criptomoedas como MetaMask.
            </p>
            <div className="text-sm mb-4">
              <a 
                href="https://metamask.io/download/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-800 dark:hover:text-indigo-300"
              >
                Instalar MetaMask
              </a>
            </div>
            <Image 
              src="/murmuration.jpg" 
              alt="Murmuration 666"
              width={400}
              height={400}
              className="rounded-xl shadow-lg mx-auto"
            />
          </div>
        </div>
      </Container>
    );
  }

  // Renderiza o componente real quando estiver pronto
  return <MurmurationPage />;
}