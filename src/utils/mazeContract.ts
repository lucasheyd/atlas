import { ethers } from 'ethers';
import { checkAndSwitchNetwork, isBaseNetwork, getNetworkName } from './networkSwitcher';

// Maze NFT contract address
export const MAZE_CONTRACT_ADDRESS = '0x9511Aef4586D10CFaa3180896bCb2B6dBdBd4f9e';

// Target chain ID (for testing we use Base Sepolia)
export const BASE_CHAIN_ID = '0x14a34'; // Base Sepolia

// Maze NFT contract ABI - the minimum needed for our functions
export const MAZE_CONTRACT_ABI = [
  // ERC721 standard functions
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function maxSupply() view returns (uint256)',
  
  // ERC721Enumerable extension
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function tokenByIndex(uint256 index) view returns (uint256)',
  
  // Custom functions
  'function mint() payable returns (uint256)',
  'function mintBatch(uint256 _quantity) payable',
  'function burn(uint256 _tokenId)',
  'function burnBatch(uint256[] calldata _tokenIds)',
  'function transferBatch(address _from, address _to, uint256[] calldata _tokenIds)',
  'function updateProgress(uint256 _tokenId, uint8 _level, uint32 _time, uint32 _moves)',
  'function getGameData(uint256 _tokenId) view returns (uint8 currentLevel, uint32[3] bestTimes, uint32[3] bestMoves)',
  'function getTraits(uint256 _tokenId) view returns (string playerShape, string goalShape, string trailColor, string uiTheme)',
  
  // Events
  'event LevelCompleted(uint256 indexed tokenId, uint8 level, uint32 time, uint32 moves)',
  'event GameProgressUpdated(uint256 indexed tokenId, uint8 currentLevel)'
];

// Get maze contract instance
export const getMazeContract = async (provider: ethers.providers.Web3Provider) => {
  if (typeof window.ethereum === 'undefined') {
    throw new Error("Please install MetaMask to interact with this application!");
  }

  try {
    // Get current chain ID
    const chainId = await provider.send('eth_chainId', []);
    
    // Check if we're on a Base network (either mainnet or testnet)
    const isCorrectNetwork = isBaseNetwork(chainId);
    
    if (!isCorrectNetwork) {
      try {
        // Try to switch to Base Sepolia network
        await checkAndSwitchNetwork(provider, 'baseSepolia');
      } catch (switchError: any) {
        console.warn("Network switch warning:", switchError.message);
        // Continue anyway - we'll try to work with current network
      }
    }
    
    await provider.send('eth_requestAccounts', []);
    const signer = provider.getSigner();
    return new ethers.Contract(MAZE_CONTRACT_ADDRESS, MAZE_CONTRACT_ABI, signer);
  } catch (error) {
    console.error("MetaMask connection error:", error);
    throw new Error("Unable to connect to wallet. Please check your MetaMask connection.");
  }
};

// Get user's Maze NFTs
export const getUserMazeNFTs = async (provider: ethers.providers.Web3Provider) => {
  try {
    const contract = await getMazeContract(provider);
    const address = await contract.signer.getAddress();
    const balance = await contract.balanceOf(address);
    const tokens = [];

    for (let i = 0; i < balance.toNumber(); i++) {
      const tokenId = await contract.tokenOfOwnerByIndex(address, i);
      
      try {
        const tokenURI = await contract.tokenURI(tokenId);
        let traits;
        let gameData;
        
        // Wrap these calls in try/catch to handle potential contract errors
        try {
          traits = await contract.getTraits(tokenId);
        } catch (traitsError) {
          console.warn(`Error fetching traits for token ${tokenId}:`, traitsError);
          traits = {
            playerShape: 'Unknown',
            goalShape: 'Unknown',
            trailColor: 'Unknown',
            uiTheme: 'Unknown'
          };
        }
        
        try {
          gameData = await contract.getGameData(tokenId);
        } catch (gameDataError) {
          console.warn(`Error fetching game data for token ${tokenId}:`, gameDataError);
          gameData = {
            currentLevel: 1,
            bestTimes: [4294967295, 4294967295, 4294967295],
            bestMoves: [4294967295, 4294967295, 4294967295]
          };
        }
        
        // Parse metadata if available
        try {
          let metadata = {};
          
          // Handle on-chain data URI format
          if (tokenURI.startsWith('data:application/json;base64,')) {
            const base64Data = tokenURI.split(',')[1];
            metadata = JSON.parse(atob(base64Data));
          } else {
            // Fetch the metadata from the token URI
            const response = await fetch(tokenURI);
            metadata = await response.json();
          }
          
          tokens.push({
            id: tokenId.toString(),
            name: metadata.name,
            image: metadata.image,
            animationUrl: metadata.animation_url,
            attributes: metadata.attributes,
            gameData: {
              currentLevel: gameData.currentLevel,
              bestTimes: gameData.bestTimes.map(time => 
                time.toString() === '4294967295' ? null : parseInt(time.toString())),
              bestMoves: gameData.bestMoves.map(moves => 
                moves.toString() === '4294967295' ? null : parseInt(moves.toString()))
            },
            traits: {
              playerShape: traits.playerShape,
              goalShape: traits.goalShape,
              trailColor: traits.trailColor,
              uiTheme: traits.uiTheme
            }
          });
        } catch (metadataError) {
          console.error("Error parsing metadata:", metadataError);
          // If metadata parsing fails, still include the token with minimal info
          tokens.push({
            id: tokenId.toString(),
            name: `Maze Puzzle #${tokenId}`,
            gameData: {
              currentLevel: gameData.currentLevel,
              bestTimes: gameData.bestTimes.map(time => 
                time.toString() === '4294967295' ? null : parseInt(time.toString())),
              bestMoves: gameData.bestMoves.map(moves => 
                moves.toString() === '4294967295' ? null : parseInt(moves.toString()))
            },
            traits: {
              playerShape: traits.playerShape,
              goalShape: traits.goalShape,
              trailColor: traits.trailColor,
              uiTheme: traits.uiTheme
            }
          });
        }
      } catch (tokenError) {
        console.error("Error fetching token data:", tokenError);
        // If token metadata/traits fetching fails, still include the token ID
        tokens.push({
          id: tokenId.toString(),
          name: `Maze Puzzle #${tokenId}`
        });
      }
    }

    return tokens;
  } catch (error) {
    console.error("Error fetching Maze NFTs:", error);
    throw new Error("Unable to fetch your Maze NFTs. Please check your wallet connection.");
  }
};

