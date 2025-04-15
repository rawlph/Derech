import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/store';
import { axialToWorld } from '@/utils/hexUtils';

const FlowProjectSite: React.FC = () => {
  const gridTiles = useGameStore(state => state.gridTiles);
  const updateTile = useGameStore(state => state.updateTile);
  const centerTile = gridTiles["0,0"];
  const dialogueMessage = useGameStore(state => state.dialogueMessage);
  
  // Animation refs
  const craneArmRef = useRef<THREE.Group>(null);
  const craneHookRef = useRef<THREE.Mesh>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Use state for materials instead of refs
  const [floorMaterialState, setFloorMaterial] = useState<THREE.MeshStandardMaterial | null>(null);
  const [lightMaterial, setLightMaterial] = useState<THREE.MeshStandardMaterial | null>(null);
  
  // Flag to force continuous animation
  const [forceAnimate, setForceAnimate] = useState(false);
  
  // Ensure the center tile exists and has the Flow Project Site building type
  useEffect(() => {
    if (centerTile) {
      // Set the tile to Plains type
      if (centerTile.type !== 'Plains') {
        updateTile(0, 0, { type: 'Plains', height: 0 });
      }
      
      // Set a special building type to prevent showing building options
      if (centerTile.building !== 'Flow Project Site') {
        updateTile(0, 0, { building: 'Flow Project Site' });
      }
    }
  }, [centerTile, updateTile]);
  
  // If center tile doesn't exist yet, don't render
  if (!centerTile) {
    return null;
  }
  
  // Calculate 3D position of center
  const centerPos = axialToWorld(centerTile.q, centerTile.r);
  
  // Create regolith-asphalt floor geometry (raised platform)
  const floorGeometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.9, 0.9, 0.11, 6); // Increased height
    return geo;
  }, []);
  
  // Floor material (dark gray with reddish tint for Martian regolith-asphalt)
  const floorMaterial = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x3F352F, // Darker color for Flow Project Site
      roughness: 0.9,
      metalness: 0.2,
      emissive: 0x1A0F0A, // Slight emissive glow to help visibility
      emissiveIntensity: 0.2
    });
    setFloorMaterial(material);
    return material;
  }, []);
  
  // Create cable points
  const cablePoints = useMemo(() => {
    return [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -0.3, 0)
    ];
  }, []);
  
  // Use useFrame for animation instead of requestAnimationFrame
  useFrame((_, delta) => {
    const time = performance.now() * 0.001; // Get time in seconds
    
    // Animate crane arm
    if (craneArmRef.current) {
      craneArmRef.current.rotation.y = Math.sin(time * 0.2) * 0.3;
    }
    
    // Animate crane hook
    if (craneHookRef.current) {
      const hookY = -0.3 + Math.sin(time * 0.5) * 0.2;
      craneHookRef.current.position.y = hookY;
    }
    
    // Animate floor glow
    if (floorMaterialState) {
      const intensity = 0.15 + Math.sin(time * 0.4) * 0.1;
      floorMaterialState.emissiveIntensity = intensity;
    }
    
    // Animate construction light
    if (lightMaterial) {
      const intensity = Math.sin(time * 3) > 0.7 ? 0.8 : 0.2;
      lightMaterial.emissiveIntensity = intensity;
    }
  });
  
  // Clean up materials on unmount
  useEffect(() => {
    return () => {
      if (floorMaterialState) {
        floorMaterialState.dispose();
      }
      if (lightMaterial) {
        lightMaterial.dispose();
      }
    };
  }, [floorMaterialState, lightMaterial]);
  
  // Force animation to continue even when dialogue is active
  useEffect(() => {
    if (dialogueMessage?.isVisible && !forceAnimate) {
      setForceAnimate(true);
      
      // Force materials to update
      if (floorMaterialState) {
        floorMaterialState.needsUpdate = true;
      }
      if (lightMaterial) {
        lightMaterial.needsUpdate = true;
      }
    }
  }, [dialogueMessage, forceAnimate, floorMaterialState, lightMaterial]);
  
  // Darker yellow for the crane - less saturated, more industrial-looking
  const craneColor = "#A88C2B"; 
  
  return (
    <group position={[centerPos.x, 0, centerPos.z]}>
      {/* Regolith-asphalt platform with more elevation for visibility */}
      <mesh 
        geometry={floorGeometry}
        material={floorMaterial}
        position={[0, 0.07, 0]} // Raised up a bit more
        rotation={[0, Math.PI / 6, 0]}
      />
      
      {/* Construction Crates */}
      {/* Crate 1 */}
      <mesh position={[0.35, 0.15, 0.4]}>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial color="#7D4E2A" roughness={0.8} />
      </mesh>
      
      {/* Crate 2 (smaller, stacked on first) */}
      <mesh position={[0.36, 0.3, 0.4]} rotation={[0, Math.PI/4, 0]}>
        <boxGeometry args={[0.15, 0.1, 0.15]} />
        <meshStandardMaterial color="#8D5E3A" roughness={0.8} />
      </mesh>
      
      {/* Crate 3 */}
      <mesh position={[-0.5, 0.15, -0.055]} rotation={[0, Math.PI/5, 0]}>
        <boxGeometry args={[0.25, 0.2, 0.25]} />
        <meshStandardMaterial color="#6D3E1A" roughness={0.9} />
      </mesh>
      
      {/* Equipment Barrels with added details */}
      {/* Red Barrel */}
      <group position={[0.3, 0.16, -0.5]}>
        {/* Main barrel body */}
        <mesh>
          <cylinderGeometry args={[0.1, 0.1, 0.3, 16]} />
          <meshStandardMaterial color="#E74C3C" roughness={0.7} />
        </mesh>
        
        {/* Top cap */}
        <mesh position={[0, 0.16, 0]}>
          <cylinderGeometry args={[0.105, 0.105, 0.02, 16]} />
          <meshStandardMaterial color="#AA3326" roughness={0.5} />
        </mesh>

        {/* Middle Ring */}
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.105, 0.105, 0.02, 16]} />
          <meshStandardMaterial color="#AA3326" roughness={0.5} />
        </mesh>
      </group>
      
      {/* Blue Barrel */}
      <group position={[-0.36, 0.15, -0.4]}>
        {/* Main barrel body */}
        <mesh>
          <cylinderGeometry args={[0.1, 0.1, 0.3, 16]} />
          <meshStandardMaterial color="#3498DB" roughness={0.7} />
        </mesh>
        
        {/* Top cap */}
        <mesh position={[0, 0.16, 0]}>
          <cylinderGeometry args={[0.105, 0.105, 0.02, 16]} />
          <meshStandardMaterial color="#2471A3" roughness={0.5} />
        </mesh>

        {/* Middle Ring */}
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.105, 0.105, 0.02, 16]} />
          <meshStandardMaterial color="#2471A3" roughness={0.5} />
        </mesh>
      </group>
      
      {/* Construction crane with darker color */}
      <group position={[-0.2, 0.1, 0]}>
        {/* Crane base */}
        <mesh position={[0.2, 0.1, 0]}>
          <cylinderGeometry args={[0.15, 0.2, 0.2, 8]} />
          <meshStandardMaterial color={craneColor} roughness={0.7} />
        </mesh>
        
        {/* Crane tower */}
        <mesh position={[0.2, 0.4, 0]}>
          <boxGeometry args={[0.08, 0.6, 0.08]} />
          <meshStandardMaterial color={craneColor} roughness={0.7} />
        </mesh>
        
        {/* Rotating crane arm */}
        <group ref={craneArmRef} position={[0.2, 0.7, 0]}>
          {/* Horizontal arm */}
          <mesh position={[0.3, 0, 0]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.6, 0.06, 0.06]} />
            <meshStandardMaterial color={craneColor} roughness={0.7} />
          </mesh>
          
          {/* Cable (simplified as a thin box) */}
          <mesh position={[0.5, -0.27, 0]} scale={[0.01, 0.5, 0.01]}>
            <boxGeometry />
            <meshStandardMaterial color="#333333" />
          </mesh>
          
          {/* Hook */}
          <mesh ref={craneHookRef} position={[0.5, -0.3, 0]}>
            <boxGeometry args={[0.04, 0.08, 0.04]} />
            <meshStandardMaterial color="#555555" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      </group>
      
      {/* Construction markings - small poles with warning stripes in a triangle pattern */}
      {[
        { x: -0.5, z: 0.5 },   // Left corner
        { x: 0.5, z: 0.5 },    // Right corner
        { x: 0, z: -0.5 }      // Bottom corner
      ].map((pos, i) => (
        <group key={`pole-${i}`} position={[pos.x, 0.15, pos.z]}>
          <mesh>
            <boxGeometry args={[0.03, 0.3, 0.03]} />
            <meshStandardMaterial color="#EEEEEE" />
          </mesh>
          {/* Warning stripe */}
          <mesh position={[0, 0.15, 0]}>
            <boxGeometry args={[0.035, 0.05, 0.035]} />
            <meshStandardMaterial color="#FF3333" emissive="#FF3333" emissiveIntensity={0.3} />
          </mesh>
        </group>
      ))}
      
      {/* Construction light (blinking) */}
      <mesh position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial 
          ref={(material) => {
            if (material) {
              setLightMaterial(material as THREE.MeshStandardMaterial);
            }
          }}
          color="#FFAA33" 
          emissive="#FFAA33" 
          emissiveIntensity={0.5} 
          toneMapped={false}
        />
      </mesh>
    </group>
  );
};

export default FlowProjectSite; 