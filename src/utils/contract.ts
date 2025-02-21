import { ethers } from 'ethers';

// Import network configuration
export const CHAIN_ID = '0x2105'; // hex for Base network
export const NETWORK_NAME = 'Base';

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';

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
  
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
  'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)',
  
  // Additional function from the original contract.ts
  'function getTokenTraits(uint256 tokenId) view returns (uint8, uint8, uint8, uint8, uint8, uint8)'
];

// Function to check and request correct network
const checkAndSwitchNetwork = async (provider: ethers.providers.Web3Provider) => {
  const network = await provider.getNetwork();
  if (network.chainId !== parseInt(CHAIN_ID, 16)) {
    try {
      await provider.send('wallet_switchEthereumChain', [{ chainId: CHAIN_ID }]);
    } catch (switchError: any) {
      // If network doesn't exist, add it
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
      } else {
        throw switchError;
      }
    }
  }
};

// Helper function to get contract instance
const getContract = async (provider: ethers.providers.Web3Provider) => {
  if (typeof window.ethereum === 'undefined') {
    throw new Error("Please install MetaMask to interact with this application!");
  }

  try {
    await checkAndSwitchNetwork(provider);
    await provider.send('eth_requestAccounts', []);
    const signer = provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  } catch (error) {
    console.error("MetaMask connection error:", error);
    throw new Error("Unable to connect to wallet. Please verify you are connected to the Base network.");
  }
};

export const getUserNFTs = async (provider: ethers.providers.Web3Provider) => {
  try {
    const contract = await getContract(provider);
    const address = await contract.signer.getAddress();
    const balance = await contract.balanceOf(address);
    const tokens = [];

    for (let i = 0; i < balance.toNumber(); i++) {
      const tokenId = await contract.tokenOfOwnerByIndex(address, i);
      const tokenURI = await contract.tokenURI(tokenId);
      const traits = await contract.getTokenTraits(tokenId);
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
    }

    return tokens;
  } catch (error) {
    console.error("Error fetching NFTs:", error);
    throw new Error("Unable to fetch your NFTs. Please verify your connection to the Base network.");
  }
};

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

export const mintNFT = async (provider: ethers.providers.Web3Provider, amount: number) => {
  return mintBatchNFT(provider, amount);
};

export const getNFTDetails = async (tokenId) => {
  try {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const web3Provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const contract = await getContract(web3Provider);
      const tokenURI = await contract.tokenURI(tokenId);

      // Fetch the metadata from the token URI
      const response = await fetch(tokenURI);
      const metadata = await response.json();

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