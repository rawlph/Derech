import React, { useRef, useEffect, forwardRef, ForwardedRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useMovementInput } from '../input/InputController';

// Props interface
interface PlayerProps {
  position?: [number, number, number];
  color?: string;
  size?: number;
  speed?: number;
  onPositionChange?: (position: THREE.Vector3) => void;
}

/**
 * Player component - A sphere that moves according to input
 */
const Player = forwardRef<THREE.Mesh, PlayerProps>(({
  position = [0, 1, 0],
  color = '#4A90E2',
  size = 0.5,
  speed = 5,
  onPositionChange
}, ref) => {
  // Create internal ref if no ref is passed
  const internalRef = useRef<THREE.Mesh>(null);
  // Use the forwarded ref or fallback to internal ref
  const sphereRef = (ref as React.MutableRefObject<THREE.Mesh | null>) || internalRef;
  
  const prevPositionRef = useRef<THREE.Vector3>(new THREE.Vector3(...position));
  
  // Access Three.js camera
  const { camera } = useThree();
  
  // Get movement input from context
  const movementInput = useMovementInput();
  
  // Update player position on render
  useFrame((_, delta) => {
    if (!sphereRef.current) return;
    
    const { forward, right } = movementInput.current;
    
    // Early return if no movement
    if (forward === 0 && right === 0) return;
    
    // Get the position and player orientation
    const playerPos = sphereRef.current.position;
    
    // Calculate movement directions
    const toCameraXZ = new THREE.Vector3(
      camera.position.x - playerPos.x,
      0,
      camera.position.z - playerPos.z
    ).normalize();
    
    // Calculate forward and right vectors (in XZ plane)
    const forwardVector = toCameraXZ.clone().negate();
    
    // Fix: The cross product needs to be forwardVector × UP to get the correct right vector
    // Previous version used UP × forwardVector which gives the opposite direction
    const rightVector = forwardVector.clone().cross(new THREE.Vector3(0, 1, 0)).normalize();
    
    // Calculate movement vector
    const moveVector = new THREE.Vector3();
    moveVector.addScaledVector(forwardVector, forward * speed * delta);
    moveVector.addScaledVector(rightVector, right * speed * delta);
    
    // Apply movement to position
    playerPos.add(moveVector);
    
    // Optional: Constrain Y height if needed
    playerPos.y = position[1]; // Keep at initial height
    
    // Call position change callback if provided and position changed
    if (onPositionChange && !playerPos.equals(prevPositionRef.current)) {
      onPositionChange(playerPos.clone());
      prevPositionRef.current.copy(playerPos);
    }
  });
  
  return (
    <mesh
      ref={sphereRef}
      position={position}
    >
      <sphereGeometry args={[size, 32, 32]} />
      <meshStandardMaterial 
        color={color} 
        metalness={0.5} 
        roughness={0.2} 
      />
    </mesh>
  );
});

Player.displayName = 'Player';

export default Player; 