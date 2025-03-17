// src/Maps3d/3d/components/AtlasViewer.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SceneManager } from '../core/SceneManager';
import { Territory } from '../../types/Territory';
import { NetworkConnection } from '../../types/Network';
import { ActivityData } from '../../types/ActivityData';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info, Loader2 } from 'lucide-react';
import { OptimizedAtlasService } from '@/services/OptimizedNFTService';
import { NFTService } from '@/services/NFTService';
import { TerritoryDataService } from '@/services/TerritoryDataService';

interface AtlasViewerProps {
  tokenId: string;
  territories?: Territory[];
  connections?: NetworkConnection[];
  loading?: boolean;
  onTerritoryClick?: (territoryId: string, activityData?: ActivityData) => void;
  simplified?: boolean;
  className?: string;
  // New optimized loading props
  useOptimizedLoading?: boolean;
}

const AtlasViewer: React.FC<AtlasViewerProps> = ({
  tokenId,
  territories: initialTerritories = [],
  connections: initialConnections = [],
  loading: initialLoading = false,
  onTerritoryClick,
  simplified = false,
  className = '',
  useOptimizedLoading = false // Default to false for backward compatibility
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sceneManager, setSceneManager] = useState<SceneManager | null>(null);
  const [selectedTerritory, setSelectedTerritory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // States for optimized loading
  const [territories, setTerritories] = useState<Territory[]>(initialTerritories);
  const [connections, setConnections] = useState<NetworkConnection[]>(initialConnections);
  const [loading, setLoading] = useState<boolean>(initialLoading);
  const [usingFallback, setUsingFallback] = useState<boolean>(false);
  const [territoryData, setTerritoryData] = useState<ActivityData | null>(null);
  const [territoryLoading, setTerritoryLoading] = useState<boolean>(false);


  
  // Load data with optimization if enabled
  useEffect(() => {
    if (!useOptimizedLoading || !tokenId) {
      // If not using optimized loading, use the props directly
      setTerritories(initialTerritories);
      setConnections(initialConnections);
      setLoading(initialLoading);
      return;
    }
    
    // Otherwise, load data using the optimized service
    let isMounted = true;
    
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Use optimized service to load data
        const result = await OptimizedAtlasService.loadOptimizedTerritories(tokenId);
        
        // Update state if component is still mounted
        if (isMounted) {
          setTerritories(result.territories);
          setConnections(result.connections);
          setUsingFallback(result.usingFallback);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error loading Atlas data:", error);
        
        if (isMounted) {
          setError("Failed to load Atlas data. Please try again later.");
          setLoading(false);
        }
      }
    };
    
    loadData();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [tokenId, useOptimizedLoading, initialTerritories, initialConnections, initialLoading]);
  
  // Initialize SceneManager
  useEffect(() => {
    if (!containerRef.current) return;
    
    try {
      const manager = new SceneManager(containerRef.current);
      setSceneManager(manager);
      
      // Add listener for territory clicks
      const handleTerritoryClick = (event: CustomEvent) => {
        const territoryId = event.detail.territoryId;
        setSelectedTerritory(territoryId);
        
        // If optimized loading, fetch territory data
        if (useOptimizedLoading && tokenId) {
          loadTerritoryData(territoryId);
        }
        
        if (onTerritoryClick) {
          onTerritoryClick(territoryId, territoryData || undefined);
        }
      };
      
      containerRef.current.addEventListener('territory-click', 
        handleTerritoryClick as EventListener);
      
      // Start animation
      manager.startAnimation();
      
      // Cleanup
      return () => {
        if (manager) {
          manager.dispose();
        }
        
        if (containerRef.current) {
          containerRef.current.removeEventListener('territory-click', 
            handleTerritoryClick as EventListener);
        }
        
        setSceneManager(null);
      };
    } catch (err) {
      console.error('Error initializing SceneManager:', err);
      setError('Failed to initialize 3D viewer. Please try refreshing the page.');
    }
  }, [onTerritoryClick, tokenId, territoryData, useOptimizedLoading]);
  
  // Load territories when available
  useEffect(() => {
    if (!sceneManager || territories.length === 0) return;
    
    const loadTerritories = async () => {
      try {
        await sceneManager.loadTerritories(territories);
        
        // Add connections after territories are loaded
        if (connections.length > 0) {
          sceneManager.addConnections(connections);
        }
      } catch (err) {
        console.error('Error loading territories:', err);
        setError('Failed to load territories. Please try refreshing the page.');
      }
    };
    
    loadTerritories();
  }, [sceneManager, territories, connections]);
  
  // Focus on selected territory
  useEffect(() => {
    if (!sceneManager || !selectedTerritory) return;
    
    try {
      sceneManager.focusOnTerritory(selectedTerritory);
    } catch (err) {
      console.error('Error focusing on territory:', err);
    }
  }, [sceneManager, selectedTerritory]);
  
  // Load territory data when selected
  const loadTerritoryData = async (territoryId: string) => {
    if (!tokenId || !territoryId) return;
    
    setTerritoryLoading(true);
    
    try {
      // Try to get data for this territory
      const data = await NFTService.getTerritoryContractData(tokenId, territoryId);
      setTerritoryData(data);
      
      // Update the parent component if needed
      if (onTerritoryClick) {
        onTerritoryClick(territoryId, data);
      }
    } catch (error) {
      console.error(`Error loading data for territory ${territoryId}:`, error);
      
      // Try fallback method or set null data
      setTerritoryData(null);
    } finally {
      setTerritoryLoading(false);
    }
  };
  
  // Reset view callback
  const resetView = useCallback(() => {
    if (!sceneManager) return;
    
    try {
      setSelectedTerritory(null);
      sceneManager.resetView();
    } catch (err) {
      console.error('Error resetting view:', err);
    }
  }, [sceneManager]);
  
  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (sceneManager) {
        try {
          sceneManager.onWindowResize();
        } catch (err) {
          console.error('Error handling resize:', err);
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sceneManager]);
  
  if (error) {
    return (
      <div className={`relative flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-lg overflow-hidden ${className}`} style={{aspectRatio: '1/1'}}>
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-red-700 dark:text-red-300 mb-2">3D Viewer Error</h3>
        <p className="text-sm text-red-600 dark:text-red-400 text-center max-w-xs">{error}</p>
        <button 
          className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-md hover:bg-red-200 dark:hover:bg-red-700"
          onClick={() => window.location.reload()}
        >
          Refresh Page
        </button>
      </div>
    );
  }
  
  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-10 rounded-lg">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      )}
      
      {usingFallback && (
        <div className="absolute top-2 left-2 z-20 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded">
          Preview Mode
        </div>
      )}
      
      <div 
        ref={containerRef} 
        className="w-full aspect-square rounded-lg overflow-hidden relative"
      >
        {territories.length === 0 && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800">
            <Info className="w-10 h-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-center">No territories available</p>
          </div>
        )}
      </div>
      
      {selectedTerritory && (
        <div className="absolute bottom-4 right-4">
          <Button
            variant="secondary"
            onClick={resetView}
          >
            View All Territories
          </Button>
        </div>
      )}
      
      {simplified && (
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            For a full interactive experience, visit:
          </p>
          <a 
            href={`/view/atlas/${tokenId}`}
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Explore Full 3D Map
          </a>
        </div>
      )}
      
      {territoryLoading && (
        <div className="mt-2 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
};

export default AtlasViewer;