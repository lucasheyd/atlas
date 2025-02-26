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
  const owner = searchParams.get('owner');

  // Validar parâmetros
  if (!contract || !owner) {
    return NextResponse.json({ 
      error: 'Contract and owner addresses are required' 
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
    // Recuperar tokens do contrato
    const response = await axios.get(`${config.apiUrl}`, {
      params: {
        module: 'account',
        action: 'tokennfttx',
        contractaddress: contract,
        address: owner,
        page: 1,
        offset: 100,
        sort: 'desc',
        apikey: config.apiKey
      }
    });

    // Processar tokens
    const tokens = (response.data.result || [])
      .filter(tx => 
        tx.to.toLowerCase() === owner.toLowerCase() && 
        tx.contractAddress.toLowerCase() === contract.toLowerCase()
      )
      .map(tx => ({
        id: tx.tokenID,
        name: `${tx.tokenName} #${tx.tokenID}`,
        image: '', // Você pode adicionar lógica para recuperar imagem do token
      }));

    return NextResponse.json({ 
      tokens,
      total: tokens.length 
    });
  } catch (error) {
    console.error('Erro ao buscar NFTs:', error);
    return NextResponse.json({ 
      error: 'Erro ao buscar NFTs', 
      details: error.message 
    }, { status: 500 });
  }
} 