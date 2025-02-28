// utils/murmurationContract.ts
import { ethers } from 'ethers';
import { NETWORKS } from './networks';
import { checkAndSwitchNetwork } from './contract';
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';

const MURMURATION_CONTRACT_ADDRESS = '0xe16E3753f33A10602177f77fEc769D116fF70A69';
const MURMURATION_ABI = [
  // Basic ERC721 functions
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  
  // Murmuration666 specific functions
  'function mint() payable',
  'function mintBatch(uint256 quantity) payable',
  'function totalSupply() view returns (uint256)',
  'function maxSupply() view returns (uint256)',
  'function mintPrice() view returns (uint256)',
  'function crossChainRedeem(bytes32[] calldata _merkleProof, uint256[] calldata _burnedTokenIds, address _burnerAddress)',
  'function redemptionRate() view returns (uint256)',
  'function burnProofClaimed(bytes32) view returns (bool)',
  'function redemptionCount(address) view returns (uint256)',
  
  // Events
  'event BoidMinted(address indexed to, uint256 tokenId, bool fromBurn)',
  'event CrossChainRedemption(address indexed redeemer, bytes32 burnProofHash)'
];

// Base contract address - using the Fractal NFT address
const FRACTAL_CONTRACT_ADDRESS = '0xcfc07303a4e916663259c3283a191b3c92a4af2c';
const FRACTAL_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function safeTransferFrom(address from, address to, uint256 tokenId)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function getTokenTraits(uint256 tokenId) view returns (uint8, uint8, uint8, uint8, uint8, uint8)'
];

// Check if connected to Bera network
export const isOnBeraNetwork = async (provider: ethers.providers.Web3Provider): Promise<boolean> => {
  try {
    const { chainId } = await provider.getNetwork();
    const chainIdHex = `0x${chainId.toString(16)}`;
    return chainIdHex === NETWORKS.bera.chainId;
  } catch (error) {
    console.error("Error checking network:", error);
    return false;
  }
};

// Check if connected to Base network
export const isOnBaseNetwork = async (provider: ethers.providers.Web3Provider): Promise<boolean> => {
  try {
    const { chainId } = await provider.getNetwork();
    const chainIdHex = `0x${chainId.toString(16)}`;
    return chainIdHex === NETWORKS.base.chainId;
  } catch (error) {
    console.error("Error checking network:", error);
    return false;
  }
};

/**
 * Burns Fractal tokens in batches to reduce the number of transactions
 * @param provider Web3Provider instance
 * @param tokenIds Array of token IDs to burn
 * @param batchSize Number of tokens to burn in each transaction (default: 10)
 * @returns Object with transaction hashes and success status
 */
export const burnFractalTokensInBatches = async (
  provider: ethers.providers.Web3Provider, 
  tokenIds: number[],
  batchSize: number = 10
): Promise<{success: boolean; txHashes: string[]; errorMessage?: string}> => {
  try {
    // Verify on Base network
    const onBase = await isOnBaseNetwork(provider);
    if (!onBase) {
      return {
        success: false,
        txHashes: [],
        errorMessage: "Please connect to Base network to burn Fractal tokens"
      };
    }
    
    // Get signer and contract
    try {
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(FRACTAL_CONTRACT_ADDRESS, FRACTAL_ABI, signer);
      
      // Dead address for burning
      const deadAddress = '0x000000000000000000000000000000000000dEaD';
      
      // Get user address
      const userAddress = await signer.getAddress();
      
      // Split tokens into batches
      const batches: number[][] = [];
      for (let i = 0; i < tokenIds.length; i += batchSize) {
        batches.push(tokenIds.slice(i, i + batchSize));
      }
      
      console.log(`Burning ${tokenIds.length} tokens in ${batches.length} batches`);
      
      // Process each batch
      const txHashes: string[] = [];
      let batchNumber = 1;
      
      for (const batch of batches) {
        console.log(`Processing batch ${batchNumber} of ${batches.length} (${batch.length} tokens)`);
        
        // For each batch, create array of transfer promises
        const transferPromises = batch.map(tokenId => 
          contract.safeTransferFrom(userAddress, deadAddress, tokenId)
        );
        
        // Wait for all transactions in this batch to be sent
        const txs = await Promise.all(transferPromises);
        
        // Store transaction hashes
        txs.forEach(tx => txHashes.push(tx.hash));
        
        batchNumber++;
      }
      
      // Store burn information
      try {
        storeBurnInfo(userAddress, tokenIds, txHashes.join(','));
      } catch (storageError) {
        console.warn("Error storing burn info:", storageError);
        // Continue anyway, this is not critical
      }
      
      return {
        success: true,
        txHashes
      };
      
    } catch (contractError: any) {
      console.error("Contract interaction error:", contractError);
      return {
        success: false,
        txHashes: [],
        errorMessage: contractError.message || "Error interacting with the contract"
      };
    }
    
  } catch (error: any) {
    console.error('Error burning tokens in batches:', error);
    return {
      success: false,
      txHashes: [],
      errorMessage: error.message || 'Failed to burn tokens'
    };
  }
};

