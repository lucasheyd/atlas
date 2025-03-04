'use client';

import React, { useState, useEffect } from 'react';
import { Container } from "@/components/Container";
import Image from 'next/image';

// Componente wrapper que guarda toda lógica potencialmente problemática
// dentro de verificações de window
export default function MurmurationPageGuard() {
  const [isClient, setIsClient] = useState(false);
  const [isError, setIsError] = useState(false);
  const [MurmurationPageComponent, setMurmurationPageComponent] = useState<React.ComponentType | null>(null);

  // Detecta se estamos no ambiente cliente
  useEffect(() => {
    setIsClient(true);

    const loadMurmurationModule = async () => {
      try {
        // Carrega o componente real de forma dinâmica apenas no cliente
        const module = await import('@/components/MurmurationPage');
        setMurmurationPageComponent(() => module.default);
      } catch (err) {
        console.error("Erro ao carregar módulo MurmurationPage:", err);
        setIsError(true);
      }
    };

    loadMurmurationModule();
  }, []);

  // Mostra um placeholder enquanto o componente não está carregado no cliente
  if (!isClient || !MurmurationPageComponent) {
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
              Carregando componentes Web3...
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
            <p className="text-red-600 dark:text-red-400">
              Houve um erro ao carregar os componentes Web3. Por favor, tente novamente mais tarde ou entre em contato com o suporte.
            </p>
          </div>
        </div>
      </Container>
    );
  }

  // Renderiza o componente real quando estiver pronto
  const MurmurationPage = MurmurationPageComponent;
  return <MurmurationPage />;
}