// Mint a Maze NFT
export const mintMazeNFT = async (provider: ethers.providers.Web3Provider, value: ethers.BigNumber) => {
  try {
    const contract = await getMazeContract(provider);
    const tx = await contract.mint({ value });
    await tx.wait();
    return tx.hash;
  } catch (error: any) {
    console.error("Error minting Maze NFT:", error);
    if (error.code === 'INSUFFICIENT_FUNDS') {
      throw new Error("Insufficient funds to mint NFT.");
    }
    throw new Error("Error minting Maze NFT. Please check your connection and try again.");
  }
};

// Mint batch of Maze NFTs
export const mintBatchMazeNFT = async (provider: ethers.providers.Web3Provider, amount: number, value: ethers.BigNumber) => {
  try {
    const contract = await getMazeContract(provider);
    const tx = await contract.mintBatch(amount, { value });
    await tx.wait();
    return tx.hash;
  } catch (error: any) {
    console.error("Error minting Maze NFTs:", error);
    if (error.code === 'INSUFFICIENT_FUNDS') {
      throw new Error("Insufficient funds to mint NFTs.");
    }
    throw new Error("Error minting Maze NFTs. Please check your connection and try again.");
  }
};

// Get details of a specific Maze NFT
export const getMazeNFTDetails = async (tokenId: number) => {
  try {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const web3Provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const contract = await getMazeContract(web3Provider);
      const tokenURI = await contract.tokenURI(tokenId);
      
      let traits;
      let gameData;
      
      // Wrap these calls in try/catch to handle potential contract errors
      try {
        traits = await contract.getTraits(tokenId);
      } catch (traitsError) {
        console.warn(`Error fetching traits for token ${tokenId}:`, traitsError);
        traits = {
          playerShape: 'Unknown',
          goalShape: 'Unknown',
          trailColor: 'Unknown',
          uiTheme: 'Unknown'
        };
      }
      
      try {
        gameData = await contract.getGameData(tokenId);
      } catch (gameDataError) {
        console.warn(`Error fetching game data for token ${tokenId}:`, gameDataError);
        gameData = {
          currentLevel: 1,
          bestTimes: [4294967295, 4294967295, 4294967295],
          bestMoves: [4294967295, 4294967295, 4294967295]
        };
      }

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
        attributes: metadata.attributes,
        gameData: {
          currentLevel: gameData.currentLevel,
          bestTimes: gameData.bestTimes.map(time => 
            time.toString() === '4294967295' ? null : parseInt(time.toString())),
          bestMoves: gameData.bestMoves.map(moves => 
            moves.toString() === '4294967295' ? null : parseInt(moves.toString()))
        },
        traits: {
          playerShape: traits.playerShape,
          goalShape: traits.goalShape,
          trailColor: traits.trailColor,
          uiTheme: traits.uiTheme
        }
      };
    } else {
      throw new Error("Ethereum object not found. Please install MetaMask.");
    }
  } catch (error) {
    console.error("Error fetching Maze NFT details:", error);
    throw new Error("Unable to fetch Maze NFT details. Please check your connection.");
  }
};

// Update game progress
export const updateMazeProgress = async (provider: ethers.providers.Web3Provider, tokenId: number, level: number, time: number, moves: number) => {
  try {
    const contract = await getMazeContract(provider);
    const tx = await contract.updateProgress(tokenId, level, time, moves);
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error("Error updating game progress:", error);
    throw new Error("Unable to update game progress. Please check your connection.");
  }
};

// Get total supply of Maze NFTs
export const getMazeTotalSupply = async (provider: ethers.providers.Web3Provider) => {
  try {
    const contract = await getMazeContract(provider);
    const totalSupply = await contract.totalSupply();
    const maxSupply = await contract.maxSupply();
    return {
      minted: totalSupply.toNumber(),
      total: maxSupply.toNumber() || 'Unlimited' // Handle case where maxSupply is 0 (unlimited)
    };
  } catch (error) {
    console.error("Error fetching supply:", error);
    return {
      minted: 0,
      total: 'Unknown'
    };
  }
};