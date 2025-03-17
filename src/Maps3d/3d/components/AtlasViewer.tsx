// src/Maps3d/3d/components/AtlasViewer.tsx
import React, { useEffect, useRef, useState } from 'react';
import { SceneManager } from '../core/SceneManager';
import { Territory } from '../../types/Territory';
import { NetworkConnection } from '../../types/Network';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface AtlasViewerProps {
  tokenId: string;
  territories?: Territory[];
  connections?: NetworkConnection[];
  loading?: boolean;
  onTerritoryClick?: (territoryId: string) => void;
  simplified?: boolean;
  className?: string;
}

const AtlasViewer: React.FC<AtlasViewerProps> = ({
  tokenId,
  territories = [],
  connections = [],
  loading = false,
  onTerritoryClick,
  simplified = false,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sceneManager, setSceneManager] = useState<SceneManager | null>(null);
  const [selectedTerritory, setSelectedTerritory] = useState<string | null>(null);
  
  // Initialize SceneManager
  useEffect(() => {
    if (!containerRef.current) return;
    
    const manager = new SceneManager(containerRef.current);
    setSceneManager(manager);
    
    // Add listener for territory clicks
    const handleTerritoryClick = (event: CustomEvent) => {
      const territoryId = event.detail.territoryId;
      setSelectedTerritory(territoryId);
      
      if (onTerritoryClick) {
        onTerritoryClick(territoryId);
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
  }, [onTerritoryClick]);
  
  // Load territories when available
  useEffect(() => {
    if (!sceneManager || territories.length === 0) return;
    
    const loadTerritories = async () => {
      await sceneManager.loadTerritories(territories);
      
      // Add connections after territories are loaded
      if (connections.length > 0) {
        sceneManager.addConnections(connections);
      }
    };
    
    loadTerritories();
  }, [sceneManager, territories, connections]);
  
  // Focus on selected territory
  useEffect(() => {
    if (!sceneManager || !selectedTerritory) return;
    
    sceneManager.focusOnTerritory(selectedTerritory);
  }, [sceneManager, selectedTerritory]);
  
  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-10 rounded-lg">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      )}
      
      <div 
        ref={containerRef} 
        className="w-full aspect-square rounded-lg overflow-hidden"
      />
      
      {selectedTerritory && (
        <div className="absolute bottom-4 right-4">
          <Button
            variant="secondary"
            onClick={() => {
              setSelectedTerritory(null);
              if (sceneManager) {
                sceneManager.resetView();
              }
            }}
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
    </div>
  );
};

export default AtlasViewer;