// Simplified burn function that burns all 25 tokens at once
export const burnTokensSimplified = async (
  provider: ethers.providers.Web3Provider, 
  tokenIds: number[]
): Promise<{success: boolean; txHash: string; errorMessage?: string}> => {
  try {
    const signer = provider.getSigner();
    const userAddress = await signer.getAddress();
    
    // Use OpenSea Conduit on Base network
    const conduitAddress = '0x000000000000000000000000000000000000dEaD';

    // Check if exactly 25 tokens are selected
    if (tokenIds.length !== 25) {
      return {
        success: false,
        txHash: '',
        errorMessage: `You must burn exactly 25 tokens. You selected ${tokenIds.length}.`
      };
    }

    // Contract addresses
    const BULK_TRANSFER_CONTRACT = '0x0000000000c2d145a2526bD8C716263bFeBe1A72';
    const CONDUIT_KEY = '0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000';

    const bulkTransferABI = [
      'function bulkTransfer(tuple(tuple(uint8,address,uint256,uint256)[] tokens, address conduitAddress, bool isOpen)[] items, bytes32 conduitKey) external'
    ];

    const bulkTransferContract = new ethers.Contract(
      BULK_TRANSFER_CONTRACT, 
      bulkTransferABI, 
      signer
    );

    // Prepare items for bulk transfer
    const bulkTransferItems = [{
      tokens: tokenIds.map(tokenId => [
        2,  // Item type (ERC721)
        FRACTAL_CONTRACT_ADDRESS, 
        tokenId, 
        1  // Quantity
      ]),
      conduitAddress: conduitAddress,
      isOpen: true
    }];

    console.log(`[BURN] Starting burn of ${tokenIds.length} tokens for address ${userAddress}`);

    const gasLimit = Math.max(300000, 50000 * tokenIds.length);

    // Execute bulk transfer
    const tx = await bulkTransferContract.bulkTransfer(
      bulkTransferItems,
      CONDUIT_KEY,
      {
        gasLimit: gasLimit,
        gasPrice: await provider.getGasPrice()
      }
    );

    console.log(`[BURN] Burn transaction sent: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`[BURN] Tokens burned successfully. Confirmations: ${receipt.confirmations}`);

    // Store burn information locally
    await storeBurnRecordSimplified(userAddress, tokenIds, tx.hash);

    return {
      success: true,
      txHash: tx.hash
    };

  } catch (error) {
    console.error('Error in token burn:', error);
    
    return {
      success: false,
      txHash: '',
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};




export const redeemBurnedTokensWithMerkle = async (
  provider: ethers.providers.Web3Provider, 
  burnedTokenIds: number[],
  burnTxHash: string
): Promise<string> => {
  try {
    // Obter o contrato
    const contract = await getMurmurationContract(provider);
    
    // Obter taxa de resgate
    const redemptionRate = await contract.redemptionRate();
    
    // Verificar número correto de tokens
    if (burnedTokenIds.length !== redemptionRate.toNumber()) {
      throw new Error(`Redemption requires exactly ${redemptionRate.toNumber()} tokens`);
    }
    
    // Obter endereço do usuário
    const signer = provider.getSigner();
    const userAddress = await signer.getAddress();
    
    // Obter provas do localStorage ou tentar carregar novamente
    let proofsString = localStorage.getItem('merkleProofs');
    if (!proofsString) {
      console.log('[MERKLE] Provas não encontradas no localStorage, tentando carregar...');
      await loadMerkleProofs();
      proofsString = localStorage.getItem('merkleProofs');
    }
    
    if (!proofsString) {
      throw new Error("Merkle proofs not found. Please reload the page or contact support.");
    }
    
    const proofs = JSON.parse(proofsString);

    
     // Ordenar os burnedTokenIds antes de gerar a chave da prova
    const sortedTokenIds = [...burnedTokenIds].sort((a, b) => a - b);
    const proofKey = `${userAddress.toLowerCase()}_${sortedTokenIds.join('_')}`;
    
    const merkleProof = proofs[proofKey];
    
    if (!merkleProof) {
      console.error('[MERKLE] Chave tentada:', proofKey);
      console.error('[MERKLE] Chaves disponíveis:', Object.keys(proofs));
      throw new Error("No Merkle proof found for these tokens. Verify burn details.");
    }
    
    // Executar resgate com os IDs dos tokens ordenados
    const tx = await contract.crossChainRedeem(
      merkleProof,
      sortedTokenIds,
      userAddress
    );
    
    await tx.wait();
    
    return tx.hash;
  } catch (error: any) {
    console.error('Erro no resgate:', error);
    throw new Error(error.message || 'Falha no resgate de tokens');
  }
};



// Efficient bulk token transfer
export const burnTokensEfficiently = async (
  provider: ethers.providers.Web3Provider, 
  tokenIds: number[]
): Promise<{success: boolean; burnTxs: string[]; batchSize: number; errorMessage?: string}> => {
  try {
    const signer = provider.getSigner();
    const userAddress = await signer.getAddress();
    
    // Use OpenSea Conduit on Base network
    //const conduitAddress = '0x000000000000000000000000000000000000dEaD';

    // Contract addresses
    const BULK_TRANSFER_CONTRACT = '0x0000000000c2d145a2526bD8C716263bFeBe1A72';
    const CONDUIT_KEY = '0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000';

    // ABI updated to match exact structure
    const bulkTransferABI = [
      'function bulkTransfer(tuple(tuple(uint8,address,uint256,uint256)[] tokens, address conduitAddress, bool isOpen)[] items, bytes32 conduitKey) external'
    ];

    const bulkTransferContract = new ethers.Contract(
      BULK_TRANSFER_CONTRACT, 
      bulkTransferABI, 
      signer
    );

    // Prepare items for bulk transfer
    const bulkTransferItems = [{
      tokens: tokenIds.map(tokenId => [
        2,  // Item type (ERC721)
        FRACTAL_CONTRACT_ADDRESS, 
        tokenId, 
        1  // Quantity
      ]),
      conduitAddress: conduitAddress,
      isOpen: true
    }];

    console.log('[BURN] Transaction details:', {
      userAddress,
      tokenCount: tokenIds.length,
      firstTokens: tokenIds.slice(0, 5)
    });

    // Set gas limit based on token count
    const gasLimit = Math.max(300000, 50000 * tokenIds.length);

    // Execute bulk transfer
    const tx = await bulkTransferContract.bulkTransfer(
      bulkTransferItems,
      CONDUIT_KEY,
      {
        gasLimit: gasLimit,
        gasPrice: await provider.getGasPrice()
      }
    );

    console.log(`[BURN] Tx Sent. Hash: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`[BURN] Tokens transferred in bulk. Confirmations: ${receipt.confirmations}`);
    
    // Store burn information
    storeBurnInfo(userAddress, tokenIds, tx.hash);

    return {
      success: true,
      burnTxs: [tx.hash],
      batchSize: tokenIds.length,
    };

  } catch (error) {
    console.error('Error in token transfer:', error);
    
    // Detailed error logging
    if (error instanceof Error) {
      console.error('error constructor:', error.constructor.name);
      console.error('Error Message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return {
      success: false,
      burnTxs: [],
      batchSize: 0,
      errorMessage: error instanceof Error ? error.message : 'Error'
    };
  }
};													

// Adicione ou modifique esta parte em murmurationContract.ts

// Esta função deve ser definida antes de switchToBaseNetwork e switchToBeraNetwork
export const switchToNetwork = async (networkKey: 'base' | 'bera'): Promise<boolean> => {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      console.warn('No crypto wallet found. Please install Metamask.');
      return false;
    }
    
    const networkConfig = NETWORKS[networkKey];
    console.log(`Attempting to switch to ${networkConfig.name}...`);
    
    try {
      // First try simple switching
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: networkConfig.chainId }],
      });
      
      console.log(`Successfully switched to ${networkConfig.name}`);
      // Small delay to allow UI to update
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    } catch (switchError: any) {
      // If the chain hasn't been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: networkConfig.chainId,
                chainName: networkConfig.name,
                nativeCurrency: {
                  name: networkConfig.currency,
                  symbol: networkConfig.currency,
                  decimals: 18
                },
                rpcUrls: [networkConfig.rpcUrl],
                blockExplorerUrls: [networkConfig.blockExplorer]
              },
            ],
          });
          
          // Attempt to switch again after adding
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: networkConfig.chainId }],
          });
          
          console.log(`Successfully added and switched to ${networkConfig.name}`);
          await new Promise(resolve => setTimeout(resolve, 500));
          return true;
        } catch (addError) {
          console.error(`Failed to add ${networkConfig.name}:`, addError);
          return false;
        }
      }
      
      // User rejected the request
      if (switchError.code === 4001) {
        console.log("User rejected the network switch request");
        return false;
      }
      
      console.error(`Unknown error switching to ${networkConfig.name}:`, switchError);
      return false;
    }
  } catch (error) {
    console.error(`General error in switchToNetwork:`, error);
    return false;
  }
};

