// app/api/atlas-metadata/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_NETWORKS } from '@/Maps3d/data/DefaultNetworks';

// Função para gerar seed visual
const generateSeed = (tokenId: number, networkId: string): number => {
  let hash = 0;
  const str = `${tokenId}-${networkId}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Converter para inteiro de 32 bits
  }
  return Math.abs(hash);
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tokenId = parseInt(params.id);
    
    // Verificar se o tokenId é válido
    if (isNaN(tokenId)) {
      return NextResponse.json(
        { error: 'Invalid token ID' },
        { status: 400 }
      );
    }
    
    // Determinar o nível de fusão com base no tokenId (exemplo)
    const fusionLevel = (tokenId % 5) || 1;
    
    // Gerar URL da imagem
    const imageUrl = new URL(`/api/atlas-image/${tokenId}`, request.nextUrl.origin).toString();
    
    // URL para visualização do NFT
    const atlasViewerUrl = new URL(`/view/atlas/${tokenId}`, request.nextUrl.origin).toString();
    
    // Gerar lista de territórios
    const territories = Object.entries(DEFAULT_NETWORKS).map(([id, network]) => {
      const visualSeed = generateSeed(tokenId, id);
      return {
        id,
        name: network.name,
        type: network.type,
        visualSeed
      };
    });
    
    // Gerar metadados padrão ERC-721
    const metadata = {
      name: `Crypto Atlas #${tokenId}`,
      description: `An interactive multi-chain explorer map visualizing blockchain activity. This Crypto Atlas contains ${territories.length} territories at fusion level ${fusionLevel}.`,
      image: imageUrl,
      external_url: atlasViewerUrl,
      attributes: [
        {
          trait_type: "Fusion Level",
          value: fusionLevel
        },
        {
          trait_type: "Territories",
          value: territories.length
        },
        {
          trait_type: "Genesis Territory",
          value: "Ethereum Mainland"
        },
        {
          trait_type: "Animation Support",
          value: "Yes"
        }
      ],
      properties: {
        territories: territories.map(t => ({
          id: t.id,
          name: t.name,
          type: t.type,
          seed: t.visualSeed
        })),
        connections: [
          "ethereum-polygon",
          "ethereum-base",
          "ethereum-arbitrum",
          "ethereum-optimism",
          "ethereum-avalanche",
          "ethereum-zksync"
        ],
        view_url: atlasViewerUrl,
        animation_url: atlasViewerUrl, // OpenSea e outras plataformas podem usar isto para iframe
        interactive: true
      }
    };
    
    return NextResponse.json(metadata);
  } catch (error) {
    console.error('Error generating atlas metadata:', error);
    return NextResponse.json(
      { error: 'Failed to generate atlas metadata' },
      { status: 500 }
    );
  }
}
