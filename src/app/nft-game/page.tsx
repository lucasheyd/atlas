'use client';

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';

// Este componente apenas redireciona para a API route
export default function NFTGamePage() {
  const router = useRouter();
  
  React.useEffect(() => {
    // Pegar a URL atual 
    const currentUrl = window.location.href;
    
    // Extrair os parâmetros da URL atual
    const url = new URL(currentUrl);
    const params = url.searchParams;
    
    // Construir a nova URL para a API route
    const apiUrl = `/api/nft-game?${params.toString()}`;
    
    // Redirecionar para a API route
    window.location.href = apiUrl;
  }, [router]);
  
  // Mostrar um loading enquanto redireciona
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-teal-400 mx-auto mb-4"></div>
        <p className="text-lg">Carregando jogo...</p>
      </div>
    </div>
  );
}