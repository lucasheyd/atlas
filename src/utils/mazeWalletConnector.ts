// utils/mazeWalletConnector.ts
import { ethers } from 'ethers';
import { MAZE_CONTRACT_ADDRESS, MAZE_CONTRACT_ABI } from './mazeContract';

export interface WalletState {
  isConnected: boolean;
  isCorrectNetwork: boolean;
  account: string | null;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  contract: ethers.Contract | null;
  chainId: string | null;
}

import { CHAIN_IDS } from './mazeTypes';

// For deployment in Base Mainnet, just change this line to:
// export const REQUIRED_CHAIN_ID = CHAIN_IDS.BASE_MAINNET;
export const REQUIRED_CHAIN_ID = CHAIN_IDS.BASE_SEPOLIA;

export async function connectWallet(): Promise<WalletState> {
  const state: WalletState = {
    isConnected: false,
    isCorrectNetwork: false,
    account: null,
    provider: null,
    signer: null,
    contract: null,
    chainId: null
  };

  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask or compatible wallet not detected');
  }

  try {
    // Request accounts
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    // Setup provider
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    state.provider = provider;
    
    // Get accounts and chainId
    const accounts = await provider.listAccounts();
    const chainId = await provider.send('eth_chainId', []);
    
    state.account = accounts[0];
    state.chainId = chainId;
    state.isConnected = accounts.length > 0;
    state.isCorrectNetwork = chainId === REQUIRED_CHAIN_ID;
    
    // Setup signer and contract
    if (state.isConnected) {
      state.signer = provider.getSigner();
      state.contract = new ethers.Contract(
        MAZE_CONTRACT_ADDRESS,
        MAZE_CONTRACT_ABI,
        state.signer
      );
    }
    
    return state;
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
}

export async function switchToRequiredNetwork(): Promise<boolean> {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask or compatible wallet not detected');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: REQUIRED_CHAIN_ID }]
    });
    return true;
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: REQUIRED_CHAIN_ID,
            chainName: 'Base Sepolia',
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://sepolia.base.org'],
            blockExplorerUrls: ['https://sepolia.basescan.org']
          }]
        });
        return true;
      } catch (addError) {
        console.error('Error adding chain:', addError);
        return false;
      }
    }
    console.error('Error switching chain:', switchError);
    return false;
  }
}

// Verify token ownership for the current wallet
export async function verifyTokenOwnership(
  tokenId: number, 
  walletState: WalletState
): Promise<boolean> {
  if (!walletState.isConnected || !walletState.contract || !walletState.account) {
    return false;
  }
  
  try {
    const ownerAddress = await walletState.contract.ownerOf(tokenId);
    return ownerAddress.toLowerCase() === walletState.account.toLowerCase();
  } catch (error) {
    console.error('Error verifying token ownership:', error);
    return false;
  }
}

// Save game progress to the contract
export async function saveGameProgress(
  tokenId: number,
  level: number,
  time: number,
  moves: number,
  walletState: WalletState
): Promise<boolean> {
  if (!walletState.isConnected || !walletState.contract) {
    return false;
  }
  
  try {
    // Verify ownership before saving
    const isOwner = await verifyTokenOwnership(tokenId, walletState);
    if (!isOwner) {
      throw new Error('You do not own this token');
    }
    
    // Ensure parameters are valid numbers
    const safeTokenId = parseInt(tokenId.toString());
    const safeLevel = parseInt(level.toString());
    const safeTime = parseInt(time.toString());
    const safeMoves = parseInt(moves.toString());
    
    // Log the values we're sending to the contract
    console.log(`Saving progress: tokenId=${safeTokenId}, level=${safeLevel}, time=${safeTime}, moves=${safeMoves}`);
    
    // Call contract method to update progress
    const tx = await walletState.contract.updateProgress(
      safeTokenId,
      safeLevel,
      safeTime,
      safeMoves
    );
    
    // Wait for transaction to be mined
    await tx.wait();
    console.log('Progress saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving game progress:', error);
    return false;
  }
}

