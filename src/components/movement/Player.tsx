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
  initialLookDirection?: THREE.Vector3; // Initial direction the player should face
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
  verticalSpeed = 3, // New: Slightly slower vertical movement
  minHeight = 0.1,   // New: Minimum height (slightly above ground)
  maxHeight = 20,    // New: Maximum height
  initialLookDirection = new THREE.Vector3(0, 0, -1), // Default: face forward along negative Z
  onPositionChange
}, ref) => {
  // Create internal ref if no ref is passed
  const internalRef = useRef<THREE.Mesh>(null);
  // Use the forwarded ref or fallback to internal ref
  const sphereRef = (ref as React.MutableRefObject<THREE.Mesh | null>) || internalRef;
  
  const prevPositionRef = useRef<THREE.Vector3>(new THREE.Vector3(...position));
  // Keep track of the last valid forward direction for fallback
  const lastValidForwardRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, -1));
  
  // Access Three.js camera
  const { camera } = useThree();
  
  // Track if initialization has been done
  const initializedRef = useRef<boolean>(false);
  
  // Track if we're on a mobile device
  const isMobileRef = useRef<boolean>(false);
  
  // Track the last movement input for detecting first movement
  const lastMovementRef = useRef<{forward: number, right: number, up: number}>({
    forward: 0, right: 0, up: 0
  });

  // Check if we're on a mobile device
  useEffect(() => {
    const checkMobile = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };
    
    isMobileRef.current = checkMobile();
  }, []);

  // Initialize lastValidForwardRef with initialLookDirection and sync camera on mount
  useEffect(() => {
    if (initializedRef.current) return;
    
    if (initialLookDirection) {
      // Normalize the direction vector
      const normalizedDirection = initialLookDirection.clone().normalize();
      
      // Set the last valid forward reference
      lastValidForwardRef.current.copy(normalizedDirection);
      
      // Calculate the camera's initial position relative to the player if camera exists
      if (camera && sphereRef.current) {
        // Force the initial camera position to be aligned with our desired look direction
        // This helps synchronize the camera and movement direction at scene start
        const playerPos = new THREE.Vector3(...position);
        
        // Calculate a position behind the player based on the initial direction
        // We need to invert the direction because the camera should be behind the player
        const cameraOffset = normalizedDirection.clone().negate().multiplyScalar(5);
        
        // Position the camera behind and at a proper height for a third-person view
        camera.position.copy(playerPos).add(cameraOffset);
        camera.position.y += 3; // Add height but not too much - was 2 before
        
        // Adjust to create a better viewing angle - tilt the camera down toward the player
        const lookTarget = playerPos.clone();
        lookTarget.y += 0.5; // Look slightly above player center
        camera.lookAt(lookTarget);
      }
      
      initializedRef.current = true;
    }
  }, [camera, initialLookDirection, position]);
  
  // Get movement input from context
  const movementInput = useMovementInput();
  
  // Update player position on render
  useFrame((_, delta) => {
    if (!sphereRef.current) return;
    
    const { forward, right, up } = movementInput.current;
    
    // Detect if this is the first movement after being stationary
    const wasStationary = 
      Math.abs(lastMovementRef.current.forward) < 0.01 && 
      Math.abs(lastMovementRef.current.right) < 0.01 && 
      Math.abs(lastMovementRef.current.up) < 0.01;
    
    const isMoving = 
      Math.abs(forward) > 0.01 || 
      Math.abs(right) > 0.01 || 
      Math.abs(up) > 0.01;
    
    // Update last movement state
    lastMovementRef.current = { forward, right, up };
    
    // Early return if no movement
    if (!isMoving) return;
    
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
      // But don't update this if it's the first frame of movement on mobile (preserves camera direction)
      if (!(isMobileRef.current && wasStationary && isMoving)) {
        lastValidForwardRef.current.copy(forwardVector);
      }
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