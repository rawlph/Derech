import { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RapierRigidBody } from '@react-three/rapier';
import { ThreeEvent } from '@react-three/fiber';

// Physics player refs
export interface PhysicsPlayerRefs {
  rigidBodyRef: React.RefObject<RapierRigidBody>;
  visualRef: React.RefObject<THREE.Group>;
}

// Player state
export interface PhysicsPlayerState {
  playerPosition: THREE.Vector3;
  playerRotation: THREE.Quaternion;
  playerVelocity: THREE.Vector3;
  getPosition: () => THREE.Vector3;
  onMobileMove: (data: { x: number; y: number }) => void;
  handleDragStart: (e: ThreeEvent<PointerEvent>) => void;
  handleDragMove: (e: ThreeEvent<PointerEvent>) => void;
  handleDragEnd: () => void;
}

// Options
export interface PhysicsPlayerOptions {
  initialPosition?: [number, number, number];
  moveSpeed?: number;
  rotationSpeed?: number;
  dampingFactor?: number;
  mobileSensitivity?: number;
}

const usePhysicsMovement = (
  refs: PhysicsPlayerRefs,
  options: PhysicsPlayerOptions = {}
): PhysicsPlayerState => {
  const {
    initialPosition = [0, 0, 5],
    moveSpeed = 15,
    rotationSpeed = 2,
    dampingFactor = 0.9,
    mobileSensitivity = 1.0
  } = options;

  // State
  const [playerPosition, setPlayerPosition] = useState(() => new THREE.Vector3(...initialPosition));
  const [playerRotation, setPlayerRotation] = useState(() => new THREE.Quaternion());
  const [playerVelocity, setPlayerVelocity] = useState(() => new THREE.Vector3());
  
  // Input tracking
  const keys = useRef<Record<string, boolean>>({});
  const moveInput = useRef<THREE.Vector3>(new THREE.Vector3());
  const dragActive = useRef(false);
  const lastPointerPosition = useRef({ x: 0, y: 0 });
  const rotationTarget = useRef(new THREE.Quaternion());
  const mobileMoveInput = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Initialize rotation target with default forward direction
  useEffect(() => {
    // Set initial rotation to look in the negative Z direction (forward)
    const initialEuler = new THREE.Euler(0, 0, 0);
    rotationTarget.current.setFromEuler(initialEuler);
    
    // If visual ref is available, set its initial rotation too
    if (refs.visualRef.current) {
      refs.visualRef.current.quaternion.copy(rotationTarget.current);
    }
  }, [refs.visualRef]);

  // Handle keyboard input
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

  // Handle pointer drag for look direction
  const handleDragStart = (e: ThreeEvent<PointerEvent>) => {
    dragActive.current = true;
    lastPointerPosition.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY };
    if (e.target) {
      (e.target as any).setPointerCapture(e.pointerId);
    }
  };

  const handleDragMove = (e: ThreeEvent<PointerEvent>) => {
    if (!dragActive.current) return;
    
    // Calculate delta
    const deltaX = e.nativeEvent.clientX - lastPointerPosition.current.x;
    const deltaY = e.nativeEvent.clientY - lastPointerPosition.current.y;
    
    // Update last position
    lastPointerPosition.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY };
    
    // Apply rotation to target quaternion
    const targetEuler = new THREE.Euler().setFromQuaternion(rotationTarget.current);
    targetEuler.y -= deltaX * 0.01 * rotationSpeed;
    // Limit vertical rotation to avoid flipping
    targetEuler.x = Math.max(-Math.PI/4, Math.min(Math.PI/4, targetEuler.x - deltaY * 0.01 * rotationSpeed));
    rotationTarget.current.setFromEuler(targetEuler);
  };

  const handleDragEnd = () => {
    dragActive.current = false;
  };

  // Handle mobile joystick input
  const onMobileMove = (data: { x: number; y: number }) => {
    mobileMoveInput.current = { 
      x: data.x * mobileSensitivity, 
      y: data.y * mobileSensitivity 
    };
  };

  // Physics update
  useFrame((state, delta) => {
    const { rigidBodyRef, visualRef } = refs;
    if (!rigidBodyRef?.current || !visualRef?.current) return;
    
    // Get current world position
    const position = rigidBodyRef.current.translation();
    const currentPosition = new THREE.Vector3(position.x, position.y, position.z);
    
    // Calculate movement direction from keyboard input
    moveInput.current.set(0, 0, 0);
    
    // Keyboard WASD/Arrow keys
    if (keys.current['KeyW'] || keys.current['ArrowUp']) moveInput.current.z -= 1;
    if (keys.current['KeyS'] || keys.current['ArrowDown']) moveInput.current.z += 1;
    if (keys.current['KeyA'] || keys.current['ArrowLeft']) moveInput.current.x -= 1;
    if (keys.current['KeyD'] || keys.current['ArrowRight']) moveInput.current.x += 1;
    
    // Mobile input overrides keyboard if present
    if (Math.abs(mobileMoveInput.current.x) > 0.1 || Math.abs(mobileMoveInput.current.y) > 0.1) {
      moveInput.current.x = mobileMoveInput.current.x;
      moveInput.current.z = mobileMoveInput.current.y;
    }
    
    // Apply movement if input exists
    if (moveInput.current.lengthSq() > 0) {
      // Normalize for consistent speed in all directions
      moveInput.current.normalize();
      
      // Get the current rotation to apply movement relative to where player is facing
      const currentRotation = visualRef.current.quaternion.clone();
      const forwardVector = new THREE.Vector3(0, 0, -1).applyQuaternion(currentRotation);
      const rightVector = new THREE.Vector3(1, 0, 0).applyQuaternion(currentRotation);
      
      // Calculate movement velocity
      const targetVelocity = new THREE.Vector3()
        .addScaledVector(forwardVector, -moveInput.current.z * moveSpeed)
        .addScaledVector(rightVector, moveInput.current.x * moveSpeed);
      
      // Apply velocity to rigid body
      rigidBodyRef.current.setLinvel({ 
        x: targetVelocity.x, 
        y: 0, // Keep y velocity at zero for floating movement
        z: targetVelocity.z 
      }, true);
    } else {
      // Apply damping when no input to slow down gracefully
      const currentVel = rigidBodyRef.current.linvel();
      rigidBodyRef.current.setLinvel({ 
        x: currentVel.x * dampingFactor, 
        y: 0,
        z: currentVel.z * dampingFactor 
      }, true);
    }
    
    // Update visual rotation to smoothly follow the target rotation
    visualRef.current.quaternion.slerp(rotationTarget.current, delta * 5);
    
    // Update state with new position and rotation for components that need it
    setPlayerPosition(currentPosition);
    setPlayerRotation(visualRef.current.quaternion.clone());
    
    // Update velocity state
    const vel = rigidBodyRef.current.linvel();
    setPlayerVelocity(new THREE.Vector3(vel.x, vel.y, vel.z));
  });
  
  // Helper to get position
  const getPosition = () => {
    return new THREE.Vector3().copy(playerPosition);
  };
  
  return {
    playerPosition,
    playerRotation,
    playerVelocity,
    getPosition,
    onMobileMove,
    handleDragStart,
    handleDragMove,
    handleDragEnd
  };
};

export default usePhysicsMovement; 