// Load game data from the contract
export async function loadGameData(
  tokenId: number,
  walletState: WalletState
): Promise<{
  currentLevel: number;
  bestTimes: (number | null)[];
  bestMoves: (number | null)[];
} | null> {
  if (!walletState.contract) {
    return null;
  }
  
  try {
    // Log da tentativa de carregamento
    console.log(`Loading game data for token #${tokenId}`);
    
    // Tenta obter os dados do contrato
    const result = await walletState.contract.getGameData(tokenId);
    console.log('Raw contract data:', result);
    
    // Verifica se recebemos um array com 3 elementos
    if (!Array.isArray(result) || result.length !== 3) {
      console.error('Invalid data format returned from contract');
      return {
        currentLevel: 1,
        bestTimes: [null, null, null],
        bestMoves: [null, null, null]
      };
    }
    
    const [currentLevel, bestTimes, bestMoves] = result;
    
    // Função de ajuda para converter valores
    const convertToNumber = (value: any): number => {
      if (value === undefined || value === null) return 0;
      if (typeof value === 'object' && 'toNumber' in value && typeof value.toNumber === 'function') {
        return value.toNumber();
      }
      return Number(value);
    };
    
    // Função para verificar se um valor é o valor máximo (não completado)
    const isMaxValue = (value: any): boolean => {
      if (value === undefined || value === null) return true;
      
      const MAX_UINT32 = 4294967295;
      
      if (typeof value === 'object' && 'eq' in value && typeof value.eq === 'function') {
        // Usando BigNumber
        try {
          return value.eq(ethers.constants.MaxUint256) || value.eq(MAX_UINT32);
        } catch (error) {
          return Number(value) === MAX_UINT32;
        }
      } else {
        // Usando número primitivo
        return Number(value) === MAX_UINT32;
      }
    };
    
    // Converter currentLevel
    const currentLevelNumber = Math.max(1, convertToNumber(currentLevel));
    
    // Converter arrays de tempo e movimentos
    const processArray = (arr: any[]): (number | null)[] => {
      if (!Array.isArray(arr)) {
        console.warn('Expected array but got:', arr);
        return [null, null, null];
      }
      
      return arr.map(item => isMaxValue(item) ? null : convertToNumber(item));
    };
    
    // Garantir que temos arrays de tempo e movimentos válidos
    const processedBestTimes = Array.isArray(bestTimes) 
      ? processArray(bestTimes)
      : [null, null, null];
      
    const processedBestMoves = Array.isArray(bestMoves)
      ? processArray(bestMoves)
      : [null, null, null];
    
    // Garantir que os arrays têm o tamanho correto
    while (processedBestTimes.length < 3) processedBestTimes.push(null);
    while (processedBestMoves.length < 3) processedBestMoves.push(null);
    
    // Criar objeto de retorno
    const gameData = {
      currentLevel: currentLevelNumber,
      bestTimes: processedBestTimes.slice(0, 3),
      bestMoves: processedBestMoves.slice(0, 3)
    };
    
    console.log('Processed game data:', gameData);
    return gameData;
    
  } catch (error) {
    console.error('Error loading game data:', error);
    // Retornar valores padrão em caso de erro
    return {
      currentLevel: 1,
      bestTimes: [null, null, null],
      bestMoves: [null, null, null]
    };
  }
}
// Setup wallet event listeners
export function setupWalletListeners(callback: (walletState: Partial<WalletState>) => void): () => void {
  if (typeof window.ethereum === 'undefined') {
    return () => {}; // No cleanup needed
  }
  
  // Setup listeners
  const handleAccountsChanged = async (accounts: string[]) => {
    callback({
      isConnected: accounts.length > 0,
      account: accounts.length > 0 ? accounts[0] : null
    });
  };
  
  const handleChainChanged = async (chainId: string) => {
    callback({
      chainId,
      isCorrectNetwork: chainId === REQUIRED_CHAIN_ID
    });
  };
  
  window.ethereum.on('accountsChanged', handleAccountsChanged);
  window.ethereum.on('chainChanged', handleChainChanged);
  
  // Return cleanup function
  return () => {
    window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    window.ethereum.removeListener('chainChanged', handleChainChanged);
  };
}