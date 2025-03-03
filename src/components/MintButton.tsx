import React, { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import TreeContractService from '../utils/treeContractService';

// Contract address for visualization links
const FRACTAL_TREE_NFT_ADDRESS = process.env.NEXT_PUBLIC_FRACTAL_TREE_NFT_ADDRESS || '0x8B150684E88501DA2FC25bfc6eC86d5dbF40EbAD';
const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;
const MINT_PRICE = process.env.NEXT_PUBLIC_FRACTAL_TREE_MINT_PRICE || "0.00125"; // Updated mint price

const MintButton: React.FC<{
  params: any;
  captureTreeImage: () => Promise<{ 
    imageDataURL: string; 
    params: any 
  }>;
}> = ({ params, captureTreeImage }) => {
  const [minting, setMinting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>("Waiting for action");
  const [tokenId, setTokenId] = useState<string | null>(null);
  const [similarTree, setSimilarTree] = useState<any>(null);
  const [showSimilarityWarning, setShowSimilarityWarning] = useState(false);
  const [exactDuplicate, setExactDuplicate] = useState(false);

  const uploadToIPFS = useCallback(async (content: string | Blob, name: string) => {
    if (!PINATA_JWT) {
      throw new Error('Pinata JWT is not configured');
    }

    try {
      const formData = new FormData();
      const blob = content instanceof Blob 
        ? content 
        : new Blob([content], { type: 'text/html' });
      
      formData.append('file', blob, name);
      
      // Log file size for debugging
      console.log(`Uploading file: ${name}, Size: ${blob.size} bytes`);
      
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PINATA_JWT}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('IPFS upload error:', errorBody);
        throw new Error(`IPFS upload failed: ${errorBody}`);
      }

      const result = await response.json();
      console.log(`Upload successful. IPFS Hash: ${result.IpfsHash}`);
      return result.IpfsHash;
    } catch (err) {
      console.error('Error uploading to IPFS:', err);
      throw err;
    }
  }, []);

  // Function to check for similar trees
  const checkSimilarTrees = async () => {
    try {
      setProgress("Checking for similar trees...");
      
      // Get Ethereum provider
      if (!window.ethereum) {
        throw new Error("Please install MetaMask to create NFTs");
      }
      
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      
      // Check for similar trees
      const result = await TreeContractService.checkIfTreeExists(params, provider);
      
      if (result.exists) {
        setSimilarTree(result);
        
        // Check if it's an exact duplicate (100% similarity)
        if (result.similarityScore === "100%" || parseFloat(result.similarityScore) >= 99.9) {
          setExactDuplicate(true);
          setShowSimilarityWarning(true);
          setProgress(`Exact duplicate found! Tree already exists as Token ID: ${result.tokenId}`);
        } else {
          setExactDuplicate(false);
          setShowSimilarityWarning(true);
          setProgress(`Similar tree found with ${result.similarityScore} similarity`);
        }
        return true;
      } else {
        setSimilarTree(null);
        setShowSimilarityWarning(false);
        setExactDuplicate(false);
        return false;
      }
    } catch (err) {
      console.error("Error checking similarity:", err);
      return false;
    }
  };

  // Function to continue minting despite similarity warning
  const continueMintAnyway = () => {
    // Only proceed if it's not an exact duplicate
    if (!exactDuplicate) {
      setShowSimilarityWarning(false);
      // Start mint process directly without checking for similar trees
      performMint();
    }
  };

  // Primary mint initiation function
  const mintNFT = async () => {
    // If already minting, do nothing
    if (minting) return;
    
    // First check for similar trees
    const hasSimilarTree = await checkSimilarTrees();
    if (hasSimilarTree) {
      // If found similar tree, stop here until user decides
      return;
    }
    
    // If no similar tree, proceed with mint
    performMint();
  };

  // The actual mint process implementation
  const performMint = async () => {
    setMinting(true);
    setError(null);
    setTxHash(null);
    setProgress("Starting mint process");

    try {
      if (!window.ethereum) {
        throw new Error("Please install MetaMask to create NFTs");
      }

      await window.ethereum.request({ method: 'eth_requestAccounts' });
      setProgress("Wallet connected");

      // Generate unique tokenId
      const generatedTokenId = `FT-${Math.floor(Math.random() * 1000000)}`;
      
      // Capture tree image
      setProgress("Capturing tree image");
      const treeCapture = await captureTreeImage();
      if (!treeCapture || !treeCapture.imageDataURL) {
        throw new Error("Failed to capture tree image");
      }

      // Generate optimized HTML
      setProgress("Generating optimized HTML");
      const htmlContent = await TreeContractService.generateHTML(
        { ...params, tokenId: generatedTokenId }, 
        generatedTokenId
      );

      // Upload HTML to IPFS
      setProgress("Uploading HTML to IPFS");
      const animationHTMLHash = await uploadToIPFS(
        htmlContent, 
        `fractal-tree-${generatedTokenId}.html`
      );

      // Upload preview image to IPFS
      setProgress("Uploading image to IPFS");
      const previewImageResponse = await fetch(treeCapture.imageDataURL);
      const previewImageBlob = await previewImageResponse.blob();
      const previewImageHash = await uploadToIPFS(
        previewImageBlob, 
        `fractal-tree-${generatedTokenId}.png`
      );

      // Prepare contract parameters
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = TreeContractService.getFractalTreeNFTContract(signer);

      // CORRECTION: Ensure values are within contract limits and conversions are correct
      const contractParams = {
        branches: params.branches,
        maxDepth: params.maxDepth,
        symmetrical: params.symmetrical,
        // Limit lengthRatio between 500-900 (0.5-0.9)
        lengthRatio: Math.min(900, Math.max(500, Math.floor(params.lengthRatio * 1000))),
        // Limit branchAngle between 10-90
        branchAngle: Math.min(90, Math.max(10, params.branchAngle)),
        // Limit initialLength between 50-200
        initialLength: Math.min(200, Math.max(50, params.initialLength)),
        // Limit branchWidth between 10-200 (multiplied by 10 for contract compatibility)
        branchWidth: Math.min(200, Math.max(10, Math.floor(params.branchWidth * 10))),
        // Limit randomness between 0-1000
        randomness: Math.min(1000, Math.max(0, Math.floor(params.randomness * 1000))),
        // Limit curvature between 0-1000
        curvature: Math.min(1000, Math.max(0, Math.floor(params.curvature * 1000))),
        // Convert enum to numeric value
        colorSchemeValue: {
          gradient: 0,
          rainbow: 1,
          autumn: 2,
          monochrome: 3,
          neon: 4
        }[params.colorScheme] || 0,
        // Limit hueStart between 0-360
        hueStart: Math.min(360, Math.max(0, params.hueStart)),
        // Limit hueRange between 0-180
        hueRange: Math.min(180, Math.max(0, params.hueRange)),
        // Limit saturation between 0-1000 (multiplied by 10 for contract compatibility)
        saturation: Math.min(1000, Math.max(0, Math.floor(params.saturation * 10))),
        // Limit lightness between 200-800 (multiplied by 10 for contract compatibility)
        lightness: Math.min(800, Math.max(200, Math.floor(params.lightness * 10))),
        drawLeaves: params.drawLeaves,
        // Limit windStrength between 0-1000
        windStrength: Math.min(1000, Math.max(0, Math.floor(params.windStrength * 1000))),
        // Limit windSpeed between 0-1000
        windSpeed: Math.min(1000, Math.max(0, Math.floor(params.windSpeed * 1000))),
        // Limit particleAmount between 0-1000 (multiplied by 10 for contract compatibility)
        particleAmount: Math.min(1000, Math.max(0, Math.floor(params.particleAmount * 10)))
      };
      
      // Add logs for debugging
      console.log("Parameters sent to contract:", contractParams);

      // Call mint function with correct parameters
      setProgress("Creating NFT");
      const tx = await contract.mintTreeFromFrontend(
        contractParams.branches,
        contractParams.maxDepth,
        contractParams.symmetrical,
        contractParams.lengthRatio,
        contractParams.branchAngle,
        contractParams.initialLength,
        contractParams.branchWidth,
        contractParams.randomness,
        contractParams.curvature,
        contractParams.colorSchemeValue,
        contractParams.hueStart,
        contractParams.hueRange,
        contractParams.saturation,
        contractParams.lightness,
        contractParams.drawLeaves,
        contractParams.windStrength,
        contractParams.windSpeed,
        contractParams.particleAmount,
        `https://ipfs.io/ipfs/${previewImageHash}`,
        animationHTMLHash,
        { 
          value: ethers.utils.parseEther(MINT_PRICE),
          gasLimit: 3000000 // Explicit gas limit increase
        }
      );

      setTxHash(tx.hash);
      setProgress("Waiting for transaction confirmation");

      const receipt = await tx.wait();
      const mintEvent = receipt.events?.find(event => event.event === 'TreeMinted');
      const mintedTokenId = mintEvent?.args?.tokenId.toString();

      setTokenId(mintedTokenId);
      setProgress(`NFT created successfully! Token ID: ${mintedTokenId}`);

    } catch (err: any) {
      console.error("Complete error:", err);
      
      // Try to extract specific error message
      let errorMessage = "Error creating NFT";
      
      if (err.reason) {
        errorMessage = err.reason;
      } else if (err.error && err.error.message) {
        errorMessage = err.error.message;
      } else if (err.data && err.data.message) {
        errorMessage = err.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Check if it contains a contract revert message
      if (errorMessage.includes("execution reverted")) {
        // Try to extract specific revert message
        const match = errorMessage.match(/reverted: ([^"]+)/);
        if (match && match[1]) {
          errorMessage = match[1];
        }
      }
      
      setError(`Transaction failed: ${errorMessage}`);
      setProgress("An error occurred during the process");
    } finally {
      setMinting(false);
    }
  };

  // Get explorer URL based on chain ID
  const getExplorerUrl = () => {
    if (typeof window === 'undefined' || !window.ethereum) return 'https://basescan.org';
    
    const chainId = parseInt(window.ethereum.chainId || '8453', 16);
    
    switch (chainId) {
      case 8453:
        return 'https://basescan.org'; // Base Mainnet
      case 84532:
        return 'https://sepolia.basescan.org'; // Base Sepolia
      default:
        return 'https://basescan.org';
    }
  };

  return (
    <div className="mt-8">
      {showSimilarityWarning && similarTree ? (
        <div className={`mb-6 p-4 rounded-lg border ${exactDuplicate ? 'bg-red-100 text-red-800 border-red-300' : 'bg-yellow-100 text-yellow-800 border-yellow-300'}`}>
          {exactDuplicate ? (
            <>
              <h3 className="text-lg font-semibold mb-2">Duplicate Tree Detected!</h3>
              <p className="mb-2">This tree is 100% identical to an existing tree (Token ID: {similarTree.tokenId}).</p>
              <p className="mb-4">Please change at least one parameter before minting.</p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSimilarityWarning(false)}
                  className="bg-gray-400 hover:bg-gray-500 text-white py-2 px-4 rounded"
                >
                  Cancel
                </button>
                <a
                  href={`${getExplorerUrl()}/token/${FRACTAL_TREE_NFT_ADDRESS}/instance/${similarTree.tokenId}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded inline-block"
                >
                  View Existing Tree
                </a>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold mb-2">Similar Tree Found!</h3>
              <p className="mb-2">A tree with {similarTree.similarityScore} similarity exists (Token ID: {similarTree.tokenId}).</p>
              <p className="mb-4">Some parameters are identical or very similar.</p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSimilarityWarning(false)}
                  className="bg-gray-400 hover:bg-gray-500 text-white py-2 px-4 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={continueMintAnyway}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded"
                >
                  Mint Anyway
                </button>
                <a
                  href={`${getExplorerUrl()}/token/${FRACTAL_TREE_NFT_ADDRESS}/instance/${similarTree.tokenId}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded inline-block"
                >
                  View Similar Tree
                </a>
              </div>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={mintNFT}
          disabled={minting}
          className={`w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 px-6 rounded-lg text-xl font-bold transition-all ${
            minting ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:-translate-y-1'
          }`}
        >
          {minting ? 'Processing...' : `Mint NFT (${MINT_PRICE} ETH)`}
        </button>
      )}
      
      {minting && (
        <div className="mt-4 p-3 bg-emerald-100 text-emerald-800 rounded-lg">
          <p>{progress}</p>
        </div>
      )}
      
      {txHash && (
        <div className="mt-4 p-3 bg-emerald-100 text-emerald-800 rounded-lg text-sm">
          <p>Transaction:</p>
          <a
            href={`${getExplorerUrl()}/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="break-words underline"
          >
            {txHash}
          </a>
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-lg">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default MintButton;