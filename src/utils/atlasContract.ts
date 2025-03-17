// utils/atlasContract.ts
import { ethers } from 'ethers';
import { getProvider } from './wallet';

// ABI mínimo para interação com o contrato NFT
const ATLAS_NFT_ABI = [
  // Funções de leitura
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function tokenByIndex(uint256 index) view returns (uint256)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function getFusionLevel(uint256 tokenId) view returns (uint8)",
  "function getTokenFullData(uint256 tokenId) view returns (string, string[], uint8, string, string)",
  
  // Funções de escrita
  "function mintAtlasMap() payable",
  "function activateTerritory(uint256 tokenId, string networkId)",
  "function batchActivateTerritories(uint256 tokenId, string[] networkIds)",
  "function updateTerritory(uint256 tokenId, string networkId, uint256 balance, uint256 nftCount, uint256 transactions, uint256 stakedAmount)",
  "function fuseTokens(uint256[] parentTokenIds) returns (uint256)",
  "function setCustomMapName(uint256 tokenId, string name)",
  
  // Eventos
  "event AtlasMinted(uint256 indexed tokenId, address indexed owner)",
  "event TerritoryActivated(uint256 indexed tokenId, string networkId)",
  "event TerritoryUpdated(uint256 indexed tokenId, string networkId)",
  "event TokensFused(uint256 indexed newTokenId, uint256[] parentTokenIds)"
];

// Endereços do contrato por rede
const CONTRACT_ADDRESSES: { [chainId: string]: string } = {
  '0x1': '0x1234567890123456789012345678901234567890', // Ethereum Mainnet (exemplo)
  '0x5': '0x1234567890123456789012345678901234567890', // Goerli (exemplo)
  '0x89': '0x1234567890123456789012345678901234567890', // Polygon (exemplo)
  '0x14a04': '0x91B80CcE88B265392e801f2e9C9F4B4994EE66a7', // Base Sepolia
};

// Additional contract addresses (may be used in other parts of your app)
export const NETWORK_ADDRESSES = {
  '0x14a04': { // Base Sepolia
    CRYPTO_ATLAS_NFT: '0x91B80CcE88B265392e801f2e9C9F4B4994EE66a7',
    NETWORK_REGISTRY: '0xDBB3963F74AbBC2baF2A2ffbD9e1391F7c6C65DF',
    TERRITORY_DATA_STORE: '0xcc3f4Fd23806F9a309355eBcada6c25372ff2B84',
    ATLAS_RENDERER_CORE: '0x2D210E4F67b866e7BC28976bac810FF814e30B16'
  }
};

// Token price
const MINT_PRICE = ethers.utils.parseEther('0.01');

/**
 * Obtém instância do contrato Atlas NFT
 */
export const getAtlasContract = async () => {
  const provider = await getProvider();
  const network = await provider.getNetwork();
  const contractAddress = CONTRACT_ADDRESSES[`0x${network.chainId.toString(16)}`];
  
  if (!contractAddress) {
    throw new Error(`Contrato não implantado na rede ${network.name}`);
  }
  
  const signer = provider.getSigner();
  return new ethers.Contract(contractAddress, ATLAS_NFT_ABI, signer);
};

/**
 * Obtém informações básicas do contrato
 */
export const getContractInfo = async () => {
  try {
    const contract = await getAtlasContract();
    const [name, symbol, totalSupply] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.totalSupply().then((supply: ethers.BigNumber) => supply.toNumber())
    ]);
    
    return { name, symbol, totalSupply };
  } catch (error) {
    console.error('Erro ao obter informações do contrato:', error);
    throw error;
  }
};

/**
 * Obtém todos os tokens do endereço atual
 */
export const getUserAtlasTokens = async () => {
  try {
    const contract = await getAtlasContract();
    const signer = await contract.signer;
    const userAddress = await signer.getAddress();
    
    const balance = await contract.balanceOf(userAddress);
    const tokens = [];
    
    for (let i = 0; i < balance.toNumber(); i++) {
      const tokenId = await contract.tokenOfOwnerByIndex(userAddress, i);
      const uri = await contract.tokenURI(tokenId);
      const fusionLevel = await contract.getFusionLevel(tokenId);
      
      tokens.push({
        id: tokenId.toString(),
        uri,
        fusionLevel
      });
    }
    
    return tokens;
  } catch (error) {
    console.error('Erro ao obter tokens do usuário:', error);
    throw error;
  }
};

/**
 * Minta um novo Atlas NFT
 */
export const mintAtlasNFT = async () => {
  try {
    const contract = await getAtlasContract();
    
    // Minta o NFT com o valor correto
    const tx = await contract.mintAtlasMap({ value: MINT_PRICE });
    const receipt = await tx.wait();
    
    // Procura pelo evento de mintagem para obter o tokenId
    const mintEvent = receipt.events?.find(
      (event: any) => event.event === 'AtlasMinted'
    );
    
    if (mintEvent && mintEvent.args) {
      return {
        tokenId: mintEvent.args.tokenId.toString(),
        owner: mintEvent.args.owner,
        tx: receipt.transactionHash
      };
    }
    
    throw new Error('Evento de mintagem não encontrado no recibo da transação');
  } catch (error) {
    console.error('Erro ao mintar Atlas NFT:', error);
    throw error;
  }
};