// Então use-a nestas funções
export const switchToBeraNetwork = async (provider?: ethers.providers.Web3Provider): Promise<boolean> => {
  return await switchToNetwork('bera');
};

export const switchToBaseNetwork = async (provider?: ethers.providers.Web3Provider): Promise<boolean> => {
  return await switchToNetwork('base');
};

// Get provider and signer
const getProviderAndSigner = async (provider: ethers.providers.Web3Provider) => {
  await provider.send('eth_requestAccounts', []);
  const signer = provider.getSigner();
  return { provider, signer };
};

// Get Murmuration contract instance
const getMurmurationContract = async (provider: ethers.providers.Web3Provider) => {
  await switchToBeraNetwork(provider);
  const { signer } = await getProviderAndSigner(provider);
  return new ethers.Contract(MURMURATION_CONTRACT_ADDRESS, MURMURATION_ABI, signer);
};

// Get Fractal contract instance
const getFractalContract = async (provider: ethers.providers.Web3Provider) => {
  await switchToBaseNetwork(provider);
  const { signer } = await getProviderAndSigner(provider);
  return new ethers.Contract(FRACTAL_CONTRACT_ADDRESS, FRACTAL_ABI, signer);
};

// Mint Murmuration NFTs (paying with BERA)
export const mintMurmuration = async (provider: ethers.providers.Web3Provider, quantity: number = 1): Promise<string> => {
  try {
    const contract = await getMurmurationContract(provider);
    
    // Get mint price
    const pricePerNft = await contract.mintPrice();
    const totalPrice = pricePerNft.mul(quantity);
    
    let tx;
    if (quantity === 1) {
      tx = await contract.mint({ value: totalPrice });
    } else {
      tx = await contract.mintBatch(quantity, { value: totalPrice });
    }
    
    await tx.wait();
    return tx.hash;
  } catch (error: any) {
    console.error('Error minting Murmuration NFT:', error);
    throw new Error(error.message || 'Failed to mint NFT');
  }
};

// Get supply information for Murmuration
export const getMurmurationSupply = async (provider: ethers.providers.Web3Provider) => {
  try {
    // Check if on Bera network
    const onBera = await isOnBeraNetwork(provider);
    if (!onBera) {
      return { minted: 0, total: 666 };
    }
    
    const contract = new ethers.Contract(MURMURATION_CONTRACT_ADDRESS, MURMURATION_ABI, provider);
    const totalSupply = await contract.totalSupply();
    const maxSupply = await contract.maxSupply();
    
    return {
      minted: totalSupply.toNumber(),
      total: maxSupply.toNumber()
    };
  } catch (error) {
    console.error('Error getting Murmuration supply:', error);
    return { minted: 0, total: 666 };
  }
};

// Get mint price for Murmuration
export const getMurmurationPrice = async (provider: ethers.providers.Web3Provider) => {
  try {
    // Check if on Bera network
    const onBera = await isOnBeraNetwork(provider);
    if (!onBera) {
      return '1.0'; // Default price
    }
    
    const contract = new ethers.Contract(MURMURATION_CONTRACT_ADDRESS, MURMURATION_ABI, provider);
    const price = await contract.mintPrice();
    return ethers.utils.formatEther(price);
  } catch (error) {
    console.error('Error getting Murmuration mint price:', error);
    return '1.0'; // Fallback to 1 BERA
  }
};

