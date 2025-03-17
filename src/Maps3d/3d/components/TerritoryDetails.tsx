// src/Maps3d/components/TerritoryDetails.tsx
import React from 'react';
import { Territory } from '../../types/Territory'; 
import { ActivityData } from '../../types/ActivityData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DollarSign,
  ImageIcon,
  ArrowRightLeft,
  PiggyBank,
  CalendarClock
} from 'lucide-react';

// Mapeamento de tipos de territórios para símbolos de moeda
const CURRENCY_SYMBOLS: { [key: string]: string } = {
  ethereum: "ETH",
  polygon: "MATIC",
  arbitrum: "ETH",
  optimism: "ETH",
  base: "ETH",
  zksync: "ETH",
  avalanche: "AVAX"
};

interface TerritoryDetailsProps {
  territory: Territory;
  activity?: ActivityData;
  className?: string;
}

const TerritoryDetails: React.FC<TerritoryDetailsProps> = ({
  territory,
  activity,
  className = ''
}) => {
  // Formatar timestamp para data legível
  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString();
  };
  
  // Determinar categoria de território para exibir informações relevantes
  const getTerritoryCategoryInfo = () => {
    switch (territory.type) {
      case 'mainland':
        return {
          title: 'Mainland',
          description: 'A major blockchain network with significant infrastructure and user base.'
        };
      case 'island':
        return {
          title: 'Island',
          description: 'An independent blockchain ecosystem with unique features.'
        };
      case 'peninsula':
        return {
          title: 'Peninsula',
          description: 'A layer-2 solution connected to a mainland blockchain.'
        };
      case 'mountains':
        return {
          title: 'Mountains',
          description: 'A high-performance blockchain network for staking.'
        };
      case 'archipelago':
        return {
          title: 'Archipelago',
          description: 'A collection of related protocols in the same ecosystem.'
        };
      case 'desert':
        return {
          title: 'Desert',
          description: 'An untapped blockchain territory with potential for growth.'
        };
      case 'forest':
        return {
          title: 'Forest',
          description: 'A vibrant ecosystem with diverse applications and projects.'
        };
      default:
        return {
          title: 'Unknown',
          description: 'A mysterious blockchain territory.'
        };
    }
  };
  
  // Get currency symbol for the territory
  const getCurrencySymbol = () => {
    return CURRENCY_SYMBOLS[territory.id] || "ETH";
  };
  
  const categoryInfo = getTerritoryCategoryInfo();
  const currencySymbol = getCurrencySymbol();
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold">{territory.name}</CardTitle>
        <div className="text-sm text-muted-foreground">
          {categoryInfo.title} • Fusion Level: {territory.fusionLevel}
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm mb-4">{categoryInfo.description}</p>
        
        {activity && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 mr-2 text-primary" />
                <span className="text-sm">{currencySymbol} Balance</span>
              </div>
              <span className="font-medium">{activity.balance.toFixed(4)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ImageIcon className="w-4 h-4 mr-2 text-primary" />
                <span className="text-sm">NFTs</span>
              </div>
              <span className="font-medium">{activity.nftCount}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ArrowRightLeft className="w-4 h-4 mr-2 text-primary" />
                <span className="text-sm">Transactions</span>
              </div>
              <span className="font-medium">{activity.transactions}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <PiggyBank className="w-4 h-4 mr-2 text-primary" />
                <span className="text-sm">Staked</span>
              </div>
              <span className="font-medium">{activity.stakedAmount.toFixed(4)} {currencySymbol}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CalendarClock className="w-4 h-4 mr-2 text-primary" />
                <span className="text-sm">Last Updated</span>
              </div>
              <span className="font-medium">{formatDate(activity.lastUpdate)}</span>
            </div>
          </div>
        )}
        
        {!activity && (
          <div className="text-sm text-muted-foreground italic">
            No activity data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TerritoryDetails;