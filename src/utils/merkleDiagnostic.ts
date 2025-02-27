// utils/merkleDiagnostic.ts
import { ethers } from 'ethers';

/**
 * Utility to help diagnose and fix Merkle proof issues
 */
export class MerkleDiagnostic {
  /**
   * Run a full diagnostic on the merkle proofs
   */
  static async runDiagnostic() {
    console.log('[MERKLE-DIAGNOSTIC] Starting diagnostics...');
    
    // Check if proofs are loaded in localStorage
    const hasProofs = this.checkLocalStorageProofs();
    
    // Attempt to load proofs from all possible sources
    const loadedFromSource = await this.attemptLoadProofsFromAllSources();
    
    // Verify the integrity of available proofs
    const integrityResult = this.verifyProofIntegrity();
    
    // Overall diagnosis
    console.log('[MERKLE-DIAGNOSTIC] Diagnostic Summary:');
    console.log(`- Proofs in localStorage: ${hasProofs ? 'YES' : 'NO'}`);
    console.log(`- Successfully loaded from sources: ${loadedFromSource ? 'YES' : 'NO'}`);
    console.log(`- Proof integrity: ${integrityResult.valid ? 'VALID' : 'INVALID'}`);
    console.log(`- Issues found: ${integrityResult.issues.length}`);
    
    return {
      hasProofs,
      loadedFromSource,
      integrityResult,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Check if proofs exist in localStorage
   */
  static checkLocalStorageProofs() {
    try {
      const proofsStr = localStorage.getItem('merkleProofs');
      if (!proofsStr) {
        console.log('[MERKLE-DIAGNOSTIC] No proofs found in localStorage');
        return false;
      }
      
      const proofs = JSON.parse(proofsStr);
      const proofKeys = Object.keys(proofs);
      
      console.log(`[MERKLE-DIAGNOSTIC] Found ${proofKeys.length} proofs in localStorage`);
      console.log(`[MERKLE-DIAGNOSTIC] Sample keys: ${proofKeys.slice(0, 2).map(k => k.substring(0, 20) + '...')}`);
      
      return proofKeys.length > 0;
    } catch (error) {
      console.error('[MERKLE-DIAGNOSTIC] Error checking localStorage:', error);
      return false;
    }
  }
  
  /**
   * Attempt to load proofs from all possible sources
   */
  static async attemptLoadProofsFromAllSources() {
    try {
      const paths = [
        '/merkle-proofs.json',
        '/public/merkle-proofs.json',
        '/frontend/public/merkle-proofs.json',
        '/api/merkle-proofs'
      ];
      
      console.log('[MERKLE-DIAGNOSTIC] Attempting to load proofs from multiple sources...');
      
      let foundProofs = false;
      
      for (const path of paths) {
        try {
          console.log(`[MERKLE-DIAGNOSTIC] Trying ${path}...`);
          const response = await fetch(path);
          
          if (!response.ok) {
            console.log(`[MERKLE-DIAGNOSTIC] ${path} returned ${response.status}`);
            continue;
          }
          
          const data = await response.json();
          const proofKeys = Object.keys(data);
          
          if (proofKeys.length > 0) {
            console.log(`[MERKLE-DIAGNOSTIC] Successfully loaded ${proofKeys.length} proofs from ${path}`);
            
            // Store in localStorage for future use
            localStorage.setItem('merkleProofs', JSON.stringify(data));
            localStorage.setItem('merkleProofsSource', path);
            localStorage.setItem('merkleProofsLastLoaded', new Date().toISOString());
            
            foundProofs = true;
            break;
          } else {
            console.log(`[MERKLE-DIAGNOSTIC] ${path} returned empty proofs object`);
          }
        } catch (error) {
          console.log(`[MERKLE-DIAGNOSTIC] Error loading from ${path}:`, error);
        }
      }
      
      if (!foundProofs) {
        console.log('[MERKLE-DIAGNOSTIC] Could not load proofs from any source');
      }
      
      return foundProofs;
    } catch (error) {
      console.error('[MERKLE-DIAGNOSTIC] Error loading proofs:', error);
      return false;
    }
  }
  
  /**
   * Verify the integrity of the proofs in localStorage
   */
  static verifyProofIntegrity() {
    try {
      const proofsStr = localStorage.getItem('merkleProofs');
      if (!proofsStr) {
        return { 
          valid: false, 
          issues: ['No proofs found in localStorage'] 
        };
      }
      
      const proofs = JSON.parse(proofsStr);
      const proofKeys = Object.keys(proofs);
      const issues = [];
      
      if (proofKeys.length === 0) {
        issues.push('Empty proofs object');
      }
      
      // Sample a few proofs to validate structure
      for (const key of proofKeys.slice(0, 3)) {
        const proof = proofs[key];
        
        // Proofs should be arrays
        if (!Array.isArray(proof)) {
          issues.push(`Proof for key ${key} is not an array`);
          continue;
        }
        
        // Check if proofs look like Merkle proof hashes
        for (const item of proof) {
          if (typeof item !== 'string' || !item.startsWith('0x')) {
            issues.push(`Proof item for key ${key} does not appear to be a hash: ${item}`);
          }
        }
        
        // Parse key structure
        try {
          const parts = key.split('_');
          
          // First part should be an address
          const address = parts[0];
          if (!address.startsWith('0x') || address.length !== 42) {
            issues.push(`Key ${key} does not start with a valid address`);
          }
          
          // Check if any token IDs can be parsed
          const tokenIds = parts.slice(1).map(p => parseInt(p)).filter(n => !isNaN(n));
          if (tokenIds.length === 0) {
            issues.push(`Key ${key} does not contain any valid token IDs`);
          }
        } catch (error) {
          issues.push(`Error parsing key ${key}: ${error.message}`);
        }
      }
      
      return {
        valid: issues.length === 0,
        issues,
        proofCount: proofKeys.length,
        sampleKeys: proofKeys.slice(0, 3)
      };
    } catch (error) {
      console.error('[MERKLE-DIAGNOSTIC] Error verifying proofs:', error);
      return { 
        valid: false, 
        issues: [`Error verifying proofs: ${error.message}`] 
      };
    }
  }
  
  /**
   * Helper function to test a specific redemption
   */
  static testRedemption(address: string, tokenIds: number[], txHash: string) {
    try {
      console.log('[MERKLE-DIAGNOSTIC] Testing redemption with:');
      console.log(`- Address: ${address}`);
      console.log(`- Token IDs: ${tokenIds.join(', ')}`);
      console.log(`- Tx Hash: ${txHash}`);
      
      const proofsStr = localStorage.getItem('merkleProofs');
      if (!proofsStr) {
        return { success: false, error: 'No proofs in localStorage' };
      }
      
      const proofs = JSON.parse(proofsStr);
      
      // Normalize inputs
      const normalizedAddress = address.toLowerCase();
      const normalizedTxHash = txHash.toLowerCase();
      const sortedTokenIds = [...tokenIds].sort((a, b) => a - b);
      
      // Generate various key formats to try
      const possibleKeys = [
        // Full format with txHash
        `${normalizedAddress}_${sortedTokenIds.join('_')}_${normalizedTxHash}`,
        
        // Just address and tokens
        `${normalizedAddress}_${sortedTokenIds.join('_')}`,
        
        // Just tokens
        sortedTokenIds.join('_')
      ];
      
      console.log('[MERKLE-DIAGNOSTIC] Trying exact key matches:');
      
      // Try direct key matches first
      for (const testKey of possibleKeys) {
        if (proofs[testKey]) {
          console.log(`[MERKLE-DIAGNOSTIC] Found direct match with key: ${testKey}`);
          return { 
            success: true, 
            key: testKey, 
            proof: proofs[testKey],
            matchType: 'direct'
          };
        }
        console.log(`[MERKLE-DIAGNOSTIC] No match for: ${testKey}`);
      }
      
      // Try more flexible matching
      console.log('[MERKLE-DIAGNOSTIC] Trying flexible matching...');
      
      const proofKeys = Object.keys(proofs);
      const matchResults = [];
      
      for (const key of proofKeys) {
        const keyParts = key.split('_');
        const keyAddress = keyParts[0].toLowerCase();
        
        // Extract token IDs from the key (filtering out non-numeric parts)
        const keyTokens = keyParts.slice(1)
          .map(p => {
            const num = parseInt(p);
            return isNaN(num) ? null : num;
          })
          .filter(n => n !== null)
          .sort((a, b) => a - b);
        
        // Check for matches
        const addressMatch = keyAddress === normalizedAddress;
        
        // Check token IDs overlap
        const tokenOverlap = keyTokens.filter(t => sortedTokenIds.includes(t)).length;
        const tokenOverlapPercentage = tokenOverlap / keyTokens.length;
        
        // Possible match criteria:
        // 1. Same address and at least 90% token overlap
        // 2. At least 95% token overlap regardless of address
        
        if ((addressMatch && tokenOverlapPercentage >= 0.9) || 
            (tokenOverlapPercentage >= 0.95)) {
          
          matchResults.push({
            key,
            proof: proofs[key],
            addressMatch,
            tokenOverlap,
            tokenOverlapPercentage,
            score: (addressMatch ? 1 : 0) + tokenOverlapPercentage
          });
        }
      }
      
      // If we found any potential matches, return the best one
      if (matchResults.length > 0) {
        // Sort by score (higher is better)
        matchResults.sort((a, b) => b.score - a.score);
        
        const bestMatch = matchResults[0];
        console.log(`[MERKLE-DIAGNOSTIC] Found flexible match:`, {
          key: bestMatch.key,
          addressMatch: bestMatch.addressMatch,
          tokenOverlap: bestMatch.tokenOverlap,
          overlapPercentage: (bestMatch.tokenOverlapPercentage * 100).toFixed(1) + '%'
        });
        
        return {
          success: true,
          key: bestMatch.key,
          proof: bestMatch.proof,
          matchType: 'flexible',
          matchDetails: {
            addressMatch: bestMatch.addressMatch,
            tokenOverlap: bestMatch.tokenOverlap,
            tokenOverlapPercentage: bestMatch.tokenOverlapPercentage
          }
        };
      }
      
      // If we get here, no matches were found
      return {
        success: false,
        error: 'No matching proof found',
        details: {
          attemptedKeys: possibleKeys,
          totalProofs: proofKeys.length
        }
      };
    } catch (error) {
      console.error('[MERKLE-DIAGNOSTIC] Error testing redemption:', error);
      return {
        success: false,
        error: `Error: ${error.message}`
      };
    }
  }
  
  /**
   * Add a debug component to the page to help diagnose Merkle proof issues
   */
  static addDebuggingInterface() {
    if (typeof document === 'undefined') return;
    
    // Create container
    const container = document.createElement('div');
    container.id = 'merkle-debug-panel';
    container.style.position = 'fixed';
    container.style.bottom = '10px';
    container.style.right = '10px';
    container.style.width = '300px';
    container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    container.style.color = 'white';
    container.style.padding = '10px';
    container.style.borderRadius = '5px';
    container.style.fontFamily = 'monospace';
    container.style.fontSize = '12px';
    container.style.zIndex = '9999';
    
    // Add title
    const title = document.createElement('div');
    title.textContent = 'Merkle Debug Panel';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '10px';
    container.appendChild(title);
    
    // Add status
    const status = document.createElement('div');
    status.id = 'merkle-debug-status';
    status.style.marginBottom = '10px';
    container.appendChild(status);
    
    // Add buttons
    const buttonsDiv = document.createElement('div');
    buttonsDiv.style.display = 'flex';
    buttonsDiv.style.gap = '5px';
    
    const runDiagnosticBtn = document.createElement('button');
    runDiagnosticBtn.textContent = 'Run Diagnostic';
    runDiagnosticBtn.style.flex = '1';
    runDiagnosticBtn.onclick = async () => {
      status.textContent = 'Running diagnostic...';
      const result = await this.runDiagnostic();
      status.innerHTML = `
        Proofs in localStorage: ${result.hasProofs ? '✅' : '❌'}<br>
        Loaded from source: ${result.loadedFromSource ? '✅' : '❌'}<br>
        Integrity: ${result.integrityResult.valid ? '✅' : '❌'}<br>
        Issues: ${result.integrityResult.issues.length}
      `;
    };
    
    const loadProofsBtn = document.createElement('button');
    loadProofsBtn.textContent = 'Load Proofs';
    loadProofsBtn.style.flex = '1';
    loadProofsBtn.onclick = async () => {
      status.textContent = 'Loading proofs...';
      const success = await this.attemptLoadProofsFromAllSources();
      status.textContent = success ? 'Proofs loaded ✅' : 'Failed to load proofs ❌';
    };
    
    buttonsDiv.appendChild(runDiagnosticBtn);
    buttonsDiv.appendChild(loadProofsBtn);
    container.appendChild(buttonsDiv);
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.display = 'block';
    closeBtn.style.width = '100%';
    closeBtn.style.marginTop = '10px';
    closeBtn.onclick = () => {
      document.body.removeChild(container);
    };
    container.appendChild(closeBtn);
    
    // Add to document
    document.body.appendChild(container);
    
    // Initial status
    this.checkLocalStorageProofs();
    status.textContent = 'Ready. Click Run Diagnostic to check Merkle proofs.';
    
    return container;
  }
  
  /**
   * Repair common issues with Merkle proofs
   */
  static async repairProofs() {
    try {
      console.log('[MERKLE-DIAGNOSTIC] Attempting to repair proofs...');
      
      // First check if proofs exist
      if (!this.checkLocalStorageProofs()) {
        // Try to load from sources
        const loaded = await this.attemptLoadProofsFromAllSources();
        if (!loaded) {
          console.error('[MERKLE-DIAGNOSTIC] Could not load proofs from any source');
          return { success: false, message: 'Could not load proofs from any source' };
        }
      }
      
      // Get existing proofs
      const proofsStr = localStorage.getItem('merkleProofs');
      if (!proofsStr) {
        return { success: false, message: 'No proofs in localStorage even after loading' };
      }
      
      const proofs = JSON.parse(proofsStr);
      const originalKeys = Object.keys(proofs);
      
      // Create a new proofs object with fixed keys
      const repairedProofs = {};
      
      // Process each key to fix common issues
      for (const key of originalKeys) {
        const proof = proofs[key];
        
        // Skip invalid proofs
        if (!Array.isArray(proof) || proof.length === 0) {
          console.log(`[MERKLE-DIAGNOSTIC] Skipping invalid proof for key: ${key}`);
          continue;
        }
        
        try {
          // Parse the key structure
          const parts = key.split('_');
          
          // First part should be an address
          let address = parts[0];
          if (!address.startsWith('0x')) {
            console.log(`[MERKLE-DIAGNOSTIC] Key does not start with an address: ${key}`);
            continue;
          }
          
          // Normalize address to lowercase
          address = address.toLowerCase();
          
          // Extract potential token IDs (any numeric parts)
          const tokenIds = [];
          let txHash = '';
          
          for (let i = 1; i < parts.length; i++) {
            const part = parts[i];
            
            // Check if this part is a transaction hash (last part starting with 0x)
            if (i === parts.length - 1 && part.startsWith('0x')) {
              txHash = part.toLowerCase();
              continue;
            }
            
            // Try to parse as token ID
            const num = parseInt(part);
            if (!isNaN(num)) {
              tokenIds.push(num);
            }
          }
          
          // Sort token IDs for consistency
          tokenIds.sort((a, b) => a - b);
          
          // Skip if no token IDs were found
          if (tokenIds.length === 0) {
            console.log(`[MERKLE-DIAGNOSTIC] No token IDs found in key: ${key}`);
            continue;
          }
          
          // Create a new standardized key
          let newKey = `${address}_${tokenIds.join('_')}`;
          if (txHash) {
            newKey += `_${txHash}`;
          }
          
          // Add to repaired proofs
          repairedProofs[newKey] = proof;
          
        } catch (error) {
          console.error(`[MERKLE-DIAGNOSTIC] Error processing key ${key}:`, error);
        }
      }
      
      // Save the repaired proofs back to localStorage
      if (Object.keys(repairedProofs).length > 0) {
        localStorage.setItem('merkleProofs', JSON.stringify(repairedProofs));
        console.log(`[MERKLE-DIAGNOSTIC] Saved ${Object.keys(repairedProofs).length} repaired proofs`);
        
        return {
          success: true,
          message: `Repaired ${Object.keys(repairedProofs).length} proofs`,
          originalCount: originalKeys.length
        };
      } else {
        return {
          success: false,
          message: 'Could not repair any proofs',
          originalCount: originalKeys.length
        };
      }
    } catch (error) {
      console.error('[MERKLE-DIAGNOSTIC] Error repairing proofs:', error);
      return { 
        success: false, 
        message: `Error: ${error.message}` 
      };
    }
  }
}
