// services/contractService.ts
import { ethers } from 'ethers';
import CryptoAtlasNFTAbi from '../abi/CryptoAtlasNFT.json';
import TerritoryDataStoreAbi from '../abi/TerritoryDataStore.json';

const CRYPTO_ATLAS_ADDRESS = "0x91B80CcE88B265392e801f2e9C9F4B4994EE66a7";
const TERRITORY_STORE_ADDRESS = "0xcc3f4Fd23806F9a309355eBcada6c25372ff2B84";

export const getTokenData = async (provider: ethers.providers.Provider, tokenId: string) => {
  const contract = new ethers.Contract(
    CRYPTO_ATLAS_ADDRESS,
    CryptoAtlasNFTAbi,
    provider
  );
  
  try {
    const data = await contract.getTokenFullData(tokenId);
    return data;
  } catch (error) {
    console.error("Error fetching token data:", error);
    throw error;
  }
};

export const getTerritoryActivity = async (
  provider: ethers.providers.Provider,
  tokenId: string,
  networkId: string
) => {
  const contract = new ethers.Contract(
    TERRITORY_STORE_ADDRESS,
    TerritoryDataStoreAbi,
    provider
  );
  
  try {
    const data = await contract.getTerritoryActivity(tokenId, networkId);
    return {
      balance: parseFloat(ethers.utils.formatEther(data.balance)),
      nftCount: data.nftCount.toNumber(),
      transactions: data.transactions.toNumber(),
      stakedAmount: parseFloat(ethers.utils.formatEther(data.stakedAmount)),
      lastUpdate: data.lastUpdate.toNumber()
    };
  } catch (error) {
    console.error("Error fetching territory activity:", error);
    throw error;
  }
};