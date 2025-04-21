import React, { useState, useEffect, useRef } from 'react';
import { Text, Billboard } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@store/store';
import styles from '@styles/AudioPuzzleScene.module.css';
import InteractiveSceneLayout from '../layouts/InteractiveSceneLayout';
import InfoDisplay from '../components/ui/InfoDisplay';

// Helper function to create a marble-like material
const createMarbleMaterial = (color: string = '#f5f5f5', roughness: number = 0.3) => {
  return new THREE.MeshStandardMaterial({
    color: color,
    roughness: roughness,
    metalness: 0.1
  });
};

// Helper function to create an alabaster-like glowing material
const createAlabasterGlow = (color: string = '#f8f4e6', emissiveIntensity: number = 0.2) => {
  return new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.2,
    metalness: 0.0,
    transparent: true,
    opacity: 0.8,
    emissive: color,
    emissiveIntensity: emissiveIntensity
  });
};

// Utility function to darken a color
const darkenColor = (hexColor: string, amount: number = 0.2): string => {
  // Parse the hex color
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Darken each component
  const darkenedR = Math.max(0, Math.floor(r * (1 - amount)));
  const darkenedG = Math.max(0, Math.floor(g * (1 - amount)));
  const darkenedB = Math.max(0, Math.floor(b * (1 - amount)));
  
  // Convert back to hex
  return `#${darkenedR.toString(16).padStart(2, '0')}${darkenedG.toString(16).padStart(2, '0')}${darkenedB.toString(16).padStart(2, '0')}`;
};

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
      <Billboard
        position={[0, 1.5, 0]}
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
      >
        <Text
          fontSize={0.5}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
        >
          {text}
        </Text>
      </Billboard>
    </group>
  );
};

// Greek Column Component for the temple
interface GreekColumnProps {
  position: [number, number, number];
  height?: number;
  radius?: number;
}

const GreekColumn: React.FC<GreekColumnProps> = ({ position, height = 8, radius = 0.5 }) => {
  const columnMaterial = createMarbleMaterial('#ede5d8', 0.2);  // Light beige for columns
  const baseMaterial = createMarbleMaterial('#8c7055', 0.4);    // Brownish sockets for columns
  const capitalMaterial = createMarbleMaterial('#d5cdbe', 0.3); // Slightly darker top for contrast
  
  return (
    <group position={position}>
      {/* Column base */}
      <mesh position={[0, 0.3, 0]} material={baseMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[radius * 1.3, radius * 1.3, 0.6, 8]} />
      </mesh>
      
      {/* Column shaft with slight taper - extended to floor */}
      <mesh position={[0, height/2, 0]} material={columnMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[radius * 0.85, radius, height, 8, 1, false]} />
      </mesh>
      
      {/* Column capital */}
      <mesh position={[0, height - 0.2, 0]} material={capitalMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[radius * 1.2, radius * 0.85, 0.4, 8]} />
      </mesh>
      <mesh position={[0, height, 0]} material={capitalMaterial} castShadow receiveShadow>
        <boxGeometry args={[radius * 2.4, 0.4, radius * 2.4]} />
      </mesh>
    </group>
  );
};

// Frieze Component
interface FriezeProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
}

const GreekFrieze: React.FC<FriezeProps> = ({ 
  position, 
  rotation = [0, 0, 0], 
  width = 4 
}) => {
  const friezeMaterial = createMarbleMaterial('#e0e0e0', 0.25);
  const detailMaterial = createMarbleMaterial('#8b9c81', 0.3);  // Subtle desaturated green for frieze details
  
  // Pattern of repeated geometric elements
  return (
    <group position={position} rotation={new THREE.Euler(...rotation)}>
      {/* Base panel */}
      <mesh material={friezeMaterial} castShadow receiveShadow>
        <boxGeometry args={[width, 0.8, 0.1]} />
      </mesh>
      
      {/* Decorative pattern - simplified meander/Greek key pattern */}
      {Array.from({ length: Math.floor(width) * 2 }).map((_, i) => (
        <mesh 
          key={`frieze-detail-${i}`} 
          position={[-width/2 + 0.25 + i * 0.5, 0, 0.06]} 
          material={detailMaterial}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.1, 0.6, 0.05]} />
        </mesh>
      ))}
    </group>
  );
};

