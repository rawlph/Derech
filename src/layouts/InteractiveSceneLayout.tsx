import React, { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { InputController } from '../components/input/InputController';
import Player from '../components/movement/Player';
import CameraRig from '../components/movement/CameraRig';
import styles from '../styles/InteractiveSceneLayout.module.css';

interface InteractiveSceneLayoutProps {
  children?: React.ReactNode;
  backgroundColor?: string;
  playerPosition?: [number, number, number];
  playerColor?: string;
  playerSize?: number;
  playerSpeed?: number;
  playerVerticalSpeed?: number;
  playerMinHeight?: number;
  playerMaxHeight?: number;
  showFloor?: boolean;
  floorSize?: number;
  floorColor?: string;
  cameraMinPolarAngle?: number;
  cameraMaxPolarAngle?: number;
  cameraFollowSpeed?: number;
  cameraMinDistance?: number;
  cameraMaxDistance?: number;
  selfieStickEffect?: boolean;
  selfieStickMaxDistance?: number;
  selfieStickSpeed?: number;
  initialYRotation?: number;
  initialLookDirection?: THREE.Vector3;
  minCameraHeight?: number;
}

/**
 * Interactive scene layout with player movement
 * Use this as a base layout for scenes that need player movement
 */
const InteractiveSceneLayout: React.FC<InteractiveSceneLayoutProps> = ({
  children,
  backgroundColor = '#000d14',
  playerPosition = [0, 1, 0],
  playerColor = '#4A90E2',
  playerSize = 0.5,
  playerSpeed = 5,
  playerVerticalSpeed = 3,
  playerMinHeight = 0.1,
  playerMaxHeight = 20,
  showFloor = true,
  floorSize = 100,
  floorColor = '#111111',
  cameraMinPolarAngle = Math.PI * 0.1, // About 18 degrees from vertical
  cameraMaxPolarAngle = Math.PI / 2,   // Max is horizontal
  cameraFollowSpeed = 0.1,
  cameraMinDistance = 2,
  cameraMaxDistance = 4,
  selfieStickEffect = true,
  selfieStickMaxDistance = 6,
  selfieStickSpeed = 0.05,
  initialYRotation = 0,
  initialLookDirection,
  minCameraHeight = 0.8
}) => {
  // Ref for the player mesh
  const playerRef = useRef<THREE.Mesh>(null);
  
  // Unique IDs for the nipple joystick containers
  const nippleContainerId = 'nipple-container';
  const verticalNippleContainerId = 'vertical-nipple-container';
  
  return (
    <div className={styles.sceneContainer}>
      {/* Canvas (3D content) */}
      <Canvas 
        shadows
        camera={{ position: [0, 2, 5], fov: 75 }}
      >
        <color attach="background" args={[backgroundColor]} />
        
        {/* Lights */}
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize={[2048, 2048]}
        />
        
        {/* Input Controller */}
        <InputController 
          nippleContainerId={nippleContainerId}
          verticalNippleContainerId={verticalNippleContainerId}
        >
          {/* Player - Using forwardRef */}
          <Player
            ref={playerRef}
            position={playerPosition}
            color={playerColor}
            size={playerSize}
            speed={playerSpeed}
            verticalSpeed={playerVerticalSpeed}
            minHeight={playerMinHeight}
            maxHeight={playerMaxHeight}
            initialLookDirection={initialLookDirection}
          />
          
          {/* Camera Rig */}
          <CameraRig 
            target={playerRef} 
            followSpeed={cameraFollowSpeed}
            minPolarAngle={cameraMinPolarAngle}
            maxPolarAngle={cameraMaxPolarAngle}
            minDistance={cameraMinDistance}
            maxDistance={cameraMaxDistance}
            selfieStickEffect={selfieStickEffect}
            selfieStickMaxDistance={selfieStickMaxDistance}
            selfieStickSpeed={selfieStickSpeed}
            initialYRotation={initialYRotation}
            minCameraHeight={minCameraHeight}
          >
            {/* Scene content (passed as children) */}
            {children}
          </CameraRig>
          
          {/* Optional floor */}
          {showFloor && (
            <mesh 
              rotation={[-Math.PI / 2, 0, 0]} 
              position={[0, 0, 0]} 
              receiveShadow
            >
              <planeGeometry args={[floorSize, floorSize]} />
              <meshStandardMaterial 
                color={floorColor} 
                roughness={0.9}
              />
            </mesh>
          )}
        </InputController>
      </Canvas>
      
      {/* Nipple joystick container for mobile - horizontal movement */}
      <div 
        id={nippleContainerId} 
        className={styles.nippleContainer}
      ></div>
      
      {/* Vertical nipple joystick container for mobile - up/down movement */}
      <div 
        id={verticalNippleContainerId} 
        className={styles.verticalNippleContainer}
      ></div>
    </div>
  );
};

export default InteractiveSceneLayout; 