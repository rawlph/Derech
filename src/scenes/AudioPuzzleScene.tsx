import React, { useState, useEffect, useRef } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '@store/store';
import styles from '@styles/AudioPuzzleScene.module.css';
import InteractiveSceneLayout from '../layouts/InteractiveSceneLayout';

// Simple clickable object component
interface InteractiveObjectProps {
  position: [number, number, number];
  text: string;
  color?: string;
  scale?: [number, number, number];
  onClick?: () => void;
}

const InteractiveObject: React.FC<InteractiveObjectProps> = ({
  position,
  text,
  color = '#E91E63',
  scale = [1, 1, 1],
  onClick
}) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        scale={scale}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={hovered ? '#FFFFFF' : color}
          emissive={color}
          emissiveIntensity={hovered ? 0.8 : 0.5}
        />
      </mesh>
      <Text
        position={[0, 1.5, 0]}
        fontSize={0.5}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
      >
        {text}
      </Text>
    </group>
  );
};

// Scene content component
const AudioPuzzleContent: React.FC = () => {
  const setGameView = useGameStore(state => state.setGameView);
  const currentRound = useGameStore(state => state.currentRound);
  
  // Check if a colony exists
  const colonyExists = currentRound > 1;
  
  // Handle return to welcome scene
  const handleReturnToWelcome = () => {
    setGameView('welcome');
  };

  // Handle return to management scene
  const handleReturnToManagement = () => {
    setGameView('management');
  };

  return (
    <>
      {/* Interactive objects */}
      <InteractiveObject
        position={[5, 1, 0]}
        text="Return to Welcome"
        color="#4CAF50"
        onClick={handleReturnToWelcome}
      />
      
      {colonyExists && (
        <InteractiveObject
          position={[-5, 1, 0]}
          text="Return to Colony"
          color="#FF5722"
          onClick={handleReturnToManagement}
        />
      )}
      
      {/* Museum exhibits could be added here */}
      <InteractiveObject
        position={[0, 1, -5]}
        text="Audio Puzzle 1"
        color="#2196F3"
        onClick={() => console.log('Audio Puzzle 1 clicked')}
      />
      
      <InteractiveObject
        position={[0, 1, 5]}
        text="Audio Puzzle 2"
        color="#9C27B0"
        onClick={() => console.log('Audio Puzzle 2 clicked')}
      />
    </>
  );
};

// Main component
const AudioPuzzleScene: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simple loading simulation
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={styles.sceneContainer}>
      {/* Loading overlay */}
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading Audio Puzzle...</p>
        </div>
      )}

      {/* Use our new InteractiveSceneLayout with museum-like camera settings */}
      <InteractiveSceneLayout
        backgroundColor="#000d14"
        playerColor="#E91E63"
        playerPosition={[0, 1, 0]}
        playerSpeed={5}
        // Camera settings optimized for museum exploration
        cameraMinDistance={2.5}
        cameraMaxDistance={5}
        cameraFollowSpeed={0.15}
        // Selfie stick effect for better backward movement
        selfieStickEffect={true}
        selfieStickMaxDistance={7}
        selfieStickSpeed={0.01}
      >
        <AudioPuzzleContent />
      </InteractiveSceneLayout>
      
      {/* Simple info text */}
      <div className={styles.infoPanel}>
        <h2>Audio Puzzle</h2>
        <p>Explore the area using WASD keys and mouse.</p>
        <p>On mobile, use the joystick in the bottom right and touch-drag to look around.</p>
        <p>Move backward to zoom out for a better view.</p>
      </div>
    </div>
  );
};

export default AudioPuzzleScene; 