// Get Fractal tokens available on Base network
// Versão melhorada da função getFractalTokens
export const getFractalTokens = async (provider: ethers.providers.Web3Provider): Promise<number[]> => {
  try {
    // Verificar se estamos na rede Base primeiro
    const onBase = await isOnBaseNetwork(provider);
    
    if (!onBase) {
      console.log("Not on Base network, attempting to switch...");
      const switched = await switchToBaseNetwork(provider);
      
      if (!switched) {
        console.log("User may have canceled the network switch");
        return []; // Retornar array vazio se o usuário cancelar a troca
      }
      
      // Criar um novo provider após a troca de rede
      if (window.ethereum) {
        provider = new ethers.providers.Web3Provider(window.ethereum);
      }
    }
    
    // Usar try/catch específico para a parte de obtenção dos tokens
    try {
      const { signer } = await getProviderAndSigner(provider);
      const userAddress = await signer.getAddress();
      const contract = new ethers.Contract(FRACTAL_CONTRACT_ADDRESS, FRACTAL_ABI, provider);
      
      const balance = await contract.balanceOf(userAddress);
      const tokens: number[] = [];
      
      // Obter os IDs dos tokens do usuário
      for (let i = 0; i < balance.toNumber(); i++) {
        const tokenId = await contract.tokenOfOwnerByIndex(userAddress, i);
        tokens.push(tokenId.toNumber());
      }
      
      return tokens;
    } catch (contractError) {
      console.error('Error interacting with contract:', contractError);
      return [];
    }
  } catch (error) {
    console.error('Error getting Fractal tokens:', error);
    return []; // Retornar array vazio em caso de erro
  }
};
// Get detailed information about Fractal tokens
export const getFractalTokenDetails = async (provider: ethers.providers.Web3Provider): Promise<any[]> => {
  try {
    // Attempt to switch to Base network
    await switchToBaseNetwork(provider);
    
    const { signer } = await getProviderAndSigner(provider);
    const userAddress = await signer.getAddress();
    const contract = new ethers.Contract(FRACTAL_CONTRACT_ADDRESS, FRACTAL_ABI, provider);
    
    const balance = await contract.balanceOf(userAddress);
    const tokens = [];
    
    // Get token details
    for (let i = 0; i < balance.toNumber(); i++) {
      const tokenId = await contract.tokenOfOwnerByIndex(userAddress, i);
      
      try {
        const tokenURI = await contract.tokenURI(tokenId);
        const traits = await contract.getTokenTraits(tokenId);
        
        let metadata;
        if (tokenURI.startsWith('data:application/json;base64,')) {
          const base64Data = tokenURI.split(',')[1];
          metadata = JSON.parse(atob(base64Data));
        } else {
          // If not base64 encoded, try to fetch as URL
          try {
            const response = await fetch(tokenURI);
            metadata = await response.json();
          } catch (fetchError) {
            metadata = { name: `Token #${tokenId}` };
          }
        }
        
        tokens.push({
          id: tokenId.toNumber(),
          name: metadata.name || `Token #${tokenId}`,
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
      } catch (error) {
        // If error fetching metadata, still add the token with minimal info
        tokens.push({
          id: tokenId.toNumber(),
          name: `Token #${tokenId}`
        });
      }
    }
    
    return tokens;
  } catch (error: any) {
    console.error('Error getting Fractal token details:', error);
    throw new Error(error.message || "Failed to get Fractal token details");
  }
};

// Burn Fractal tokens on Base network (transfer to dead address)
export const burnFractalTokens = async (provider: ethers.providers.Web3Provider, tokenIds: number[]): Promise<string> => {
  try {
    const contract = await getFractalContract(provider);
    
    // Get user address
    const signer = provider.getSigner();
    const userAddress = await signer.getAddress();
    
    // Dead address for burning
    const deadAddress = '0x000000000000000000000000000000000000dEaD';
    
    // Burn tokens - transfer to dead address
    const txPromises = tokenIds.map(tokenId => 
      contract.safeTransferFrom(userAddress, deadAddress, tokenId)
    );
    
    // Wait for all transactions to be sent
    const txs = await Promise.all(txPromises);
    
    // Store burn info in local storage
    storeBurnInfo(userAddress, tokenIds, txs[txs.length - 1].hash);
    
    // Return hash of the last transaction
    return txs[txs.length - 1].hash;
  } catch (error: any) {
    console.error('Error burning tokens:', error);
    throw new Error(error.message || 'Failed to burn tokens');
  }
};

// Store burn record in Pinata IPFS
export const storeBurnRecordSimplified = async (
  userAddress: string, 
  tokenIds: number[], 
  txHash: string
): Promise<{success: boolean; ipfsHash?: string}> => {
  try {
    // First store locally
    if (typeof window !== 'undefined' && window.localStorage) {
      const existingBurnsJSON = localStorage.getItem('fractalBurns') || '[]';
      const existingBurns = JSON.parse(existingBurnsJSON);
      
      // Add new burn info
      existingBurns.push({
        address: userAddress,
        tokenIds: tokenIds,
        txHash: txHash,
        timestamp: Date.now(),
        redeemed: false
      });
      
      // Save back to localStorage
      localStorage.setItem('fractalBurns', JSON.stringify(existingBurns));
      console.log(`[STORAGE] Burn information stored locally: ${tokenIds.length} tokens, tx: ${txHash}`);
    }
    
    // Store in Pinata IPFS
    try {
      const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
      const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;
      
      if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
        console.warn('Pinata API keys not found, skipping IPFS upload');
        return { success: true };
      }
      
      // Prepare data for Pinata
      const burnData = {
        address: userAddress,
        tokenIds: tokenIds,
        txHash: txHash,
        timestamp: Date.now(),
        network: 'base',
        contractAddress: FRACTAL_CONTRACT_ADDRESS
      };
      
      // Upload to Pinata
      const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET_KEY
        },
        body: JSON.stringify(burnData)
      });
      
      if (!pinataResponse.ok) {
        throw new Error(`Pinata upload failed: ${pinataResponse.status} ${pinataResponse.statusText}`);
      }
      
      const pinataResult = await pinataResponse.json();
      const ipfsHash = pinataResult.IpfsHash;
      
      console.log(`[STORAGE] Uploaded burn record to IPFS with hash: ${ipfsHash}`);
      
      // Update local storage with the IPFS hash
      if (typeof window !== 'undefined' && window.localStorage) {
        const burnsJSON = localStorage.getItem('fractalBurns') || '[]';
        const burns = JSON.parse(burnsJSON);
        
        // Find the burn we just added and update it with the IPFS hash
        const updatedBurns = burns.map(burn => {
          if (burn.address === userAddress && burn.txHash === txHash) {
            return { ...burn, ipfsHash };
          }
          return burn;
        });
        
        localStorage.setItem('fractalBurns', JSON.stringify(updatedBurns));
      }
      
      return { success: true, ipfsHash };
    } catch (pinataError) {
      console.error('Error uploading to Pinata:', pinataError);
      return { success: true }; // Continue even if Pinata upload fails - we have local storage as backup
    }
    
  } catch (error) {
    console.error('Error storing burn record:', error);
    return { success: false };
  }
};

// Simple proof generation - adapt based on your contract's requirements
function generateSimpleProof(userAddress: string, tokenIds: number[], txHash: string): string[] {
  // This is a very simplified example
  // Your actual implementation would depend on your contract's verification logic
  const combinedData = ethers.utils.solidityKeccak256(
    ['address', 'uint256[]', 'bytes32'],
    [userAddress, tokenIds, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(txHash))]
  );
  
  return [combinedData];
}

// Check if a burn transaction has already been redeemed
async function checkIfBurnRedeemed(userAddress: string, txHash: string): Promise<boolean> {
  try {
    // First check local storage
    if (typeof window !== 'undefined' && window.localStorage) {
      const burnsJSON = localStorage.getItem('fractalBurns') || '[]';
      const burns = JSON.parse(burnsJSON);
      
      const burnRecord = burns.find(burn => 
        burn.address.toLowerCase() === userAddress.toLowerCase() && 
        burn.txHash === txHash
      );
      
      if (burnRecord?.redeemed) {
        return true;
      }
    }
    
    // If not found in local storage or not marked as redeemed,
    // we could check a master record on IPFS or your server
    
    return false;
  } catch (error) {
    console.error('Error checking if burn redeemed:', error);
    return false;
  }
}

