import { useEffect, useRef, useState } from 'react';
import { Text, Billboard } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '@store/store';
import { axialToWorld, TILE_THICKNESS } from '@utils/hexUtils';
import * as THREE from 'three';

export interface ResourceGeneration {
  taskId: string;
  targetTileKey: string;
  type: string;
  resourceType: string;
  amount: number;
  position?: THREE.Vector3;
  id?: string; // Unique ID for each generation
  timestamp?: number; // When it was created
  details?: string; // Additional context about the resource generation
}

interface FloatingNumberProps {
  generation: ResourceGeneration;
  onComplete: () => void;
}

// Individual floating number component
const FloatingNumber = ({ generation, onComplete }: FloatingNumberProps) => {
  const { position, resourceType, amount } = generation;
  const ref = useRef<any>();
  const startTime = useRef(Date.now());
  const duration = 2000; // 2 seconds for the animation
  
  // Resource type to color and symbol mapping
  const resourceColors: Record<string, string> = {
    power: '#ffe066',      // Yellow for power
    water: '#66c2ff',      // Blue for water
    minerals: '#c98949',   // Brown for minerals
    researchPoints: '#66ffcc', // Teal for research points
    colonyGoods: '#c266ff', // Purple for colony goods
  };
  
  const resourceSymbols: Record<string, string> = {
    power: '⚡',
    water: '💧',
    minerals: '⛏️',
    researchPoints: '🔬',
    colonyGoods: '📦',
  };

  const color = resourceColors[resourceType] || 'white';
  const symbol = resourceSymbols[resourceType] || '';
  const displayText = `${symbol} +${amount}`;

  // Force cleanup after maximum duration of 5 seconds
  useEffect(() => {
    const forceCleanupTimeout = setTimeout(() => {
      console.log("Force cleanup for floating number");
      onComplete();
    }, 5000); // Backup cleanup after 5 seconds
    
    return () => clearTimeout(forceCleanupTimeout);
  }, [onComplete]);

  useFrame(() => {
    if (!ref.current) return;
    
    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(elapsed / duration, 1);
    
    // Move upward and fade out
    if (ref.current.position && position) {
      ref.current.position.y = position.y + progress * 1.5; // Float upward 1.5 units
      ref.current.material.opacity = 1 - progress; // Fade out
    }
    
    // Animation complete
    if (progress >= 1) {
      onComplete();
    }
  });

  if (!position) return null;

  return (
    <Billboard
      position={[position.x, position.y + 0.5, position.z]} // Position the billboard
      follow={true} // Always face the camera
    >
      <Text
        ref={ref}
        position={[0, 0, 0]} // Position relative to the billboard (centered)
        fontSize={0.5}
        color={color}
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
        fillOpacity={1}
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        {displayText}
      </Text>
    </Billboard>
  );
};

// Main component that manages all floating resource numbers
const FloatingResourceNumbers = () => {
  const [visibleGenerations, setVisibleGenerations] = useState<ResourceGeneration[]>([]);
  const { roundResourceGenerations, clearResourceGenerations } = useGameStore(state => ({
    roundResourceGenerations: state.roundResourceGenerations,
    clearResourceGenerations: state.clearResourceGenerations,
  }));
  const gridTiles = useGameStore(state => state.gridTiles);
  
  // Force clean all animations every 10 seconds
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setVisibleGenerations(prev => {
        // Remove animations older than 5 seconds
        const now = Date.now();
        const filtered = prev.filter(gen => 
          gen.timestamp && now - gen.timestamp < 5000
        );
        
        // If we removed any, log it
        if (filtered.length < prev.length) {
          console.log(`Cleaned up ${prev.length - filtered.length} stale animations`);
        }
        
        return filtered;
      });
    }, 10000);
    
    return () => clearInterval(cleanupInterval);
  }, []);

  // When component unmounts, clean everything
  useEffect(() => {
    return () => {
      setVisibleGenerations([]);
    };
  }, []);

  // When new resource generations are available, add them to visible list with positions
  useEffect(() => {
    if (roundResourceGenerations.length > 0) {
      // Limit to max 30 visible animations to prevent overload
      if (visibleGenerations.length > 30) {
        console.warn("Too many animations, limiting to 30");
        setVisibleGenerations(prev => prev.slice(-20)); // Keep only the 20 most recent
      }
      
      const now = Date.now();
      const generationsWithPositions = roundResourceGenerations.map(gen => {
        const tile = gridTiles[gen.targetTileKey];
        if (!tile) return gen;
        
        const tilePos = axialToWorld(tile.q, tile.r);
        const heightOffset = tile.height * (TILE_THICKNESS * 0.8);
        const buildingY = heightOffset + TILE_THICKNESS / 2 + 0.5; // Position above building
        
        return {
          ...gen,
          id: `${gen.taskId}-${now}-${Math.random().toString(36).slice(2, 9)}`, // Create truly unique ID
          timestamp: now,
          position: new THREE.Vector3(tilePos.x, buildingY, tilePos.z)
        };
      });
      
      setVisibleGenerations(prev => [...prev, ...generationsWithPositions]);
      
      // Clear the source data after processing
      clearResourceGenerations();
    }
  }, [roundResourceGenerations, gridTiles, clearResourceGenerations, visibleGenerations.length]);

  // Remove a single generation by its unique ID
  const removeGeneration = (id: string) => {
    setVisibleGenerations(prev => prev.filter(gen => gen.id !== id));
  };

  return (
    <group>
      {visibleGenerations.map((gen) => (
        <FloatingNumber
          key={gen.id || `${gen.taskId}-${gen.resourceType}`}
          generation={gen}
          onComplete={() => removeGeneration(gen.id || `${gen.taskId}-${gen.resourceType}`)}
        />
      ))}
    </group>
  );
};

export default FloatingResourceNumbers;