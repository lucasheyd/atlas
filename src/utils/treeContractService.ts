import { ethers } from 'ethers';
import { generateOptimizedTreeHTML } from './tree-html-generator';

// Endereços dos contratos
const FRACTAL_TREE_NFT_ADDRESS = process.env.NEXT_PUBLIC_FRACTAL_TREE_NFT_ADDRESS || '0x8B150684E88501DA2FC25bfc6eC86d5dbF40EbAD';

// ABI simplificado para interações
const FRACTAL_TREE_NFT_ABI = [
  {
    "inputs": [
      {"internalType": "uint8", "name": "branches", "type": "uint8"},
      {"internalType": "uint8", "name": "maxDepth", "type": "uint8"},
      {"internalType": "bool", "name": "symmetrical", "type": "bool"},
      {"internalType": "uint16", "name": "lengthRatio", "type": "uint16"},
      {"internalType": "uint16", "name": "branchAngle", "type": "uint16"},
      {"internalType": "uint16", "name": "initialLength", "type": "uint16"},
      {"internalType": "uint16", "name": "branchWidth", "type": "uint16"},
      {"internalType": "uint16", "name": "randomness", "type": "uint16"},
      {"internalType": "uint16", "name": "curvature", "type": "uint16"},
      {"internalType": "uint8", "name": "colorSchemeValue", "type": "uint8"},
      {"internalType": "uint16", "name": "hueStart", "type": "uint16"},
      {"internalType": "uint16", "name": "hueRange", "type": "uint16"},
      {"internalType": "uint16", "name": "saturation", "type": "uint16"},
      {"internalType": "uint16", "name": "lightness", "type": "uint16"},
      {"internalType": "bool", "name": "drawLeaves", "type": "bool"},
      {"internalType": "uint16", "name": "windStrength", "type": "uint16"},
      {"internalType": "uint16", "name": "windSpeed", "type": "uint16"},
      {"internalType": "uint16", "name": "particleAmount", "type": "uint16"},
      {"internalType": "string", "name": "previewImage", "type": "string"},
      {"internalType": "string", "name": "animationHTMLHash", "type": "string"}
    ],
    "name": "mintTreeFromFrontend",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"}
    ],
    "name": "tokenURI",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"}
    ],
    "name": "getTreeDetails",
    "outputs": [
      {"components": [
        {"internalType": "uint8", "name": "branches", "type": "uint8"},
        {"internalType": "uint8", "name": "maxDepth", "type": "uint8"},
        {"internalType": "bool", "name": "symmetrical", "type": "bool"},
        {"internalType": "uint16", "name": "lengthRatio", "type": "uint16"},
        {"internalType": "uint16", "name": "branchAngle", "type": "uint16"},
        {"internalType": "uint16", "name": "initialLength", "type": "uint16"},
        {"internalType": "uint16", "name": "branchWidth", "type": "uint16"},
        {"internalType": "uint16", "name": "randomness", "type": "uint16"},
        {"internalType": "uint16", "name": "curvature", "type": "uint16"}
      ], "internalType": "struct TreeStructureLib.Parameters", "name": "structure", "type": "tuple"},
      {"components": [
        {"internalType": "enum AppearanceLib.ColorScheme", "name": "colorScheme", "type": "uint8"},
        {"internalType": "uint16", "name": "hueStart", "type": "uint16"},
        {"internalType": "uint16", "name": "hueRange", "type": "uint16"},
        {"internalType": "uint16", "name": "saturation", "type": "uint16"},
        {"internalType": "uint16", "name": "lightness", "type": "uint16"},
        {"internalType": "bool", "name": "drawLeaves", "type": "bool"}
      ], "internalType": "struct AppearanceLib.Parameters", "name": "appearance", "type": "tuple"},
      {"components": [
        {"internalType": "uint16", "name": "windStrength", "type": "uint16"},
        {"internalType": "uint16", "name": "windSpeed", "type": "uint16"},
        {"internalType": "uint16", "name": "particleAmount", "type": "uint16"},
        {"internalType": "bool", "name": "animateGrowth", "type": "bool"},
        {"internalType": "bool", "name": "postGrowthMovement", "type": "bool"}
      ], "internalType": "struct AnimationLib.Parameters", "name": "animation", "type": "tuple"},
      {"internalType": "uint256", "name": "complexity", "type": "uint256"},
      {"internalType": "bool", "name": "isComplete", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// Mapeamento de esquemas de cores
const COLOR_SCHEME_MAP = {
  gradient: 0,
  rainbow: 1,
  autumn: 2,
  monochrome: 3,
  neon: 4
};

export const TreeContractService = {
  /**
   * Gera HTML otimizado para download/preview da árvore
   */
  generateHTML: async (params: any, tokenId: string) => {
    try {
      return generateOptimizedTreeHTML(params, tokenId);
    } catch (error) {
      console.error("Erro ao gerar HTML:", error);
      throw error;
    }
  },

  /**
   * Obtém uma instância do contrato FractalTreeNFT
   */
  getFractalTreeNFTContract: (signerOrProvider: ethers.Signer | ethers.providers.Provider) => {
    return new ethers.Contract(
      FRACTAL_TREE_NFT_ADDRESS,
      FRACTAL_TREE_NFT_ABI,
      signerOrProvider
    );
  },

  /**
   * Converte parâmetros do frontend para formato do contrato
   * com validações para garantir que estão dentro dos limites
   */
  convertParamsForContract: (params: any) => {
    // Valores validados de acordo com os limites do contrato
    return {
      branches: Math.min(5, Math.max(1, params.branches)),
      maxDepth: Math.min(12, Math.max(2, params.maxDepth)),
      symmetrical: params.symmetrical,
      lengthRatio: Math.min(900, Math.max(500, Math.floor(params.lengthRatio * 1000))),
      branchAngle: Math.min(90, Math.max(10, params.branchAngle)),
      initialLength: Math.min(200, Math.max(50, params.initialLength)),
      branchWidth: Math.min(200, Math.max(10, Math.floor(params.branchWidth * 10))),
      randomness: Math.min(1000, Math.max(0, Math.floor(params.randomness * 1000))),
      curvature: Math.min(1000, Math.max(0, Math.floor(params.curvature * 1000))),
      colorSchemeValue: COLOR_SCHEME_MAP[params.colorScheme] || 0,
      hueStart: Math.min(360, Math.max(0, params.hueStart)),
      hueRange: Math.min(180, Math.max(0, params.hueRange)),
      saturation: Math.min(1000, Math.max(0, Math.floor(params.saturation * 10))),
      lightness: Math.min(800, Math.max(200, Math.floor(params.lightness * 10))),
      drawLeaves: params.drawLeaves,
      windStrength: Math.min(1000, Math.max(0, Math.floor(params.windStrength * 1000))),
      windSpeed: Math.min(1000, Math.max(0, Math.floor(params.windSpeed * 1000))),
      particleAmount: Math.min(1000, Math.max(0, Math.floor(params.particleAmount * 10)))
    };
  },

  /**
   * Verifica se uma árvore com parâmetros similares já existe
   * @param params Parâmetros da árvore a verificar
   * @param provider Provider Ethereum para acessar o contrato
   * @returns Objeto com informações sobre existência e similaridade
   */
  checkIfTreeExists: async (params: any, provider: ethers.providers.Provider) => {
  try {
    const contract = TreeContractService.getFractalTreeNFTContract(provider);
    
    // Convert the parameters to the contract format
    const contractParams = TreeContractService.convertParamsForContract(params);
    
    // Get the total number of tokens
    const totalSupply = await contract.totalSupply();
    console.log(`Total existing trees: ${totalSupply}`);
    
    // To avoid RPC overload, limit checking to the last 50 trees
    const maxToCheck = Math.min(Number(totalSupply), 50);
    const startId = Math.max(1, Number(totalSupply) - maxToCheck + 1);
    
    // Store similar trees found
    const similarTrees = [];
    
    // Check each selected token
    for (let i = startId; i <= Number(totalSupply); i++) {
      try {
        const details = await contract.getTreeDetails(i);
        
        // Calculate similarity score (0-100)
        let similarityScore = 0;
        let matchCount = 0;
        let totalChecks = 0;
        
        // Calculate maximum possible score for normalization
        const maxPossibleScore = 100;
        
        // --- STRUCTURE PARAMETERS ---
        
        // Branch count (major visual impact)
        if (details.structure.branches === contractParams.branches) {
          similarityScore += 10;
          matchCount++;
        }
        totalChecks++;
        
        // Max depth (major visual impact)
        if (details.structure.maxDepth === contractParams.maxDepth) {
          similarityScore += 10;
          matchCount++;
        }
        totalChecks++;
        
        // Symmetry (significant visual impact)
        if (details.structure.symmetrical === contractParams.symmetrical) {
          similarityScore += 7;
          matchCount++;
        }
        totalChecks++;
        
        // Length ratio (within 5% margin)
        const lengthRatioDiff = Math.abs(details.structure.lengthRatio - contractParams.lengthRatio);
        if (lengthRatioDiff <= 50) { // difference of 5% or less
          similarityScore += 7;
          matchCount++;
        }
        totalChecks++;
        
        // Branch angle (within 10 degrees)
        const branchAngleDiff = Math.abs(details.structure.branchAngle - contractParams.branchAngle);
        if (branchAngleDiff <= 10) {
          similarityScore += 7;
          matchCount++;
        }
        totalChecks++;
        
        // Initial length (within 15% margin)
        const initialLengthDiff = Math.abs(details.structure.initialLength - contractParams.initialLength);
        if (initialLengthDiff <= contractParams.initialLength * 0.15) {
          similarityScore += 5;
          matchCount++;
        }
        totalChecks++;
        
        // Branch width (within 20% margin)
        const branchWidthDiff = Math.abs(details.structure.branchWidth - contractParams.branchWidth);
        if (branchWidthDiff <= contractParams.branchWidth * 0.2) {
          similarityScore += 3;
          matchCount++;
        }
        totalChecks++;
        
        // Randomness (within 20% margin)
        const randomnessDiff = Math.abs(details.structure.randomness - contractParams.randomness);
        if (randomnessDiff <= 200) { // 20% of max 1000
          similarityScore += 3;
          matchCount++;
        }
        totalChecks++;
        
        // Curvature (within 20% margin)
        const curvatureDiff = Math.abs(details.structure.curvature - contractParams.curvature);
        if (curvatureDiff <= 200) { // 20% of max 1000
          similarityScore += 3;
          matchCount++;
        }
        totalChecks++;
        
        // --- APPEARANCE PARAMETERS ---
        
        // Color scheme (major visual impact)
        if (details.appearance.colorScheme === contractParams.colorSchemeValue) {
          similarityScore += 10;
          matchCount++;
        }
        totalChecks++;
        
        // Hue start (within 30 degrees margin, considering circular nature of hue)
        const hueStartDiff = Math.abs(details.appearance.hueStart - contractParams.hueStart);
        if (hueStartDiff <= 30 || hueStartDiff >= 330) {
          similarityScore += 8;
          matchCount++;
        }
        totalChecks++;
        
        // Hue range (within 20% margin)
        const hueRangeDiff = Math.abs(details.appearance.hueRange - contractParams.hueRange);
        if (hueRangeDiff <= contractParams.hueRange * 0.2) {
          similarityScore += 5;
          matchCount++;
        }
        totalChecks++;
        
        // Saturation (within 15% margin)
        const saturationDiff = Math.abs(details.appearance.saturation - contractParams.saturation);
        if (saturationDiff <= 150) { // 15% of max 1000
          similarityScore += 5;
          matchCount++;
        }
        totalChecks++;
        
        // Lightness (within 15% margin)
        const lightnessDiff = Math.abs(details.appearance.lightness - contractParams.lightness);
        if (lightnessDiff <= 100) { // ~15% of range 200-800
          similarityScore += 5;
          matchCount++;
        }
        totalChecks++;
        
        // Draw leaves (exact match)
        if (details.appearance.drawLeaves === contractParams.drawLeaves) {
          similarityScore += 5;
          matchCount++;
        }
        totalChecks++;
        
        // --- ANIMATION PARAMETERS ---
        
        // Wind strength (within 20% margin)
        const windStrengthDiff = Math.abs(details.animation.windStrength - contractParams.windStrength);
        if (windStrengthDiff <= 200) { // 20% of max 1000
          similarityScore += 3;
          matchCount++;
        }
        totalChecks++;
        
        // Wind speed (within 20% margin)
        const windSpeedDiff = Math.abs(details.animation.windSpeed - contractParams.windSpeed);
        if (windSpeedDiff <= 200) { // 20% of max 1000
          similarityScore += 3;
          matchCount++;
        }
        totalChecks++;
        
        // Particle amount (within 30% margin)
        const particleAmountDiff = Math.abs(details.animation.particleAmount - contractParams.particleAmount);
        if (particleAmountDiff <= 300) { // 30% of max 1000
          similarityScore += 1;
          matchCount++;
        }
        totalChecks++;
        
        // Round to 1 decimal place
        similarityScore = Math.round(similarityScore * 10) / 10;
        
        // Add additional metadata for debugging
        const matchPercentage = Math.round((matchCount / totalChecks) * 100);
        
        // If similarity score is high, add to the list
        if (similarityScore >= 50) {
          similarTrees.push({
            tokenId: i,
            similarityScore: similarityScore,
            matchCount: `${matchCount}/${totalChecks}`,
            matchPercentage: `${matchPercentage}%`,
            // For comparison, add some main parameters
            params: {
              branches: details.structure.branches,
              maxDepth: details.structure.maxDepth,
              lengthRatio: details.structure.lengthRatio / 1000, // Convert back to decimal
              branchAngle: details.structure.branchAngle,
              symmetrical: details.structure.symmetrical,
              colorScheme: details.appearance.colorScheme,
              hueStart: details.appearance.hueStart,
              drawLeaves: details.appearance.drawLeaves
            }
          });
        }
        
        // If found an exact or near-exact match (>90%), return immediately
        if (similarityScore >= 90) {
          return {
            exists: true,
            tokenId: i,
            similarityScore: `${similarityScore}%`,
            matchCount: `${matchCount}/${totalChecks}`,
            matchPercentage: `${matchPercentage}%`,
            treeDetails: details
          };
        }
      } catch (error) {
        console.log(`Error checking token ${i}:`, error);
        continue;
      }
    }
    
    // If found similar trees, return the most similar
    if (similarTrees.length > 0) {
      // Sort by decreasing similarity
      similarTrees.sort((a, b) => b.similarityScore - a.similarityScore);
      
      return {
        exists: true,
        tokenId: similarTrees[0].tokenId,
        similarityScore: `${similarTrees[0].similarityScore}%`,
        matchCount: similarTrees[0].matchCount,
        matchPercentage: similarTrees[0].matchPercentage,
        similarTrees: similarTrees
      };
    }
    
    return { exists: false };
  } catch (error) {
    console.error("Error checking tree:", error);
    return { exists: false, error: error.message };
  }
}
};

export default TreeContractService;