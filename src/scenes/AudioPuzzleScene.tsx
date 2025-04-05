import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle, createContext, useContext } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Html, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '@store/store';
import MobileControls from '@components/MobileControls';
import styles from '@styles/AudioPuzzleScene.module.css';
import { createNoise2D } from 'simplex-noise';
import { showIntroductionDialogue, showWaveFilterSuccessDialogue, playMainDialogueSequence } from '@utils/AudioPuzzleDialogueManager';
import { getAudioPuzzleDialogue } from '@config/dialogues';

// Player handle interface for external control
export interface PlayerHandle {
  handleMobileMove: (data: { x: number; y: number }) => void;
  handleMobileLook: (data: { x: number; y: number }) => void;
  getPosition: () => THREE.Vector3;
}

// Player component that handles movement and camera
interface PlayerProps {
  handleRef?: React.Ref<PlayerHandle>;
  position?: [number, number, number];
  invertLook?: boolean;
}

const Player = forwardRef<PlayerHandle, PlayerProps>(({ handleRef, position = [0, 1.5, 0], invertLook = false }, ref) => {
  const playerRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  
  // Player state and controls
  const [playerPosition, setPlayerPosition] = useState(() => new THREE.Vector3(...position));
  const keys = useRef<Record<string, boolean>>({});
  const mobileMoveInput = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mobileLookInput = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isMouseLooking = useRef(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });
  const speed = useRef(0.15);
  const lookSensitivity = useRef(0.05);
  const mouseLookSensitivity = useRef(0.005);
  const shouldAutoLevel = useRef(true);
  const autoLevelSpeed = 0.05;

  // Initialize rotation order to YXZ to prevent gimbal lock
  useEffect(() => {
    if (playerRef.current) {
      // Ensure proper rotation order is set (YXZ is best for first-person controls)
      playerRef.current.rotation.order = 'YXZ';
      playerRef.current.updateMatrixWorld();
    }
  }, []);

  // Expose methods for external control via ref
  useImperativeHandle(handleRef, () => ({
    handleMobileMove: (data: { x: number; y: number }) => {
      mobileMoveInput.current = data;
    },
    handleMobileLook: (data: { x: number; y: number }) => {
      mobileLookInput.current = data;
      // Disable auto-leveling when actively looking
      shouldAutoLevel.current = data.x === 0 && data.y === 0;
    },
    getPosition: () => {
      return playerPosition.clone();
    }
  }));

  // Event handlers for keyboard and mouse
  useEffect(() => {
    // Keyboard handling
    const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    
    // Mouse look handling
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { // Left click
        isMouseLooking.current = true;
        lastMousePosition.current = { x: e.clientX, y: e.clientY };
        
        // Important: Don't reset any rotation values here, just start tracking from current position
      }
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isMouseLooking.current && playerRef.current) {
        const deltaX = e.clientX - lastMousePosition.current.x;
        const deltaY = e.clientY - lastMousePosition.current.y;
        
        // Ensure proper rotation order
        playerRef.current.rotation.order = 'YXZ';
        
        // Apply horizontal look (Y rotation) with rate limiting
        const yRotationDelta = -deltaX * mouseLookSensitivity.current;
        const maxMouseRotationRate = 0.1; // Max rotation per frame
        const clampedYDelta = Math.max(-maxMouseRotationRate, Math.min(maxMouseRotationRate, yRotationDelta));
        playerRef.current.rotation.y += clampedYDelta;
        
        // Apply vertical look (X rotation) with constraints and inversion if enabled
        // In non-inverted mode (default): mouse up (negative deltaY) = look up (negative rotation)
        const verticalMovement = deltaY * mouseLookSensitivity.current * (invertLook ? 1 : -1);
        const clampedXDelta = Math.max(-maxMouseRotationRate, Math.min(maxMouseRotationRate, verticalMovement));
        
        // Check if the potential rotation would exceed limits before applying
        const potentialNewRotation = playerRef.current.rotation.x + clampedXDelta;
        const maxVerticalRotation = Math.PI / 2 - 0.15;
        
        // Apply reduced movement when getting close to limits
        if (Math.abs(potentialNewRotation) > maxVerticalRotation * 0.8) {
          // Apply greatly reduced movement near limits (20% of normal)
          playerRef.current.rotation.x += clampedXDelta * 0.2;
        } else {
          // Normal case - full rotation
          playerRef.current.rotation.x += clampedXDelta;
        }
        
        // Final safety clamp to absolutely ensure we don't exceed limits
        const absoluteMaxRotation = Math.PI / 2 - 0.1;
        playerRef.current.rotation.x = Math.max(-absoluteMaxRotation, 
                                      Math.min(absoluteMaxRotation, playerRef.current.rotation.x));
        
        // Update matrix for proper positioning
        playerRef.current.updateMatrixWorld();
        
        // Update mouse position for next frame
        lastMousePosition.current = { x: e.clientX, y: e.clientY };
        
        // Disable auto-leveling when actively looking
        shouldAutoLevel.current = false;
      }
    };
    
    const handleMouseUp = () => {
      isMouseLooking.current = false;
      shouldAutoLevel.current = true;
    };
    
    const handleMouseLeave = () => {
      isMouseLooking.current = false;
      shouldAutoLevel.current = true;
    };
    
    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      // Clean up event listeners
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [invertLook]);

  // Handle movement and camera updates
  useFrame((_, delta) => {
    if (!playerRef.current) return;
    
    // Calculate movement direction based on keyboard input
    let moveX = 0;
    let moveZ = 0;
    
    // WASD and Arrow keys movement
    if (keys.current['KeyW'] || keys.current['ArrowUp']) moveZ -= 1;
    if (keys.current['KeyS'] || keys.current['ArrowDown']) moveZ += 1;
    if (keys.current['KeyA'] || keys.current['ArrowLeft']) moveX -= 1;
    if (keys.current['KeyD'] || keys.current['ArrowRight']) moveX += 1;
    
    // Combine keyboard and mobile inputs
    moveX += mobileMoveInput.current.x;
    moveZ -= mobileMoveInput.current.y; // Inverted Y for forward/backward
    
    // Normalize movement vector to prevent faster diagonal movement
    if (moveX !== 0 || moveZ !== 0) {
      const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
      moveX /= length;
      moveZ /= length;
    }
    
    // Apply movement relative to player's rotation
    const moveDirection = new THREE.Vector3(moveX, 0, moveZ);
    const rotatedDirection = moveDirection.clone().applyQuaternion(playerRef.current.quaternion);
    
    // Update position
    const newPosition = playerPosition.clone().add(
      rotatedDirection.multiplyScalar(speed.current)
    );
    
    // Simple collision detection with floor boundaries
    const floorSize = 50; // Match this with your floor size
    newPosition.x = Math.max(-floorSize/2 + 1, Math.min(floorSize/2 - 1, newPosition.x));
    newPosition.z = Math.max(-floorSize/2 + 1, Math.min(floorSize/2 - 1, newPosition.z));
    
    // Floor collision - prevent falling through the floor
    const floorHeight = position[1]; // Use initial Y position as floor height
    newPosition.y = Math.max(floorHeight, newPosition.y);
    
    // Apply new position
    setPlayerPosition(newPosition);
    playerRef.current.position.copy(newPosition);
    
    // Store previous rotation for vertical constraints only
    const prevRotationX = playerRef.current.rotation.x;
    
    // Ensure proper rotation order is maintained
    playerRef.current.rotation.order = 'YXZ';
    
    // Handle mobile look input
    if (mobileLookInput.current.x !== 0 || mobileLookInput.current.y !== 0) {
      // Apply rotation based on mobile joystick with rate limiting
      const maxRotationRate = 0.1; // Max rotation change per frame
      const yRotationDelta = -mobileLookInput.current.x * lookSensitivity.current;
      
      // Limit rotation rate for smoother motion
      const clampedYDelta = Math.max(-maxRotationRate, Math.min(maxRotationRate, yRotationDelta));
      playerRef.current.rotation.y += clampedYDelta;
      
      // Apply vertical rotation with inversion if enabled and rate limiting
      const mobileLookY = mobileLookInput.current.y * (invertLook ? 1 : -1);
      const xRotationDelta = mobileLookY * lookSensitivity.current;
      const clampedXDelta = Math.max(-maxRotationRate, Math.min(maxRotationRate, xRotationDelta));
      
      // Calculate the potential new rotation to check if it would exceed limits
      const potentialNewRotation = playerRef.current.rotation.x + clampedXDelta;
      
      // Define strict rotation limits - slightly tighter than the general max
      const maxVerticalRotation = Math.PI / 2 - 0.2;
      
      // Check if the potential rotation would exceed limits
      if (Math.abs(potentialNewRotation) > maxVerticalRotation * 0.8) {
        // If we're already close to limits, apply very reduced movement
        const reductionFactor = Math.min(1.0, (maxVerticalRotation - Math.abs(playerRef.current.rotation.x)) / (maxVerticalRotation * 0.2));
        playerRef.current.rotation.x += clampedXDelta * reductionFactor * 0.5;
      } else {
        // Normal case - full rotation speed when not near limits
        playerRef.current.rotation.x += clampedXDelta;
      }
      
      // Final safety clamp to absolutely ensure we don't exceed limits
      const absoluteMaxRotation = Math.PI / 2 - 0.1;
      playerRef.current.rotation.x = Math.max(-absoluteMaxRotation, 
                                Math.min(absoluteMaxRotation, playerRef.current.rotation.x));
      
      // Disable auto-leveling when actively looking
      shouldAutoLevel.current = false;
    } else if (shouldAutoLevel.current) {
      // Auto-level when not actively looking
      // Adaptive auto-leveling - faster recovery from extreme angles
      const absRotation = Math.abs(playerRef.current.rotation.x);
      const normalizedRotation = absRotation / (Math.PI / 2); // 0 to 1 scale
      
      // Higher recovery speed when at more extreme angles
      let recoverySpeed = autoLevelSpeed;
      if (normalizedRotation > 0.6) {
        // Up to 3x faster recovery from extreme angles
        recoverySpeed = autoLevelSpeed * (1 + normalizedRotation * 2);
      }
      
      // Apply smoothing with the adaptive recovery speed
      playerRef.current.rotation.x *= (1 - recoverySpeed);
      
      // If very close to zero, just snap to level
      if (Math.abs(playerRef.current.rotation.x) < 0.01) {
        playerRef.current.rotation.x = 0;
      }
    }
    
    // Additional guard against extreme rotation
    if (isNaN(playerRef.current.rotation.x) || !isFinite(playerRef.current.rotation.x)) {
      playerRef.current.rotation.x = 0;
    }
    
    // Calculate view direction for camera orientation
    const viewDirection = new THREE.Vector3(0, 0, -1);
    viewDirection.applyQuaternion(playerRef.current.quaternion);
    
    // Update the camera to follow player in third-person view
    // Calculate camera position behind and slightly above the player
    const cameraOffset = new THREE.Vector3(0, 2, 5); // Position camera above and behind
    
    // Smooth camera following by interpolating quaternions
    const targetQuaternion = playerRef.current.quaternion.clone();
    const smoothness = 0.1; // Lower = smoother (0-1)
    
    // Create a temporary quaternion for smooth interpolation
    const smoothQuaternion = new THREE.Quaternion();
    smoothQuaternion.copy(camera.quaternion);
    smoothQuaternion.slerp(targetQuaternion, smoothness);
    
    // Apply the smoothed quaternion to the offset
    const rotatedOffset = cameraOffset.clone().applyQuaternion(playerRef.current.quaternion);
    const cameraPosition = playerPosition.clone().add(rotatedOffset);
    
    // Set camera position with smooth interpolation
    camera.position.lerp(cameraPosition, 0.1);
    
    // Make camera look at a point slightly above the player
    const targetOffset = new THREE.Vector3(0, 0.5, -3);
    const rotatedTargetOffset = targetOffset.clone().applyQuaternion(playerRef.current.quaternion);
    const lookTarget = playerPosition.clone().add(rotatedTargetOffset);
    
    // Use lookAt for immediate direction but smooth the actual quaternion
    camera.lookAt(lookTarget);
    
    // Explicitly update the camera's matrix
    camera.updateMatrix();
    camera.updateMatrixWorld();
  });

  return (
    <group ref={playerRef} position={[position[0], position[1], position[2]]}>
      {/* Player's body (visible sphere) */}
      <mesh castShadow>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#4A90E2" metalness={0.5} roughness={0.2} />
      </mesh>
      
      {/* Add a small glow effect */}
      <pointLight 
        position={[0, 0, 0]} 
        intensity={0.4} 
        distance={2} 
        color="#4A90E2" 
      />
    </group>
  );
});

