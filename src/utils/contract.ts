import { ethers } from 'ethers';
import { NETWORKS } from './networks';

// Import network configuration for Base
export const CHAIN_ID = '0x2105'; // hex for Base network
export const NETWORK_NAME = 'Base';
export const FRACTAL_CONTRACT_ADDRESS = '0xcfc07303a4e916663259c3283a191b3c92a4af2c';

// Contract ABI
export const CONTRACT_ABI = [
  // ERC721 standard functions
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function MAX_SUPPLY() view returns (uint256)',
  
  // ERC721Enumerable extension
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function tokenByIndex(uint256 index) view returns (uint256)',
  
  // Minting function
  'function mint() payable returns (uint256)',
  'function mintBatch(uint256 amount) payable',
  
  // Mint price getter
  'function mintPrice() view returns (uint256)',
  
  // Burning functionality
  'function safeTransferFrom(address from, address to, uint256 tokenId)',
  
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
  'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)',
  
  // Additional function from the original contract.ts
  'function getTokenTraits(uint256 tokenId) view returns (uint8, uint8, uint8, uint8, uint8, uint8)'
];

// Function to check if connected to Base network
export const isOnBaseNetwork = async (provider: ethers.providers.Web3Provider): Promise<boolean> => {
  try {
    const { chainId } = await provider.getNetwork();
    const chainIdHex = `0x${chainId.toString(16)}`;
    return chainIdHex === CHAIN_ID;
  } catch (error) {
    console.error("Error checking network:", error);
    return false;
  }
};

