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
  verticalSpeed?: number; // New: Control vertical movement speed
  minHeight?: number;     // New: Minimum height limit
  maxHeight?: number;     // New: Maximum height limit
  onPositionChange?: (position: THREE.Vector3) => void;
  initialYRotation?: number; // New: Initial rotation around Y axis
}

/**
 * Player component - A sphere that moves according to input
 */
const Player = forwardRef<THREE.Mesh, PlayerProps>(({
  position = [0, 1, 0],
  color = '#4A90E2',
  size = 0.5,
  speed = 5,
  verticalSpeed = 3, // New: Slightly slower vertical movement
  minHeight = 0.1,   // New: Minimum height (slightly above ground)
  maxHeight = 20,    // New: Maximum height
  onPositionChange,
  initialYRotation = 0 // New: Initial rotation around Y axis
}, ref) => {
  // Create internal ref if no ref is passed
  const internalRef = useRef<THREE.Mesh>(null);
  // Use the forwarded ref or fallback to internal ref
  const sphereRef = (ref as React.MutableRefObject<THREE.Mesh | null>) || internalRef;
  
  const prevPositionRef = useRef<THREE.Vector3>(new THREE.Vector3(...position));
  
  // Set initial forward direction based on initialYRotation (Math.PI = facing north/negative Z)
  const initialForward = new THREE.Vector3(
    Math.sin(initialYRotation), 
    0, 
    -Math.cos(initialYRotation)
  );
  
  // Keep track of the last valid forward direction for fallback
  const lastValidForwardRef = useRef<THREE.Vector3>(initialForward);
  
  // Access Three.js camera
  const { camera } = useThree();
  
  // Get movement input from context
  const movementInput = useMovementInput();
  
  // Log initial position for debugging
  useEffect(() => {
    if (sphereRef.current) {
      console.log('Player initialized at position:', sphereRef.current.position);
      console.log('Player is using lastValidForward:', lastValidForwardRef.current);
      console.log('Initial rotation set to:', initialYRotation);
    }
  }, [initialYRotation]);
  
  // Update player position on render
  useFrame((_, delta) => {
    if (!sphereRef.current) return;
    
    const { forward, right, up } = movementInput.current;
    
    // Early return if no movement
    if (forward === 0 && right === 0 && up === 0) return;
    
    // Get the position and player orientation
    const playerPos = sphereRef.current.position;
    
    // Calculate horizontal movement directions
    const toCameraXZ = new THREE.Vector3(
      camera.position.x - playerPos.x,
      0,
      camera.position.z - playerPos.z
    );
    
    // Check if the camera is directly or almost directly above
    let forwardVector: THREE.Vector3;
    if (toCameraXZ.lengthSq() < 0.01) {
      // Camera is directly above or very close - use last valid direction or fallback
      forwardVector = lastValidForwardRef.current.clone();
    } else {
      // Normal case - calculate based on camera position
      toCameraXZ.normalize();
      forwardVector = toCameraXZ.clone().negate();
      // Save this as the last valid direction
      lastValidForwardRef.current.copy(forwardVector);
    }
    
    // Calculate right vector
    const rightVector = forwardVector.clone().cross(new THREE.Vector3(0, 1, 0)).normalize();
    
    // Calculate movement vector
    const moveVector = new THREE.Vector3();
    moveVector.addScaledVector(forwardVector, forward * speed * delta);
    moveVector.addScaledVector(rightVector, right * speed * delta);
    
    // Apply horizontal movement to position
    playerPos.x += moveVector.x;
    playerPos.z += moveVector.z;
    
    // Apply vertical movement with constraints
    if (up !== 0) {
      playerPos.y += up * verticalSpeed * delta;
      // Apply height constraints
      playerPos.y = Math.max(minHeight, Math.min(maxHeight, playerPos.y));
    }
    
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