// app/view/atlas/[id]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
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

  // Efeito para verificar a existência do token
  useEffect(() => {
    if (!tokenId) {
      setError("Token ID not found");
      setLoading(false);
      return;
    }

    const checkTokenExistence = async () => {
      try {
        // Verificar se o token existe antes de prosseguir
        const exists = await NFTService.tokenExists(tokenId);
        setTokenExists(exists);
        
        if (!exists) {
          console.log(`Token #${tokenId} does not exist.`);
          
          // Obter informações gerais do contrato
          const info = await NFTService.getContractInfo();
          setContractInfo(info);
          
          setError(`Token #${tokenId} does not exist. Valid range: 1 to ${info.totalSupply}.`);
          setLoading(false);
          return;
        }
        
        // Se o token existe, prosseguir com o carregamento dos dados
        loadRealNFTData();
      } catch (err) {
        console.error("Error checking token existence:", err);
        setError("Error connecting to blockchain. Please try again later.");
        setLoading(false);
      }
    };
    
    // Função para carregar dados reais do NFT
    const loadRealNFTData = async () => {
      try {
        // Buscar dados do NFT do contrato (owner, nível de fusão, redes ativas)
        const nftData = await NFTService.getNFTData(tokenId);
        
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
        
        setTimeout(() => {
          setLoading(false);
        }, 500);
      } catch (err) {
        console.error("Error loading NFT data:", err);
        setError("Error loading NFT data. Please try again later.");
        setLoading(false);
      }
    };
    
    // Iniciar verificação
    checkTokenExistence();
  }, [tokenId]);

  // Função para carregar dados reais de atividade
  const loadRealActivityData = async (territoryId: string) => {
    if (!tokenId || !territoryId || !ownerAddress) return;
    
    try {
      setActivityLoading(true);
      
      // Tentar obter dados do contrato primeiro
      let data = await NFTService.getTerritoryContractData(tokenId, territoryId);
      
      // Se não houver dados no contrato, buscar diretamente da blockchain
      if (data.balance === 0 && data.transactions === 0) {
        try {
          const realData = await TerritoryDataService.fetchActivityData(territoryId, ownerAddress);
          
          // Usar dados da blockchain
          data = realData;
        } catch (error) {
          console.error("Error fetching real blockchain data:", error);
        }
      }
      
      setActivityData(data);
    } catch (error) {
      console.error("Error loading territory activity data:", error);
      setActivityData(undefined);
    } finally {
      setActivityLoading(false);
    }
  };

  // Handler para clique em território
  const handleTerritoryClick = (territoryId: string) => {
    if (!territoryId) return;
    
    setSelectedTerritory(territoryId);
    loadRealActivityData(territoryId);
  };

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

  // Find the selected territory
  const selectedTerritoryData = selectedTerritory
    ? territories.find(t => t.id === selectedTerritory)
    : null;

  return (
    <SafeContainer>
      <div className="py-8">
        <h1 className="text-3xl font-bold mb-1 text-center">{nftName || "Crypto Atlas Explorer"}</h1>
        <h2 className="text-xl text-center text-muted-foreground mb-8">
          Token #{tokenId} 
          {fusionLevel > 1 && <span className="ml-2 text-sm text-amber-500">Fusion Level {fusionLevel}</span>}
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
                      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mb-4"></div>
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
                      <span className="font-medium text-green-600">Blockchain</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {selectedTerritoryData && (
                <ErrorBoundary>
                  {activityLoading ? (
                    <Card>
                      <CardContent className="p-6 flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
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