// Decorative Urn Component
interface UrnProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  color?: string;
}

const GreekUrn: React.FC<UrnProps> = ({ 
  position, 
  rotation = [0, 0, 0], 
  scale = 1,
  color = '#e0e0e0'
}) => {
  const urnMaterial = createMarbleMaterial(color, 0.2);
  const detailMaterial = createMarbleMaterial(darkenColor(color, 0.15), 0.3);
  
  return (
    <group position={position} rotation={new THREE.Euler(...rotation)} scale={[scale, scale, scale]}>
      {/* Base */}
      <mesh material={detailMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.4, 0.2, 16]} />
      </mesh>
      
      {/* Body */}
      <mesh position={[0, 0.6, 0]} material={urnMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.3, 1.0, 16, 1, false]} />
      </mesh>
      
      {/* Neck */}
      <mesh position={[0, 1.25, 0]} material={urnMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.25, 0.5, 0.5, 16, 1, false]} />
      </mesh>
      
      {/* Rim */}
      <mesh position={[0, 1.55, 0]} material={detailMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.25, 0.1, 16]} />
      </mesh>
      
      {/* Handles (simplified) */}
      <mesh position={[0.38, 1, 0]} rotation={[0, 3.14, Math.PI/2]} material={detailMaterial} castShadow receiveShadow>
        <torusGeometry args={[0.2, 0.05, 8, 12, Math.PI]} />
      </mesh>
      <mesh position={[-0.38, 1, 0]} rotation={[0, 0, Math.PI/2]} material={detailMaterial} castShadow receiveShadow>
        <torusGeometry args={[0.2, 0.05, 8, 12, Math.PI]} />
      </mesh>
    </group>
  );
};