// AudioVisualizer component for the noise-to-waveform animation
interface AudioVisualizerProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  progress?: number;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  progress = 0
}) => {
  // References for the two lines (using Group as container)
  const topLineRef = useRef<THREE.Group>(null);
  const bottomLineRef = useRef<THREE.Group>(null);
  
  // Reference for time to animate the waveforms
  const timeRef = useRef(0);
  
  // Create the initial lines with noisy positions
  useEffect(() => {
    // Create simplex noise generator
    const noise2D = createNoise2D();
    
    // Create positions and colors arrays
    const pointCount = 100;
    const topPositions = new Float32Array(pointCount * 3);
    const bottomPositions = new Float32Array(pointCount * 3);
    const topColors = new Float32Array(pointCount * 3);
    const bottomColors = new Float32Array(pointCount * 3);
    
    // Fill positions with noisy values
    for (let i = 0; i < pointCount; i++) {
      const x = (i / (pointCount - 1)) * 10 - 5; // Range from -5 to 5
      
      // Generate noise values
      const topNoiseVal = noise2D(x * 0.5, 0) * 0.5;
      const bottomNoiseVal = noise2D(x * 0.5, 10) * 0.5; // Different seed
      
      // Set positions
      topPositions[i * 3] = x;
      topPositions[i * 3 + 1] = topNoiseVal + 1; // Offset by 1 on Y axis
      topPositions[i * 3 + 2] = 0;
      
      bottomPositions[i * 3] = x;
      bottomPositions[i * 3 + 1] = bottomNoiseVal - 1; // Offset by -1 on Y axis
      bottomPositions[i * 3 + 2] = 0;
      
      // Set initial mixed colors
      topColors[i * 3] = 0.7; // Red component
      topColors[i * 3 + 1] = 0.3; // Green component
      topColors[i * 3 + 2] = 0.3; // Blue component
      
      bottomColors[i * 3] = 0.3; // Red component
      bottomColors[i * 3 + 1] = 0.3; // Green component
      bottomColors[i * 3 + 2] = 0.7; // Blue component
    }
    
    // Create geometries for both lines
    const topGeometry = new THREE.BufferGeometry();
    const bottomGeometry = new THREE.BufferGeometry();
    
    // Set attributes on geometries
    topGeometry.setAttribute('position', new THREE.BufferAttribute(topPositions, 3));
    topGeometry.setAttribute('color', new THREE.BufferAttribute(topColors, 3));
    
    bottomGeometry.setAttribute('position', new THREE.BufferAttribute(bottomPositions, 3));
    bottomGeometry.setAttribute('color', new THREE.BufferAttribute(bottomColors, 3));
    
    // Create materials with different colors
    const topMaterial = new THREE.LineBasicMaterial({ 
      vertexColors: true,
      linewidth: 1
    });
    
    const bottomMaterial = new THREE.LineBasicMaterial({ 
      vertexColors: true,
      linewidth: 1
    });
    
    // Create the lines with the geometries and materials
    const topLine = new THREE.Line(topGeometry, topMaterial);
    const bottomLine = new THREE.Line(bottomGeometry, bottomMaterial);
    
    // Assign the lines to the refs
    if (topLineRef.current) {
      // Remove any existing children
      while (topLineRef.current.children.length > 0) {
        topLineRef.current.remove(topLineRef.current.children[0]);
      }
      topLineRef.current.add(topLine);
    }
    
    if (bottomLineRef.current) {
      // Remove any existing children
      while (bottomLineRef.current.children.length > 0) {
        bottomLineRef.current.remove(bottomLineRef.current.children[0]);
      }
      bottomLineRef.current.add(bottomLine);
    }
  }, []);
  
  // Update the lines based on progress and animate them
  useFrame((_, delta) => {
    if (!topLineRef.current || !bottomLineRef.current) return;
    
    // Get the first child of each line ref (the actual THREE.Line)
    const topLine = topLineRef.current.children[0] as THREE.Line;
    const bottomLine = bottomLineRef.current.children[0] as THREE.Line;
    
    // Check if we have valid lines
    if (!topLine || !bottomLine) return;
    
    // Update time for wave animation - REDUCE SPEED significantly
    timeRef.current += delta * 0.75; // Reduced from 2.0 to 0.75
    
    // Get position attributes
    const topPositions = topLine.geometry.attributes.position;
    const bottomPositions = bottomLine.geometry.attributes.position;
    const topColors = topLine.geometry.attributes.color;
    const bottomColors = bottomLine.geometry.attributes.color;
    
    // Check if attributes exist
    if (!topPositions || !bottomPositions || !topColors || !bottomColors) return;
    
    // Calculate wave frequency and phase - LOWER FREQUENCY
    const frequency = 0.6; // Reduced from 1.0 to 0.6
    const phase = timeRef.current;
    
    // Create simplex noise generator for initial positions
    const noise2D = createNoise2D();
    
    // Update each vertex
    for (let i = 0; i < topPositions.count; i++) {
      const x = topPositions.getX(i);
      
      // Generate noise values for initial state - REDUCED VARIATION
      const noiseScale = 0.3; // Lower scale means smoother noise
      const topNoiseVal = noise2D(x * 0.3, phase * 0.1) * noiseScale; // More consistent noise
      const bottomNoiseVal = noise2D(x * 0.3, phase * 0.1 + 10) * noiseScale;
      
      // Calculate sine wave values for final state - SMOOTHER AMPLITUDE
      const amplitude = 0.4; // Reduced from 0.5 to 0.4
      const topSineVal = Math.sin(x * frequency + phase) * amplitude;
      const bottomSineVal = Math.sin(x * frequency + phase + Math.PI) * amplitude; // Phase shifted by PI
      
      // Interpolate between noise and sine wave based on progress - ADD SMOOTHING
      // Use progress to determine how much smoothing to apply
      const smoothFactor = 0.2 + progress * 0.8; // More smoothing at lower progress
      
      // Calculate positions with adaptive smoothing
      const prevTopY = topPositions.getY(i);
      const prevBottomY = bottomPositions.getY(i);
      
      // Target positions (interpolated between noise and sine)
      const targetTopY = (1 - progress) * topNoiseVal + progress * topSineVal + 1; // +1 offset
      const targetBottomY = (1 - progress) * bottomNoiseVal + progress * bottomSineVal - 1; // -1 offset
      
      // Apply smoothing to make less jumpy
      const topY = prevTopY * (1 - smoothFactor) + targetTopY * smoothFactor;
      const bottomY = prevBottomY * (1 - smoothFactor) + targetBottomY * smoothFactor;
      
      // Update positions
      topPositions.setY(i, topY);
      bottomPositions.setY(i, bottomY);
      
      // Interpolate colors based on progress - LESS INTENSE COLORS
      // From mixed colors to more muted red (top) and blue (bottom)
      topColors.setX(i, 0.6 + progress * 0.3); // Red: 0.6 -> 0.9 (not full 1.0)
      topColors.setY(i, 0.3 - progress * 0.2); // Green: 0.3 -> 0.1 (not 0)
      topColors.setZ(i, 0.3 - progress * 0.2); // Blue: 0.3 -> 0.1 (not 0)
      
      bottomColors.setX(i, 0.3 - progress * 0.2); // Red: 0.3 -> 0.1
      bottomColors.setY(i, 0.3 - progress * 0.2); // Green: 0.3 -> 0.1
      bottomColors.setZ(i, 0.6 + progress * 0.3); // Blue: 0.6 -> 0.9
    }
    
    // Mark attributes as needing update
    topPositions.needsUpdate = true;
    bottomPositions.needsUpdate = true;
    topColors.needsUpdate = true;
    bottomColors.needsUpdate = true;
  });
  
  return (
    <group position={[position[0], position[1], position[2]]} 
           rotation={[rotation[0], rotation[1], rotation[2]]}
           scale={scale}>
      <group ref={topLineRef} />
      <group ref={bottomLineRef} />
    </group>
  );
};

