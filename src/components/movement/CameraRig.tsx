import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface CameraRigProps {
  target: React.RefObject<THREE.Object3D>;
  followSpeed?: number;
  minDistance?: number;
  maxDistance?: number;
  maxPolarAngle?: number;
  children?: React.ReactNode;
}

/**
 * Camera rig that smoothly follows a target using OrbitControls
 */
const CameraRig: React.FC<CameraRigProps> = ({
  target,
  followSpeed = 0.5,
  minDistance = 2,
  maxDistance = 4,
  maxPolarAngle = Math.PI / 2, // Prevents camera from going below the horizontal plane
  children
}) => {
  // Create a ref for orbit controls
  const controlsRef = useRef<any>(null);
  
  // Get camera to set its initial position if needed
  const { camera } = useThree();
  
  // Update camera target on render frame
  useFrame(() => {
    if (target.current && controlsRef.current) {
      // Get target position
      const targetPosition = target.current.position;
      
      // Create a temporary Vector3 to avoid object creation in the render loop
      const temp = new THREE.Vector3();
      
      // Smoothly interpolate (lerp) the orbit controls target to the player's position
      temp.copy(controlsRef.current.target);
      temp.lerp(targetPosition, followSpeed);
      controlsRef.current.target.copy(temp);
      
      // Update controls
      controlsRef.current.update();
    }
  });
  
  return (
    <>
      <OrbitControls
        ref={controlsRef}
        minDistance={minDistance}
        maxDistance={maxDistance}
        maxPolarAngle={maxPolarAngle}
        enablePan={false}
      />
      {children}
    </>
  );
};

export default CameraRig; 