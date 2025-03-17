'use client';

import { useEffect } from 'react';
import { OptimizedNFTService } from '@/services/OptimizedNFTService';

/**
 * Componente que pré-carrega dados de tokens próximos para navegação mais rápida
 * Não renderiza nada na interface, funciona apenas em background
 */
export function TokenPreloader({ 
  tokenId, 
  range = 2
}: { 
  tokenId: string | number; 
  range?: number; 
}) {
  useEffect(() => {
    if (!tokenId) return;
    
    const currentId = parseInt(tokenId.toString());
    if (isNaN(currentId)) return;
    
    // Esta função é executada em segundo plano
    const preloadNearbyTokens = async () => {
      // Primeiro verificar se o token atual existe
      const exists = await OptimizedNFTService.tokenExists(currentId.toString());
      if (!exists) return;
      
      // Pré-carregar tokens próximos após pequeno delay
      setTimeout(() => {
        // Pré-carregar tokens anteriores
        for (let i = 1; i <= range; i++) {
          const prevId = currentId - i;
          if (prevId > 0) {
            OptimizedNFTService.preloadTokenData(prevId.toString());
          }
        }
        
        // Pré-carregar tokens seguintes
        for (let i = 1; i <= range; i++) {
          const nextId = currentId + i;
          OptimizedNFTService.preloadTokenData(nextId.toString());
        }
      }, 2000); // Delay para não interferir no carregamento do token atual
    };
    
    preloadNearbyTokens();
  }, [tokenId, range]);
  
  // Este componente não renderiza nada
  return null;
}

/**
 * Hook para integrar a funcionalidade de pré-carregamento em componentes existentes
 */
export function useTokenPreloader(tokenId: string | number, range = 2) {
  useEffect(() => {
    if (!tokenId) return;
    
    const currentId = parseInt(tokenId.toString());
    if (isNaN(currentId)) return;
    
    // Função para pré-carregar um token com segurança
    const safePreloadToken = async (id: number) => {
      try {
        // Verificar primeiro se o token existe
        const exists = await OptimizedNFTService.tokenExists(id.toString());
        if (!exists) return;
        
        // Carregar apenas dados básicos, sem tentar territórios ainda
        await OptimizedNFTService.getNFTData(id.toString());
      } catch (error) {
        // Silenciosamente ignorar erros em pré-carregamento
        console.debug(`Error preloading token #${id}:`, error);
      }
    };
    
    // Pré-carregar token atual com curto atraso
    const timerCurrent = setTimeout(() => {
      safePreloadToken(currentId);
    }, 100);
    
    // Pré-carregar tokens próximos após mais atraso
    const timerNeighbors = setTimeout(() => {
      // Pré-carregar tokens anteriores
      for (let i = 1; i <= range; i++) {
        const prevId = currentId - i;
        if (prevId > 0) {
          safePreloadToken(prevId);
        }
      }
      
      // Pré-carregar tokens seguintes
      for (let i = 1; i <= range; i++) {
        const nextId = currentId + i;
        safePreloadToken(nextId);
      }
    }, 3000); // Atraso maior para os vizinhos
    
    return () => {
      clearTimeout(timerCurrent);
      clearTimeout(timerNeighbors);
    };
  }, [tokenId, range]);
}

export default TokenPreloader;
