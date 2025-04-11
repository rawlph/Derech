import { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Simplified player refs
export interface PlayerRefs {
  playerGroupRef: React.RefObject<THREE.Group>;
}

// Simplified player state
export interface PlayerMovementState {
  playerPosition: THREE.Vector3;
  mobileMoveInput: { x: number; y: number };
  mobileLookInput: { x: number; y: number };
  onMobileMove: (data: { x: number; y: number }) => void;
  onMobileLook: (data: { x: number; y: number }) => void;
  getPosition: () => THREE.Vector3;
}

// Simplified options
export interface PlayerMovementOptions {
  initialPosition?: [number, number, number];
  invertLook?: boolean;
  enableCollision?: boolean;
  floorSize?: number;
  floorHeight?: number;
}

// Simple WASD-only player movement
const usePlayerMovement = (
  refs: PlayerRefs,
  options: PlayerMovementOptions = {}
): PlayerMovementState => {
  const {
    initialPosition = [0, 0, 5],
  } = options;

  // State
  const [playerPosition, setPlayerPosition] = useState(() => new THREE.Vector3(...initialPosition));
  
  // Track keyboard state
  const keys = useRef<Record<string, boolean>>({});
  const speed = useRef(0.15);
  const mobileMoveInput = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mobileLookInput = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Basic keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  // Simple movement per frame
  useFrame(() => {
    const { playerGroupRef } = refs;
    if (!playerGroupRef?.current) return;
    
    // Basic movement direction
    const moveDirection = new THREE.Vector3(0, 0, 0);
    
    // Check WASD/Arrow keys
    if (keys.current['KeyW'] || keys.current['ArrowUp']) moveDirection.z -= 1;
    if (keys.current['KeyS'] || keys.current['ArrowDown']) moveDirection.z += 1;
    if (keys.current['KeyA'] || keys.current['ArrowLeft']) moveDirection.x -= 1;
    if (keys.current['KeyD'] || keys.current['ArrowRight']) moveDirection.x += 1;
    
    // Apply movement if needed
    if (moveDirection.lengthSq() > 0) {
      moveDirection.normalize();
      
      // Simple forward direction based on rotation
      const rotatedDirection = moveDirection.clone().applyQuaternion(playerGroupRef.current.quaternion);
      
      // Update position
      playerGroupRef.current.position.x += rotatedDirection.x * speed.current;
      playerGroupRef.current.position.z += rotatedDirection.z * speed.current;
      
      // Update React state to trigger renders that rely on position
      setPlayerPosition(new THREE.Vector3().copy(playerGroupRef.current.position));
    }
  });
  
  // Stub mobile control functions (do nothing)
  const onMobileMove = () => {};
  const onMobileLook = () => {};
  
  // Helper to get position
  const getPosition = () => {
    return new THREE.Vector3().copy(playerPosition);
  };
  
  return {
    playerPosition,
    mobileMoveInput: { x: 0, y: 0 },
    mobileLookInput: { x: 0, y: 0 },
    onMobileMove,
    onMobileLook,
    getPosition
  };
};

export default usePlayerMovement; 