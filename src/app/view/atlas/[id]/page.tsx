// app/view/atlas/[id]/page.tsx - Otimizado
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import AtlasViewer from '../../../../Maps3d/3d/components/AtlasViewer';
import TerritoryDetails from '../../../../Maps3d/3d/components/TerritoryDetails';
import { Territory } from '../../../../Maps3d/types/Territory';
import { NetworkConnection } from '../../../../Maps3d/types/Network';
import { DEFAULT_NETWORK_CONNECTIONS } from '../../../../Maps3d/data/DefaultNetworks';
import { AtlasModuleLoader } from '../../../../Maps3d/AtlasModuleLoader';
import Container from '../../../../components/Container';
import ErrorBoundary from '../../../../components/ErrorBoundary';
import { Button } from '../../../../components/ui/button';
import { ActivityData } from '../../../../Maps3d/types/ActivityData';
import { NFTService } from '../../../../services/NFTService';
import { TerritoryDataService } from '../../../../services/TerritoryDataService';
import { Loader2 } from 'lucide-react';

// Cache local para dados de NFT
interface NFTDataCache {
  data: any;
  timestamp: number;
  ttl: number;
}

// Implementação de cache na memória para reduzir chamadas
const memoryCacheMap = new Map<string, NFTDataCache>();

function getFromCache(key: string): any | null {
  const cached = memoryCacheMap.get(key);
  if (!cached) return null;
  
  // Verificar expiração
  if (Date.now() > cached.timestamp + cached.ttl) {
    memoryCacheMap.delete(key);
    return null;
  }
  
  return cached.data;
}

function setToCache(key: string, data: any, ttl = 5 * 60 * 1000): void {
  memoryCacheMap.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
}

// Componentes de fallback para segurança
const FallbackComponent = ({ name, ...props }: { name: string, [key: string]: any }) => {
  console.warn(`Using fallback for missing component: ${name}`);
  return (
    <div className="border border-red-300 bg-red-50 p-4 rounded">
      <p className="text-red-500 font-bold">Missing Component: {name}</p>
      <pre className="text-xs mt-2 overflow-auto max-h-40">
        {JSON.stringify(props, null, 2)}
      </pre>
    </div>
  );
};

// Wrap component references to prevent undefined errors
const SafeAtlasViewer = AtlasViewer || 
  ((props: any) => <FallbackComponent name="AtlasViewer" {...props} />);

const SafeTerritoryDetails = TerritoryDetails || 
  ((props: any) => <FallbackComponent name="TerritoryDetails" {...props} />);

const SafeContainer = Container || 
  ((props: any) => <div className="container mx-auto px-4 max-w-6xl">{props.children}</div>);

