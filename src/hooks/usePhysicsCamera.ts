import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RapierRigidBody } from '@react-three/rapier';

export interface PhysicsCameraRefs {
  rigidBodyRef: React.RefObject<RapierRigidBody>;
  visualRef: React.RefObject<THREE.Group>;
}

export interface PhysicsCameraOptions {
  distance?: number;
  height?: number;
  lookHeight?: number;
  smoothSpeed?: number;
}

const usePhysicsCamera = (
  refs: PhysicsCameraRefs,
  options: PhysicsCameraOptions = {}
) => {
  const {
    distance = 10,
    height = 5,
    lookHeight = 0,
    smoothSpeed = 5
  } = options;

  // Camera position and target refs
  const cameraTargetPosition = useRef(new THREE.Vector3());
  const cameraTargetLookAt = useRef(new THREE.Vector3());
  
  // Update camera position each frame to follow player
  useFrame((state, delta) => {
    const { camera } = state;
    const { rigidBodyRef, visualRef } = refs;
    
    // Skip if refs not ready
    if (!rigidBodyRef?.current || !visualRef?.current) return;

    // Get current player position from physics body
    const position = rigidBodyRef.current.translation();
    const playerPosition = new THREE.Vector3(position.x, position.y, position.z);
    
    // Get player's forward direction from visual mesh quaternion
    const playerRotation = visualRef.current.quaternion.clone();
    
    // Calculate camera offset based on player's rotation
    // We want the camera to be behind the player based on their look direction
    const cameraOffset = new THREE.Vector3(0, height, distance);
    cameraOffset.applyQuaternion(playerRotation);
    
    // Calculate target camera position
    cameraTargetPosition.current.copy(playerPosition).sub(cameraOffset);
    
    // Calculate target look position (slightly above player)
    cameraTargetLookAt.current.copy(playerPosition).add(new THREE.Vector3(0, lookHeight, 0));
    
    // Smoothly move camera
    camera.position.lerp(cameraTargetPosition.current, delta * smoothSpeed);
    
    // Make camera look at player
    const currentLookAt = new THREE.Vector3();
    camera.getWorldDirection(currentLookAt).multiplyScalar(100).add(camera.position);
    
    // Create a target look at vector for smooth transition
    const targetLookAt = new THREE.Vector3().copy(cameraTargetLookAt.current);
    
    // Interpolate current look direction with target
    currentLookAt.lerp(targetLookAt, delta * smoothSpeed);
    
    // Look at interpolated position
    camera.lookAt(currentLookAt);
  });
};

export default usePhysicsCamera; 