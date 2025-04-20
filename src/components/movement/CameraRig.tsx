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
  initialYRotation?: number;
  minCameraHeight?: number;
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
  minPolarAngle = Math.PI * 0.2, // Increased from 0.1 to 0.2 (about 36 degrees from vertical)
  maxPolarAngle = Math.PI * 0.8, // Limit to 80% of 180 degrees - prevents too low angle
  selfieStickEffect = true, // Enable selfie stick effect by default
  selfieStickMaxDistance = 6, // Maximum distance when moving backward
  selfieStickSpeed = 0.05, // Speed of distance adjustment
  initialYRotation = 0, // Initial rotation around Y axis
  minCameraHeight = 0.5,
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
  
  // Keep track of whether initial rotation has been applied
  const initialRotationAppliedRef = useRef(false);
  
  // Track if movement has been detected to preserve camera rotation
  const movementDetectedRef = useRef(false);
  
  // Track the last user-set camera rotation
  const lastUserRotationRef = useRef<{theta: number, phi: number} | null>(null);
  
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
        
        // Also store the last user-set camera rotation angles
        lastUserRotationRef.current = {
          theta: spherical.theta,
          phi: spherical.phi
        };
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
  
  // Capture initial position on first render and apply initial rotation
  useEffect(() => {
    if (!initialRotationAppliedRef.current && 
        camera && 
        controlsRef.current && 
        controlsRef.current.target &&
        target.current) {
      
      // Short delay to allow Player component to initialize first
      const timer = setTimeout(() => {
        // We need to be careful not to reset the camera position if Player has already set it
        const targetToCamera = new THREE.Vector3().subVectors(
          camera.position, 
          controlsRef.current.target
        );
        
        const spherical = new THREE.Spherical().setFromVector3(targetToCamera);
        originalSphereRef.current = spherical;
        lastUserRotationRef.current = {
          theta: spherical.theta,
          phi: spherical.phi
        };
        
        // Set better initial camera angles
        controlsRef.current.minPolarAngle = minPolarAngle;
        controlsRef.current.maxPolarAngle = maxPolarAngle;
        
        // Update controls
        controlsRef.current.update();
        
        // Mark rotation as applied
        initialRotationAppliedRef.current = true;
      }, 100); // Small delay to let Player component initialize first
      
      return () => clearTimeout(timer);
    }
  }, [camera, initialYRotation, target, minPolarAngle, maxPolarAngle]);
  
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
      
      // Check if we're moving now
      const { forward, right, up } = movementInput.current;
      const isMoving = Math.abs(forward) > 0.01 || Math.abs(right) > 0.01 || Math.abs(up) > 0.01;
      
      // If we just started moving and we have a last user rotation, preserve it
      if (isMoving && !movementDetectedRef.current && lastUserRotationRef.current) {
        movementDetectedRef.current = true;
        
        // Don't adjust camera rotation when movement starts - let the user's last set view remain
      }
      
      // If we stopped moving, reset our movement detection flag
      if (!isMoving && movementDetectedRef.current) {
        movementDetectedRef.current = false;
      }
      
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
        
        // Only adjust polar angle if user isn't currently interacting AND we're not preserving user rotation
        if (isBackingUp && !userInteractingRef.current && !lastUserRotationRef.current) {
          // Make minPolarAngle bigger (closer to horizontal) when backing up
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
        } else if (!isBackingUp && !userInteractingRef.current) {
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
      
      // Apply floor clamp - prevent camera from going below minimum height
      if (camera.position.y < minCameraHeight) {
        camera.position.y = minCameraHeight;
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