// Updated function using direct RPC
export const fetchBurnedTokensFromTx = async (
  burnTxHash: string,
  customTokenIds?: number[]
): Promise<{ success: boolean; tokenIds: number[]; address: string; message?: string }> => {
  try {
    console.log(`[FETCH] Fetching details for transaction ${burnTxHash}`);
    
    // If custom token IDs are provided, use them
    if (customTokenIds && customTokenIds.length > 0) {
      console.log(`[FETCH] Using provided token IDs: ${customTokenIds.join(', ')}`);
      return {
        success: true,
        tokenIds: customTokenIds,
        address: ''
      };
    }
    
    // Try direct RPC to Base Network
    try {
      console.log(`[FETCH] Connecting to Base Network via RPC...`);
      
      // Base network RPC endpoints - try multiple for reliability
      const BASE_RPC_URLS = [
        'https://mainnet.base.org',
        'https://base.llamarpc.com',
        'https://base-rpc.publicnode.com'
      ];
      
      let provider = null;
      
      // Try each RPC endpoint until one works
      for (const rpcUrl of BASE_RPC_URLS) {
        try {
          provider = new ethers.providers.JsonRpcProvider(rpcUrl);
          // Test the connection
          await provider.getBlockNumber();
          console.log(`[FETCH] Connected to Base via ${rpcUrl}`);
          break;
        } catch (rpcError) {
          console.warn(`[FETCH] Failed to connect to ${rpcUrl}:`, rpcError);
        }
      }
      
      if (!provider) {
        throw new Error("Could not connect to any Base Network RPC endpoint");
      }
      
      // Get transaction receipt to check status and logs
      console.log(`[FETCH] Fetching transaction receipt...`);
      const receipt = await provider.getTransactionReceipt(burnTxHash);
      
      if (!receipt) {
        throw new Error("Transaction not found on Base Network");
      }
      
      if (receipt.status === 0) {
        throw new Error("Transaction failed on Base Network");
      }
      
      console.log(`[FETCH] Transaction confirmed in block ${receipt.blockNumber}`);
      
      // Filter the logs for ERC-721 transfers to dead address
      const DEAD_ADDRESS = '0x000000000000000000000000000000000000dEaD'.toLowerCase();
      const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
      
      const burnEvents = receipt.logs.filter(log => {
        // Check for Transfer event
        if (log.topics[0] !== TRANSFER_TOPIC || log.topics.length < 4) {
          return false;
        }
        
        // Check destination is dead address
        const to = '0x' + log.topics[2].slice(26).toLowerCase();
        return to === DEAD_ADDRESS;
      });
      
      if (burnEvents.length === 0) {
        throw new Error("No token burn events found in this transaction");
      }
      
      // Extract token IDs and sender address
      const tokenIds = burnEvents.map(log => parseInt(log.topics[3], 16));
      const fromAddress = '0x' + burnEvents[0].topics[1].slice(26).toLowerCase();
      
      console.log(`[FETCH] Found ${tokenIds.length} tokens burned by ${fromAddress}`);
      console.log(`[FETCH] Token IDs: ${tokenIds.join(', ')}`);
      
      return {
        success: true,
        tokenIds,
        address: fromAddress
      };
    } catch (rpcError) {
      console.error('[FETCH] RPC error:', rpcError);
      throw rpcError;
    }
    
  } catch (error) {
    console.error('[FETCH] Error fetching burned tokens:', error);
    return {
      success: false,
      tokenIds: [],
      address: '',
      message: error instanceof Error ? error.message : 'Unknown error fetching burned tokens'
    };
  }
};
export const loadMerkleProofs = async () => {
  try {
    console.log('[MERKLE] Carregando provas Merkle...');
    
    // Primeiro, verificar se há informações de atualização
    try {
      const updateInfoResponse = await fetch('/merkle-update-info.json');
      if (updateInfoResponse.ok) {
        const updateInfo = await updateInfoResponse.json();
        console.log(`[MERKLE] Última atualização: ${updateInfo.lastUpdated}`);
        console.log(`[MERKLE] Merkle Root: ${updateInfo.merkleRoot}`);
        console.log(`[MERKLE] Total de provas: ${updateInfo.proofCount}`);
      }
    } catch (infoError) {
      console.warn('[MERKLE] Erro ao carregar informações de atualização:', infoError);
    }
    
    // Carregar o arquivo de provas
    const proofsResponse = await fetch('/merkle-proofs.json');
    
    if (!proofsResponse.ok) {
      throw new Error(`Falha ao carregar provas: ${proofsResponse.status}`);
    }
    
    const proofs = await proofsResponse.json();
    console.log(`[MERKLE] Provas carregadas com sucesso: ${Object.keys(proofs).length} registros`);
    
    // Armazenar no localStorage para acesso rápido
    localStorage.setItem('merkleProofs', JSON.stringify(proofs));
    localStorage.setItem('merkleProofsLastLoaded', new Date().toISOString());
    
    return true;
  } catch (error) {
    console.error('[MERKLE] Erro ao carregar provas:', error);
    return false;
  }
};
export const checkMerkleProofsExist = () => {
  const proofs = localStorage.getItem('merkleProofs');
  if (!proofs) {
    console.warn('[MERKLE] No Merkle proofs found in localStorage');
    return false;
  }
  
  try {
    const parsedProofs = JSON.parse(proofs);
    const keys = Object.keys(parsedProofs);
    console.log(`[MERKLE] Found ${keys.length} proofs in localStorage`);
    console.log('[MERKLE] Example keys:', keys.slice(0, 3));
    return keys.length > 0;
  } catch (error) {
    console.error('[MERKLE] Error parsing Merkle proofs:', error);
    return false;
  }
};

// Mark a burn as redeemed
async function markBurnAsRedeemedSimplified(userAddress: string, txHash: string): Promise<void> {
  try {
    // Update local storage
    if (typeof window !== 'undefined' && window.localStorage) {
      const burnsJSON = localStorage.getItem('fractalBurns') || '[]';
      const burns = JSON.parse(burnsJSON);
      
      const updatedBurns = burns.map(burn => {
        if (burn.address.toLowerCase() === userAddress.toLowerCase() && burn.txHash === txHash) {
          return { ...burn, redeemed: true };
        }
        return burn;
      });
      
      localStorage.setItem('fractalBurns', JSON.stringify(updatedBurns));
      console.log(`[STORAGE] Marked burn transaction ${txHash} as redeemed`);
    }
    
    // If in production, we would also update the master record
    if (process.env.NODE_ENV === 'production') {
      // This would typically be a call to your backend
      // which would update the redemption status in your database
      // or create a new record on IPFS
    }
  } catch (error) {
    console.error('Error marking burn as redeemed:', error);
  }
}

