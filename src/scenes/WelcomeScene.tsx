import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Text, Sky, useGLTF, Cloud, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '@store/store';
import styles from '@styles/WelcomeScene.module.css';
import InteractiveSceneLayout from '../layouts/InteractiveSceneLayout';
import InfoDisplay from '../components/ui/InfoDisplay';
import { useFrame } from '@react-three/fiber';

// Simple clickable object component (same as AudioPuzzleScene)
interface InteractiveObjectProps {
  position: [number, number, number];
  text: string;
  color?: string;
  scale?: [number, number, number];
  onClick?: () => void;
}

// Helper function to create a marble-like material
const createMarbleMaterial = (color: string = '#f5f5f5', roughness: number = 0.3) => {
  return new THREE.MeshStandardMaterial({
    color: color,
    roughness: roughness,
    metalness: 0.1
  });
};

// Helper function to create an alabaster-like glowing material
const createAlabasterGlow = (color: string = '#f8f4e6', emissiveIntensity: number = 0.2) => {
  return new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.2,
    metalness: 0.0,
    transparent: true,
    opacity: 0.8,
    emissive: color,
    emissiveIntensity: emissiveIntensity
  });
};

// Decorative Urn Component
interface UrnProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  color?: string;  // Add color prop for varied urns
}

const GreekUrn: React.FC<UrnProps> = ({ 
  position, 
  rotation = [0, 0, 0], 
  scale = 1,
  color = '#e0e0e0'  // Default color is light beige
}) => {
  const urnMaterial = createMarbleMaterial(color, 0.2);
  const detailMaterial = createMarbleMaterial(darkenColor(color, 0.15), 0.3);  // Darker details
  
  return (
    <group position={position} rotation={new THREE.Euler(...rotation)} scale={[scale, scale, scale]}>
      {/* Base */}
      <mesh material={detailMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.4, 0.2, 16]} />
      </mesh>
      
      {/* Body */}
      <mesh position={[0, 0.6, 0]} material={urnMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.3, 1.0, 16, 1, false]} />
      </mesh>
      
      {/* Neck */}
      <mesh position={[0, 1.25, 0]} material={urnMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.25, 0.5, 0.5, 16, 1, false]} />
      </mesh>
      
      {/* Rim */}
      <mesh position={[0, 1.55, 0]} material={detailMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.25, 0.1, 16]} />
      </mesh>
      
      {/* Handles (simplified) */}
      <mesh position={[0.38, 1, 0]} rotation={[0, 3.14, Math.PI/2]} material={detailMaterial} castShadow receiveShadow>
        <torusGeometry args={[0.2, 0.05, 8, 12, Math.PI]} />
      </mesh>
      <mesh position={[-0.38, 1, 0]} rotation={[0, 0, Math.PI/2]} material={detailMaterial} castShadow receiveShadow>
        <torusGeometry args={[0.2, 0.05, 8, 12, Math.PI]} />
      </mesh>
    </group>
  );
};

// Frieze Panel Component
interface FriezeProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
}

// Utility function to darken a color by a certain amount
const darkenColor = (hexColor: string, amount: number = 0.2): string => {
  // Parse the hex color
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Darken each component
  const darkenedR = Math.max(0, Math.floor(r * (1 - amount)));
  const darkenedG = Math.max(0, Math.floor(g * (1 - amount)));
  const darkenedB = Math.max(0, Math.floor(b * (1 - amount)));
  
  // Convert back to hex
  return `#${darkenedR.toString(16).padStart(2, '0')}${darkenedG.toString(16).padStart(2, '0')}${darkenedB.toString(16).padStart(2, '0')}`;
};

const GreekFrieze: React.FC<FriezeProps> = ({ 
  position, 
  rotation = [0, 0, 0], 
  width = 4 
}) => {
  const friezeMaterial = createMarbleMaterial('#f0f0f0', 0.25);
  const detailMaterial = createMarbleMaterial('#8b9c81', 0.3);  // Subtle desaturated green for frieze details
  
  // Pattern of repeated geometric elements
  return (
    <group position={position} rotation={new THREE.Euler(...rotation)}>
      {/* Base panel */}
      <mesh material={friezeMaterial} castShadow receiveShadow>
        <boxGeometry args={[width, 0.8, 0.1]} />
      </mesh>
      
      {/* Decorative pattern - simplified meander/Greek key pattern */}
      {Array.from({ length: Math.floor(width) * 2 }).map((_, i) => (
        <mesh 
          key={`frieze-detail-${i}`} 
          position={[-width/2 + 0.25 + i * 0.5, 0, 0.06]} 
          material={detailMaterial}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.1, 0.6, 0.05]} />
        </mesh>
      ))}
    </group>
  );
};

// Greek Column Component
interface GreekColumnProps {
  position: [number, number, number];
  height?: number;
  radius?: number;
}