/**
 * Ativa um território para um token específico
 */
export const activateTerritory = async (tokenId: string, networkId: string) => {
  try {
    const contract = await getAtlasContract();
    
    // Verifica propriedade do token
    const owner = await contract.ownerOf(tokenId);
    const signer = await contract.signer;
    const userAddress = await signer.getAddress();
    
    if (owner.toLowerCase() !== userAddress.toLowerCase()) {
      throw new Error('You are not the owner of this token');
    }
    
    // Ativa o território
    const tx = await contract.activateTerritory(tokenId, networkId);
    const receipt = await tx.wait();
    
    return {
      success: true,
      tx: receipt.transactionHash
    };
  } catch (error) {
    console.error('Erro ao ativar território:', error);
    throw error;
  }
};

/**
 * Atualiza dados de um território
 */
export const updateTerritoryData = async (
  tokenId: string, 
  networkId: string,
  balance: number,
  nftCount: number,
  transactions: number,
  stakedAmount: number
) => {
  try {
    const contract = await getAtlasContract();
    
    // Verifica propriedade do token
    const owner = await contract.ownerOf(tokenId);
    const signer = await contract.signer;
    const userAddress = await signer.getAddress();
    
    if (owner.toLowerCase() !== userAddress.toLowerCase()) {
      throw new Error('Você não é o proprietário deste token');
    }
    
    // Converte valores para BigNumber
    const balanceBN = ethers.utils.parseEther(balance.toString());
    const stakedAmountBN = ethers.utils.parseEther(stakedAmount.toString());
    
    // Atualiza o território
    const tx = await contract.updateTerritory(
      tokenId, 
      networkId, 
      balanceBN,
      nftCount,
      transactions,
      stakedAmountBN
    );
    const receipt = await tx.wait();
    
    return {
      success: true,
      tx: receipt.transactionHash
    };
  } catch (error) {
    console.error('Erro ao atualizar território:', error);
    throw error;
  }
};

/**
 * Funde vários tokens em um novo
 */
export const fuseTokens = async (tokenIds: string[]) => {
  if (tokenIds.length < 2) {
    throw new Error('É necessário pelo menos 2 tokens para fusão');
  }
  
  try {
    const contract = await getAtlasContract();
    
    // Verifica propriedade de todos os tokens
    for (const tokenId of tokenIds) {
      const owner = await contract.ownerOf(tokenId);
      const signer = await contract.signer;
      const userAddress = await signer.getAddress();
      
      if (owner.toLowerCase() !== userAddress.toLowerCase()) {
        throw new Error(`Você não é o proprietário do token ${tokenId}`);
      }
    }
    
    // Realiza a fusão
    const tx = await contract.fuseTokens(tokenIds);
    const receipt = await tx.wait();
    
    // Procura pelo evento de fusão para obter o novo tokenId
    const fuseEvent = receipt.events?.find(
      (event: any) => event.event === 'TokensFused'
    );
    
    if (fuseEvent && fuseEvent.args) {
      return {
        newTokenId: fuseEvent.args.newTokenId.toString(),
        parentTokenIds: fuseEvent.args.parentTokenIds.map((id: ethers.BigNumber) => id.toString()),
        tx: receipt.transactionHash
      };
    }
    
    throw new Error('Evento de fusão não encontrado no recibo da transação');
  } catch (error) {
    console.error('Erro ao fundir tokens:', error);
    throw error;
  }
};

/**
 * Define o nome personalizado para um token
 */
export const setCustomTokenName = async (tokenId: string, name: string) => {
  try {
    const contract = await getAtlasContract();
    
    // Verifica propriedade do token
    const owner = await contract.ownerOf(tokenId);
    const signer = await contract.signer;
    const userAddress = await signer.getAddress();
    
    if (owner.toLowerCase() !== userAddress.toLowerCase()) {
      throw new Error('Você não é o proprietário deste token');
    }
    
    // Define o nome personalizado
    const tx = await contract.setCustomMapName(tokenId, name);
    const receipt = await tx.wait();
    
    return {
      success: true,
      tx: receipt.transactionHash
    };
  } catch (error) {
    console.error('Erro ao definir nome personalizado:', error);
    throw error;
  }
};

/**
 * Obtém detalhes completos de um token
 */
export const getTokenDetails = async (tokenId: string) => {
  try {
    const contract = await getAtlasContract();
    
    // Obter dados completos do token
    const [name, territories, fusionLevel, externalModelURL, metadata] = 
      await contract.getTokenFullData(tokenId);
    
    // Obter proprietário
    const owner = await contract.ownerOf(tokenId);
    
    return {
      id: tokenId,
      name,
      territories,
      fusionLevel,
      externalModelURL,
      metadata: metadata ? JSON.parse(metadata) : {},
      owner
    };
  } catch (error) {
    console.error('Erro ao obter detalhes do token:', error);
    throw error;
  }
};
