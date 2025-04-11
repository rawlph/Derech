import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useMovementInput } from '../input/InputController';

interface CameraRigProps {
  target: React.RefObject<THREE.Object3D>;
  followSpeed?: number;
  minDistance?: number;
  maxDistance?: number;
  minPolarAngle?: number;
  maxPolarAngle?: number;
  selfieStickEffect?: boolean;
  selfieStickMaxDistance?: number;
  selfieStickSpeed?: number;
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
  minPolarAngle = Math.PI * 0.1, // Minimum angle from vertical (about 18 degrees)
  maxPolarAngle = Math.PI / 2, // Prevents camera from going below the horizontal plane
  selfieStickEffect = true, // Enable selfie stick effect by default
  selfieStickMaxDistance = 6, // Maximum distance when moving backward
  selfieStickSpeed = 0.05, // Speed of distance adjustment
  children
}) => {
  // Create a ref for orbit controls
  const controlsRef = useRef<any>(null);
  
  // Get camera to set its initial position if needed
  const { camera } = useThree();
  
  // Get movement input for selfie stick effect
  const movementInput = useMovementInput();
  
  // Keep track of current target distance
  const targetDistanceRef = useRef(minDistance);
  
  // Flag to detect user interaction with OrbitControls
  const userInteractingRef = useRef(false);
  
  // Track current backward state
  const isBackingUpRef = useRef(false);
  const backwardAmountRef = useRef(0);
  
  // Track original camera position for repositioning
  const originalSphereRef = useRef<THREE.Spherical | null>(null);
  
  // Set up listeners for detecting user interaction with controls
  useEffect(() => {
    if (!controlsRef.current) return;
    
    const handleStart = () => {
      userInteractingRef.current = true;
    };
    
    const handleEnd = () => {
      userInteractingRef.current = false;
      
      // When user stops interacting, capture current spherical coords as "original"
      if (controlsRef.current && controlsRef.current.target) {
        const targetToCamera = new THREE.Vector3().subVectors(
          camera.position, 
          controlsRef.current.target
        );
        
        const spherical = new THREE.Spherical().setFromVector3(targetToCamera);
        originalSphereRef.current = spherical;
      }
    };
    
    // Add listeners to orbit controls dom element
    const domElement = controlsRef.current.domElement;
    domElement.addEventListener('mousedown', handleStart);
    domElement.addEventListener('touchstart', handleStart);
    domElement.addEventListener('mouseup', handleEnd);
    domElement.addEventListener('touchend', handleEnd);
    
    return () => {
      domElement.removeEventListener('mousedown', handleStart);
      domElement.removeEventListener('touchstart', handleStart);
      domElement.removeEventListener('mouseup', handleEnd);
      domElement.removeEventListener('touchend', handleEnd);
    };
  }, [controlsRef.current]);
  
  // Capture initial position on first render
  useEffect(() => {
    if (camera && controlsRef.current && controlsRef.current.target) {
      const targetToCamera = new THREE.Vector3().subVectors(
        camera.position, 
        controlsRef.current.target
      );
      
      const spherical = new THREE.Spherical().setFromVector3(targetToCamera);
      originalSphereRef.current = spherical;
    }
  }, []);
  
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
      
      // Selfie stick effect - adjust distance based on backward movement
      if (selfieStickEffect && movementInput) {
        const { forward } = movementInput.current;
        const isBackingUp = forward < 0;
        isBackingUpRef.current = isBackingUp;
        
        // Calculate backward amount (0 when not moving backward, positive when moving backward)
        const backwardAmount = Math.max(-forward, 0);
        backwardAmountRef.current = backwardAmount;
        
        // Calculate target distance:
        // - When moving backward (forward < 0), increase distance up to selfieStickMaxDistance
        // - When not moving backward, return to minDistance
        const targetDistance = minDistance + (backwardAmount * (selfieStickMaxDistance - minDistance));
        
        // Smoothly adjust current target distance
        targetDistanceRef.current = THREE.MathUtils.lerp(
          targetDistanceRef.current,
          targetDistance,
          selfieStickSpeed
        );
        
        // Apply the distance to orbit controls
        // This works WITH the controls rather than against them
        controlsRef.current.minDistance = targetDistanceRef.current;
        controlsRef.current.maxDistance = Math.max(targetDistanceRef.current + 1, maxDistance);
        
        // Adjust the minPolarAngle to keep camera lower when backing up
        // Only do this if we're not in the middle of user interaction
        if (isBackingUp && !userInteractingRef.current) {
          // Make minPolarAngle bigger (closer to horizontal) when backing up
          // Scale between normal minPolarAngle and a more horizontal angle (e.g., 0.3 * PI)
          const targetMinPolarAngle = THREE.MathUtils.lerp(
            minPolarAngle,
            Math.PI * 0.3, // More horizontal angle (closer to ground level)
            Math.min(backwardAmount, 1)
          );
          
          // Apply smoothly
          controlsRef.current.minPolarAngle = THREE.MathUtils.lerp(
            controlsRef.current.minPolarAngle,
            targetMinPolarAngle,
            selfieStickSpeed * 2
          );
        } else {
          // Gradually return to normal minPolarAngle when not backing up
          controlsRef.current.minPolarAngle = THREE.MathUtils.lerp(
            controlsRef.current.minPolarAngle,
            minPolarAngle,
            selfieStickSpeed
          );
        }
      }
      
      // Update controls
      controlsRef.current.update();
      
      // If backing up and we have an original camera position and not interacting,
      // help bias the camera toward a more horizontal position
      if (selfieStickEffect && 
          isBackingUpRef.current && 
          !userInteractingRef.current && 
          originalSphereRef.current) {
        
        // Only apply this adjustment if the camera is currently high above the target
        const currentSpherical = new THREE.Spherical().setFromVector3(
          new THREE.Vector3().subVectors(camera.position, controlsRef.current.target)
        );
        
        // If camera is high up (small phi angle), start bringing it down
        if (currentSpherical.phi < Math.PI * 0.3) {
          // Create a new spherical position with the current distance, but a more
          // horizontal angle (larger phi, as phi is measured from the top down)
          const targetSpherical = new THREE.Spherical(
            currentSpherical.radius, // Keep the same distance
            THREE.MathUtils.lerp(
              currentSpherical.phi,
              Math.PI * 0.5, // Aim for horizontal position
              Math.min(backwardAmountRef.current * 0.3, 0.3) // Subtle influence
            ),
            currentSpherical.theta // Keep the same horizontal rotation
          );
          
          // Convert back to cartesian coordinates
          const targetPosition = new THREE.Vector3().setFromSpherical(targetSpherical)
            .add(controlsRef.current.target);
          
          // Apply a subtle adjustment toward this position
          camera.position.lerp(targetPosition, selfieStickSpeed * 0.5);
        }
      }
      
      // Optional: After controls update, ensure we maintain minimum distance when backing up
      if (selfieStickEffect && isBackingUpRef.current && !userInteractingRef.current) {
        const currentDistance = camera.position.distanceTo(controlsRef.current.target);
        
        // If we're too close, adjust distance but preserve spherical coordinates
        if (currentDistance < targetDistanceRef.current * 0.9) {
          // Extract spherical coordinates (preserves the look direction)
          const direction = camera.position.clone().sub(controlsRef.current.target).normalize();
          
          // Scale to desired distance
          const newPosition = controlsRef.current.target.clone().add(
            direction.multiplyScalar(targetDistanceRef.current)
          );
          
          // Apply position change smoothly
          camera.position.lerp(newPosition, selfieStickSpeed * 2);
        }
      }
    }
  });
  
  return (
    <>
      <OrbitControls
        ref={controlsRef}
        minDistance={minDistance}
        maxDistance={selfieStickEffect ? selfieStickMaxDistance : maxDistance}
        minPolarAngle={minPolarAngle}
        maxPolarAngle={maxPolarAngle}
        enablePan={false}
      />
      {children}
    </>
  );
};

export default CameraRig; 