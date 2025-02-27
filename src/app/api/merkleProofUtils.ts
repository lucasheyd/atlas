// utils/merkleProofUtils.ts
import { ethers } from 'ethers';
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';

// Improved function to load Merkle proofs with better error handling
export const loadMerkleProofs = async (): Promise<boolean> => {
  try {
    console.log('[MERKLE] Attempting to load Merkle proofs');
    
    try {
      // Try multiple possible paths for the merkle-proofs.json file
      const possiblePaths = [
        '/merkle-proofs.json',           // Root path
        '/public/merkle-proofs.json',    // Explicit public path
        '/frontend/public/merkle-proofs.json', // Frontend public path
        '/api/merkle-proofs'             // API route option
      ];
      
      let proofsResponse;
      let foundPath = '';
      
      // Try each path until we find the file
      for (const path of possiblePaths) {
        try {
          console.log(`[MERKLE] Trying to load proofs from: ${path}`);
          const response = await fetch(path);
          if (response.ok) {
            proofsResponse = response;
            foundPath = path;
            break;
          }
        } catch (e) {
          console.log(`[MERKLE] Path ${path} failed:`, e);
        }
      }
      
      if (!proofsResponse || !foundPath) {
        throw new Error(`Failed to load proofs from any known location`);
      }
      
      console.log(`[MERKLE] Successfully found proofs at: ${foundPath}`);
      
      const proofs = await proofsResponse.json();
      
      console.log('[MERKLE] Successfully loaded proofs', {
        totalProofs: Object.keys(proofs).length,
        firstFiveKeys: Object.keys(proofs).slice(0, 5)
      });
      
      // Store in localStorage
      localStorage.setItem('merkleProofs', JSON.stringify(proofs));
      localStorage.setItem('merkleProofsLastLoaded', new Date().toISOString());
      
      return true;
    } catch (fetchError) {
      // If we couldn't fetch the file, try to use the fallback proofs
      console.warn('[MERKLE] Error fetching proof file:', fetchError);
      
      // Fall back to hardcoded proofs if available
      const fallbackProofs = getFallbackMerkleProofs();
      if (Object.keys(fallbackProofs).length > 0) {
        console.log('[MERKLE] Using fallback proofs:', {
          totalFallbackProofs: Object.keys(fallbackProofs).length
        });
        
        localStorage.setItem('merkleProofs', JSON.stringify(fallbackProofs));
        localStorage.setItem('merkleProofsLastLoaded', new Date().toISOString());
        return true;
      }
      
      // If no fallback available, rethrow the error
      throw fetchError;
    }
  } catch (error) {
    console.error('[MERKLE] Comprehensive error loading proofs:', {
      errorMessage: error.message,
      errorStack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return false;
  }
};

// Fallback proofs - these are the ones from the JSON file
export const getFallbackMerkleProofs = () => {
  return {
    "0x80fa3a7d0501083a2a3481da788137bf719d9ede_500_501_502_503_504_505_506_507_508_509_510_511_512_513_514_515_516_517_518_519_601_602_603_604_605_0x0c0e7883804a2dc4cd45bb045a9064e7d956ddc86a5243f55ae556b19ccc4745": [
      "0x38ba7c7210ca3f005c2bb536f91aa6d6e5f81c7660e0fab3f6303d3a65a5756f",
      "0x69c4888b9cb985bd7e067c028a8853028918c7484d011902586f5863349ec8e3"
    ],
    "0xa838c04583664c36974417c6490fd8fe830e3482_169_170_171_172_173_174_175_176_177_520_521_522_523_525_526_527_528_529_546_547_548_549_550_564_598_0x246231030e9887c6eedc709c385ec990fec19b9a8e0a6bf0a629a0cb90351755": [
      "0xf6287db87a3fb92c00637a17e7615d16dbc8b80e46c244856165e683e8b31818",
      "0x69c4888b9cb985bd7e067c028a8853028918c7484d011902586f5863349ec8e3"
    ],
    "0xa838c04583664c36974417c6490fd8fe830e3482_578_579_580_581_582_583_584_585_586_587_588_589_590_591_592_594_595_596_597_600_632_633_670_671_673_0x1c199ec387c4b7fd523d7a8aa8b7e8cf73be637a60f657d5c37372c80f19e0d0": [
      "0xd55c2592d501f59df6a261216c68676882f24da5f30e969b0e2c03b55cee3ebd"
    ]
  };
};

// Check if Merkle proofs are available in localStorage
export const checkMerkleProofsExist = (): boolean => {
  try {
    const proofsString = localStorage.getItem('merkleProofs');
    if (!proofsString) {
      console.warn('[MERKLE] No Merkle proofs found in localStorage');
      return false;
    }
    
    const proofs = JSON.parse(proofsString);
    const keys = Object.keys(proofs);
    
    console.log(`[MERKLE] Found ${keys.length} proofs in localStorage`);
    return keys.length > 0;
  } catch (error) {
    console.error('[MERKLE] Error checking Merkle proofs:', error);
    return false;
  }
};

// Generate a Merkle tree from burn records
export const generateMerkleTree = (
  burnRecords: Array<{address: string, tokenIds: number[]}>
): {
  merkleTree: MerkleTree;
  merkleRoot: string;
  proofs: Record<string, string[]>;
} => {
  // Create leaves for each burn record
  const leaves = burnRecords.map(record => {
    const address = record.address.toLowerCase();
    const sortedTokenIds = [...record.tokenIds].sort((a, b) => a - b);
    
    // Create leaf exactly like in the contract
    return ethers.utils.solidityKeccak256(
      ['address', 'uint256[]'],
      [address, sortedTokenIds]
    );
  });
  
  // Create the Merkle tree using keccak256 as hash function
  const merkleTree = new MerkleTree(leaves, keccak256, { hashLeaves: false, sortPairs: true });
  
  // Get the Merkle root
  const merkleRoot = merkleTree.getHexRoot();
  
  // Generate proofs for each leaf
  const proofs: Record<string, string[]> = {};
  leaves.forEach((leaf, index) => {
    const proof = merkleTree.getHexProof(leaf);
    const record = burnRecords[index];
    const sortedTokenIds = [...record.tokenIds].sort((a, b) => a - b);
    
    // Create key with address and sorted token IDs
    const key = `${record.address.toLowerCase()}_${sortedTokenIds.join('_')}`;
    proofs[key] = proof;
  });
  
  return { merkleTree, merkleRoot, proofs };
};

// Generate a Merkle leaf for specific tokens
export const generateMerkleLeaf = (address: string, tokenIds: number[]): string => {
  const normalizedAddress = address.toLowerCase();
  const sortedTokenIds = [...tokenIds].sort((a, b) => a - b);
  
  return ethers.utils.solidityKeccak256(
    ['address', 'uint256[]'],
    [normalizedAddress, sortedTokenIds]
  );
};

// Generate a new Merkle proof for a specific burn
export const generateProofForBurn = (
  address: string,
  tokenIds: number[],
  existingProofs: Record<string, string[]>
): string[] | null => {
  try {
    // Try to find a direct match first
    const normalizedAddress = address.toLowerCase();
    const sortedTokenIds = [...tokenIds].sort((a, b) => a - b);
    
    // Create keys to try for matching
    const possibleKeys = [
      // Full key pattern: address_token1_token2_..._tokenN (no txHash)
      `${normalizedAddress}_${sortedTokenIds.join('_')}`,
      
      // Try with just the tokens (address agnostic)
      `${sortedTokenIds.join('_')}`
    ];
    
    // Try each possible key pattern
    for (const keyPattern of possibleKeys) {
      // Find any key that contains our pattern
      const matchingKey = Object.keys(existingProofs).find(key => 
        key.includes(keyPattern) || 
        // If the key is very long, it might be more efficient to check token by token
        (key.includes(normalizedAddress) && sortedTokenIds.every(id => key.includes(`_${id}_`)))
      );
      
      if (matchingKey) {
        console.log(`[MERKLE] Found matching proof using pattern: ${keyPattern}`);
        return existingProofs[matchingKey];
      }
    }
    
    // If still not found, we need to check each key in detail
    console.log('[MERKLE] No exact pattern match, checking individual keys...');
    
    for (const key of Object.keys(existingProofs)) {
      const parts = key.split('_');
      const keyAddress = parts[0].toLowerCase();
      
      // Skip keys with a different address
      if (keyAddress !== normalizedAddress) {
        continue;
      }
      
      // Extract token IDs from the key
      let keyTokens: number[] = [];
      for (let i = 1; i < parts.length; i++) {
        const parsed = parseInt(parts[i]);
        if (!isNaN(parsed)) {
          keyTokens.push(parsed);
        }
      }
      
      // Sort the key tokens
      keyTokens.sort((a, b) => a - b);
      
      // Check if sorted token IDs match
      const allTokensMatch = sortedTokenIds.length === keyTokens.length &&
                            sortedTokenIds.every((token, idx) => token === keyTokens[idx]);
      
      if (allTokensMatch) {
        console.log('[MERKLE] Found matching proof through detailed key analysis');
        return existingProofs[key];
      }
    }
    
    console.warn('[MERKLE] No matching proof found after exhaustive search');
    return null;
  } catch (error) {
    console.error('[MERKLE] Error generating proof for burn:', error);
    return null;
  }
};

// Verify a Merkle proof
export const verifyMerkleProof = (
  merkleRoot: string,
  proof: string[],
  address: string,
  tokenIds: number[]
): boolean => {
  try {
    const leaf = generateMerkleLeaf(address, tokenIds);
    const merkleTree = new MerkleTree([], keccak256, { hashLeaves: false, sortPairs: true });
    return merkleTree.verify(proof, leaf, merkleRoot);
  } catch (error) {
    console.error('[MERKLE] Error verifying proof:', error);
    return false;
  }
};

// Get a proof for a specific redemption
export const getProofForRedemption = async (
  userAddress: string,
  tokenIds: number[]
): Promise<string[] | null> => {
  try {
    // Check if proofs exist in localStorage
    const proofsExist = checkMerkleProofsExist();
    if (!proofsExist) {
      // Try to load proofs
      const loaded = await loadMerkleProofs();
      if (!loaded) {
        console.error('[MERKLE] Failed to load Merkle proofs');
        return null;
      }
    }
    
    // Now get the proofs from localStorage
    const proofsString = localStorage.getItem('merkleProofs');
    if (!proofsString) {
      console.error('[MERKLE] Merkle proofs still not available');
      return null;
    }
    
    const proofs = JSON.parse(proofsString);
    
    // Try to find a matching proof
    return generateProofForBurn(userAddress, tokenIds, proofs);
  } catch (error) {
    console.error('[MERKLE] Error getting proof for redemption:', error);
    return null;
  }
};