// Function to check and request correct network
export const checkAndSwitchNetwork = async (provider: ethers.providers.Web3Provider) => {
  try {
    const network = await provider.getNetwork();
    const currentChainIdHex = `0x${network.chainId.toString(16)}`;
    
    if (currentChainIdHex !== CHAIN_ID) {
      console.log(`Switching to ${NETWORK_NAME} network...`);
      
      try {
        await provider.send('wallet_switchEthereumChain', [{ chainId: CHAIN_ID }]);
      } catch (switchError: any) {
        // Se a rede não existe, adicione-a
        if (switchError.code === 4902) {
          await provider.send('wallet_addEthereumChain', [{
            chainId: CHAIN_ID,
            chainName: NETWORK_NAME,
            nativeCurrency: {
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18
            },
            rpcUrls: ['https://mainnet.base.org'],
            blockExplorerUrls: ['https://basescan.org']
          }]);
        } else if (switchError.code === 4001) {
          // Usuário rejeitou a troca de rede
          console.log("User rejected the network switch");
          return false;
        } else {
          throw switchError;
        }
      }
      
      // Aguarde um momento para a rede atualizar
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return true;
  } catch (error) {
    console.warn("Network switch check error:", error);
    return false;
  }
};

// Helper function to get contract instance
export const getContract = async (provider: ethers.providers.Web3Provider, contractAddress = FRACTAL_CONTRACT_ADDRESS) => {
  if (typeof window.ethereum === 'undefined') {
    throw new Error("Please install MetaMask to interact with this application!");
  }

  try {
    // Tente trocar para a rede correta
    const networkSwitched = await checkAndSwitchNetwork(provider);
    
    // Continue mesmo se a troca de rede falhar, pois o usuário pode já estar na rede correta
    // ou pode trocar manualmente
    
    await provider.send('eth_requestAccounts', []);
    const signer = provider.getSigner();
    return new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
  } catch (error) {
    console.error("MetaMask connection error:", error);
    throw new Error("Unable to connect to wallet. Please verify you are connected to the Base network.");
  }
};

// Get user's NFTs
export const getUserNFTs = async (provider: ethers.providers.Web3Provider) => {
  try {
    const contract = await getContract(provider);
    const address = await contract.signer.getAddress();
    const balance = await contract.balanceOf(address);
    const tokens = [];

    for (let i = 0; i < balance.toNumber(); i++) {
      const tokenId = await contract.tokenOfOwnerByIndex(address, i);
      
      try {
        const tokenURI = await contract.tokenURI(tokenId);
        const traits = await contract.getTokenTraits(tokenId);
        
        // Parse metadata if available
        try {
          const metadata = JSON.parse(atob(tokenURI.split(',')[1]));
          tokens.push({
            id: tokenId.toString(),
            name: metadata.name,
            image: metadata.image,
            traits: {
              connectionStyle: traits[0],
              colorScheme: traits[1],
              densityLevel: traits[2],
              motionPattern: traits[3],
              particleType: traits[4],
              effectType: traits[5]
            }
          });
        } catch (metadataError) {
          // If metadata parsing fails, still include the token with minimal info
          tokens.push({
            id: tokenId.toString(),
            name: `Token #${tokenId}`,
            traits: {
              connectionStyle: traits[0],
              colorScheme: traits[1],
              densityLevel: traits[2],
              motionPattern: traits[3],
              particleType: traits[4],
              effectType: traits[5]
            }
          });
        }
      } catch (tokenError) {
        // If token metadata/traits fetching fails, still include the token ID
        tokens.push({
          id: tokenId.toString(),
          name: `Token #${tokenId}`
        });
      }
    }

    return tokens;
  } catch (error) {
    console.error("Error fetching NFTs:", error);
    throw new Error("Unable to fetch your NFTs. Please verify your connection to the Base network.");
  }
};

// Get all token IDs owned by the user without additional metadata
export const getUserTokenIds = async (provider: ethers.providers.Web3Provider): Promise<number[]> => {
  try {
    const contract = await getContract(provider);
    const address = await contract.signer.getAddress();
    const balance = await contract.balanceOf(address);
    const tokenIds: number[] = [];

    for (let i = 0; i < balance.toNumber(); i++) {
      const tokenId = await contract.tokenOfOwnerByIndex(address, i);
      tokenIds.push(tokenId.toNumber());
    }

    return tokenIds;
  } catch (error) {
    console.error("Error fetching token IDs:", error);
    return [];
  }
};

// Get mint price
export const getMintPrice = async (provider: ethers.providers.Web3Provider) => {
  try {
    const contract = await getContract(provider);
    const price = await contract.mintPrice();
    return ethers.utils.formatEther(price);
  } catch (error) {
    console.error("Error fetching mint price:", error);
    throw new Error("Unable to fetch mint price. Please check your connection.");
  }
};

// Mint batch of NFTs
export const mintBatchNFT = async (provider: ethers.providers.Web3Provider, amount: number) => {
  try {
    const contract = await getContract(provider);
    const price = await contract.mintPrice();
    const totalPrice = price.mul(amount);
    const tx = await contract.mintBatch(amount, { value: totalPrice });
    await tx.wait();
    return tx.hash;
  } catch (error: any) {
    console.error("Error minting NFTs:", error);
    if (error.code === 'INSUFFICIENT_FUNDS') {
      throw new Error("Insufficient funds to mint NFTs.");
    }
    throw new Error("Error minting NFTs. Please check your connection and try again.");
  }
};

// Mint single NFT (uses mintBatch with amount=1)
export const mintNFT = async (provider: ethers.providers.Web3Provider, amount: number) => {
  return mintBatchNFT(provider, amount);
};

// Get details of a specific NFT
export const getNFTDetails = async (tokenId) => {
  try {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const web3Provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const contract = await getContract(web3Provider);
      const tokenURI = await contract.tokenURI(tokenId);

      // Handle on-chain data URI format
      let metadata;
      if (tokenURI.startsWith('data:application/json;base64,')) {
        const base64Data = tokenURI.split(',')[1];
        metadata = JSON.parse(atob(base64Data));
      } else {
        // Fetch the metadata from the token URI
        const response = await fetch(tokenURI);
        metadata = await response.json();
      }

      return {
        id: tokenId,
        name: metadata.name,
        description: metadata.description,
        image: metadata.image,
        animationUrl: metadata.animation_url,
        attributes: metadata.attributes
      };
    } else {
      throw new Error("Ethereum object not found. Please install MetaMask.");
    }
  } catch (error) {
    console.error("Error fetching NFT details:", error);
    throw new Error("Unable to fetch NFT details. Please check your connection.");
  }
};

// Get total supply and max supply
export const getTotalSupply = async (provider: ethers.providers.Web3Provider) => {
  try {
    const contract = await getContract(provider);
    const totalSupply = await contract.totalSupply();
    const maxSupply = await contract.MAX_SUPPLY();
    return {
      minted: totalSupply.toNumber(),
      total: maxSupply.toNumber()
    };
  } catch (error) {
    console.error("Error fetching supply:", error);
    return {
      minted: 0,
      total: 10000
    };
  }
};

// Burn tokens (transfer to dead address)
export const burnTokens = async (provider: ethers.providers.Web3Provider, tokenIds: number[]): Promise<string> => {
  try {
    await checkAndSwitchNetwork(provider);
    const contract = await getContract(provider);
    const signer = provider.getSigner();
    const userAddress = await signer.getAddress();
    
    // Dead address for burning tokens
    const deadAddress = '0x000000000000000000000000000000000000dEaD';
    
    // Transfer each token to the dead address (effectively burning them)
    const txPromises = tokenIds.map(tokenId => 
      contract.safeTransferFrom(userAddress, deadAddress, tokenId)
    );
    
    // Wait for all transactions to be sent
    const txs = await Promise.all(txPromises);
    
    // Return the hash of the last transaction
    return txs[txs.length - 1].hash;
  } catch (error: any) {
    console.error("Error burning tokens:", error);
    throw new Error(error.message || "Failed to burn tokens. Please try again.");
  }
};