// Simplified redemption function
export const redeemBurnedTokensSimplified = async (
  provider: ethers.providers.Web3Provider, 
  burnedTokenIds: number[],
  burnTxHash: string
): Promise<string> => {
  try {
    const contract = await getMurmurationContract(provider);
    
    // Get redemption rate
    const redemptionRate = await contract.redemptionRate();
    
    // Verify correct number of tokens
    if (burnedTokenIds.length !== redemptionRate.toNumber()) {
      throw new Error(`Redemption requires exactly ${redemptionRate.toNumber()} tokens`);
    }
    
    // Get user address
    const signer = provider.getSigner();
    const userAddress = await signer.getAddress();
    
    console.log(`[REDEEM] Starting redemption for ${burnedTokenIds.length} tokens on Berachain`);
    console.log(`[REDEEM] User address: ${userAddress}`);
    
    // Check if this burn has already been redeemed
    const isBurnRedeemed = await checkIfBurnRedeemed(userAddress, burnTxHash);
    if (isBurnRedeemed) {
      throw new Error("These tokens have already been redeemed");
    }
    
    // Generate a simple proof for the contract
    // This assumes your contract has a simplified verification method
    const proof = generateSimpleProof(userAddress, burnedTokenIds, burnTxHash);
    
    console.log(`[REDEEM] Proof generated for burn transaction: ${burnTxHash}`);
    
    // Execute redemption
    console.log(`[REDEEM] Sending crossChainRedeem transaction...`);
    const tx = await contract.crossChainRedeem(
      proof,
      burnedTokenIds,
      userAddress
    );
    
    await tx.wait();
    console.log(`[REDEEM] Redemption successful. Hash: ${tx.hash}`);
    
    // Mark as redeemed
    await markBurnAsRedeemedSimplified(userAddress, burnTxHash);
    
    return tx.hash;
  } catch (error: any) {
    console.error('Error redeeming burned tokens:', error);
    throw new Error(error.message || 'Failed to redeem tokens');
  }
};

// Simple utility for hashing
function hashLeaf(address: string, tokenId: number): string {
  return ethers.utils.solidityKeccak256(
    ['address', 'uint256'],
    [address.toLowerCase(), tokenId]
  );
}

// Create a simple Merkle Tree
function createMerkleTree(address: string, tokenIds: number[]): { 
  root: string; 
  proofs: { [tokenId: number]: string[] } 
} {
  // Generate leaf nodes (one per token)
  const leaves = tokenIds.map(id => hashLeaf(address, id));
  
  // If there's just one token, the proof is empty but we need a root
  if (leaves.length === 1) {
    return {
      root: leaves[0],
      proofs: { [tokenIds[0]]: [] }
    };
  }
  
  // For multiple tokens, create a simple tree
  const layers: string[][] = [leaves];
  
  // Build tree upward until we have a single root
  while (layers[0].length > 1) {
    const newLayer: string[] = [];
    const currentLayer = layers[0];
    
    // Combine pairs of nodes
    for (let i = 0; i < currentLayer.length; i += 2) {
      if (i + 1 < currentLayer.length) {
        // Hash the pair together
        const combined = ethers.utils.solidityKeccak256(
          ['bytes32', 'bytes32'],
          [currentLayer[i], currentLayer[i + 1]]
        );
        newLayer.push(combined);
      } else {
        // Odd number of nodes, promote the last one
        newLayer.push(currentLayer[i]);
      }
    }
    
    // Add new layer to the beginning
    layers.unshift(newLayer);
  }
  
  // The root is the single hash at the top layer
  const root = layers[0][0];
  
  // Generate proofs for each token
  const proofs: { [tokenId: number]: string[] } = {};
  tokenIds.forEach((tokenId, index) => {
    const proof: string[] = [];
    let currentIndex = index;
    
    // Walk up the tree, collecting sibling nodes
    for (let i = layers.length - 1; i > 0; i--) {
      const layer = layers[i];
      const isRight = currentIndex % 2 === 1;
      const siblingIndex = isRight ? currentIndex - 1 : currentIndex + 1;
      
      if (siblingIndex < layer.length) {
        proof.push(layer[siblingIndex]);
      }
      
      // Move to parent index
      currentIndex = Math.floor(currentIndex / 2);
    }
    
    proofs[tokenId] = proof;
  });
  
  return { root, proofs };
}

export async function generateMerkleTree(burnRecords: Array<{address: string, tokenIds: number[]}>): Promise<{
  merkleTree: MerkleTree;
  merkleRoot: string;
  proofs: Record<string, string[]>;
}> {
  // Criar leaves para cada registro de queima
  const leaves = burnRecords.map(record => {
    // Normalizar endereço e ordenar token IDs
    const address = record.address.toLowerCase();
    const sortedTokenIds = [...record.tokenIds].sort((a, b) => a - b);
    
    // Criar folha exatamente como no contrato
    return ethers.utils.solidityKeccak256(
      ['address', 'uint256[]'],
      [address, sortedTokenIds]
    );
  });
  
  // Criar a árvore Merkle usando keccak256 como função de hash
  const merkleTree = new MerkleTree(leaves, keccak256, { hashLeaves: false, sortPairs: true });
  
  // Obter a raiz Merkle
  const merkleRoot = merkleTree.getHexRoot();
  
  // Gerar provas para cada folha
  const proofs: Record<string, string[]> = {};
  leaves.forEach((leaf, index) => {
    const proof = merkleTree.getHexProof(leaf);
    const key = `${burnRecords[index].address}_${burnRecords[index].tokenIds.join('_')}`;
    proofs[key] = proof;
  });
  
  return { merkleTree, merkleRoot, proofs };
}

// Função para gerar um leaf para um conjunto específico de tokens
export function generateMerkleLeaf(address: string, tokenIds: number[]): string {
  const normalizedAddress = address.toLowerCase();
  const sortedTokenIds = [...tokenIds].sort((a, b) => a - b);
  
  return ethers.utils.solidityKeccak256(
    ['address', 'uint256[]'],
    [normalizedAddress, sortedTokenIds]
  );
}