// The temple structure for the audio puzzle room
const TempleRoom: React.FC = () => {
  const floorMaterial = createMarbleMaterial('#d5d0c9', 0.1); // Cooler floor for night scene
  const wallMaterial = createMarbleMaterial('#c9c5bd', 0.2);  // Cooler wall for night scene
  const alabasterMaterial = createAlabasterGlow('#e9e5dd', 0.25); // Brighter alabaster for night
  
  // Urn color variations - cooler tones for night scene
  const urnColors = [
    '#b5a89e', // Cool beige
    '#9c8f85', // Medium taupe
    '#a59c94', // Cool grey-beige
    '#ada69d', // Light taupe
    '#c1bbb1'  // Light greige
  ];
  
  // Dimensions for a much more spacious room
  const roomSize = 40; // Dramatically increased for maximum space
  const wallHeight = 15; // Much taller walls for grandeur
  const cornerWallSize =5; // Larger corner walls
  const alabasterPanelHeight = 7; // Taller panels
  const alabasterPanelInset = 0.6;
  const friezeHeight = 8; // Higher friezes
  
  // Values for subtle animation of alabaster glow
  const time = useRef(0);
  useFrame((_, delta) => {
    time.current += delta * 0.3; // Slow time increment for subtle pulsing
  });
  
  // Create alabaster panel with animated glow
  const AlabasterPanel = ({ position, rotation, width, height = alabasterPanelHeight }: {
    position: [number, number, number],
    rotation: [number, number, number],
    width: number,
    height?: number
  }) => {
    const panelRef = useRef<THREE.Mesh>(null);
    
    // Animate subtle glow pulsing - more intense for night scene
    useFrame(() => {
      if (panelRef.current && panelRef.current.material instanceof THREE.MeshStandardMaterial) {
        // Subtle pulsing effect, stronger for night scene
        const pulseFactor = Math.sin(time.current) * 0.08 + 0.25; // Pulse between 0.17 and 0.33
        panelRef.current.material.emissiveIntensity = pulseFactor;
      }
    });
    
    return (
      <mesh 
        ref={panelRef}
        position={position} 
        rotation={new THREE.Euler(...rotation)} 
        castShadow={false} 
        receiveShadow={false}
      >
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial 
          color='#f8f4e6'
          roughness={0.2}
          metalness={0.0}
          transparent={true}
          opacity={0.8}
          emissive='#f8f4e6'
          emissiveIntensity={0.25}
          side={THREE.DoubleSide}
        />
      </mesh>
    );
  };

  return (
    <group>
      {/* Main floor */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={floorMaterial}>
        <planeGeometry args={[roomSize, roomSize]} />
      </mesh>
      
      {/* Corner Walls */}
      {/* Northeast Corner */}
      <mesh 
        position={[roomSize/2 - cornerWallSize/2, wallHeight/2, -roomSize/2 + cornerWallSize/2]} 
        material={wallMaterial} 
        castShadow 
        receiveShadow
      >
        <boxGeometry args={[cornerWallSize, wallHeight, cornerWallSize]} />
      </mesh>
      
      {/* Northwest Corner */}
      <mesh 
        position={[-roomSize/2 + cornerWallSize/2, wallHeight/2, -roomSize/2 + cornerWallSize/2]} 
        material={wallMaterial} 
        castShadow 
        receiveShadow
      >
        <boxGeometry args={[cornerWallSize, wallHeight, cornerWallSize]} />
      </mesh>
      
      {/* Southeast Corner */}
      <mesh 
        position={[roomSize/2 - cornerWallSize/2, wallHeight/2, roomSize/2 - cornerWallSize/2]} 
        material={wallMaterial} 
        castShadow 
        receiveShadow
      >
        <boxGeometry args={[cornerWallSize, wallHeight, cornerWallSize]} />
      </mesh>
      
      {/* Southwest Corner */}
      <mesh 
        position={[-roomSize/2 + cornerWallSize/2, wallHeight/2, roomSize/2 - cornerWallSize/2]} 
        material={wallMaterial} 
        castShadow 
        receiveShadow
      >
        <boxGeometry args={[cornerWallSize, wallHeight, cornerWallSize]} />
      </mesh>
      
      {/* Perimeter columns - widely spaced for the much larger room */}
      {/* Front row (entrance side) */}
      {[-16, -8, 0, 8, 16].map((x, i) => (
        <GreekColumn key={`front-${i}`} position={[x, 0, roomSize/2 - 1.5]} height={wallHeight} />
      ))}
      
      {/* Back row */}
      {[-16, -8, 0, 8, 16].map((x, i) => (
        <GreekColumn key={`back-${i}`} position={[x, 0, -roomSize/2 + 1.5]} height={wallHeight} />
      ))}
      
      {/* Left side */}
      {[-16, -8, 0, 8, 16].map((z, i) => (
        <GreekColumn key={`left-${i}`} position={[-roomSize/2 + 1.5, 0, z]} height={wallHeight} />
      ))}
      
      {/* Right side */}
      {[-16, -8, 0, 8, 16].map((z, i) => (
        <GreekColumn key={`right-${i}`} position={[roomSize/2 - 1.5, 0, z]} height={wallHeight} />
      ))}
      
      {/* Ceiling */}
      <mesh position={[0, wallHeight, 0]} material={createMarbleMaterial('#c2bcb2', 0.2)} castShadow={false} receiveShadow>
        <boxGeometry args={[roomSize, 0.5, roomSize]} />
      </mesh>
      
      {/* Friezes along the walls */}
      <GreekFrieze position={[0, friezeHeight, roomSize/2 - 0.8 - alabasterPanelInset]} rotation={[0, 0, 0]} width={roomSize - 6} />
      <GreekFrieze position={[0, friezeHeight, -roomSize/2 + 0.8 + alabasterPanelInset]} rotation={[0, Math.PI, 0]} width={roomSize - 6} />
      <GreekFrieze position={[roomSize/2 - 0.8 - alabasterPanelInset, friezeHeight, 0]} rotation={[0, -Math.PI*1.5, 0]} width={roomSize - 6} />
      <GreekFrieze position={[-roomSize/2 + 0.8 + alabasterPanelInset, friezeHeight, 0]} rotation={[0, Math.PI*1.5, 0]} width={roomSize - 6} />
      
      {/* Alabaster glowing panels above the friezes - with stronger glow for night scene */}
      <AlabasterPanel 
        position={[0, friezeHeight + alabasterPanelHeight/2 + 0.4, roomSize/2 - 0.8 - alabasterPanelInset]} 
        rotation={[0, 0, 0]} 
        width={roomSize - 10}
      />
      <AlabasterPanel 
        position={[0, friezeHeight + alabasterPanelHeight/2 + 0.4, -roomSize/2 + 0.8 + alabasterPanelInset]} 
        rotation={[0, 0, 0]} 
        width={roomSize - 10} 
      />
      <AlabasterPanel 
        position={[roomSize/2 - 0.8 - alabasterPanelInset, friezeHeight + alabasterPanelHeight/2 + 0.4, 0]} 
        rotation={[0, Math.PI/2, 0]} 
        width={roomSize - 10}
      />
      <AlabasterPanel 
        position={[-roomSize/2 + 0.8 + alabasterPanelInset, friezeHeight + alabasterPanelHeight/2 + 0.4, 0]} 
        rotation={[0, Math.PI/2, 0]} 
        width={roomSize - 10}
      />
    </group>
  );
};

// Low-poly lever component with animation and effects
const Lever: React.FC<{position: [number, number, number], onClick: () => void}> = ({
  position,
  onClick
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const leverRef = useRef<THREE.Group>(null);
  const baseRef = useRef<THREE.Mesh>(null);
  const handleRef = useRef<THREE.Group>(null);
  const sparksRef = useRef<THREE.Points[]>([]);
  const playerRef = useRef<THREE.Mesh | null>(null);
  const { scene } = useThree();
  const [leverPulled, setLeverPulled] = useState(false);
  const useGameStoreVal = useGameStore();
  
  // Track animation progress
  const animationProgress = useRef(0);
  const sparkParticles = useRef<{
    particles: THREE.Points | null,
    positions: Float32Array | null,
    velocities: {x: number, y: number, z: number}[] | null
  }>({
    particles: null,
    positions: null,
    velocities: null
  });
  
  // Find player sphere on mount
  useEffect(() => {
    // Find the player sphere in the scene
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && 
          object.geometry instanceof THREE.SphereGeometry && 
          object.material instanceof THREE.MeshStandardMaterial &&
          object.material.color.getHexString() === "e91e63") { // Pink color of player
        playerRef.current = object;
      }
    });
  }, [scene]);
  
  const handleLeverPull = () => {
    if (isAnimating || leverPulled) return;
    
    // Start the animation
    setIsAnimating(true);
    
    // Create sparks effect
    createSparks();
    
    // After animation is complete, update game state
    setTimeout(() => {
      setIsAnimating(false);
      setLeverPulled(true);
      
      // Update the game state
      useGameStoreVal.markAudioPuzzleCompleted();
      useGameStoreVal.incrementEmbodimentInsight();
      
      // Show a notification dialogue
      useGameStoreVal.showDialogue(
        "Embodiment Phase 0 complete. Insight gained.",
        "mission-control.jpg",
        "System"
      );
      
      // Clean up particles
      if (sparkParticles.current.particles && leverRef.current) {
        leverRef.current.remove(sparkParticles.current.particles);
        sparkParticles.current.particles = null;
        sparkParticles.current.positions = null;
        sparkParticles.current.velocities = null;
      }
    }, 4000); // Animation duration: 4 seconds (reduced from 8 to fit animation timing)
  };
  
  // Create spark particles that will fly toward the player
  const createSparks = () => {
    if (!leverRef.current || !playerRef.current) return;
    
    // Clear any existing particles
    if (sparkParticles.current.particles && leverRef.current) {
      leverRef.current.remove(sparkParticles.current.particles);
    }
    
    const particleCount = 150;
    const positions = new Float32Array(particleCount * 3);
    const velocities: {x: number, y: number, z: number}[] = [];
    
    // Initialize particles at lever position with velocities toward player
    const playerPos = playerRef.current.position.clone();
    const leverPos = new THREE.Vector3().setFromMatrixPosition(leverRef.current.matrixWorld);
    
    for (let i = 0; i < particleCount; i++) {
      // Random starting position near lever handle
      positions[i * 3] = (Math.random() - 0.5) * 0.5;
      positions[i * 3 + 1] = Math.random() * 0.5 + 1.0; // Above the base
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
      
      // Calculate direction toward player with some randomness
      const direction = new THREE.Vector3()
        .subVectors(playerPos, leverPos)
        .normalize()
        .add(new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.5
        ));
      
      // Set velocity 
      velocities.push({
        x: direction.x * (Math.random() * 0.2 + 0.2),
        y: direction.y * (Math.random() * 0.2 + 0.2),
        z: direction.z * (Math.random() * 0.2 + 0.2)
      });
    }
    
    // Create particle material
    const particleMaterial = new THREE.PointsMaterial({
      color: '#00ffff',
      size: 0.1,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    // Create particle system
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    leverRef.current.add(particles);
    
    // Store references for animation
    sparkParticles.current = {
      particles,
      positions,
      velocities
    };
  };
  
  // Animation logic
  useFrame((_, delta) => {
    // Animate lever pull
    if (isAnimating && handleRef.current) {
      // Rotate handle over time
      if (animationProgress.current < 1) {
        animationProgress.current += delta * 0.3; // Reduced from 0.5 for slower animation
        
        // Clamp progress to 0-1
        animationProgress.current = Math.min(animationProgress.current, 1);
        
        // Apply rotation to handle
        handleRef.current.rotation.x = -Math.PI * 0.5 * animationProgress.current;
      }
    }
    
    // Animate particles
    if (isAnimating && sparkParticles.current.particles && 
        sparkParticles.current.positions && 
        sparkParticles.current.velocities) {
      
      const positions = sparkParticles.current.positions;
      const velocities = sparkParticles.current.velocities;
      
      for (let i = 0; i < positions.length / 3; i++) {
        // Update positions based on velocities
        positions[i * 3] += velocities[i].x * delta * 10; // Reduced from 15 for slower particles
        positions[i * 3 + 1] += velocities[i].y * delta * 10; // Reduced from 15 for slower particles
        positions[i * 3 + 2] += velocities[i].z * delta * 10; // Reduced from 15 for slower particles
        
        // Fade out particles over time
        if (sparkParticles.current.particles.material instanceof THREE.PointsMaterial) {
          sparkParticles.current.particles.material.opacity = 
            Math.max(0, 0.8 - animationProgress.current * 0.8);
          
          // Make particles grow slightly larger over time
          sparkParticles.current.particles.material.size = 
            0.1 + animationProgress.current * 0.1;
        }
      }
      
      // Update the geometry attribute
      sparkParticles.current.particles.geometry.attributes.position.needsUpdate = true;
    }
  });
  
  return (
    <group ref={leverRef} position={position} onClick={!leverPulled ? handleLeverPull : undefined}>
      {/* Base of the lever */}
      <mesh ref={baseRef} position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1, 0.4, 1]} />
        <meshStandardMaterial color="#333333" roughness={0.7} />
      </mesh>
      
      {/* Lever pivot */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.2, 8]} />
        <meshStandardMaterial color="#555555" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Lever handle */}
      <group ref={handleRef} position={[0, 0.3, 0]}>
        <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.08, 0.08, 1.2, 6]} />
          <meshStandardMaterial color="#777777" metalness={0.6} roughness={0.3} />
        </mesh>
        
        {/* Lever handle grip */}
        <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshStandardMaterial 
            color={leverPulled ? "#00ff00" : "#E91E63"} 
            emissive={leverPulled ? "#00ff00" : "#E91E63"} 
            emissiveIntensity={leverPulled ? 0.8 : 0.5} 
            roughness={0.3} 
          />
        </mesh>
      </group>
      
      {/* Text label */}
      <Billboard
        position={[0, 2, 0]}
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
      >
        <Text
          fontSize={0.4}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
        >
          {leverPulled ? "Embodiment Phase 0 Complete" : "Activate Embodiment Phase 0"}
        </Text>
      </Billboard>
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
      {/* Temple structure */}
      <TempleRoom />
      
      {/* Moonlight - enhanced for massive space */}
      <directionalLight 
        position={[12, 35, 20]} 
        intensity={0.85} 
        color="#b9c7ff" 
        castShadow 
        shadow-mapSize={[2048, 2048]}
      />
      
      {/* Soft secondary light for opposite side */}
      <directionalLight 
        position={[-15, 25, -12]} 
        intensity={0.4} 
        color="#6b7a9e" 
        castShadow={false}
      />
      
      {/* Ambient night light - adjusted for massive space */}
      <ambientLight intensity={0.35} color="#424a5f" />
      
      {/* Atmospheric fog for night effect - adjusted for the massive room */}
      <fog attach="fog" args={['#0a121f', 15, 70]} />
      
      {/* Interactive objects - widely spread in the massive temple */}
      <InteractiveObject
        position={[0, 1, 15]}
        text="Return to Welcome"
        color="#4CAF50"
        onClick={handleReturnToWelcome}
      />
      
      {colonyExists && (
        <InteractiveObject
          position={[4, 1, 15]}
          text="Return to Colony"
          color="#FF5722"
          onClick={handleReturnToManagement}
        />
      )}
      
      {/* Info Display for the Lever */}
      <InfoDisplay
        position={[-4, 3, -15]}
        rotation={[0, Math.PI/12, 0]}
        width={4}
        height={5}
        title="Placeholder Puzzle Lever"
        content={`Guide:
1. Pull the lever
2. Watch dramatic animation unfold
3. Return to Colony

Rewards:
Research completed
+1 Embodiment Insight (WIP)

Thanks for testing :)`}
        contentFontSize={0.2}
        contentLineHeight={1.4}
        backgroundColor="#332244"
        emissiveColor="#6633aa"
        glowColor="#aa66ff"
      />
      
      {/* Replace the Audio Puzzle 1 box with the Lever */}
      <Lever 
        position={[0, 0, -15]} 
        onClick={() => {}}
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

      {/* Use our InteractiveSceneLayout with settings for the massive temple space */}
      <InteractiveSceneLayout
        backgroundColor="#121016" // Dark purple background for audio theme
        playerColor="#E91E63" // Pink player for audio theme
        playerPosition={[0, 1, 15]} // Position player at the entrance
        playerSpeed={5}
        // Camera settings optimized for exploration
        cameraMinDistance={3} 
        cameraMaxDistance={7}
        cameraFollowSpeed={0.15}
        // Better camera angle settings
        cameraMinPolarAngle={Math.PI * 0.2} // Higher angle from vertical (36 degrees)
        cameraMaxPolarAngle={Math.PI * 0.75} // Limit how low camera can go
        // Selfie stick effect for better backward movement
        selfieStickEffect={true}
        selfieStickMaxDistance={7}
        selfieStickSpeed={0.05}
        // No floor - we have our own floor in the scene
        showFloor={false}
        // Height limits for vertical movement
        playerMinHeight={0.1}
        playerMaxHeight={12}
        initialLookDirection={new THREE.Vector3(0, 0, -1)}
        minCameraHeight={1.2} // Prevent camera from going below the floor
      >
        <AudioPuzzleContent />
      </InteractiveSceneLayout>
      
      {/* Simple info text */}
      <div className={styles.infoPanel}>
        <h2>Embodiment Phase 0</h2>
        <p>Explore the moonlit temple.</p>
      </div>
    </div>
  );
};

export default AudioPuzzleScene; 