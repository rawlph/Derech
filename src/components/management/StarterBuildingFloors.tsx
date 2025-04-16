import { useMemo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '@/store/store';
import { axialToWorld } from '@/utils/hexUtils';

// Location coordinates for the starter buildings
const STARTER_BUILDINGS = [
  { q: -1, r: 1, building: 'Living Dome' },    // Living Dome
  { q: 0, r: 1, building: 'Production Dome' },  // Production Dome
  { q: -1, r: 0, building: 'Research Dome' },  // Research Dome
];

const StarterBuildingFloors: React.FC = () => {
  const gridTiles = useGameStore(state => state.gridTiles);
  const dialogueMessage = useGameStore(state => state.dialogueMessage);
  
  // References for animated materials
  const materialRefs = useRef<THREE.MeshStandardMaterial[]>([]);
  
  // Flag to force continuous animation
  const [forceAnimate, setForceAnimate] = useState(false);
  
  // Create regolith-asphalt floor geometry (slightly raised platform)
  const floorGeometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.9, 0.9, 0.12, 6); // Slightly thinner than Flow Project Site
    return geo;
  }, []);
  
  // Floor materials for each building type (with slightly different colors)
  const floorMaterials = useMemo(() => {
    const materials = {
      'Living Dome': new THREE.MeshStandardMaterial({ 
        color: 0x5F4A44, // Lighter color than Flow Project Site (0x3F352F)
        roughness: 0.8,
        metalness: 0.1,
        emissive: 0x331A10, // Slight emissive glow
        emissiveIntensity: 0.15
      }),
      'Production Dome': new THREE.MeshStandardMaterial({ 
        color: 0x564943, // Slightly darker
        roughness: 0.85,
        metalness: 0.15,
        emissive: 0x2A1208, // Slight emissive glow
        emissiveIntensity: 0.15
      }),
      'Research Dome': new THREE.MeshStandardMaterial({ 
        color: 0x5A453F, // Middle tone
        roughness: 0.75,
        metalness: 0.12,
        emissive: 0x2D1812, // Slight emissive glow
        emissiveIntensity: 0.15
      })
    };
    
    // Store material references for animation
    materialRefs.current = Object.values(materials);
    
    return materials;
  }, []);
  
  // Clean up materials on unmount
  useEffect(() => {
    return () => {
      // Dispose materials when component unmounts
      materialRefs.current.forEach(material => {
        if (material) {
          material.dispose();
        }
      });
    };
  }, []);
  
  // Force animation to continue even when dialogue is active
  useEffect(() => {
    if (dialogueMessage?.isVisible && !forceAnimate) {
      setForceAnimate(true);
      
      // Force materials to update
      materialRefs.current.forEach(material => {
        if (material) {
          material.needsUpdate = true;
        }
      });
    }
  }, [dialogueMessage, forceAnimate]);
  
  // Animate the floor material glow
  useFrame(({ clock }) => {
    materialRefs.current.forEach((material, index) => {
      // Create slightly different animation patterns for each dome
      const offset = index * 0.7; // Offset to make each floor pulse at different times
      const intensity = 0.12 + Math.sin(clock.getElapsedTime() * 0.3 + offset) * 0.08;
      material.emissiveIntensity = intensity;
    });
  });
  
  return (
    <>
      {STARTER_BUILDINGS.map(({ q, r, building }) => {
        const tileKey = `${q},${r}`;
        const tile = gridTiles[tileKey];
        
        if (!tile || tile.building !== building) {
          return null;
        }
        
        const position = axialToWorld(q, r);
        const material = floorMaterials[building as keyof typeof floorMaterials];
        
        return (
          <group key={tileKey} position={[position.x, 0, position.z]}>
            {/* Regolith-asphalt platform */}
            <mesh 
              geometry={floorGeometry}
              material={material}
              position={[0, 0.06, 0]} // Slightly raised
              rotation={[0, Math.PI / 6, 0]}
            />
          </group>
        );
      })}
    </>
  );
};

export default StarterBuildingFloors; 