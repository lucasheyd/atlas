import { ethers } from 'ethers';

const MURMURATION_CONTRACT_ADDRESS = '0xe16e3753f33a10602177f77fec769d116ff70a69';

// Basic ABI for metadata retrieval
const MINIMAL_ABI = [
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)'
];

export async function getNFTDetails(tokenId: string) {
  try {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const web3Provider = new ethers.providers.Web3Provider((window as any).ethereum);
      
      // Create a contract instance with minimal ABI
      const contract = new ethers.Contract(
        MURMURATION_CONTRACT_ADDRESS, 
        MINIMAL_ABI, 
        web3Provider
      );

      // First, check if the token exists by trying to get its owner
      try {
        const owner = await contract.ownerOf(parseInt(tokenId));
        
        // Token exists, now try to get its URI
        try {
          const tokenURI = await contract.tokenURI(parseInt(tokenId));
          
          // If no URI, return basic token information
          if (!tokenURI || tokenURI.trim() === '') {
            return {
              id: tokenId,
              name: `Murmuration #${tokenId}`,
              description: 'Unrevealed Murmuration NFT',
              image: '/placeholder-unrevealed.png',
              animationUrl: null,
              attributes: []
            };
          }

          // Handle different URI formats
          let metadata;
          if (tokenURI.startsWith('data:application/json;base64,')) {
            const base64Data = tokenURI.split(',')[1];
            metadata = JSON.parse(atob(base64Data));
          } else {
            // Fetch metadata from URI
            try {
              const response = await fetch(tokenURI);
              metadata = await response.json();
            } catch (fetchError) {
              console.error('Error fetching metadata:', fetchError);
              return {
                id: tokenId,
                name: `Murmuration #${tokenId}`,
                description: 'Metadata could not be retrieved',
                image: '/placeholder-unrevealed.png',
                animationUrl: null,
                attributes: []
              };
            }
          }

          return {
            id: tokenId,
            name: metadata.name || `Murmuration #${tokenId}`,
            description: metadata.description || '',
            image: metadata.image || '/placeholder-unrevealed.png',
            animationUrl: metadata.animation_url || null,
            attributes: metadata.attributes || []
          };

        } catch (uriError) {
          console.error('Error retrieving token URI:', uriError);
          return {
            id: tokenId,
            name: `Murmuration #${tokenId}`,
            description: 'Token exists but metadata is unavailable',
            image: '/placeholder-unrevealed.png',
            animationUrl: null,
            attributes: []
          };
        }
      } catch (ownerError) {
        // Token does not exist
        console.error('Token does not exist:', ownerError);
        throw new Error("Token does not exist");
      }
    } else {
      throw new Error("Ethereum provider not found. Please install MetaMask.");
    }
  } catch (error) {
    console.error("Error fetching Murmuration NFT details:", error);
    throw new Error("Unable to fetch NFT details. Please check your connection.");
  }
}