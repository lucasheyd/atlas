import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Mapeamento de contratos para suas respectivas APIs de explorador
const CONTRACT_CONFIGS = {
  // Contrato Fractal 
  '0x9a3daeda5cf6fdce63b35af7781378d53fbf9047': {
    apiKey: process.env.NEXT_PUBLIC_BASESCAN_API_KEY,
    apiUrl: 'https://api.basescan.org/api',
    chainId: 8453 // Base mainnet
  },
  // Contrato Murmuration 
  '0xe16e3753f33a10602177f77fec769d116ff70a69': {
    apiKey: process.env.NEXT_PUBLIC_BERASCAN_API_KEY,
    apiUrl: 'https://api.routescan.io/v2/network/mainnet/evm/80094/etherscan',
    chainId: 80094 // Berachain
  }
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const contract = searchParams.get('contract');
  const tokenId = searchParams.get('tokenId');

  // Validar parâmetros
  if (!contract || !tokenId) {
    return NextResponse.json({ 
      error: 'Contract and tokenId are required' 
    }, { status: 400 });
  }

  // Buscar configuração do contrato
  const config = CONTRACT_CONFIGS[contract.toLowerCase()];
  if (!config) {
    return NextResponse.json({ 
      error: 'Unsupported contract' 
    }, { status: 400 });
  }

  try {
    // Para o Murmuration, como exemplo, retornaremos detalhes básicos
    return NextResponse.json({
      id: tokenId,
      name: `Murmuration #${tokenId}`,
      description: 'A unique Murmuration NFT from the 666 collection',
      image: '', // Você pode adicionar uma URL de imagem padrão
      animationUrl: `/murmuration/${tokenId}`, // URL para visualização
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do NFT:', error);
    return NextResponse.json({ 
      error: 'Erro ao buscar detalhes do NFT', 
      details: error.message 
    }, { status: 500 });
  }
}