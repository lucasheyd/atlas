// utils/networks.ts

export const NETWORKS = {
  ethereum: {
    name: 'Ethereum',
    chainId: '0x1',
    chainIdNumber: 1,
    rpcUrl: 'https://eth.llamarpc.com',
    currency: 'ETH',
    blockExplorer: 'https://etherscan.io',
    icon: '/icons/ethereum.svg'
  },
  base: {
    name: 'Base',
    chainId: '0x2105',
    chainIdNumber: 8453,
    rpcUrl: 'https://mainnet.base.org',
    currency: 'ETH',
    blockExplorer: 'https://basescan.org',
    icon: '/icons/base.svg'
  },
  soneium: {
    name: 'Soneium',
    chainId: '0x74C',
    chainIdNumber: 1868,
    rpcUrl: 'https://rpc.soneium.org/',
    currency: 'ETH',
    blockExplorer: 'https://soneium.blockscout.com',
    icon: '/icons/soneium.svg'
  },
  bera: {
    name: 'Berachain',
    chainId: '0x138de',  // Já está configurado para Mainnet (80094)
    chainIdNumber: 80094,
    rpcUrl: 'https://rpc.berachain.com/',
    currency: 'BERA',
    blockExplorer: 'https://berascan.com/',
    icon: '/icons/bera.avif'
  },
  optimism: {
    name: 'Optimism',
    chainId: '0xA',
    chainIdNumber: 10,
    rpcUrl: 'https://mainnet.optimism.io',
    currency: 'ETH',
    blockExplorer: 'https://optimistic.etherscan.io',
    icon: '/icons/optimism.png'
  },
  linea: {
    name: 'Linea',
    chainId: '0xE708',
    chainIdNumber: 59144,
    rpcUrl: 'https://rpc.linea.build',
    currency: 'ETH',
    blockExplorer: 'https://lineascan.build',
    icon: '/icons/linea.svg'
  }
} as const;

export type NetworkKey = keyof typeof NETWORKS;

// Helper function to switch networks
export async function switchNetwork(networkKey: NetworkKey) {
  const network = NETWORKS[networkKey];
  
  if (typeof window.ethereum !== 'undefined') {
    try {
      // Try to switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: network.chainId }],
      });
      
      // Aguardar um momento para que a rede seja trocada
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verificar se a troca de rede foi bem-sucedida
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== network.chainId) {
        console.warn(`Network switch to ${network.name} may not have completed correctly`);
      } else {
        console.log(`Successfully switched to ${network.name}`);
      }
      
    } catch (switchError: any) {
      // If the network isn't added yet, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: network.chainId,
                chainName: network.name,
                nativeCurrency: {
                  name: network.currency,
                  symbol: network.currency,
                  decimals: 18
                },
                rpcUrls: [network.rpcUrl],
                blockExplorerUrls: [network.blockExplorer]
              },
            ],
          });
          
          // Aguardar um momento para que a rede seja adicionada
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Tentar trocar para a rede novamente após adição
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: network.chainId }],
          });
          
        } catch (addError) {
          console.error(`Failed to add ${network.name} network`, addError);
          throw new Error(`Failed to add ${network.name} network`);
        }
      } else {
        console.error(`Failed to switch to ${network.name}`, switchError);
        throw switchError;
      }
    }
  } else {
    throw new Error('No Web3 Provider found');
  }
}