// Função para obter uma prova Merkle para um registro específico
export function getMerkleProofForBurn(
  merkleTree: MerkleTree,
  address: string,
  tokenIds: number[]
): string[] {
  const leaf = generateMerkleLeaf(address, tokenIds);
  return merkleTree.getHexProof(leaf);
}

// Função para verificar uma prova Merkle
export function verifyMerkleProof(
  merkleRoot: string,
  merkleProof: string[],
  address: string,
  tokenIds: number[]
): boolean {
  const leaf = generateMerkleLeaf(address, tokenIds);
  const merkleTree = new MerkleTree([], keccak256, { hashLeaves: false, sortPairs: true });
  return merkleTree.verify(merkleProof, leaf, merkleRoot);
}

// Função para gerar e configurar o Merkle Root no contrato
export async function setupMerkleRootForContract(
  provider: ethers.providers.Web3Provider,
  burnRecords: Array<{address: string, tokenIds: number[]}>
): Promise<string> {
  try {
    // Gerar a árvore Merkle
    const { merkleTree, merkleRoot, proofs } = await generateMerkleTree(burnRecords);
    
    console.log(`Generated Merkle Root: ${merkleRoot}`);
    console.log(`Number of burn records in tree: ${burnRecords.length}`);
    
    // Obter o contrato
    const contract = await getMurmurationContract(provider);
    
    // Configurar o Merkle Root no contrato
    console.log(`Setting Merkle Root on contract...`);
    const tx = await contract.setMerkleRoot(merkleRoot);
    await tx.wait();
    
    console.log(`Merkle Root successfully set on contract. Transaction: ${tx.hash}`);
    
    // Salvar as provas localmente para uso futuro
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('merkleProofs', JSON.stringify(proofs));
      localStorage.setItem('merkleRoot', merkleRoot);
    }
    
    return merkleRoot;
  } catch (error) {
    console.error('Error setting up Merkle Root:', error);
    throw error;
  }
}

// Função para obter a prova Merkle para um usuário e tokens específicos
export async function getProofForRedemption(
  userAddress: string,
  tokenIds: number[]
): Promise<string[]> {
  try {
    // Verificar se temos provas armazenadas
    if (typeof window !== 'undefined' && window.localStorage) {
      const proofsString = localStorage.getItem('merkleProofs');
      
      if (proofsString) {
        const proofs = JSON.parse(proofsString);
        const normalizedAddress = userAddress.toLowerCase();
        const sortedTokenIds = [...tokenIds].sort((a, b) => a - b);
        const key = `${normalizedAddress}_${sortedTokenIds.join('_')}`;
        
        if (proofs[key]) {
          return proofs[key];
        }
      }
    }
    
    // Se não encontramos a prova armazenada, retornamos uma prova vazia
    console.warn('Merkle proof not found for this address and tokens');
    return [];
  } catch (error) {
    console.error('Error getting Merkle proof:', error);
    return [];
  }
}

// Verify burn with Berascan API
async function verifyBurnWithBerascan(txHash: string, userAddress: string, tokenIds: number[]): Promise<boolean> {
  try {
    const BERASCAN_API_KEY = "II3EQVTZ15UD11Y91Z2TV4R18JERH9M3FI";
    const API_URL = `https://api.berascan.com/api?module=account&action=tokentx&address=${userAddress}&apikey=${BERASCAN_API_KEY}`;
    
    const response = await fetch(API_URL);
    const data = await response.json();
    
    if (data.status !== '1') {
      console.error("Berascan API error:", data.message);
      return false;
    }
    
    // Look for transactions to the dead address
    const DEAD_ADDRESS = '0x000000000000000000000000000000000000dEaD';
    const relevantTxs = data.result.filter((tx: any) => 
      tx.to.toLowerCase() === DEAD_ADDRESS.toLowerCase() &&
      tx.hash.toLowerCase() === txHash.toLowerCase() &&
      tx.contractAddress.toLowerCase() === FRACTAL_CONTRACT_ADDRESS.toLowerCase()
    );
    
    // Check if all tokenIds were transferred in this transaction
    const burnedTokenIds = relevantTxs.map((tx: any) => parseInt(tx.tokenID));
    const allTokensBurned = tokenIds.every(id => burnedTokenIds.includes(id));
    
    return allTokensBurned;
  } catch (error) {
    console.error("Error verifying burn with Berascan:", error);
    return false;
  }
}



// Redeem burned tokens
export const redeemBurnedTokens = async (
  provider: ethers.providers.Web3Provider, 
  burnedTokenIds: number[]
): Promise<string> => {
  try {
    const contract = await getMurmurationContract(provider);
    
    // Get redemption rate
    const redemptionRate = await contract.redemptionRate();
    
    // Verify correct number of tokens
    if (burnedTokenIds.length !== redemptionRate.toNumber()) {
      throw new Error(`Redemption requires exactly ${redemptionRate.toNumber()} tokens`);
    }
    
    // Get user address
    const signer = provider.getSigner();
    const userAddress = await signer.getAddress();
    
    console.log(`[REDEEM] Starting redemption for ${burnedTokenIds.length} tokens on Berachain`);
    console.log(`[REDEEM] User address: ${userAddress}`);
    
    // Get merkle proof using our local implementation
    const merkleProof = await getMerkleProofForBurn(userAddress, burnedTokenIds);
    
    console.log(`[REDEEM] Merkle proof obtained:`, merkleProof);
    
    // Execute redemption
    console.log(`[REDEEM] Sending crossChainRedeem transaction...`);
    const tx = await contract.crossChainRedeem(
      merkleProof.proof,
      burnedTokenIds,
      userAddress
    );
    
    await tx.wait();
    console.log(`[REDEEM] Redemption successful. Hash: ${tx.hash}`);
    
    // Update local storage to mark these tokens as redeemed
    markBurnAsRedeemed(userAddress, burnedTokenIds);
    
    return tx.hash;
  } catch (error: any) {
    console.error('Error redeeming burned tokens:', error);
    throw new Error(error.message || 'Failed to redeem tokens');
  }
};

// Store burn information in local storage
export const storeBurnInfo = (userAddress: string, tokenIds: number[], txHash: string) => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    
    // Get existing burns or initialize empty array
    const existingBurnsJSON = localStorage.getItem('fractalBurns') || '[]';
    const existingBurns = JSON.parse(existingBurnsJSON);
    
    console.log(`[STORAGE] Storing burn information: ${tokenIds.length} tokens, tx: ${txHash}`);
    
    // Add new burn info
    existingBurns.push({
      address: userAddress,
      tokenIds: tokenIds,
      txHash: txHash,
      timestamp: Date.now(),
      redeemed: false
    });
    
    // Save back to localStorage
    localStorage.setItem('fractalBurns', JSON.stringify(existingBurns));
  } catch (error) {
    console.error('Error storing burn info:', error);
  }
};

