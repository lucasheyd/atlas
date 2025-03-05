// hooks/useWalletForMaze.tsx
import { useState, useEffect, useCallback } from 'react';
import { 
  connectWallet, 
  switchToRequiredNetwork,
  verifyTokenOwnership,
  saveGameProgress,
  loadGameData,
  setupWalletListeners,
  WalletState,
  REQUIRED_CHAIN_ID
} from '@/utils/mazeWalletConnector';

interface UseWalletForMazeOptions {
  tokenId?: number;
  autoConnect?: boolean;
}

export function useWalletForMaze({ tokenId, autoConnect = false }: UseWalletForMazeOptions = {}) {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    isCorrectNetwork: false,
    account: null,
    provider: null,
    signer: null,
    contract: null,
    chainId: null
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ownsToken, setOwnsToken] = useState<boolean | null>(null);
  const [gameData, setGameData] = useState<{
    currentLevel: number;
    bestTimes: number[];
    bestMoves: number[];
  } | null>(null);

  // Connect wallet
  const handleConnect = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const newState = await connectWallet();
      setWalletState(newState);
      
      // Check token ownership if tokenId is provided
      if (tokenId && newState.isConnected && newState.contract) {
        const isOwner = await verifyTokenOwnership(tokenId, newState);
        setOwnsToken(isOwner);
        
        // Load game data if user owns the token
        if (isOwner) {
          const data = await loadGameData(tokenId, newState);
          setGameData(data);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  }, [tokenId]);
  
  // Switch network
  const handleSwitchNetwork = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const success = await switchToRequiredNetwork();
      if (success) {
        // Refresh connection after switching
        await handleConnect();
      } else {
        setError('Failed to switch network');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to switch network');
    } finally {
      setLoading(false);
    }
  }, [handleConnect]);
  
  // Save game progress
  const handleSaveProgress = useCallback(async (
    level: number,
    time: number,
    moves: number
  ) => {
    if (!tokenId) {
      setError('Token ID is required');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const success = await saveGameProgress(
        tokenId,
        level,
        time,
        moves,
        walletState
      );
      
      if (success) {
        // Reload game data after saving
        const data = await loadGameData(tokenId, walletState);
        setGameData(data);
      }
      
      return success;
    } catch (err: any) {
      setError(err.message || 'Failed to save game progress');
      return false;
    } finally {
      setLoading(false);
    }
  }, [tokenId, walletState]);
  
  // Auto-connect on mount if requested
  useEffect(() => {
    if (autoConnect) {
      handleConnect();
    }
  }, [autoConnect, handleConnect]);
  
  // Setup wallet event listeners
  useEffect(() => {
    const cleanup = setupWalletListeners((updates) => {
      setWalletState(prev => ({ ...prev, ...updates }));
      
      // If account changed, re-check token ownership
      if (updates.account !== undefined && tokenId) {
        if (updates.isConnected && walletState.contract) {
          verifyTokenOwnership(tokenId, {
            ...walletState,
            account: updates.account
          })
            .then(setOwnsToken)
            .catch(err => {
              console.error('Error checking ownership after account change:', err);
              setOwnsToken(false);
            });
        } else {
          setOwnsToken(false);
        }
      }
      
      // If network changed and no longer correct, clear game data
      if (updates.isCorrectNetwork === false) {
        setGameData(null);
      }
    });
    
    return cleanup;
  }, [tokenId, walletState]);
  
  return {
    wallet: walletState,
    loading,
    error,
    connect: handleConnect,
    switchNetwork: handleSwitchNetwork,
    ownsToken,
    gameData,
    saveProgress: handleSaveProgress,
    requiredChainId: REQUIRED_CHAIN_ID
  };
}

export default useWalletForMaze;