// Portal component for navigation between scenes
interface PortalProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  label: string;
  color?: string;
  targetView: 'management' | 'welcome' | 'puzzle';
  onClick?: () => void;
  isSceneComplete?: boolean; // NEW: Track if the scene is completed
}

const Portal: React.FC<PortalProps> = ({ 
  position, 
  rotation = [0, 0, 0],
  label, 
  color = "#4A90E2", 
  targetView,
  onClick,
  isSceneComplete = false // NEW: Default to false
}) => {
  const [hovered, setHovered] = useState(false);
  const portalRef = useRef<THREE.Mesh>(null);
  const setGameView = useGameStore(state => state.setGameView);
  const showDialogue = useGameStore(state => state.showDialogue); // NEW: Get showDialogue function
  
  // Handle portal activation
  const handlePortalClick = () => {
    // NEW: Show confirmation dialogue instead of immediately navigating
    const message = isSceneComplete 
      ? "Scene Finished. Leave?" 
      : "Interrupt scene and enter portal?";
    
    const choices = [
      {
        text: "Cancel",
        action: () => {
          // Do nothing, just close the dialogue
          useGameStore.getState().hideDialogue();
        }
      },
      {
        text: "Leave Scene",
        action: () => {
          // Close the dialogue first
          useGameStore.getState().hideDialogue();
          
          // Then perform the navigation
    if (onClick) {
      onClick();
    } else {
      // Default behavior: change game view
      setGameView(targetView);
    }
        }
      }
    ];
    
    showDialogue(
      message,
      '/Derech/avatars/AiHelper.jpg',
      'System',
      choices
    );
  };
  
  // Portal animation
  useFrame((_, delta) => {
    if (portalRef.current) {
      portalRef.current.rotation.y += delta * 0.5;
      
      // Scale effect when hovered
      const targetScale = hovered ? 1.1 : 1;
      portalRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });
  
  return (
    <group position={position} rotation={rotation}>
      {/* Portal frame */}
      <mesh
        ref={portalRef}
        onClick={handlePortalClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <torusGeometry args={[2, 0.3, 16, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      
      {/* Portal center */}
      <mesh position={[0, 0, 0]}>
        <circleGeometry args={[1.7, 32]} />
        <meshBasicMaterial color={color} opacity={0.7} transparent={true} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Portal label */}
      <Text
        position={[0, -2.5, 0]}
        fontSize={0.5}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
};

// FloorPlate component for interactive floor elements
interface FloorPlateProps {
  position: [number, number, number];
  color: string;
  scale?: number;
  onClick?: () => void;
}

const FloorPlate: React.FC<FloorPlateProps> = ({ 
  position, 
  color, 
  scale = 1, 
  onClick 
}) => {
  const [hovered, setHovered] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const plateRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  
  // Get appropriate material colors based on the base color
  const getColors = () => {
    const baseColor = color.toLowerCase();
    
    if (baseColor === 'red') {
      return {
        main: '#ff3333',
        emissive: '#ff0000',
        frame: '#aa2222'
      };
    } else if (baseColor === 'green') {
      return {
        main: '#33ff33',
        emissive: '#00ff00',
        frame: '#22aa22'
      };
    } else if (baseColor === 'blue') {
      return {
        main: '#3333ff',
        emissive: '#0000ff',
        frame: '#2222aa'
      };
    } else {
      // Default colors
      return {
        main: '#ffffff',
        emissive: '#cccccc',
        frame: '#aaaaaa'
      };
    }
  };
  
  const colors = getColors();
  
  // Animation for hover effect
  useFrame(() => {
    if (plateRef.current) {
      // Hover effect - rise slightly when hovered
      const targetY = hovered ? position[1] + 0.05 : position[1];
      plateRef.current.position.y = THREE.MathUtils.lerp(
        plateRef.current.position.y, 
        targetY, 
        0.1
      );
      
      // Pulse emissive intensity when hovered
      if (materialRef.current) {
        const time = Date.now() * 0.001;
        const baseIntensity = hovered ? 0.8 : 0.3;
        materialRef.current.emissiveIntensity = baseIntensity + (hovered ? Math.sin(time * 5) * 0.2 : 0);
      }
    }
  });
  
  const handleClick = (e: any) => {
    // Stop event propagation to prevent double clicks
    e.stopPropagation();
    
    // Prevent multiple rapid clicks
    if (isClicking) return;
    
    if (onClick) {
      setIsClicking(true);
      onClick();
      
      // Reset clicking state after a delay
      setTimeout(() => {
        setIsClicking(false);
      }, 300);
    }
  };
  
  return (
    <group 
      ref={plateRef}
      position={position}
      scale={scale}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Main plate component with frame */}
      <group>
        {/* The colored plate surface */}
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <boxGeometry args={[3, 3, 0.1]} />
          <meshStandardMaterial 
            ref={materialRef}
            color={colors.main} 
            emissive={colors.emissive}
            emissiveIntensity={0.3}
            metalness={0.5}
            roughness={0.2}
          />
        </mesh>
        
        {/* Frame around the plate */}
        <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <boxGeometry args={[3.3, 3.3, 0.1]} />
          <meshStandardMaterial 
            color={colors.frame} 
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
        
        {/* Corner indicators */}
        {[
          [-1.35, 0.02, -1.35],
          [1.35, 0.02, -1.35],
          [-1.35, 0.02, 1.35],
          [1.35, 0.02, 1.35]
        ].map((cornerPos, index) => (
          <mesh key={index} position={[cornerPos[0], cornerPos[1], cornerPos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 0.05, 16]} />
            <meshStandardMaterial 
              color={colors.frame} 
              emissive={colors.emissive}
              emissiveIntensity={0.5}
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
};

// Floor and environment
interface EnvironmentProps {
  cubeColors?: string[];
  syncComplete?: boolean;
}

const Environment: React.FC<EnvironmentProps> = ({ cubeColors, syncComplete = false }) => {
  return (
    <>
      {/* Add Sky when synchronization is complete */}
      {syncComplete && (
        <Sky 
          distance={450000} 
          sunPosition={[5, 3, 10]} 
          inclination={0.4}
          azimuth={0.25}
          rayleigh={0.8} // Increase for more blue
          turbidity={10} // Add more atmosphere
        />
      )}

      {/* Add a comically large sun when complete */}
      {syncComplete && (
        <mesh position={[80, 40, 80]} castShadow>
          <sphereGeometry args={[15, 32, 32]} />
          <meshBasicMaterial color="#ffff33" />
          <pointLight position={[0, 0, 0]} intensity={2.0} color="#ffffaa" distance={500} />
        </mesh>
      )}

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color={syncComplete ? "#33445e" : "#111122"} />
      </mesh>
      
      {/* Floor collision - invisible but solid floor with thickness */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <boxGeometry args={[50, 50, 1]} />
        <meshStandardMaterial visible={false} />
      </mesh>
      
      {/* Walls */}
      <mesh position={[0, 10, -25]} rotation={[0, 0, 0]}>
        <boxGeometry args={[50, 20, 0.5]} />
        <meshStandardMaterial color={syncComplete ? "#334466" : "#222233"} />
      </mesh>
      <mesh position={[0, 10, 25]} rotation={[0, 0, 0]}>
        <boxGeometry args={[50, 20, 0.5]} />
        <meshStandardMaterial color={syncComplete ? "#334466" : "#222233"} />
      </mesh>
      <mesh position={[-25, 10, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[50, 20, 0.5]} />
        <meshStandardMaterial color={syncComplete ? "#334466" : "#222233"} />
      </mesh>
      <mesh position={[25, 10, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[50, 20, 0.5]} />
        <meshStandardMaterial color={syncComplete ? "#334466" : "#222233"} />
      </mesh>
      
      {/* Ceiling */}
      <mesh position={[0, 20, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color={syncComplete ? "#334466" : "#111122"} />
      </mesh>
      
      {/* Add water surrounding the room when complete */}
      {syncComplete && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
          <planeGeometry args={[500, 500]} />
          <meshStandardMaterial 
            color="#0066aa" 
            metalness={0.8}
            roughness={0.2}
            transparent={true}
            opacity={0.8}
          />
        </mesh>
      )}

      {/* Add a small oasis with palm trees when complete */}
      {syncComplete && (
        <group position={[60, 0, 40]}>
          {/* Oasis sand circle */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <circleGeometry args={[20, 32]} />
            <meshStandardMaterial color="#d4b16a" />
          </mesh>
          
          {/* Oasis water */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
            <circleGeometry args={[12, 32]} />
            <meshStandardMaterial 
              color="#0088cc" 
              metalness={0.9}
              roughness={0.1}
              transparent={true}
              opacity={0.9}
            />
          </mesh>
          
          {/* Palm tree 1 */}
          <PalmTree position={[-8, 0, -5]} scale={1.5} />
          
          {/* Palm tree 2 */}
          <PalmTree position={[9, 0, 2]} scale={1.3} rotation={[0, Math.PI * 0.7, 0]} />
          
          {/* Palm tree 3 */}
          <PalmTree position={[-2, 0, 10]} scale={1.7} rotation={[0, Math.PI * 0.3, 0]} />
        </group>
      )}
      
      {/* SciFi Screen on back wall */}
      <ScifiScreen 
        position={[0, 10, -24.5]} 
        rotation={[0, 0, 0]} 
        cubeColors={cubeColors} 
        syncComplete={syncComplete}
      />
      
      {/* Lighting changes based on syncComplete */}
      {syncComplete ? (
        // Bright daylight lighting when complete
        <>
          <ambientLight intensity={1.2} color="#e0e8ff" />
          <directionalLight position={[0, 10, 10]} intensity={1.5} color="#ffffff" />
          <pointLight position={[0, 15, 0]} intensity={1.0} color="#ffffdd" />
        </>
      ) : (
        // Original darker lighting
        <>
      <ambientLight intensity={0.6} color="#d0d0e0" />
      <directionalLight position={[5, 10, 5]} intensity={0.7} />
      <directionalLight position={[-5, 10, -5]} intensity={0.5} />
      <pointLight position={[0, 15, 0]} intensity={0.7} color="#ffffff" />
      <pointLight position={[0, 5, 10]} intensity={0.6} color="#f0f0ff" />
      <pointLight position={[0, 10, -20]} intensity={0.4} color="#00aaff" distance={15} />
        </>
      )}
    </>
  );
};

// Create a simple palm tree component
interface PalmTreeProps {
  position: [number, number, number];
  scale?: number;
  rotation?: [number, number, number];
}

const PalmTree: React.FC<PalmTreeProps> = ({ 
  position, 
  scale = 1, 
  rotation = [0, 0, 0] 
}) => {
  return (
    <group position={position} scale={scale} rotation={rotation}>
      {/* Trunk */}
      <mesh position={[0, 5, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.6, 10, 8]} />
        <meshStandardMaterial color="#8B4513" roughness={0.9} />
      </mesh>
      
      {/* Palm leaves */}
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const bendAngle = Math.PI * 0.2; // Slight upward bend
        
        return (
          <group 
            key={i} 
            position={[0, 9.5, 0]} 
            rotation={[bendAngle, angle, 0]}
          >
            <mesh castShadow>
              <coneGeometry args={[0.2, 6, 4, 1]} />
              <meshStandardMaterial color="#228822" roughness={0.8} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

// SciFi Screen component for the wall
interface ScifiScreenProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  cubeColors?: string[]; // Add prop for cube colors
  syncComplete?: boolean; // Add syncComplete prop
}

const ScifiScreen: React.FC<ScifiScreenProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  cubeColors = ["red", "green", "blue", "red", "green", "blue", "red", "green", "blue"],
  syncComplete = false // Default to false
}) => {
  // Refs for animation
  const screenRef = useRef<THREE.Mesh>(null);
  const frameLightsRef = useRef<THREE.Group>(null);
  const progressBarRef = useRef<THREE.Mesh>(null);
  
  // Get the puzzle progress from the game state
  const puzzleProgress = useGameStore(state => state.audioPuzzleProgress);
  
  // Helper function to get color values based on cube color name
  const getColorValues = (colorName: string) => {
    switch (colorName) {
      case "red":
        return { color: "#ff3333", emissive: "#ff0000" };
      case "green":
        return { color: "#33ff33", emissive: "#00ff00" };
      case "blue":
        return { color: "#3333ff", emissive: "#0000ff" };
      default:
        return { color: "#ff3333", emissive: "#ff0000" };
    }
  };
  
  // Animation for the screen and frame lights
  useFrame((_, delta) => {
    if (screenRef.current) {
      // Subtle pulsing effect for the screen
      const time = Date.now() * 0.001;
      const pulseIntensity = 0.05;
      const baseBrightness = 0.4;
      const brightness = baseBrightness + Math.sin(time * 0.8) * pulseIntensity;
      
      // Update screen material emissive intensity
      const material = screenRef.current.material as THREE.MeshStandardMaterial;
      if (material) {
        material.emissiveIntensity = brightness;
      }
    }
    
    if (frameLightsRef.current) {
      // Animated lights on the frame
      frameLightsRef.current.children.forEach((light, index) => {
        const time = Date.now() * 0.001;
        const offset = index * 0.2;
        const blinkRate = 1.5; // Speed of blinking
        const intensity = ((Math.sin(time * blinkRate + offset) + 1) / 2) * 0.5;
        
        // Apply to point light
        if (light instanceof THREE.PointLight) {
          light.intensity = intensity;
        }
      });
    }
    
    // Update progress bar
    if (progressBarRef.current) {
      // Scale the progress bar based on puzzle progress
      progressBarRef.current.scale.x = 0.1 + puzzleProgress * 0.9; // Never completely empty
      
      // Change color based on progress
      const material = progressBarRef.current.material as THREE.MeshStandardMaterial;
      if (material) {
        // Gradient from red to green based on progress
        const r = 1.0 - puzzleProgress * 0.8;
        const g = 0.2 + puzzleProgress * 0.8;
        const b = 0.5;
        material.color.setRGB(r, g, b);
        material.emissive.setRGB(r * 0.5, g * 0.5, b * 0.5);
      }
    }
  });

  // Generate system status text
  const getSystemStatus = () => {
    if (syncComplete) return ""; // Return empty string when complete
    if (puzzleProgress < 0.3) return "INITIALIZING";
    if (puzzleProgress < 0.6) return "CALIBRATING";
    if (puzzleProgress < 0.9) return "SYNCHRONIZING";
    return "READY";
  };
  
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Frame */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[40, 15, 0.8]} />
        <meshStandardMaterial 
          color="#444444" 
          metalness={0.8} 
          roughness={0.2}
          emissive="#222222"
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {/* Inner Frame Border */}
      <mesh position={[0, 0, 0.2]}>
        <boxGeometry args={[38, 13, 0.4]} />
        <meshStandardMaterial 
          color="#666666" 
          metalness={0.9} 
          roughness={0.1}
          emissive="#333333"
          emissiveIntensity={0.3}
        />
      </mesh>
      
      {/* Screen Surface */}
      <mesh ref={screenRef} position={[0, 0, 0.5]}>
        <planeGeometry args={[36, 11]} />
        <meshStandardMaterial 
          color="#001122" 
          metalness={0.2} 
          roughness={0.3}
          emissive="#0066aa"
          emissiveIntensity={0.4}
        />
      </mesh>
      
      {/* Screen Content - Grid Pattern */}
      <mesh position={[0, 0, 0.51]}>
        <planeGeometry args={[35.5, 10.5]} />
        <meshBasicMaterial 
          map={createGridTexture()}
          transparent={true}
          opacity={0.7}
        />
      </mesh>

      {/* Status Text */}
      <Text
        position={[0, 4, 0.6]}
        fontSize={1.2}
        color="#00ffff"
        anchorX="center"
        anchorY="middle"
      >
        {syncComplete ? "Finished Embodiment Research Project 0" : "HARMONIC EIGENSPACE FILTER"}
      </Text>
      
      {/* Dynamic Status Text - hide when complete */}
      {!syncComplete && (
      <Text
        position={[0, 2, 0.6]}
        fontSize={0.9}
        color="#ffcc00"
        anchorX="center"
        anchorY="middle"
      >
        {getSystemStatus()} - {Math.floor(puzzleProgress * 100)}%
      </Text>
      )}
      
      {/* Audio Waveform Visualization - only show when not complete */}
      {!syncComplete && (
      <group position={[0.35, 0, 0.6]}>
        {/* Generate 40 vertical bars for audio visualization */}
        {Array.from({ length: 40 }).map((_, index) => {
          // Calculate position
          const x = (index - 20) * 0.8;
          
          // Calculate dynamic height based on time and position
          const time = Date.now() * 0.001;
          const frequency = 0.5 + index * 0.1; // Different frequency for each bar
          const baseHeight = Math.sin(time * frequency + index * 0.2) * 0.5 + 0.5;
          
          // Scale height based on puzzle progress
          const finalHeight = 0.2 + baseHeight * 3 * (0.3 + puzzleProgress * 0.7);
          
          // Color variations
          const hue = (index / 40) * 0.2 + 0.5; // Blue to cyan range (0.5-0.7)
          
          return (
            <mesh key={index} position={[x, 0, 0]}>
              <boxGeometry args={[0.4, finalHeight, 0.1]} />
              <meshBasicMaterial color={`hsl(${hue * 360}, 80%, 60%)`} />
            </mesh>
          );
        })}
      </group>
      )}
      
      {/* Progress Bar Container - only when not complete */}
      {!syncComplete && (
      <mesh position={[0, -2.5, 0.75]}>
        <boxGeometry args={[30, 1, 0.2]} />
        <meshStandardMaterial 
          color="#333333" 
          metalness={0.6} 
          roughness={0.4}
        />
      </mesh>
      )}
      
      {/* Progress Bar Fill - only when not complete */}
      {!syncComplete && (
      <mesh 
        ref={progressBarRef}
        position={[-15 + 15 * puzzleProgress, -2.5, 0.85]} 
        scale={[puzzleProgress, 1, 1]}
      >
        <boxGeometry args={[30, 0.8, 0.1]} />
        <meshStandardMaterial 
          color={new THREE.Color(1 - puzzleProgress * 0.8, 0.2 + puzzleProgress * 0.8, 0.5)}
          emissive={new THREE.Color((1 - puzzleProgress * 0.8) * 0.5, (0.2 + puzzleProgress * 0.8) * 0.5, 0.25)}
          emissiveIntensity={0.6}
        />
      </mesh>
      )}
      
      {/* Connection Status Indicators */}
      <group position={[-10.5, -4, 0.6]}>
        {/* Status indicators with labels */}
        {[
          { label: syncComplete ? "RETURN" : "MAIN SIGNAL", active: puzzleProgress > 0.2 || syncComplete },
          { label: syncComplete ? "TO" : "CARRIER WAVE", active: puzzleProgress > 0.4 || syncComplete },
          { label: syncComplete ? "MANAGEMENT" : "DATA STREAM", active: puzzleProgress > 0.6 || syncComplete },
          { label: syncComplete ? "AREA" : "ENCRYPTION", active: puzzleProgress > 0.8 || syncComplete }
        ].map((item, index) => (
          <group key={index} position={[index * 7, 0, 0]}>
            {/* Status light */}
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.3, 16, 16]} />
              <meshStandardMaterial 
                color={item.active ? "#00ff00" : "#ff0000"}
                emissive={item.active ? "#00ff00" : "#ff0000"}
                emissiveIntensity={0.8}
              />
            </mesh>
            
            {/* Label */}
            <Text
              position={[0, -0.5, 0]}
              fontSize={0.4}
              color={syncComplete ? "#ffffff" : "#bbbbbb"}
              anchorX="center"
              anchorY="top"
            >
              {item.label}
            </Text>
          </group>
        ))}
      </group>
      
      {/* Control Panel Below Screen */}
      <mesh position={[0, -7.5, 0.3]}>
        <boxGeometry args={[20, 2, 0.6]} />
        <meshStandardMaterial 
          color="#333333" 
          metalness={0.7} 
          roughness={0.3}
        />
      </mesh>
      
      {/* Control Panel Buttons */}
      <group position={[0, -7.5, 0.7]}>
        {/* Create multiple small control buttons */}
        {[-8, -6, -4, -2, 0, 2, 4, 6, 8].map((x, index) => {
          const colorValues = getColorValues(cubeColors[index]);
          return (
            <mesh key={index} position={[x, 0, 0]}>
              <boxGeometry args={[0.8, 0.8, 0.2]} />
              <meshStandardMaterial 
                color={colorValues.color}
                emissive={colorValues.emissive}
                emissiveIntensity={0.5}
              />
            </mesh>
          );
        })}
      </group>
      
      {/* Frame Indicator Lights */}
      <group ref={frameLightsRef}>
        {/* Top lights */}
        {[-18, -12, -6, 0, 6, 12, 18].map((x, index) => (
          <pointLight 
            key={`top-${index}`} 
            position={[x, 7, 0.6]} 
            intensity={0.3} 
            distance={2} 
            color={index % 2 === 0 ? "#66aaff" : "#33ccff"} 
          />
        ))}
        
        {/* Bottom lights */}
        {[-18, -12, -6, 0, 6, 12, 18].map((x, index) => (
          <pointLight 
            key={`bottom-${index}`} 
            position={[x, -6, 0.6]} 
            intensity={0.3} 
            distance={2} 
            color={index % 2 === 0 ? "#33ccff" : "#66aaff"} 
          />
        ))}
      </group>
    </group>
  );
};

// Helper function to create a grid texture for the screen
function createGridTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  
  if (!context) return new THREE.Texture();
  
  // Fill background
  context.fillStyle = 'rgba(0, 18, 20, 0.97)';
  context.fillRect(0, 0, size, size);
  
  // Draw grid lines
  context.strokeStyle = 'rgba(0, 180, 255, 0.5)';
  context.lineWidth = 1;
  
  // Horizontal lines
  const gridSize = 32;
  for (let i = 0; i <= size; i += gridSize) {
    context.beginPath();
    context.moveTo(0, i);
    context.lineTo(size, i);
    context.stroke();
  }
  
  // Vertical lines
  for (let i = 0; i <= size; i += gridSize) {
    context.beginPath();
    context.moveTo(i, 0);
    context.lineTo(i, size);
    context.stroke();
  }
  /* COMMENTING OUT FOR NOW - TOO MUCH VISUAL CLUTTER
  // Add some data-like elements
  context.fillStyle = 'rgba(0, 200, 255, 0.7)';
  for (let i = 0; i < 10; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const width = Math.random() * 100 + 50;
    const height = Math.random() * 20 + 10;
    
    context.fillRect(x, y, width, height);
  }
  
  // Add some blinking dots
  context.fillStyle = 'rgba(0, 255, 200, 0.8)';
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = Math.random() * 3 + 1;
    
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }
  */
  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// NEW: Define handle types for SceneContent ref
interface SceneContentHandle {
  handleMobileInputInternal: (data: { x: number; y: number }) => void;
  handleMobileLookInternal: (data: { x: number; y: number }) => void;
}

// Main scene content
interface SceneContentProps {
  invertLook?: boolean;
  puzzleProgress: number;
  onPuzzleComplete: () => void;
  // Remove onMobileInput and onMobileLook props
  onCubeColorsChange: (cubeColors: string[]) => void;
  syncComplete: boolean; // Add this new prop
}

// Wrap SceneContent with forwardRef
const SceneContent = forwardRef<SceneContentHandle, SceneContentProps>(({
  invertLook = false,
  puzzleProgress,
  onPuzzleComplete,
  onCubeColorsChange,
  syncComplete
}, ref) => {
  const playerRef = useRef<PlayerHandle>(null);
  const [cubeColors, setCubeColors] = useState<string[]>(["red", "green", "blue", "red", "green", "blue", "red", "green", "blue"]);
  const [activePlates, setActivePlates] = useState<string[]>([]);
  const [allCubesGreen, setAllCubesGreen] = useState(false);
  const [roofEasterEggTriggered, setRoofEasterEggTriggered] = useState(false);

  // Mobile controls handlers - These will be called by the parent via the ref
  // Handle Mobile Input Internal
  const handleMobileInputInternal = (data: { x: number; y: number }) => {
    if (playerRef.current) {
      playerRef.current.handleMobileMove(data);
    }
  };

  // Handle Mobile Look Internal
  const handleMobileLookInternal = (data: { x: number; y: number }) => {
    if (playerRef.current) {
      playerRef.current.handleMobileLook(data);
    }
  };

  // Expose methods for parent component
  useImperativeHandle(ref, () => ({
    handleMobileInputInternal,
    handleMobileLookInternal
  }));

  // Helper to cycle through colors
  const cycleColor = (color: string): string => {
    switch (color) {
      case "red": return "green";
      case "green": return "blue";
      case "blue": return "red";
      default: return "red";
    }
  };

  // Handle red plate click
  const handleRedPlateClick = () => {
    // Create a new copy of the colors array
    const newColors = [...cubeColors];
    
    // Change colors for red controls (0, 3, 6)
      newColors[0] = cycleColor(newColors[0]);
      newColors[3] = cycleColor(newColors[3]);
      newColors[6] = cycleColor(newColors[6]);
    
    // Update colors array
    setCubeColors(newColors);
      onCubeColorsChange(newColors);
    
    // Update active plates for visual feedback
    setActivePlates(prev => {
      const isActive = prev.includes('red');
      if (isActive) {
        return prev.filter(p => p !== 'red');
      } else {
        return [...prev, 'red'];
      }
    });
    
    // Clear active plates after a short delay
    setTimeout(() => {
      setActivePlates(prev => prev.filter(p => p !== 'red'));
    }, 300);
  };

  // Handle green plate click
  const handleGreenPlateClick = () => {
    // Create a new copy of the colors array
    const newColors = [...cubeColors];
    
    // Change colors for green controls (1, 4, 7)
      newColors[1] = cycleColor(newColors[1]);
      newColors[4] = cycleColor(newColors[4]);
      newColors[7] = cycleColor(newColors[7]);
    
    // Update colors array
    setCubeColors(newColors);
      onCubeColorsChange(newColors);
    
    // Update active plates for visual feedback
    setActivePlates(prev => {
      const isActive = prev.includes('green');
      if (isActive) {
        return prev.filter(p => p !== 'green');
      } else {
        return [...prev, 'green'];
      }
    });
    
    // Clear active plates after a short delay
    setTimeout(() => {
      setActivePlates(prev => prev.filter(p => p !== 'green'));
    }, 300);
  };

  // Handle blue plate click
  const handleBluePlateClick = () => {
    // Create a new copy of the colors array
    const newColors = [...cubeColors];
    
    // Change colors for blue controls (2, 5, 8)
      newColors[2] = cycleColor(newColors[2]);
      newColors[5] = cycleColor(newColors[5]);
      newColors[8] = cycleColor(newColors[8]);
    
    // Update colors array
    setCubeColors(newColors);
      onCubeColorsChange(newColors);
    
    // Update active plates for visual feedback
    setActivePlates(prev => {
      const isActive = prev.includes('blue');
      if (isActive) {
        return prev.filter(p => p !== 'blue');
      } else {
        return [...prev, 'blue'];
      }
    });
    
    // Clear active plates after a short delay
    setTimeout(() => {
      setActivePlates(prev => prev.filter(p => p !== 'blue'));
    }, 300);
  };

  // Handle cube colors change
  const handleCubeColorsChange = (cubeColors: string[]) => {
    // Quick validation
    if (!cubeColors || cubeColors.length !== 9) return;

    // Check if all cubes are green
    const areAllGreen = cubeColors.every(color => color === "green");
    
    // Set state and show dialogue when all cubes turn green
    if (areAllGreen) {
      // Only show dialogue if it's a new change
      if (!allCubesGreen) {
        setAllCubesGreen(true);
        showWaveFilterSuccessDialogue();
      }
    } else {
      // Update state if cubes are no longer all green
      if (allCubesGreen) {
        setAllCubesGreen(false);
      }
    }
  };
  
  // Check player position for the roof easter egg
  useFrame(() => {
    if (syncComplete && playerRef.current && !roofEasterEggTriggered) {
      const playerPosition = playerRef.current.getPosition();
      
      // If player is above the roof (y > 21)
      if (playerPosition.y > 21) {
        setRoofEasterEggTriggered(true);
        
        // Show dialogue popup
        const { showDialogue, incrementEmbodimentInsight } = useGameStore.getState();
        showDialogue(
          "Interesting...",
          "Derech/avatars/mission-control.jpg",
          "System"
        );
        
        // Award an additional insight point
        incrementEmbodimentInsight();
      }
    }
  });

  return (
    <>
      {/* Environment - pass syncComplete prop */}
      <Environment cubeColors={cubeColors} syncComplete={syncComplete} />

      {/* Player */}
      {/* Pass playerRef (which holds PlayerHandle) to Player via handleRef */}
      <Player handleRef={playerRef} position={[0, 1.5, 10]} invertLook={invertLook} />

      {/* Add SyncAudio component with proper props */}
      <SyncAudio isPlaying={allCubesGreen} progress={puzzleProgress} />
      
      {/* Audio Visualizer - only show when not complete */}
      {!syncComplete && (
      <group position={[-24.7, 4, 0]} rotation={[0, Math.PI/2, 0]}>
        <AudioVisualizer
          position={[0, 0, 0]}
          rotation={[0, 0, 0]}
          scale={0.9}
          progress={puzzleProgress}
        />
        {/* Add a subtle light to highlight the visualizer */}
        <pointLight position={[0, 0, 1]} intensity={0.3} color="#0088ff" distance={4} />

        {/* Interactive cubes alongside the wave visualization */}
        <group position={[0, 0, 0]}>
          {/* Red Cube - copied from ScifiScreen */}
          <mesh position={[-5, 0.8, 0.5]} castShadow>
            <boxGeometry args={[1.2, 1.2, 0.4]} />
            <meshStandardMaterial
              color="#ff3333"
              emissive="#ff0000"
              emissiveIntensity={0.5 + (activePlates.includes('red') ? 0.5 : 0)}
              metalness={0.6}
              roughness={0.2}
            />
          </mesh>

          {/* Blue Cube - copied from ScifiScreen */}
          <mesh position={[5, -0.8, 0.5]} castShadow>
            <boxGeometry args={[1.2, 1.2, 0.4]} />
            <meshStandardMaterial
              color="#3333ff"
              emissive="#0000ff"
              emissiveIntensity={0.5 + (activePlates.includes('blue') ? 0.5 : 0)}
              metalness={0.6}
              roughness={0.2}
            />
          </mesh>
        </group>
      </group>
      )}

      {/* Clickable Floor Plates */}
      {/* ... existing floor plates ... */}
      <FloorPlate
        position={[-5, 0.05, -15]}
        color="red"
        onClick={handleRedPlateClick}
      />
      <FloorPlate
        position={[0, 0.05, -15]}
        color="green"
        onClick={handleGreenPlateClick}
      />
      <FloorPlate
        position={[5, 0.05, -15]}
        color="blue"
        onClick={handleBluePlateClick}
      />


      {/* Cables connecting plates to the wall */}
      {/* ... existing cables ... */}
       <group>
        {/* Red plate cable */}
        <mesh position={[-5, 0.1, -15]} rotation={[0, Math.PI/4, 0]}>
          <tubeGeometry args={[
            new THREE.CatmullRomCurve3([
              new THREE.Vector3(4, -0.5, 0),
              new THREE.Vector3(-1, -0.1, -2),
              new THREE.Vector3(0, 0, -5),
              new THREE.Vector3(0, 0.2, -15)
            ]),
            64,
            0.1,
            8,
            false
          ]} />
          <meshStandardMaterial color="#880000" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Green plate cable */}
        <mesh position={[0, -0.5, -15]} rotation={[0, 0, 0]}>
          <tubeGeometry args={[
            new THREE.CatmullRomCurve3([
              new THREE.Vector3(0, 0, 0),
              new THREE.Vector3(0, 0.7, -3),
              new THREE.Vector3(0, 1.2, -7),
              new THREE.Vector3(0, 0.5, -11)
            ]),
            64,
            0.1,
            8,
            false
          ]} />
          <meshStandardMaterial color="#008800" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Blue plate cable */}
        <mesh position={[5, -0.5, -15]} rotation={[0, -Math.PI/4, 0]}>
          <tubeGeometry args={[
            new THREE.CatmullRomCurve3([
              new THREE.Vector3(0, 0, 0),
              new THREE.Vector3(1, 0.5, -2),
              new THREE.Vector3(0, 1, -5),
              new THREE.Vector3(0, 0.8, -18)
            ]),
            64,
            0.1,
            8,
            false
          ]} />
          <meshStandardMaterial color="#000088" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* Add point lights above each plate */}
      {/* ... existing plate lights ... */}
       <pointLight
        position={[-5, 1, -15]}
        intensity={0.3 + (activePlates.includes('red') ? 0.7 : 0)}
        color="#ff0000"
        distance={5}
      />
      <pointLight
        position={[0, 1, -15]}
        intensity={0.3 + (activePlates.includes('green') ? 0.7 : 0)}
        color="#00ff00"
        distance={5}
      />
      <pointLight
        position={[5, 1, -15]}
        intensity={0.3 + (activePlates.includes('blue') ? 0.7 : 0)}
        color="#0000ff"
        distance={5}
      />

      {/* Portals */}
      {/* ... existing portals ... */}
        <Portal
        position={[-10, 3, 24.5]}
        rotation={[0, Math.PI, 0]}
        label="Portal Room"
        color="#7E57C2"
        targetView="welcome"
        isSceneComplete={syncComplete} // Pass completion state
      />

      {/* Portal to Management Area */}
      <Portal
        position={[10, 3, 24.5]}
        rotation={[0, Math.PI, 0]}
        label="Colony Management"
        color="#4CAF50"
        targetView="management"
        isSceneComplete={syncComplete} // Pass completion state
      />

      {/* Progress info */}
      {/* ... existing progress info HTML ... */}
       <group position={[-24.7, 10, 0]} rotation={[0, Math.PI/2, 0]}>
        <Html transform distanceFactor={15} position={[0, 0, 0]}>
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center',
            boxShadow: '0 0 10px rgba(0, 150, 255, 0.5)',
            border: '1px solid rgba(0, 150, 255, 0.3)',
            width: '250px'
          }}>
            <div style={{ fontSize: '18px', marginBottom: '10px', fontWeight: 'bold' }}>
              Audio Synchronization: {Math.floor(puzzleProgress * 100)}%
            </div>
            {puzzleProgress >= 1 && (
              <button
                onClick={syncComplete ? undefined : onPuzzleComplete}
                style={{
                  marginTop: '10px',
                  padding: '8px 15px',
                  backgroundColor: syncComplete ? '#666666' : '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: syncComplete ? 'default' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  boxShadow: syncComplete ? 'none' : '0 0 8px rgba(0, 255, 0, 0.5)',
                  opacity: syncComplete ? 0.7 : 1
                }}
                disabled={syncComplete}
              >
                {syncComplete ? 'Complete!' : 'Complete Synchronization'}
              </button>
            )}
          </div>
        </Html>
        {/* Add a subtle light to highlight the panel */}
        <pointLight position={[0, 0, 1]} intensity={0.4} color="#00aaff" distance={5} />
      </group>
    </>
  );
});

// Add display name for debugging
SceneContent.displayName = 'SceneContent';

// Add SyncAudio component near the top with other component definitions
interface SyncAudioProps {
  isPlaying: boolean;
  progress: number;
}

// Create an audio context to track if user has interacted
const AudioContext = createContext<boolean>(false);

function SyncAudio({ isPlaying, progress }: SyncAudioProps) {
  const { camera } = useThree();
  const audioRef = useRef<THREE.PositionalAudio | null>(null);
  const listenerRef = useRef<THREE.AudioListener | null>(null);
  const hasInteracted = useContext(AudioContext);
  
  // Set up audio on mount
  useEffect(() => {
    // Only set up audio once user has interacted
    if (!hasInteracted) return;
    
    // Create an audio listener and add it to the camera
    if (!listenerRef.current) {
      listenerRef.current = new THREE.AudioListener();
      camera.add(listenerRef.current);
    }
    
    // Create a positional audio source
    const sound = new THREE.PositionalAudio(listenerRef.current);
    
    // Load sound
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load('/sounds/pigon.mp3', (buffer) => {
      sound.setBuffer(buffer);
      sound.setRefDistance(20); // Adjust as needed
      sound.setLoop(true);
      audioRef.current = sound;
      
      // If already playing when loaded, start playback
      if (isPlaying && !sound.isPlaying) {
        sound.play();
      }
    });
    
    // Clean up on unmount
    return () => {
      if (audioRef.current) {
        if (audioRef.current.isPlaying) {
          audioRef.current.stop();
        }
        if (audioRef.current.source) {
          audioRef.current.disconnect();
        }
      }
      if (listenerRef.current && camera) {
        camera.remove(listenerRef.current);
      }
    };
  }, [camera, isPlaying, hasInteracted]);
  
  // Handle playback based on isPlaying prop
  useEffect(() => {
    // Only manage playback after user interaction
    if (!hasInteracted || !audioRef.current || !audioRef.current.buffer) return;
    
    if (isPlaying && !audioRef.current.isPlaying) {
      audioRef.current.play();
    } else if (!isPlaying && audioRef.current.isPlaying) {
      audioRef.current.stop();
    }
  }, [isPlaying, hasInteracted]);
  
  // Handle volume fade based on progress
  useEffect(() => {
    if (!hasInteracted || !audioRef.current) return;
    
    // Adjust volume based on progress (fade out as progress approaches 1)
    const volume = 1 - progress;
    audioRef.current.setVolume(Math.max(0, volume));
    
    // Optional: stop sound completely at 100%
    if (progress >= 1 && audioRef.current.isPlaying) {
      audioRef.current.stop();
    }
  }, [progress, hasInteracted]);
  
  // This component doesn't render anything visible
  return null;
}

// Main AudioPuzzleScene component
const AudioPuzzleScene: React.FC = () => {
  // ... existing state variables ...
  const [isLoading, setIsLoading] = useState(true);
  const [invertLook, setInvertLook] = useState(false);
  const [puzzleProgress, setPuzzleProgress] = useState(0);
  const [allCubesGreen, setAllCubesGreen] = useState(false);
  const [insightGained, setInsightGained] = useState(false);
  const [dialogueTriggered, setDialogueTriggered] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [syncComplete, setSyncComplete] = useState(false);
  const [roofEasterEggTriggered, setRoofEasterEggTriggered] = useState(false);

  // Get game state functions
  // ... existing store functions ...
  const setGameView = useGameStore(state => state.setGameView);
  const showDialogue = useGameStore(state => state.showDialogue);
  const updateAudioPuzzleProgress = useGameStore(state => state.updateAudioPuzzleProgress);
  const incrementEmbodimentInsight = useGameStore(state => state.incrementEmbodimentInsight);
  const hideDialogue = useGameStore(state => state.hideDialogue);
  const markAudioPuzzleCompleted = useGameStore(state => state.markAudioPuzzleCompleted); // NEW: Get markAudioPuzzleCompleted function
  const isAudioPuzzleCompleted = useGameStore(state => state.isAudioPuzzleCompleted); // NEW: Get isAudioPuzzleCompleted state

  // Reference for SceneContent component to call its methods
  const sceneContentRef = useRef<SceneContentHandle>(null); // Changed from playerRef

  // Mobile controls handlers - Now call methods on sceneContentRef
  const handleMobileInput = (data: { x: number; y: number }) => {
    sceneContentRef.current?.handleMobileInputInternal(data); // Call SceneContent's method
  };

  const handleMobileLook = (data: { x: number; y: number }) => {
    sceneContentRef.current?.handleMobileLookInternal(data); // Call SceneContent's method
  };

  // Add cube colors change handler
   const handleCubeColorsChange = (cubeColors: string[]) => {
    // Quick validation
    if (!cubeColors || cubeColors.length !== 9) return;

    // Check if all cubes are green
    const areAllGreen = cubeColors.every(color => color === "green");

    // Set state and show dialogue when all cubes turn green
    if (areAllGreen) {
      // Only show dialogue if it's a new change
      if (!allCubesGreen) {
      setAllCubesGreen(true);
        showWaveFilterSuccessDialogue();
      }
    } else {
      // Update state if cubes are no longer all green
      if (allCubesGreen) {
      setAllCubesGreen(false);
      }
    }
  };

  // Handle user interaction for audio permission
  useEffect(() => {
    const handleInteraction = () => {
      setHasInteracted(true);
      // Remove listeners after first interaction
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
    
    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  // Handle scene loading
   useEffect(() => {
    // Simulate loading assets
    const timer = setTimeout(() => {
      setIsLoading(false);
      // Show introduction dialogue using new manager
      showIntroductionDialogue();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Toggle invert look setting
  const toggleInvertLook = () => {
    setInvertLook(prev => !prev);
  };

  // Handle puzzle progression
   useEffect(() => {
    if (!isLoading && puzzleProgress < 1 && allCubesGreen) {
      // Only progress if all cubes are green
      const interval = setInterval(() => {
        setPuzzleProgress(prev => {
          // Base progress rate
          const baseRate = 0.004;
          // Calculate new value
          const newValue = prev + baseRate;
          const clampedValue = newValue > 1 ? 1 : newValue;

          // Update the store with the new progress
          updateAudioPuzzleProgress(clampedValue);
          return clampedValue;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isLoading, puzzleProgress, updateAudioPuzzleProgress, allCubesGreen]);

  // Dialogue sequence at 30% progress
  // ... existing dialogue useEffect ...
   useEffect(() => {
    if (puzzleProgress >= 0.3 && puzzleProgress < 0.31 && !dialogueTriggered) {
      setDialogueTriggered(true);

      // Use the new dialogue sequence manager
      playMainDialogueSequence(() => {
        // Optional callback when sequence completes
        setInsightGained(true);
      });
    }
  }, [puzzleProgress, dialogueTriggered]);

  // Update store whenever puzzleProgress changes
  // ... existing update store useEffect ...
   useEffect(() => {
    updateAudioPuzzleProgress(puzzleProgress);
  }, [puzzleProgress, updateAudioPuzzleProgress]);

  // Check if scene is already completed on mount
  useEffect(() => {
    if (isAudioPuzzleCompleted) {
      // If already completed, show the scene in finished state
      setSyncComplete(true);
      setPuzzleProgress(1);
    }
  }, [isAudioPuzzleCompleted]);

  // Handle puzzle completion
   const handlePuzzleComplete = () => {
    // Update state first
    setPuzzleProgress(1);
    setSyncComplete(true);
    
    // Show completion dialogue using the new dialogue system
    const { showDialogue } = useGameStore.getState();
    const successDialogue = getAudioPuzzleDialogue('waveFilterSuccess');
    showDialogue(
      `${successDialogue.message} Synchronization complete!`,
      successDialogue.avatar,
      successDialogue.speakerName
    );
    
    // Increment insight points
      incrementEmbodimentInsight();
    
    // Mark audio puzzle as completed in the store
    markAudioPuzzleCompleted();
  };

  return (
    <AudioContext.Provider value={hasInteracted}>
    <div className={styles.sceneContainer}>
      {/* Loading overlay */}
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}></div>
          <p>Initializing Audio Systems...</p>
        </div>
      )}

      {/* Settings panel */}
      {/* ... existing settings panel ... */}
       <div className={styles.settingsPanel}>
        <div className={styles.settingsTitle}>
          Controls
        </div>
        <div className={styles.settingsOption}>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={invertLook}
              onChange={toggleInvertLook}
            />
            <span className={styles.slider}></span>
          </label>
          Invert Look
        </div>
      </div>

      {/* Main canvas */}
      <div className={styles.canvasContainer}>
        <Canvas shadows camera={{ fov: 75, near: 0.1, far: 1000 }}>
          {/* Pass sceneContentRef to SceneContent */}
          <SceneContent
            ref={sceneContentRef} // Pass the ref here
            invertLook={invertLook}
            puzzleProgress={puzzleProgress}
            onPuzzleComplete={handlePuzzleComplete}
            // Remove onMobileInput/onMobileLook props
            onCubeColorsChange={handleCubeColorsChange}
              syncComplete={syncComplete} // Pass syncComplete prop
          />
        </Canvas>
      </div>

      {/* Mobile controls */}
      <MobileControls
        onMove={handleMobileInput}
        onLook={handleMobileLook}
        invertLook={invertLook}
        debug={false} // Set to true to debug mobile controls if needed
      />
    </div>
    </AudioContext.Provider>
  );
};

export default AudioPuzzleScene; 