const GreekColumn: React.FC<GreekColumnProps> = ({ position, height = 8, radius = 0.5 }) => {
  const columnMaterial = createMarbleMaterial('#ede5d8', 0.2);  // Light beige for columns
  const baseMaterial = createMarbleMaterial('#8c7055', 0.4);    // Brownish sockets for columns
  const capitalMaterial = createMarbleMaterial('#d5cdbe', 0.3); // Slightly darker top for contrast
  
  return (
    <group position={position}>
      {/* Column base */}
      <mesh position={[0, 0.3, 0]} material={baseMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[radius * 1.3, radius * 1.3, 0.6, 8]} />
      </mesh>
      
      {/* Column shaft with slight taper - extended to floor */}
      <mesh position={[0, height/2, 0]} material={columnMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[radius * 0.85, radius, height, 8, 1, false]} />
      </mesh>
      
      {/* Column capital */}
      <mesh position={[0, height - 0.2, 0]} material={capitalMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[radius * 1.2, radius * 0.85, 0.4, 8]} />
      </mesh>
      <mesh position={[0, height, 0]} material={capitalMaterial} castShadow receiveShadow>
        <boxGeometry args={[radius * 2.4, 0.4, radius * 2.4]} />
      </mesh>
    </group>
  );
};

// Low poly cypress tree component
const CypressTree: React.FC<{position: [number, number, number], scale?: number, rotation?: number}> = ({
  position,
  scale = 1,
  rotation = 0
}) => {
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: '#5D4037', roughness: 0.8 });
  const foliageMaterial = new THREE.MeshStandardMaterial({ color: '#2D5F35', roughness: 0.8 });
  
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={[scale, scale, scale]}>
      {/* Trunk */}
      <mesh material={trunkMaterial} castShadow>
        <cylinderGeometry args={[0.2, 0.4, 1.5, 6]} />
      </mesh>
      
      {/* Foliage - layered cones for cypress shape */}
      <mesh position={[0, 2, 0]} material={foliageMaterial} castShadow>
        <coneGeometry args={[1, 4, 6]} />
      </mesh>
      <mesh position={[0, 3, 0]} material={foliageMaterial} castShadow>
        <coneGeometry args={[0.7, 3, 6]} />
      </mesh>
      <mesh position={[0, 4, 0]} material={foliageMaterial} castShadow>
        <coneGeometry args={[0.4, 2, 6]} />
      </mesh>
    </group>
  );
};

// Particles Component for insects and wind effects
const EnvironmentParticles: React.FC = () => {
  const particles = useRef<THREE.Points>(null);
  const particleCount = 100;
  
  // Initialize particles
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      // Random positions in a large area around the temple
      const radius = 10 + Math.random() * 40;
      const angle = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(angle) * radius; // x
      pos[i * 3 + 1] = Math.random() * 8; // y (height)
      pos[i * 3 + 2] = Math.sin(angle) * radius; // z
    }
    return pos;
  }, []);
  
  // Animate particles
  useFrame((state) => {
    if (particles.current) {
      const positions = particles.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < particleCount; i++) {
        // Gentle flutter movement (insects) and wind drift
        positions[i * 3] += Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.01;
        positions[i * 3 + 1] += Math.cos(state.clock.elapsedTime * 0.3 + i) * 0.005;
        positions[i * 3 + 2] += Math.sin(state.clock.elapsedTime * 0.4 + i * 1.5) * 0.01;
        
        // Keep particles within bounds
        if (Math.abs(positions[i * 3]) > 50) positions[i * 3] *= -0.9;
        if (positions[i * 3 + 1] < 0.5) positions[i * 3 + 1] = 0.5 + Math.random() * 7.5;
        if (positions[i * 3 + 1] > 8) positions[i * 3 + 1] = 8;
        if (Math.abs(positions[i * 3 + 2]) > 50) positions[i * 3 + 2] *= -0.9;
      }
      
      particles.current.geometry.attributes.position.needsUpdate = true;
    }
  });
  
  return (
    <points ref={particles}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color="#ffffff"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
};