// Get stored burn information
export const getBurnInfo = (userAddress: string) => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    
    const burnsJSON = localStorage.getItem('fractalBurns') || '[]';
    const burns = JSON.parse(burnsJSON);
    
    // Filter burns for this address
    return burns.filter(burn => burn.address.toLowerCase() === userAddress.toLowerCase());
  } catch (error) {
    console.error('Error retrieving burn info:', error);
    return [];
  }
};

// Mark a burn as redeemed
export const markBurnAsRedeemed = (userAddress: string, tokenIds: number[]) => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    
    const burnsJSON = localStorage.getItem('fractalBurns') || '[]';
    const burns = JSON.parse(burnsJSON);
    
    console.log(`[STORAGE] Marking tokens as redeemed: ${tokenIds.join(', ')}`);
    
    // Find and update the burn record
    const updatedBurns = burns.map(burn => {
      if (burn.address.toLowerCase() === userAddress.toLowerCase() && 
          arraysHaveSameElements(burn.tokenIds, tokenIds)) {
        return { ...burn, redeemed: true };
      }
      return burn;
    });
    
    // Save back to localStorage
    localStorage.setItem('fractalBurns', JSON.stringify(updatedBurns));
  } catch (error) {
    console.error('Error updating burn info:', error);
  }
};

// Helper function to check if two arrays have the same elements (regardless of order)
const arraysHaveSameElements = (a: number[], b: number[]): boolean => {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
};

// Interface for Merkle proof data
interface MerkleProofData {
  proof: string[];
  tokens: number[];
  valid: boolean;
}

// Check if a proof has already been used for redemption
export async function isProofUsed(provider: ethers.providers.Web3Provider, proofHash: string): Promise<boolean> {
  try {
    await switchToBeraNetwork(provider);
    const contract = new ethers.Contract(MURMURATION_CONTRACT_ADDRESS, MURMURATION_ABI, provider);
    return await contract.burnProofClaimed(proofHash);
  } catch (error) {
    console.error("Error checking if proof is used:", error);
    return false; // Default to false if there's an error
  }
}

// Get the redemption rate (how many tokens need to be burned)
export async function getRedemptionRate(provider: ethers.providers.Web3Provider): Promise<number> {
  try {
    await switchToBeraNetwork(provider);
    const contract = new ethers.Contract(MURMURATION_CONTRACT_ADDRESS, MURMURATION_ABI, provider);
    const rate = await contract.redemptionRate();
    return rate.toNumber();
  } catch (error) {
    console.error("Error getting redemption rate:", error);
    return 25; // Default fallback value
  }
}

// Get user's redemption count
export async function getUserRedemptionCount(provider: ethers.providers.Web3Provider): Promise<number> {
  try {
    await switchToBeraNetwork(provider);
    const { signer } = await getProviderAndSigner(provider);
    const userAddress = await signer.getAddress();
    const contract = new ethers.Contract(MURMURATION_CONTRACT_ADDRESS, MURMURATION_ABI, provider);
    const count = await contract.redemptionCount(userAddress);
    return count.toNumber();
  } catch (error) {
    console.error("Error getting user redemption count:", error);
    return 0; // Default to 0 if there's an error
  }
}

// Parse token IDs from various input formats (string, comma-separated, JSON)
export function parseTokenIds(tokenIdsInput: string): number[] {
  if (!tokenIdsInput.trim()) return [];
  
  try {
    // Handle various formats: comma-separated, space-separated, or JSON array
    if (tokenIdsInput.includes('[') && tokenIdsInput.includes(']')) {
      return JSON.parse(tokenIdsInput);
    } else {
      return tokenIdsInput
        .split(/[\s,]+/) // Split by commas or whitespace
        .map(id => id.trim())
        .filter(id => id !== '')
        .map(id => parseInt(id));
    }
  } catch (error) {
    console.error('Error parsing token IDs:', error);
    return [];
  }
}

// Get the status of Fractal to Murmuration redemption (useful for UI)
export async function getRedemptionStatus(provider: ethers.providers.Web3Provider): Promise<{
  baseConnected: boolean;
  beraConnected: boolean;
  fractalBalance: number;
  redemptionRate: number;
  userRedemptions: number;
}> {
  try {
    // Default status
    const status = {
      baseConnected: false,
      beraConnected: false,
      fractalBalance: 0,
      redemptionRate: 25, // Default
      userRedemptions: 0
    };
    
    // Check Base connection and get Fractal balance
    try {
      const baseProvider = new ethers.providers.Web3Provider(window.ethereum);
      status.baseConnected = await isOnBaseNetwork(baseProvider);
      
      if (status.baseConnected) {
        const fractalTokens = await getFractalTokens(baseProvider);
        status.fractalBalance = fractalTokens.length;
      }
    } catch (baseError) {
      console.error("Error checking Base connection:", baseError);
    }
    
    // Check Bera connection and get redemption info
    try {
      const beraProvider = new ethers.providers.Web3Provider(window.ethereum);
      status.beraConnected = await isOnBeraNetwork(beraProvider);
      
      if (status.beraConnected) {
        status.redemptionRate = await getRedemptionRate(beraProvider);
        status.userRedemptions = await getUserRedemptionCount(beraProvider);
      }
    } catch (beraError) {
      console.error("Error checking Bera connection:", beraError);
    }
    
    return status;
  } catch (error) {
    console.error("Error getting redemption status:", error);
    return {
      baseConnected: false,
      beraConnected: false,
      fractalBalance: 0,
      redemptionRate: 25,
      userRedemptions: 0
    };
  }
}

// You can also keep the default export if needed
export default {
  isOnBeraNetwork,
  isOnBaseNetwork,
  switchToBeraNetwork,
  switchToBaseNetwork,
  mintMurmuration,
  getMurmurationSupply,
  getMurmurationPrice,
  getFractalTokens,
  burnFractalTokens,
  burnFractalTokensInBatches,
  burnTokensEfficiently,
  burnTokensSimplified,
  redeemBurnedTokens,
  redeemBurnedTokensSimplified,
  parseTokenIds,
  getRedemptionRate,
  storeBurnInfo,
  getBurnInfo,
  getRedemptionStatus
};