const AtlasNFTView = () => {
  const params = useParams();
  const tokenId = params?.id as string;
  
  // Estados para dados e UI
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [connections, setConnections] = useState<NetworkConnection[]>([]);
  const [selectedTerritory, setSelectedTerritory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activityData, setActivityData] = useState<ActivityData | undefined>(undefined);
  const [activityLoading, setActivityLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenExists, setTokenExists] = useState<boolean | null>(null);
  
  // Estados para dados do NFT
  const [fusionLevel, setFusionLevel] = useState<number>(1);
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
  const [nftName, setNftName] = useState<string>("");
  const [contractInfo, setContractInfo] = useState<{ totalSupply: number }>({ totalSupply: 0 });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Flag para mostrar se estamos usando dados de fallback
  const [usingFallback, setUsingFallback] = useState(false);

  // Verificar existência do token com cache
  const checkTokenExistence = useCallback(async () => {
    // Verificar cache primeiro
    const cacheKey = `token_exists_${tokenId}`;
    const cachedData = getFromCache(cacheKey);
    
    if (cachedData !== null) {
      console.log(`Using cached token existence: ${cachedData}`);
      return cachedData;
    }
    
    try {
      const exists = await NFTService.tokenExists(tokenId);
      // Guardar no cache por 10 minutos
      setToCache(cacheKey, exists, 10 * 60 * 1000);
      return exists;
    } catch (err) {
      console.error("Error checking token existence:", err);
      return null;
    }
  }, [tokenId]);

  // Buscar dados NFT com cache
  const getNFTData = useCallback(async () => {
    // Verificar cache primeiro
    const cacheKey = `nft_data_${tokenId}`;
    const cachedData = getFromCache(cacheKey);
    
    if (cachedData !== null) {
      console.log(`Using cached NFT data for token #${tokenId}`);
      return cachedData;
    }
    
    try {
      const data = await NFTService.getNFTData(tokenId);
      // Guardar no cache por 5 minutos
      setToCache(cacheKey, data, 5 * 60 * 1000);
      return data;
    } catch (err) {
      console.error("Error fetching NFT data:", err);
      throw err;
    }
  }, [tokenId]);

  // Função otimizada para carregar dados reais do NFT
  const loadRealNFTData = useCallback(async () => {
    try {
      setUsingFallback(false);
      
      // Buscar dados do NFT do contrato (owner, nível de fusão, redes ativas)
      const nftData = await getNFTData();
      
      // Configurar dados do NFT
      setOwnerAddress(nftData.owner);
      setFusionLevel(nftData.fusionLevel);
      setNftName(nftData.customName || `Crypto Atlas #${tokenId}`);
      
      // Array de redes ativas (do contrato)
      const activeNetworks = nftData.activeNetworks;
      
      // Validar redes e nível de fusão
      const validation = AtlasModuleLoader.validateNetworks(
        tokenId,
        activeNetworks,
        nftData.fusionLevel
      );
      
      if (!validation.valid) {
        setValidationErrors(validation.errors);
      }
      
      // Carregar territórios
      const loadedTerritories = AtlasModuleLoader.loadTerritories(
        tokenId,
        activeNetworks,
        nftData.fusionLevel
      );
      setTerritories(loadedTerritories);
      
      // Carregar conexões
      const loadedConnections = AtlasModuleLoader.loadConnections(
        loadedTerritories,
        DEFAULT_NETWORK_CONNECTIONS
      );
      setConnections(loadedConnections);
      
      // Mostrar dados em um curto período para uma transição suave
      setTimeout(() => {
        setLoading(false);
      }, 300);
    } catch (err) {
      console.error("Error loading NFT data:", err);
      // Em caso de erro, carregamos os dados de fallback
      loadFallbackNFTData();
    }
  }, [tokenId, getNFTData]);

  // Função otimizada para carregar dados de fallback do NFT
  const loadFallbackNFTData = useCallback(async () => {
    try {
      console.log("Using fallback data for demonstration");
      setUsingFallback(true);
      
      const nftFusionLevel = Math.max(1, (parseInt(tokenId) % 5) || 1);
      
      setOwnerAddress("0xDemoAddress1234567890123456789012345678AbCd");
      setFusionLevel(nftFusionLevel);
      setNftName(`Crypto Atlas #${tokenId} (Demo)`);
      
      // Gerar redes ativas baseado no tokenId
      const availableNetworks = [
        "ethereum", "polygon", "arbitrum", "optimism", 
        "avalanche", "base", "zksync"
      ];
      
      // Definir quais redes vão estar ativas
      let activeNetworks = ["ethereum"]; // Ethereum sempre ativo
      
      // Adicionar mais redes baseado no fusion level
      const additionalNetworks = Math.min(availableNetworks.length - 1, nftFusionLevel * 2 - 1);
      for (let i = 0; i < additionalNetworks; i++) {
        if (i + 1 < availableNetworks.length) {
          activeNetworks.push(availableNetworks[i + 1]);
        }
      }
      
      // Carregar territórios com esses dados de fallback
      const loadedTerritories = AtlasModuleLoader.loadTerritories(
        tokenId,
        activeNetworks,
        nftFusionLevel
      );
      setTerritories(loadedTerritories);
      
      // Carregar conexões
      const loadedConnections = AtlasModuleLoader.loadConnections(
        loadedTerritories,
        DEFAULT_NETWORK_CONNECTIONS
      );
      setConnections(loadedConnections);
      
      // Definir que o token existe para exibição
      setTokenExists(true);
      
      // Mostrar dados em um curto período para uma transição suave
      setTimeout(() => {
        setLoading(false);
      }, 300);
    } catch (err) {
      console.error("Error loading fallback data:", err);
      setError("Failed to load Atlas data. Please try again later.");
      setLoading(false);
    }
  }, [tokenId]);

  // Efeito principal usando as funções otimizadas
  useEffect(() => {
    if (!tokenId) {
      setError("Token ID not found");
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      
      try {
        // Verificar se o token existe antes de prosseguir
        const exists = await checkTokenExistence();
        setTokenExists(exists);
        
        if (exists === false) {
          console.log(`Token #${tokenId} does not exist.`);
          
          // Obter informações gerais do contrato - paralelizado
          NFTService.getContractInfo()
            .then(info => setContractInfo(info))
            .catch(err => console.error("Error fetching contract info:", err));
          
          setError(`Token #${tokenId} does not exist. Valid range: 1 to ${contractInfo.totalSupply || '?'}.`);
          setLoading(false);
          return;
        }
        
        // Se o token existe ou temos incerteza (null), prosseguir com o carregamento dos dados
        await loadRealNFTData();
      } catch (err) {
        console.error("Error in main data loading flow:", err);
        // Falha silenciosa e passa para modo de demo/fallback
        loadFallbackNFTData();
      }
    };

    loadData();
    
    // Função de limpeza
    return () => {
      // Limpar timeouts, etc.
    };
  }, [tokenId, checkTokenExistence, loadRealNFTData, loadFallbackNFTData, contractInfo.totalSupply]);

  // Função para carregar dados de atividade com cache
  const loadTerritoryActivity = useCallback(async (territoryId: string) => {
    if (!tokenId || !territoryId) return;
    
    setActivityLoading(true);
    
    // Verificar cache
    const cacheKey = `activity_${tokenId}_${territoryId}`;
    const cachedData = getFromCache(cacheKey);
    
    if (cachedData !== null) {
      console.log(`Using cached activity data for territory ${territoryId}`);
      setActivityData(cachedData);
      setActivityLoading(false);
      return;
    }
    
    try {
      // Tentativa 1: Dados do contrato
      let data = await NFTService.getTerritoryContractData(tokenId, territoryId);
      
      // Se não houver dados significativos no contrato e temos um endereço de carteira válido, 
      // buscar diretamente da blockchain
      if (data.balance === 0 && data.transactions === 0 && 
          ownerAddress && ownerAddress !== '0x0000000000000000000000000000000000000000' && 
          !usingFallback) {
        try {
          const realData = await TerritoryDataService.fetchActivityData(territoryId, ownerAddress);
          
          // Se conseguimos dados reais, usá-los
          if (realData.balance > 0 || realData.transactions > 0) {
            data = realData;
          }
        } catch (error) {
          console.error("Error fetching real blockchain data:", error);
        }
      }
      
      // Guardar no cache
      setToCache(cacheKey, data, 2 * 60 * 1000); // 2 minutos
      
      setActivityData(data);
    } catch (error) {
      console.error("Error loading territory activity data:", error);
      
      // Gerar dados simulados para fallback
      const seed = parseInt(tokenId) * territoryId.length;
      const randomValue = (min: number, max: number) => {
        const x = Math.sin(seed * 0.1) * 10000;
        const r = x - Math.floor(x);
        return min + Math.floor(r * (max - min));
      };
      
      const fallbackData = {
        balance: randomValue(0, 10) + randomValue(0, 100) / 100,
        nftCount: randomValue(0, 20),
        transactions: randomValue(10, 500),
        stakedAmount: randomValue(0, 5) + randomValue(0, 100) / 100,
        lastUpdate: Math.floor(Date.now() / 1000) - randomValue(0, 86400 * 7)
      };
      
      setActivityData(fallbackData);
    } finally {
      setActivityLoading(false);
    }
  }, [tokenId, ownerAddress, usingFallback]);

  // Handler para clique em território
  const handleTerritoryClick = useCallback((territoryId: string) => {
    if (!territoryId) return;
    
    setSelectedTerritory(territoryId);
    loadTerritoryActivity(territoryId);
  }, [loadTerritoryActivity]);

  // Pré-carregamento de dados para os territórios visíveis
  useEffect(() => {
    // Se temos territórios visíveis, podemos pré-carregar os dados de atividade
    // para melhorar a experiência do usuário quando clicar neles
    if (territories.length > 0 && !loading && !activityLoading) {
      // Pré-carregando apenas os 3 primeiros territórios para economizar recursos
      territories.slice(0, 3).forEach(territory => {
        // Verificar se já temos os dados em cache
        const cacheKey = `activity_${tokenId}_${territory.id}`;
        if (!getFromCache(cacheKey)) {
          // Carregar em segundo plano de forma silenciosa, sem atualizar o estado
          NFTService.getTerritoryContractData(tokenId, territory.id)
            .then(data => {
              setToCache(cacheKey, data, 2 * 60 * 1000); // 2 minutos
            })
            .catch(() => {
              // Ignorar erros no pré-carregamento
            });
        }
      });
    }
  }, [territories, loading, activityLoading, tokenId]);

  // Exibir erro se o token não existir
  if (error) {
    return (
      <SafeContainer>
        <div className="py-8">
          <h1 className="text-3xl font-bold mb-1 text-center">Crypto Atlas Explorer</h1>
          <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <CardContent className="pt-6">
              <p className="text-center text-red-700 dark:text-red-300">{error}</p>
              
              {/* Mostrar informações adicionais se o token não existir */}
              {tokenExists === false && contractInfo.totalSupply > 0 && (
                <div className="mt-4">
                  <p className="text-center text-muted-foreground">
                    Total NFTs minted: {contractInfo.totalSupply}
                  </p>
                  <div className="flex justify-center mt-4 space-x-2">
                    {/* Botões para tokens válidos */}
                    {[1, 2, 3].map(validToken => (
                      <Button 
                        key={validToken}
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = `/view/atlas/${validToken}`}
                      >
                        View Token #{validToken}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SafeContainer>
    );
  }

  // Find the selected territory with useMemo
  const selectedTerritoryData = useMemo(() => 
    selectedTerritory ? territories.find(t => t.id === selectedTerritory) : null
  , [selectedTerritory, territories]);

  return (
    <SafeContainer>
      <div className="py-8">
        <h1 className="text-3xl font-bold mb-1 text-center">{nftName || "Crypto Atlas Explorer"}</h1>
        <h2 className="text-xl text-center text-muted-foreground mb-8">
          Token #{tokenId} 
          {fusionLevel > 1 && <span className="ml-2 text-sm text-amber-500">Fusion Level {fusionLevel}</span>}
          {usingFallback && <span className="ml-2 text-xs text-blue-500">(Demo Mode)</span>}
        </h2>
        
        {/* Mostrar erros de validação */}
        {validationErrors.length > 0 && (
          <div className="mb-4">
            <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <CardContent className="pt-4">
                <h3 className="text-yellow-700 dark:text-yellow-300 font-medium mb-2">Validation Warnings:</h3>
                <ul className="list-disc pl-5">
                  {validationErrors.map((error, idx) => (
                    <li key={idx} className="text-yellow-600 dark:text-yellow-400 text-sm">{error}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ErrorBoundary>
              <Card>
                <CardContent className="p-2 sm:p-6">
                  {loading ? (
                    <div className="w-full aspect-square bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center rounded-lg">
                      <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
                      <p className="text-muted-foreground">Loading Atlas data...</p>
                    </div>
                  ) : (
                    <SafeAtlasViewer
                      tokenId={tokenId}
                      territories={territories}
                      connections={connections}
                      loading={false}
                      onTerritoryClick={handleTerritoryClick}
                      className="w-full aspect-square"
                    />
                  )}
                </CardContent>
              </Card>
            </ErrorBoundary>
          </div>
          
          <div>
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Atlas Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Token ID:</span>
                      <span className="font-medium">{tokenId}</span>
                    </div>
                    {ownerAddress && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Owner:</span>
                        <span className="font-medium">
                          {ownerAddress === '0x0000000000000000000000000000000000000000' 
                            ? 'No owner found'
                            : `${ownerAddress.substring(0, 6)}...${ownerAddress.substring(ownerAddress.length - 4)}`}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Territories:</span>
                      <span className="font-medium">{territories.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fusion Level:</span>
                      <span className="font-medium">{fusionLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Connections:</span>
                      <span className="font-medium">{connections.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Territories:</span>
                      <span className="font-medium">{fusionLevel * 2}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Data Source:</span>
                      <span className="font-medium text-green-600">
                        {usingFallback ? 'Demo Data' : 'Blockchain'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {selectedTerritoryData && (
                <ErrorBoundary>
                  {activityLoading ? (
                    <Card>
                      <CardContent className="p-6 flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </CardContent>
                    </Card>
                  ) : (
                    <SafeTerritoryDetails
                      territory={selectedTerritoryData}
                      activity={activityData}
                      className="w-full"
                    />
                  )}
                </ErrorBoundary>
              )}
              
              {!selectedTerritoryData && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground mb-4">
                      Select a territory on the map to see details
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {territories.slice(0, 6).map(territory => (
                        <Button 
                          key={territory.id}
                          variant="outline"
                          onClick={() => handleTerritoryClick(territory.id)}
                          className="text-xs py-1 h-auto"
                        >
                          {territory.id}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </SafeContainer>
  );
};

export default AtlasNFTView;