// Temple Structure Component
const TempleStructure = () => {
  const floorMaterial = createMarbleMaterial('#e6e2dc', 0.1);  // Slightly warmer floor
  const wallMaterial = createMarbleMaterial('#e8e4dd', 0.2);   // Subtle warm wall
  const alabasterMaterial = createAlabasterGlow('#f8f4e6', 0.15);
  
  // Urn color variations
  const urnColors = [
    '#d9c7b8', // Light beige
    '#c2ab8e', // Medium beige
    '#b39c82', // Darker beige
    '#cebca9', // Warm beige
    '#c4b6a3'  // Taupe
  ];
  
  // Dimensions
  const mainRoomSize = 30;
  const hallwayWidth = 10;
  const wallHeight = 8.45;
  const floorHeight = 0.2;
  const cornerWallSize = 3.65; // Size of the corner wall sections
  const foundationHeight = 0.8; // Height of the temple foundation
  const foundationExtension = 10; // How far the foundation extends beyond the floor
  
  // Frieze height and alabaster panel dimensions
  const friezeHeight = 6;
  const alabasterPanelHeight = wallHeight - friezeHeight - 0.7; // Space between frieze and ceiling
  const alabasterPanelThickness = 0.05; // Very thin panels
  const alabasterPanelInset = 0.2; // How much to inset the panels from the edge
  
  // Values for subtle animation of glow
  const time = useRef(0);
  useFrame((_, delta) => {
    time.current += delta * 0.3; // Slow time increment for subtle pulsing
  });
  
  // Create a component for the alabaster panels
  const AlabasterPanel = ({ position, rotation, width, height = alabasterPanelHeight }: {
    position: [number, number, number],
    rotation: [number, number, number],
    width: number,
    height?: number
  }) => {
    const panelRef = useRef<THREE.Mesh>(null);
    
    // Animate subtle glow pulsing
    useFrame(() => {
      if (panelRef.current && panelRef.current.material instanceof THREE.MeshStandardMaterial) {
        // Subtle pulsing effect
        const pulseFactor = Math.sin(time.current) * 0.05 + 0.15; // Pulse between 0.1 and 0.2
        panelRef.current.material.emissiveIntensity = pulseFactor;
      }
    });
    
    return (
      <mesh 
        ref={panelRef}
        position={position} 
        rotation={new THREE.Euler(...rotation)} 
        castShadow={false} 
        receiveShadow={false}
      >
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial 
          color='#f8f4e6'
          roughness={0.2}
          metalness={0.0}
          transparent={true}
          opacity={0.8}
          emissive='#f8f4e6'
          emissiveIntensity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
    );
  };

  return (
    <group>
      {/* Temple foundation */}
      <group position={[0, -foundationHeight/2, 0]}>
        {/* Main foundation platform */}
        <mesh material={createMarbleMaterial('#c2bbad', 0.4)} receiveShadow castShadow>
          <boxGeometry args={[mainRoomSize + foundationExtension*2, foundationHeight, mainRoomSize + foundationExtension*2]} />
        </mesh>
        
        {/* Foundation steps - North side */}
        <mesh position={[0, -foundationHeight/2 - 0.1, -mainRoomSize/2 - foundationExtension - 1]} material={createMarbleMaterial('#b0a99a', 0.5)} receiveShadow castShadow>
          <boxGeometry args={[mainRoomSize + foundationExtension*2.4, 0.2, 2]} />
        </mesh>
        
        {/* Foundation steps - South side */}
        <mesh position={[0, -foundationHeight/2 - 0.1, mainRoomSize/2 + foundationExtension + 1]} material={createMarbleMaterial('#b0a99a', 0.5)} receiveShadow castShadow>
          <boxGeometry args={[mainRoomSize + foundationExtension*2.4, 0.2, 2]} />
        </mesh>
        
        {/* Foundation steps - East side */}
        <mesh position={[mainRoomSize/2 + foundationExtension + 1, -foundationHeight/2 - 0.1, 0]} material={createMarbleMaterial('#b0a99a', 0.5)} receiveShadow castShadow>
          <boxGeometry args={[2, 0.2, mainRoomSize + foundationExtension*2.5 - 4]} />
        </mesh>
        
        {/* Foundation steps - West side */}
        <mesh position={[-mainRoomSize/2 - foundationExtension - 1, -foundationHeight/2 - 0.1, 0]} material={createMarbleMaterial('#b0a99a', 0.5)} receiveShadow castShadow>
          <boxGeometry args={[2, 0.2, mainRoomSize + foundationExtension*2.5 - 4]} />
        </mesh>
      </group>
      
      {/* Add terrain beneath */}
      <mesh position={[0, -foundationHeight - 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#8B7355" roughness={0.9} />
      </mesh>
      
      {/* Grass areas around the temple */}
      <group>
        {/* North grass */}
        <mesh position={[0, -foundationHeight - 0.39, -40]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[80, 30]} />
          <meshStandardMaterial color="#4a7c3a" roughness={0.8} />
        </mesh>
        
        {/* South grass */}
        <mesh position={[0, -foundationHeight - 0.39, 40]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[80, 30]} />
          <meshStandardMaterial color="#4a7c3a" roughness={0.8} />
        </mesh>
        
        {/* East grass */}
        <mesh position={[40, -foundationHeight - 0.39, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[30, 80]} />
          <meshStandardMaterial color="#4a7c3a" roughness={0.8} />
        </mesh>
        
        {/* West grass */}
        <mesh position={[-40, -foundationHeight - 0.39, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[30, 80]} />
          <meshStandardMaterial color="#4a7c3a" roughness={0.8} />
        </mesh>
        
        {/* Low-poly cypress trees around the temple */}
        <CypressTree position={[-25, -foundationHeight + 0.1, -25]} scale={1.2} rotation={0.5} />
        <CypressTree position={[25, -foundationHeight + 0.1, -25]} scale={1} rotation={-0.3} />
        <CypressTree position={[-25, -foundationHeight + 0.1, 25]} scale={1.3} rotation={1.2} />
        <CypressTree position={[25, -foundationHeight + 0.1, 25]} scale={1.1} rotation={2.1} />
        
        <CypressTree position={[-35, -foundationHeight + 0.1, -15]} scale={0.9} rotation={0.8} />
        <CypressTree position={[35, -foundationHeight + 0.1, -15]} scale={1.4} rotation={-0.2} />
        <CypressTree position={[-35, -foundationHeight + 0.1, 15]} scale={1.2} rotation={1.5} />
        <CypressTree position={[35, -foundationHeight + 0.1, 15]} scale={1} rotation={2.8} />
        
        {/* Environment particles (insects and wind effects) */}
        <EnvironmentParticles />
      </group>

      {/* Main room floor */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={floorMaterial}>
        <planeGeometry args={[mainRoomSize, mainRoomSize]} />
      </mesh>
      
      {/* Corner Walls - Main structures only */}
      {/* Northeast Corner */}
      <mesh 
        position={[mainRoomSize/2 - cornerWallSize/2, wallHeight/2, -mainRoomSize/2 + cornerWallSize/2]} 
        material={wallMaterial} 
        castShadow 
        receiveShadow
      >
        <boxGeometry args={[cornerWallSize, wallHeight, cornerWallSize]} />
      </mesh>
      
      {/* Northwest Corner */}
      <mesh 
        position={[-mainRoomSize/2 + cornerWallSize/2, wallHeight/2, -mainRoomSize/2 + cornerWallSize/2]} 
        material={wallMaterial} 
        castShadow 
        receiveShadow
      >
        <boxGeometry args={[cornerWallSize, wallHeight, cornerWallSize]} />
      </mesh>
      
      {/* Southeast Corner */}
      <mesh 
        position={[mainRoomSize/2 - cornerWallSize/2, wallHeight/2, mainRoomSize/2 - cornerWallSize/2]} 
        material={wallMaterial} 
        castShadow 
        receiveShadow
      >
        <boxGeometry args={[cornerWallSize, wallHeight, cornerWallSize]} />
      </mesh>
      
      {/* Southwest Corner */}
      <mesh 
        position={[-mainRoomSize/2 + cornerWallSize/2, wallHeight/2, mainRoomSize/2 - cornerWallSize/2]} 
        material={wallMaterial} 
        castShadow 
        receiveShadow
      >
        <boxGeometry args={[cornerWallSize, wallHeight, cornerWallSize]} />
      </mesh>
      
      {/* Perimeter columns */}
      {/* Front row (entrance) */}
      {[-12, -8, -4, 4, 8, 12].map((x, i) => (
        <GreekColumn key={`front-${i}`} position={[x, 0, mainRoomSize/2 - 1]} />
      ))}
      
      {/* Back row */}
      {[-12, -8, -4, 4, 8, 12].map((x, i) => (
        <GreekColumn key={`back-${i}`} position={[x, 0, -mainRoomSize/2 + 1]} />
      ))}
      
      {/* Left side */}
      {[-12, -8, -4, 4, 8].map((z, i) => (
        <GreekColumn key={`left-${i}`} position={[-mainRoomSize/2 + 1, 0, z]} />
      ))}
      
      {/* Right side */}
      {[-12, -8, -4, 4, 8].map((z, i) => (
        <GreekColumn key={`right-${i}`} position={[mainRoomSize/2 - 1, 0, z]} />
      ))}
      
      {/* Ceiling beams */}
      <mesh position={[0, wallHeight, 0]} material={createMarbleMaterial('#d9d3c9', 0.2)} castShadow={false} receiveShadow>
        <boxGeometry args={[mainRoomSize, 0.5, mainRoomSize]} />
      </mesh>
      
      {/* Hallways - North */}
      <group position={[0, 0, -mainRoomSize/2 - hallwayWidth/2]}>
        {/* Floor */}
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={floorMaterial}>
          <planeGeometry args={[hallwayWidth, hallwayWidth]} />
        </mesh>
        
        {/* Columns */}
        <GreekColumn position={[-hallwayWidth/2 + 1, 0, -hallwayWidth/2 + 1]} />
        <GreekColumn position={[hallwayWidth/2 - 1, 0, -hallwayWidth/2 + 1]} />
      </group>
      
      {/* Hallways - East */}
      <group position={[mainRoomSize/2 + hallwayWidth/2, 0, 0]}>
        {/* Floor */}
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={floorMaterial}>
          <planeGeometry args={[hallwayWidth, hallwayWidth]} />
        </mesh>
        
        {/* Columns */}
        <GreekColumn position={[hallwayWidth/2 - 1, 0, -hallwayWidth/2 + 1]} />
        <GreekColumn position={[hallwayWidth/2 - 1, 0, hallwayWidth/2 - 1]} />
      </group>
      
      {/* Hallways - West */}
      <group position={[-mainRoomSize/2 - hallwayWidth/2, 0, 0]}>
        {/* Floor */}
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={floorMaterial}>
          <planeGeometry args={[hallwayWidth, hallwayWidth]} />
        </mesh>
        
        {/* Columns */}
        <GreekColumn position={[-hallwayWidth/2 + 1, 0, -hallwayWidth/2 + 1]} />
        <GreekColumn position={[-hallwayWidth/2 + 1, 0, hallwayWidth/2 - 1]} />
      </group>
    
      
      {/* Decorative elements */}
      {/* Friezes along the walls */}
      <GreekFrieze position={[0, 6, mainRoomSize/2 - 0.8 - alabasterPanelInset]} rotation={[0, 0, 0]} width={mainRoomSize - 4} />
      <GreekFrieze position={[0, 6, -mainRoomSize/2 + 0.8 + alabasterPanelInset]} rotation={[0, Math.PI, 0]} width={mainRoomSize - 4} />
      {/* East frieze - inverted to face outward */}
      <GreekFrieze position={[mainRoomSize/2 - 0.8 - alabasterPanelInset, 6, 0]} rotation={[0, -Math.PI*1.5, 0]} width={mainRoomSize - 4} />
      {/* West frieze - inverted to face outward */}
      <GreekFrieze position={[-mainRoomSize/2 + 0.8 + alabasterPanelInset, 6, 0]} rotation={[0, Math.PI*1.5, 0]} width={mainRoomSize - 4} />
      
      {/* Alabaster glowing panels above the friezes - North wall */}
      <AlabasterPanel 
        position={[0, friezeHeight + alabasterPanelHeight/2 + 0.4, mainRoomSize/2 - 0.8 - alabasterPanelInset]} 
        rotation={[0, 0, 0]} 
        width={mainRoomSize - 6}
      />
      
      {/* South wall */}
      <AlabasterPanel 
        position={[0, friezeHeight + alabasterPanelHeight/2 + 0.4, -mainRoomSize/2 + 0.8 + alabasterPanelInset]} 
        rotation={[0, 0, 0]} 
        width={mainRoomSize - 6} 
      />
      
      {/* East wall */}
      <AlabasterPanel 
        position={[mainRoomSize/2 - 0.8 - alabasterPanelInset, friezeHeight + alabasterPanelHeight/2 + 0.4, 0]} 
        rotation={[0, Math.PI/2, 0]} 
        width={mainRoomSize - 6}
      />
      
      {/* West wall */}
      <AlabasterPanel 
        position={[-mainRoomSize/2 + 0.8 + alabasterPanelInset, friezeHeight + alabasterPanelHeight/2 + 0.4, 0]} 
        rotation={[0, Math.PI/2, 0]} 
        width={mainRoomSize - 6}
      />
      
      {/* Decorative urns with varied colors */}
      <GreekUrn position={[-12, 0, mainRoomSize/2 - 4.2]} scale={1.2} color={urnColors[0]} />
      <GreekUrn position={[12, 0, mainRoomSize/2 - 4.2]} scale={1.2} color={urnColors[1]} />
      <GreekUrn position={[-4, 0, -mainRoomSize/2 + 4.2]} scale={1.2} color={urnColors[2]} />
      <GreekUrn position={[4, 0, -mainRoomSize/2 + 4]} scale={1.2} color={urnColors[3]} />
      
      {/* Smaller urns in the corners */}
      <GreekUrn position={[-mainRoomSize/2 + 4, 0, -mainRoomSize/2 + 4]} scale={0.8} color={urnColors[4]} />
      <GreekUrn position={[mainRoomSize/2 - 4, 0, -mainRoomSize/2 + 4]} scale={0.8} color={urnColors[1]} />
      <GreekUrn position={[-mainRoomSize/2 + 4, 0, mainRoomSize/2 - 4]} scale={0.8} color={urnColors[3]} />
      <GreekUrn position={[mainRoomSize/2 - 4, 0, mainRoomSize/2 - 4]} scale={0.8} color={urnColors[2]} />
    </group>
  );
};

// Regular Interactive Object Component
const InteractiveObject: React.FC<InteractiveObjectProps> = ({
  position,
  text,
  color = '#4CAF50',
  scale = [1, 1, 1],
  onClick
}) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Calculate text rotation to face center
  // If on left side (negative x), rotate text to face right
  // If on right side (positive x), rotate text to face left
  const textRotationY = position[1] < 0 ? -Math.PI/2 : Math.PI/2;

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        scale={scale}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={hovered ? '#FFFFFF' : color}
          emissive={color}
          emissiveIntensity={hovered ? 0.8 : 0.5}
        />
      </mesh>
      <Billboard
        position={[0, 1.5, 0]}
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
      >
        <Text
          fontSize={0.5}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
        >
          {text}
        </Text>
      </Billboard>
    </group>
  );
};

// Mars Colony Button Component
const MarsColonyButton: React.FC<InteractiveObjectProps> = ({
  position,
  text,
  onClick
}) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  const sphereRef = useRef<THREE.Group>(null);
  
  // Mars colors
  const marsBaseColor = "#c1440e"; // Darker reddish-orange
  const marsHighlightColor = "#e27b58"; // Lighter reddish-orange
  
  // Calculate text rotation to face center
  // If on left side (negative x), rotate text to face right
  // If on right side (positive x), rotate text to face left
  // For the center north position, we want text to face south
  const textRotationY = position[1] < -2 ? Math.PI : 0;
  
  // Rotation animation
  useFrame((_state, delta) => {
    if (sphereRef.current) {
      sphereRef.current.rotation.y += delta * 0.2; // Slow rotation
    }
  });
  
  // Create noise-based displacement for craters
  const noiseFunction = (x: number, y: number, z: number) => {
    return (
      Math.sin(x * 5 + y * 3) * 0.03 +
      Math.sin(y * 7 + z * 2) * 0.04 +
      Math.sin(z * 3 + x * 4) * 0.03
    );
  };
  
  // Create vertex displacement for the Mars surface
  const marsDisplacement = (geometry: THREE.BufferGeometry) => {
    const positionAttribute = geometry.getAttribute('position');
    const vertex = new THREE.Vector3();
    
    // Apply noise-based displacement to each vertex
    for (let i = 0; i < positionAttribute.count; i++) {
      vertex.fromBufferAttribute(positionAttribute, i);
      const displacement = noiseFunction(vertex.x, vertex.y, vertex.z);
      vertex.normalize().multiplyScalar(1 + displacement);
      positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    
    geometry.computeVertexNormals();
    return geometry;
  };
  
  return (
    <group position={position}>
      {/* Mars sphere with craters */}
      <group 
        ref={sphereRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {/* Base sphere */}
        <mesh>
          <sphereGeometry args={[0.7, 32, 32]} />
          <meshStandardMaterial 
            color={marsBaseColor}
            roughness={0.8}
            metalness={0.1}
            emissive={hovered ? marsHighlightColor : marsBaseColor}
            emissiveIntensity={hovered ? 0.5 : 0.1}
          />
        </mesh>
        
        {/* Crater layer using displaced geometry */}
        <mesh>
          <sphereGeometry
            args={[0.701, 32, 32]}
            onUpdate={(geometry) => marsDisplacement(geometry)}
          />
          <meshStandardMaterial
            color={marsHighlightColor}
            roughness={1.0}
            metalness={0.0}
            emissive={hovered ? marsHighlightColor : "#000000"}
            emissiveIntensity={hovered ? 0.3 : 0}
            transparent={true}
            opacity={0.7}
            depthWrite={false}
          />
        </mesh>
        
        {/* Dust/Atmosphere halo */}
        <mesh>
          <sphereGeometry args={[0.78, 16, 16]} />
          <meshStandardMaterial
            color="#e4a672"
            transparent={true}
            opacity={0.15}
            depthWrite={false}
          />
        </mesh>
        
        {/* Add a few distinguishable craters */}
        <mesh position={[0.3, 0.4, 0.4]}>
          <circleGeometry args={[0.15, 16]} />
          <meshStandardMaterial
            color="#9e3812"
            side={THREE.DoubleSide}
            roughness={1}
          />
        </mesh>
        
        <mesh position={[-0.4, -0.2, 0.5]}>
          <circleGeometry args={[0.2, 16]} />
          <meshStandardMaterial
            color="#9e3812"
            side={THREE.DoubleSide}
            roughness={1}
          />
        </mesh>
      </group>
      
      {/* Orbit ring */}
      <mesh rotation={[Math.PI/2, 0, 0]}>
        <torusGeometry args={[1.1, 0.03, 16, 50]} />
        <meshStandardMaterial 
          color={hovered ? "#FFFFFF" : "#f8bb7b"} 
          emissive={hovered ? "#FFFFFF" : "#f8bb7b"}
          emissiveIntensity={hovered ? 0.8 : 0.3}
          transparent={true}
          opacity={0.7}
        />
      </mesh>
      
      {/* Text label - using Billboard to always face player */}
      <Billboard
        position={[0, 1.5, 0]}
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
      >
        <Text
          fontSize={0.5}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
        >
          {text}
        </Text>
      </Billboard>
    </group>
  );
};

// Portal component - preserving original functionality
const PortalToVibeverse: React.FC<{ position?: [number, number, number], onClick: () => void }> = ({ 
  position = [0, 1, -10],
  onClick 
}) => {
  const portalRef = useRef<THREE.Group>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  
  // Calculate rotation based on position
  // For east position, we want portal to face west (toward center)
  const portalRotationY = position[0] > 10 ? -Math.PI/2 : 0;
  
  const handlePortalClick = (e: any) => {
    e.stopPropagation();
    setShowPrompt(true);
  };
  
  const handleConfirm = (e: any) => {
    e.stopPropagation();
    setShowPrompt(false);
    onClick();
  };
  
  const handleCancel = (e: any) => {
    e.stopPropagation();
    setShowPrompt(false);
  };
  
  return (
    <group ref={portalRef} position={position} onClick={handlePortalClick} rotation={[0, portalRotationY, 0]}>
      <mesh>
        <torusGeometry args={[2, 0.3, 4, 32]} />
        <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <circleGeometry args={[1.7, 32]} />
        <meshBasicMaterial color="#00ff00" opacity={0.7} transparent={true} side={THREE.DoubleSide} />
      </mesh>
      <Billboard
        position={[0, 4, 0]}
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
      >
        <Text
          fontSize={0.4}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          VIBEVERSE PORTAL
        </Text>
      </Billboard>
      
      {showPrompt && (
        <group position={[0, 1, 2.5]}>
          {/* Background panel */}
          <mesh position={[0, 0, -0.1]}>
            <planeGeometry args={[5, 3.5]} />
            <meshBasicMaterial color="#000000" opacity={0.8} transparent={true} />
          </mesh>
          
          {/* Prompt text */}
          <Text
            position={[0, 1, 0]}
            fontSize={0.3}
            color="white"
            anchorX="center"
            anchorY="middle"
            maxWidth={4.5}
          >
            You will leave Derech and enter the Vibeverse
          </Text>
          
          {/* Enter button */}
          <group position={[-1.2, -0.7, 0]} onClick={handleConfirm}>
            <mesh>
              <planeGeometry args={[2, 1]} />
              <meshBasicMaterial color="#4CAF50" />
            </mesh>
            <Text
              position={[0, 0, 0.1]}
              fontSize={0.35}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              Enter
            </Text>
          </group>
          
          {/* Cancel button */}
          <group position={[1.2, -0.7, 0]} onClick={handleCancel}>
            <mesh>
              <planeGeometry args={[2, 1]} />
              <meshBasicMaterial color="#F44336" />
            </mesh>
            <Text
              position={[0, 0, 0.1]}
              fontSize={0.35}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              Cancel
            </Text>
          </group>
        </group>
      )}
    </group>
  );
};

// Return Portal component
const ReturnPortal: React.FC<{ position?: [number, number, number], onClick: () => void, visible: boolean }> = ({ 
  position = [0, 1, 10],
  onClick,
  visible
}) => {
  if (!visible) return null;
  
  return (
    <group position={position} onClick={onClick}>
      <mesh>
        <torusGeometry args={[2, 0.3, 16, 32]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <circleGeometry args={[1.7, 32]} />
        <meshBasicMaterial color="#ff0000" opacity={0.7} transparent={true} side={THREE.DoubleSide} />
      </mesh>
      <Billboard
        position={[0, -2.5, 0]}
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
      >
        <Text
          fontSize={0.4}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          RETURN PORTAL
        </Text>
      </Billboard>
    </group>
  );
};

// Scene content component
const WelcomeContent: React.FC = () => {
  const setGameView = useGameStore(state => state.setGameView);
  const currentRound = useGameStore(state => state.currentRound);
  
  // Check if a colony exists
  const colonyExists = currentRound > 1;
  
  // Handle start/enter colony
  const handleStartColony = () => {
    if (colonyExists) {
      if (window.confirm("You already have a colony. Start a new one?")) {
        const { resetColony } = useGameStore.getState();
        resetColony();
      }
    }
    setGameView('management');
  };

  // Handle enter puzzle
  const handleEnterPuzzle = () => {
    setGameView('puzzle');
  };

  // Handle portal click - preserve original functionality
  const handlePortalClick = () => {
    const currentParams = new URLSearchParams(window.location.search);
    const newParams = new URLSearchParams();
    newParams.append('portal', 'true');
    newParams.append('username', 'DerechPlayer');
    newParams.append('color', 'blue');
    
    const currentHost = window.location.host;
    const currentPath = window.location.pathname;
    const refValue = `${currentHost}${currentPath}`;
    newParams.append('ref', refValue);
    
    for (const [key, value] of currentParams) {
      if (key !== 'ref' && key !== 'portal') {
        newParams.append(key, value);
      }
    }
    
    const paramString = newParams.toString();
    window.location.href = 'https://portal.pieter.com' + (paramString ? '?' + paramString : '');
  };

  // Check if we came from a portal
  const cameFromPortal = new URLSearchParams(window.location.search).get('portal') === 'true';
  const refUrl = new URLSearchParams(window.location.search).get('ref');

  // Handle return through portal
  const handleReturnPortal = () => {
    if (refUrl) {
      let url = refUrl;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      const currentParams = new URLSearchParams(window.location.search);
      const newParams = new URLSearchParams();
      for (const [key, value] of currentParams) {
        if (key !== 'ref' && key !== 'portal') {
          newParams.append(key, value);
        }
      }
      const paramString = newParams.toString();
      window.location.href = url + (paramString ? '?' + paramString : '');
    }
  };

  return (
    <>
      {/* Sky background */}
      <Sky sunPosition={[100, 10, 100]} turbidity={0.3} rayleigh={0.5} />
      
      {/* Clouds on the horizon */}
      <group>
        {/* @ts-ignore */}
        <Cloud position={[-50, 20, -80]} args={[3, 2]} opacity={0.8} speed={0.4} />
        {/* @ts-ignore */}
        <Cloud position={[40, 25, -100]} args={[3, 2]} opacity={0.7} speed={0.3} />
        {/* @ts-ignore */}
        <Cloud position={[0, 30, -120]} args={[3, 2]} opacity={0.9} speed={0.2} />
        {/* @ts-ignore */}
        <Cloud position={[-70, 15, -90]} args={[3, 2]} opacity={0.6} speed={0.3} />
        {/* @ts-ignore */}
        <Cloud position={[60, 20, -95]} args={[3, 2]} opacity={0.7} speed={0.25} />
        
        {/* @ts-ignore */}
        <Cloud position={[-60, 20, 90]} args={[3, 2]} opacity={0.7} speed={0.3} />
        {/* @ts-ignore */}
        <Cloud position={[50, 25, 100]} args={[3, 2]} opacity={0.8} speed={0.2} />
        {/* @ts-ignore */}
        <Cloud position={[20, 15, 110]} args={[3, 2]} opacity={0.6} speed={0.4} />
      </group>
      
      {/* Enhanced lighting for temple atmosphere */}
      <ambientLight intensity={0.6} color="#f0f8ff" /> {/* Soft ambient light */}
      <directionalLight 
        position={[50, 50, 20]} 
        intensity={1.2} 
        color="#fff6e6" 
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={100}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      {/* Soft fill light from opposite direction */}
      <directionalLight 
        position={[-30, 20, -10]} 
        intensity={0.4} 
        color="#e6f0ff" 
        castShadow={false}
      />
      
      {/* Temple structure */}
      <TempleStructure />
      
      {/* Mars Colony button with Mars-themed design */}
      <MarsColonyButton
        position={[0, 2.2, -20]}
        text={colonyExists ? "Return to Colony" : "Start New Colony"}
        onClick={handleStartColony}
      />
      
      <InteractiveObject
        position={[-18, 1, 0]}
        text="Audio Puzzle"
        color="#E91E63"
        onClick={handleEnterPuzzle}
      />
      
      {/* Portal to Vibeverse - preserve functionality */}
      <PortalToVibeverse 
        position={[18, 1, 0]} 
        onClick={handlePortalClick} 
      />
      
      {/* Return portal - only shown if coming from a portal */}
      <ReturnPortal
        position={[0, 1, 10]}
        onClick={handleReturnPortal}
        visible={cameFromPortal && !!refUrl}
      />

      {/* Introduction InfoDisplay - left of the portal */}
      <InfoDisplay
        position={[-8, 3.2, -10]}
        rotation={[0, Math.PI/8, 0]}
        width={6}
        height={6}
        title="Welcome to Derech"
        content={`Derech is a Mars colony simulation where you control an AI called Moses.
        
Your goal is to assist Mars colonists in sustaining their base.
Start a New Colony, balance resources, upgrade and expand.

Switch Scenes from Management to 3D Puzzles.

Move around using WASD keys and mouse, or touch controls on mobile.`}
        contentFontSize={0.22}
        contentLineHeight={1.5}
      />
      
      {/* Changes InfoDisplay - right of the portal */}
      <InfoDisplay
        position={[8, 3.2, -10]}
        rotation={[0, -Math.PI/8, 0]}
        width={6}
        height={6}
        title="Recent Changes"
        content={`View the latest development updates and changes to Derech.

Press the green button below to view the changes page.`}
        contentFontSize={0.22}
        contentLineHeight={1.5}
        glowColor="#4CAF50"
      />
      
      {/* Changes button - separate interactive object instead of HTML link */}
      <group 
        position={[8, 2.8, -10.45]} 
        rotation={[0, -Math.PI/8, 0]}
      >
        <mesh 
          position={[0, 0, 0.5]} 
          onClick={() => window.open("https://rawlph.github.io/Derech/changes.html", "_blank")}
          onPointerOver={(e) => {
            document.body.style.cursor = 'pointer';
            e.object.scale.set(1.1, 1.1, 1.1);
          }}
          onPointerOut={(e) => {
            document.body.style.cursor = 'default';
            e.object.scale.set(1, 1, 1);
          }}
        >
          <boxGeometry args={[3, 0.8, 0.2]} />
          <meshStandardMaterial 
            color="#4CAF50" 
            emissive="#4CAF50"
            emissiveIntensity={0.7}
          />
        </mesh>
        <Text
          position={[0, 0, 0.7]}
          fontSize={0.3}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
        >
          VIEW CHANGES
        </Text>
      </group>
    </>
  );
};

// Record visitor entry from portal as in the original code
interface VisitorLogEntry {
  username: string;
  timestamp: number;
  color?: string;
  referrer?: string;
}

const recordVisitorEntry = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const isPortalVisitor = urlParams.get('portal') === 'true';
  
  if (!isPortalVisitor) return;
  
  const username = urlParams.get('username') || 'Anonymous Explorer';
  const color = urlParams.get('color') || '#FFFFFF';
  const referrer = urlParams.get('ref') || undefined;
  
  // Create new visitor entry
  const newVisitor: VisitorLogEntry = {
    username,
    timestamp: Date.now(),
    color,
    referrer
  };
  
  // Get existing visitor log
  let visitorLog: VisitorLogEntry[] = [];
  const storedVisitors = localStorage.getItem('visitorLog');
  
  if (storedVisitors) {
    try {
      visitorLog = JSON.parse(storedVisitors);
    } catch (e) {
      console.error("Failed to parse visitor log:", e);
    }
  }
  
  // Add new visitor to log
  visitorLog.unshift(newVisitor);
  
  // Limit to last 20 visitors
  if (visitorLog.length > 20) {
    visitorLog = visitorLog.slice(0, 20);
  }
  
  // Save back to localStorage
  localStorage.setItem('visitorLog', JSON.stringify(visitorLog));
};

// Main component
const WelcomeScene: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simple loading simulation
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    // Record visitor entry on mount (preserve original functionality)
    recordVisitorEntry();
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={styles.sceneContainer}>
      {/* Loading overlay */}
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner} />
          <p>Loading Welcome Scene...</p>
        </div>
      )}

      {/* Use our InteractiveSceneLayout like AudioPuzzleScene */}
      <InteractiveSceneLayout
        backgroundColor="#87CEEB" // Sky blue background
        playerColor="#4A90E2"
        playerPosition={[0, 1, 15]} // Position player at the entrance
        playerSpeed={5}
        // Camera settings optimized for exploration
        cameraMinDistance={3} // Slightly increased from 2.5 to get better view
        cameraMaxDistance={7} // Good for temple viewing
        cameraFollowSpeed={0.15}
        // Better camera angle settings
        cameraMinPolarAngle={Math.PI * 0.2} // Higher angle from vertical (36 degrees)
        cameraMaxPolarAngle={Math.PI * 0.75} // Limit how low camera can go
        // Selfie stick effect for better backward movement
        selfieStickEffect={true}
        selfieStickMaxDistance={7}
        selfieStickSpeed={0.01}
        // Floor is handled by our temple structure
        showFloor={false}
        // Height limits for vertical movement
        playerMinHeight={0.1}
        playerMaxHeight={12} // Allow flying up to see ceiling
        initialYRotation={Math.PI} // Camera rotation - pointing north
        initialLookDirection={new THREE.Vector3(0, 0, -1)} // Player direction - make sure this matches the scene orientation
      >
        <WelcomeContent />
      </InteractiveSceneLayout>
      
      {/* Info panel */}
      <div className={styles.infoPanel}>
        <h2>Welcome to Derech</h2>
        <p>Explore the 3D Area</p>
        <p>Create/Return to a Colony</p>
        <p>Or test 3D Puzzles</p>
      </div>
    </div>
  );
};

export default WelcomeScene; 