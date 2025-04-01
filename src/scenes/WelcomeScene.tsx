import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Text, Stars, SpotLight } from '@react-three/drei';
import { Suspense, useRef, useEffect, useState, forwardRef } from 'react';
import * as THREE from 'three';
import { useGameStore } from '@store/store';
import MobileControls from '@components/MobileControls';
import styles from '@styles/WelcomeScene.module.css';

// Environment elements
const LowPolyEnvironment = () => {
  // Create a simple low-poly environment
  return (
    <group>
      {/* Mars-like reddish ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
        <planeGeometry args={[100, 100, 10, 10]} />
        <meshStandardMaterial 
          color="#a85c32" 
          roughness={0.9}
          metalness={0.1}
          wireframe={false}
          flatShading={true}
        />
      </mesh>
      
      {/* Some low-poly mountains in the distance */}
      {[...Array(15)].map((_, i) => {
        const x = Math.sin(i / 15 * Math.PI * 2) * 40;
        const z = Math.cos(i / 15 * Math.PI * 2) * 40;
        const height = 5 + Math.random() * 15;
        return (
          <mesh key={i} position={[x, height/2 - 1, z]}>
            <coneGeometry args={[5 + Math.random() * 5, height, 5]} />
            <meshStandardMaterial 
              color={`rgb(${120 + Math.random() * 40}, ${50 + Math.random() * 30}, ${30 + Math.random() * 20})`}
              roughness={0.9}
              metalness={0.1}
              flatShading={true}
            />
          </mesh>
        );
      })}
      
      {/* Add some randomly placed rocks */}
      {[...Array(50)].map((_, i) => {
        const x = (Math.random() - 0.5) * 60;
        const z = (Math.random() - 0.5) * 60;
        const scale = 0.3 + Math.random() * 1;
        return (
          <mesh key={`rock-${i}`} position={[x, -0.5, z]} scale={[scale, scale, scale]}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial 
              color={`rgb(${100 + Math.random() * 40}, ${60 + Math.random() * 30}, ${40 + Math.random() * 20})`}
              roughness={0.9}
              metalness={0.1}
              flatShading={true}
            />
          </mesh>
        );
      })}
      
      {/* Add a subtle glow/atmosphere in the distance */}
      <mesh position={[0, 5, -40]}>
        <planeGeometry args={[120, 50]} />
        <meshBasicMaterial 
          color="#ff6a45" 
          transparent={true} 
          opacity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

// Research Lab/Museum elements
const MarsLabEnvironment = () => {
  // Create a sci-fi Mars lab/museum environment
  return (
    <group>
      {/* Mars-like reddish floor with grid pattern */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
        <planeGeometry args={[100, 100, 30, 30]} />
        <meshStandardMaterial 
          color="#c8664a" 
          roughness={0.8}
          metalness={0.2}
          wireframe={false}
          flatShading={true}
        />
      </mesh>
      
      {/* Grid overlay on floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.99, 0]}>
        <planeGeometry args={[100, 100, 1, 1]} />
        <meshBasicMaterial 
          wireframe={true}
          color="#803326"
          transparent={true}
          opacity={0.5}
        />
      </mesh>
      
      {/* Sci-fi dome ceiling */}
      <mesh position={[0, 20, 0]}>
        <sphereGeometry args={[40, 16, 8]} />
        <meshStandardMaterial 
          color="#301d1a" 
          side={THREE.BackSide}
          transparent={true}
          opacity={0.9}
          metalness={0.5}
          roughness={0.6}
          emissive="#120b0a"
          emissiveIntensity={0.5}
        />
      </mesh>
      
      {/* Central holographic Mars display */}
      <group position={[0, 5, -12]}>
        <mesh>
          <sphereGeometry args={[4, 32, 32]} />
          <meshStandardMaterial 
            color="#e05e39" 
            emissive="#ff3a1f"
            emissiveIntensity={0.3}
            metalness={0.4}
            roughness={0.7}
          />
        </mesh>
        
        {/* Holographic ring around Mars */}
        <mesh rotation={[Math.PI/2, 0, 0]}>
          <torusGeometry args={[6, 0.15, 16, 100]} />
          <meshStandardMaterial
            color="#00ffff"
            emissive="#00ffff"
            emissiveIntensity={1}
            transparent={true}
            opacity={0.7}
          />
        </mesh>
        
        {/* Second holographic ring at different angle */}
        <mesh rotation={[Math.PI/3, Math.PI/4, 0]}>
          <torusGeometry args={[5.5, 0.1, 16, 100]} />
          <meshStandardMaterial
            color="#5599ff"
            emissive="#5599ff"
            emissiveIntensity={1}
            transparent={true}
            opacity={0.7}
          />
        </mesh>
        
        {/* Add holographic text above mars */}
        <Text
          position={[0, 8, 0]}
          fontSize={1.2}
          color="#00ffff"
          anchorX="center"
          anchorY="middle"
          maxWidth={10}
        >
          MARS COLONIZATION PROJECT
        </Text>
        
        <Text
          position={[0, 6.5, 0]}
          fontSize={0.7}
          color="#5599ff"
          anchorX="center"
          anchorY="middle"
          maxWidth={10}
        >
          DERECH AI MISSION CONTROL
        </Text>
      </group>
      
      {/* Add display terminals around the room */}
      {[...Array(6)].map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const radius = 15;
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;
        return (
          <group key={`terminal-${i}`} position={[x, 0, z]} rotation={[0, -angle, 0]}>
            {/* Terminal screen */}
            <mesh position={[0, 2, 0]}>
              <boxGeometry args={[3, 2, 0.2]} />
              <meshStandardMaterial 
                color="#2a6179"
                emissive="#0a3a56"
                emissiveIntensity={0.7}
                roughness={0.4}
                metalness={0.8}
              />
            </mesh>
            
            {/* Terminal stand */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.5, 2, 0.5]} />
              <meshStandardMaterial 
                color="#444444"
                roughness={0.4}
                metalness={0.8}
              />
            </mesh>
            
            {/* Terminal screen text with different text for each terminal */}
            <Text
              position={[0, 2, 0.15]}
              fontSize={0.2}
              color="#00ffff"
              anchorX="center"
              anchorY="middle"
              maxWidth={2.5}
            >
              {[
                "COLONY STATUS: PREPARATION\n\nAWAITING MISSION START\n\nAll systems nominal",
                "RESOURCE OVERVIEW\n\nMinerals: Standby\nWater: Standby\nPower: Standby",
                "RESEARCH PROJECTS\n\n6 Projects Available\n\nInitial research ready",
                "MARS GEOLOGY\n\nSurvey regions identified\n\nScanning equipment calibrated",
                "WORKFORCE STATUS\n\nColonists ready for deployment\n\nTraining complete",
                "MISSION OBJECTIVES\n\nBuild sustainable colony\n\nExplore Mars surface"
              ][i]}
            </Text>
          </group>
        );
      })}
      
      {/* Low-poly research equipment scattered around with pulsing lights */}
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2 + Math.PI/16;
        const radius = 22;
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;
        const size = 1 + Math.random() * 1.5;
        
        // Create refs for the blinking lights
        const lightRef = useRef<THREE.Mesh>(null);
        
        // Create pulsing effect directly with useFrame
        useFrame(({ clock }) => {
          if (lightRef.current) {
            // Pulse intensity based on sin wave, offset by index for variety
            const intensity = Math.abs(Math.sin(clock.getElapsedTime() * 2 + i * 0.7));
            
            // Apply to material opacity for pulse effect
            if (lightRef.current.material instanceof THREE.Material) {
              (lightRef.current.material as THREE.MeshBasicMaterial).opacity = 0.5 + intensity * 0.5;
            }
          }
        });
        
        return (
          <group key={`equipment-${i}`} position={[x, 0, z]}>
            {/* Equipment base */}
            <mesh position={[0, size/2, 0]}>
              <boxGeometry args={[size, size, size]} />
              <meshStandardMaterial 
                color={[
                  "#455a64", // Blue-grey
                  "#546e7a", 
                  "#607d8b", 
                  "#78909c", 
                  "#d32f2f", // Red
                  "#5d4037", // Brown
                  "#455a64", // Blue-grey
                  "#607d8b",
                ][i]}
                roughness={0.4}
                metalness={0.8}
              />
            </mesh>
            
            {/* Equipment details */}
            <mesh position={[0, size + 0.5, 0]}>
              <cylinderGeometry args={[size/4, size/3, 1, 8]} />
              <meshStandardMaterial 
                color={["#b0bec5", "#90a4ae", "#78909c"][i % 3]}
                roughness={0.4}
                metalness={0.8}
              />
            </mesh>
            
            {/* Small blinking light with manual animation */}
            <mesh ref={lightRef} position={[size/3, size + 0.2, size/3]}>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshBasicMaterial 
                color={["#f44336", "#4caf50", "#2196f3"][i % 3]}
                transparent={true}
                opacity={0.8}
              />
            </mesh>
          </group>
        );
      })}
      
      {/* Add some subtle Mars atmosphere */}
      <mesh position={[0, 10, -40]}>
        <planeGeometry args={[120, 60]} />
        <meshBasicMaterial 
          color="#ff7f50" 
          transparent={true} 
          opacity={0.15}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

// 3D Button component
interface ButtonProps {
  position: [number, number, number];
  text: string;
  onClick: () => void;
  color?: string;
}

// 3D Button component - Modified for better visibility
const InteractiveButton = ({ position, text, onClick, color = "#FFD700" }: ButtonProps) => {
  const buttonRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  
  useFrame(() => {
    if (buttonRef.current) {
      // Slight floating animation
      buttonRef.current.position.y = position[1] + Math.sin(Date.now() * 0.002) * 0.1;
    }
  });
  
  return (
    <group
      ref={buttonRef}
      position={position}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <mesh>
        <boxGeometry args={[6, 1.5, 0.5]} />
        <meshStandardMaterial 
          color={hovered ? "#FFFFFF" : color} 
          emissive={hovered ? color : color}
          emissiveIntensity={hovered ? 0.8 : 0.5}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
      <Text
        position={[0, 0, 0.3]}
        fontSize={0.6}
        color="#000000"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {text}
      </Text>
      <Text
        position={[0, 0, 0.35]}
        fontSize={0.6}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor={hovered ? color : "black"}
        outlineOpacity={0.8}
      >
        {text}
      </Text>
    </group>
  );
};

// Portal component based on provided code
interface PortalProps {
  position?: [number, number, number];
  scale?: number;
}

const PortalToVibeverse = forwardRef<THREE.Group, PortalProps>(({ position = [16, 2, -5], scale = 0.4 }, ref) => {
  const portalInnerRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const boxRef = useRef(new THREE.Box3());
  
  useEffect(() => {
    // Create the initial bounding box
    if (ref && typeof ref === 'object' && ref.current) {
      boxRef.current.setFromObject(ref.current);
    }
  }, [ref]);
  
  useFrame(() => {
    // Animate particles
    if (particlesRef.current && particlesRef.current.geometry.attributes.position) {
      const positions = particlesRef.current.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += 0.05 * Math.sin(Date.now() * 0.001 + i);
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
    
    // Rotate portal slightly
    if (ref && typeof ref === 'object' && ref.current) {
      ref.current.rotation.y = Math.sin(Date.now() * 0.0005) * 0.2;
    }
  });
  
  // Create particles
  const particleCount = 500; // Reduced number of particles
  const particlePositions = new Float32Array(particleCount * 3);
  const particleColors = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount * 3; i += 3) {
    // Create particles in a ring around the portal
    const angle = Math.random() * Math.PI * 2;
    const radius = 10 + (Math.random() - 0.5) * 3;
    particlePositions[i] = Math.cos(angle) * radius;
    particlePositions[i + 1] = Math.sin(angle) * radius;
    particlePositions[i + 2] = (Math.random() - 0.5) * 3;
    
    // Green color with slight variation
    particleColors[i] = 0;
    particleColors[i + 1] = 0.8 + Math.random() * 0.2;
    particleColors[i + 2] = 0;
  }
  
  return (
    <group ref={ref} position={position} rotation={[0.35, 0, 0]} scale={scale}>
      {/* Portal ring */}
      <mesh>
        <torusGeometry args={[10, 1.5, 16, 100]} />
        <meshPhongMaterial
          color={0x00ff00}
          emissive={0x00ff00}
          transparent={true}
          opacity={0.8}
        />
      </mesh>
      
      {/* Portal inner surface */}
      <mesh ref={portalInnerRef}>
        <circleGeometry args={[9, 32]} />
        <meshBasicMaterial
          color={0x00ff00}
          transparent={true}
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Portal label */}
      <Text
        position={[0, 12, 0]}
        fontSize={2}
        color="#00FF00"
        anchorX="center"
        anchorY="middle"
      >
        VIBEVERSE PORTAL
      </Text>
      
      {/* Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={particlePositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={particleCount}
            array={particleColors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.2}
          vertexColors={true}
          transparent={true}
          opacity={0.6}
        />
      </points>
    </group>
  );
});

// Start Portal component - only shown when player enters through a portal
const StartPortal = forwardRef<THREE.Group, PortalProps>(({ position = [0, 0, 10], scale = 0.4 }, ref) => {
  const portalInnerRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const boxRef = useRef(new THREE.Box3());
  
  useEffect(() => {
    // Create the initial bounding box
    if (ref && typeof ref === 'object' && ref.current) {
      boxRef.current.setFromObject(ref.current);
    }
  }, [ref]);
  
  useFrame(() => {
    // Animate particles
    if (particlesRef.current && particlesRef.current.geometry.attributes.position) {
      const positions = particlesRef.current.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += 0.05 * Math.sin(Date.now() * 0.001 + i);
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });
  
  // Create particles
  const particleCount = 500; // Reduced number of particles
  const particlePositions = new Float32Array(particleCount * 3);
  const particleColors = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount * 3; i += 3) {
    // Create particles in a ring around the portal
    const angle = Math.random() * Math.PI * 2;
    const radius = 10 + (Math.random() - 0.5) * 3;
    particlePositions[i] = Math.cos(angle) * radius;
    particlePositions[i + 1] = Math.sin(angle) * radius;
    particlePositions[i + 2] = (Math.random() - 0.5) * 3;
    
    // Red color with slight variation
    particleColors[i] = 0.8 + Math.random() * 0.2;
    particleColors[i + 1] = 0;
    particleColors[i + 2] = 0;
  }
  
  return (
    <group ref={ref} position={position} rotation={[0.35, 0, 0]} scale={scale}>
      {/* Portal ring */}
      <mesh>
        <torusGeometry args={[10, 1.5, 16, 100]} />
        <meshPhongMaterial
          color={0xff0000}
          emissive={0xff0000}
          transparent={true}
          opacity={0.8}
        />
      </mesh>
      
      {/* Portal inner surface */}
      <mesh ref={portalInnerRef}>
        <circleGeometry args={[9, 32]} />
        <meshBasicMaterial
          color={0xff0000}
          transparent={true}
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Portal label */}
      <Text
        position={[0, 12, 0]}
        fontSize={1.8}
        color="#FF0000"
        anchorX="center"
        anchorY="middle"
      >
        RETURN PORTAL
      </Text>
      
      {/* Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={particlePositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={particleCount}
            array={particleColors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.2}
          vertexColors={true}
          transparent={true}
          opacity={0.6}
        />
      </points>
    </group>
  );
});

// Simple player representation
const Player = forwardRef<THREE.Group, PortalProps>(({ position = [0, 0, 0] }, ref) => {
  const [playerPosition, setPlayerPosition] = useState(new THREE.Vector3(...position));
  const speed = useRef(0.15);
  const keys = useRef<Record<string, boolean>>({});
  
  // Set up keyboard controls
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
  
  // Handle mobile controls input
  const handleMobileMove = (data: { x: number; y: number }) => {
    const { x, y } = data;
    const moveDirection = new THREE.Vector3(x, 0, -y).normalize();
    setPlayerPosition(current => {
      const newPos = current.clone().add(moveDirection.multiplyScalar(speed.current));
      return newPos;
    });
  };
  
  // Handle movement 
  useFrame(({ camera }) => {
    if (!ref || typeof ref !== 'object' || !ref.current) return;
    
    // Movement based on keyboard input
    const moveDirection = new THREE.Vector3(0, 0, 0);
    
    if (keys.current['KeyW'] || keys.current['ArrowUp']) moveDirection.z -= 1;
    if (keys.current['KeyS'] || keys.current['ArrowDown']) moveDirection.z += 1;
    if (keys.current['KeyA'] || keys.current['ArrowLeft']) moveDirection.x -= 1;
    if (keys.current['KeyD'] || keys.current['ArrowRight']) moveDirection.x += 1;
    
    if (moveDirection.length() > 0) {
      moveDirection.normalize();
      setPlayerPosition(current => {
        const newPos = current.clone().add(moveDirection.multiplyScalar(speed.current));
        return newPos;
      });
    }
    
    // Update player mesh position
    ref.current.position.copy(playerPosition);
    
    // Make the camera follow the player with some smoothing
    const cameraTargetPos = new THREE.Vector3(
      playerPosition.x,
      camera.position.y,
      playerPosition.z + 10
    );
    
    camera.position.lerp(cameraTargetPos, 0.05);
    camera.lookAt(playerPosition.x, playerPosition.y, playerPosition.z);
  });
  
  return (
    <group ref={ref} position={[position[0], position[1], position[2]]}>
      <mesh position={[0, 0.5, 0]}>
        <capsuleGeometry args={[0.5, 1, 4, 8]} />
        <meshStandardMaterial color="#1E90FF" />
      </mesh>
    </group>
  );
});

// Display names for debugging
PortalToVibeverse.displayName = 'PortalToVibeverse';
StartPortal.displayName = 'StartPortal';
Player.displayName = 'Player';

// Main scene content
const SceneContent = () => {
  const setGameView = useGameStore(state => state.setGameView);
  const playerRef = useRef<THREE.Group>(null);
  const exitPortalBoxRef = useRef(new THREE.Box3());
  const startPortalBoxRef = useRef(new THREE.Box3());
  const exitPortalRef = useRef<THREE.Group>(null);
  const startPortalRef = useRef<THREE.Group>(null);
  
  // Check if player came through a portal
  const [cameFromPortal, setCameFromPortal] = useState(false);
  const [refUrl, setRefUrl] = useState('');
  
  useEffect(() => {
    // Check URL params to see if player came through a portal
    const urlParams = new URLSearchParams(window.location.search);
    const hasPortalParam = urlParams.get('portal') === 'true';
    const ref = urlParams.get('ref');
    
    if (hasPortalParam && ref) {
      setCameFromPortal(true);
      setRefUrl(ref);
    }
  }, []);
  
  // Set up portal collision detection
  useFrame(() => {
    if (!playerRef.current || (!exitPortalRef.current && !startPortalRef.current)) return;
    
    const playerBox = new THREE.Box3().setFromObject(playerRef.current);
    
    // Check exit portal collision (to Vibeverse)
    if (exitPortalRef.current) {
      exitPortalBoxRef.current.setFromObject(exitPortalRef.current);
      const portalDistance = playerBox.getCenter(new THREE.Vector3()).distanceTo(
        exitPortalBoxRef.current.getCenter(new THREE.Vector3())
      );
      
      if (portalDistance < 4 && playerBox.intersectsBox(exitPortalBoxRef.current)) {
        // Prepare to redirect to Vibeverse portal
        const currentParams = new URLSearchParams(window.location.search);
        const newParams = new URLSearchParams();
        newParams.append('portal', 'true');
        newParams.append('username', 'DarechPlayer');  // Can be dynamic if we have player names
        newParams.append('color', 'red');
        newParams.append('speed', '5');
        
        // Add current URL as ref
        newParams.append('ref', window.location.host);
        
        // Add any existing params except 'ref'
        for (const [key, value] of currentParams) {
          if (key !== 'ref') {
            newParams.append(key, value);
          }
        }
        
        const paramString = newParams.toString();
        window.location.href = 'https://portal.pieter.com' + (paramString ? '?' + paramString : '');
      }
    }
    
    // Check start portal collision (return to original game)
    if (startPortalRef.current && cameFromPortal) {
      startPortalBoxRef.current.setFromObject(startPortalRef.current);
      const portalDistance = playerBox.getCenter(new THREE.Vector3()).distanceTo(
        startPortalBoxRef.current.getCenter(new THREE.Vector3())
      );
      
      if (portalDistance < 4 && playerBox.intersectsBox(startPortalBoxRef.current)) {
        // Redirect back to the referring site
        let url = refUrl;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }
        
        const currentParams = new URLSearchParams(window.location.search);
        const newParams = new URLSearchParams();
        
        // Pass through all params except 'ref'
        for (const [key, value] of currentParams) {
          if (key !== 'ref') {
            newParams.append(key, value);
          }
        }
        
        const paramString = newParams.toString();
        window.location.href = url + (paramString ? '?' + paramString : '');
      }
    }
  });
  
  return (
    <>
      {/* Enhanced Lighting Setup */}
      <ambientLight intensity={1.0} color="#fff1e9" />
      
      {/* Main directional light */}
      <directionalLight 
        position={[10, 20, 10]} 
        intensity={1.5} 
        castShadow 
        color="#fff5f0"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={100}
        shadow-camera-near={0.5}
      />
      
      {/* Main overhead spot light */}
      <spotLight 
        position={[0, 20, 0]} 
        angle={0.6} 
        penumbra={0.5} 
        intensity={2} 
        color="#ffe0cc" 
        castShadow
        distance={50}
        decay={0.5}
      />
      
      {/* Holographic spot light */}
      <spotLight 
        position={[0, 10, -15]} 
        angle={0.6} 
        penumbra={0.5} 
        intensity={3}
        color="#00ffff" 
        castShadow
        distance={30}
        decay={1}
      />
      
      {/* Add point lights near each button for better visibility - increased intensity */}
      <pointLight position={[0, 2, -5]} intensity={1.5} color="#4CAF50" distance={10} />
      <pointLight position={[8, 2, -5]} intensity={1.5} color="#2196F3" distance={10} />
      <pointLight position={[-8, 2, -5]} intensity={1.5} color="#FFC107" distance={10} />
      
      {/* Add a soft fill light from below for dramatic effect */}
      <hemisphereLight color="#ffe0e0" groundColor="#331111" intensity={0.5} />
      
      {/* Stars background for space feeling */}
      <Stars radius={80} depth={50} count={1000} factor={4} fade speed={1} />
      
      {/* Mars Lab environment */}
      <MarsLabEnvironment />
      
      {/* Player */}
      <Player ref={playerRef} position={[0, 0, 0]} />
      
      {/* Interactive 3D buttons */}
      <InteractiveButton 
        position={[0, 2, -5]} 
        text="Start Colony Mission" 
        onClick={() => setGameView('management')}
        color="#4CAF50"
      />
      
      <InteractiveButton 
        position={[8, 2, -5]} 
        text="About" 
        onClick={() => {
          // Could show an info popup
          alert("Welcome to Derech - A Mars Colony Simulation Game");
        }}
        color="#2196F3"
      />
      
      <InteractiveButton 
        position={[-8, 2, -5]} 
        text="Help" 
        onClick={() => {
          // Could show help info
          alert("Use WASD or arrow keys to move. Click buttons to interact.");
        }}
        color="#FFC107"
      />
      
      {/* Portal to Vibeverse */}
      <PortalToVibeverse ref={exitPortalRef} />
      
      {/* Portal description with improved visibility */}
      <Text
        position={[16, 0.5, -5]}
        fontSize={0.4}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
        maxWidth={6}
      >
        Portal to Vibeverse Metaverse
      </Text>
      
      {/* Start Portal (only visible if player came through portal) */}
      {cameFromPortal && <StartPortal ref={startPortalRef} />}
      
      {/* Orbit controls - limited to rotation only */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        maxPolarAngle={Math.PI / 2 - 0.1}
        minPolarAngle={Math.PI / 4}
      />
    </>
  );
};

// Main component
const WelcomeScene = () => {
  const [isLoading, setIsLoading] = useState(true);
  
  // Simulate loading - in a real app, this would check if all resources are loaded
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className={styles.sceneContainer}>
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner} />
          <p>Loading Mars Welcome Portal...</p>
        </div>
      )}
      
      <div className={styles.canvasContainer}>
        <Canvas shadows camera={{ position: [0, 8, 15], fov: 60 }}>
          <color attach="background" args={['#251512']} /> {/* Brighter background for better visibility */}
          <fog attach="fog" args={['#3d211e', 50, 150]} /> {/* Brighter fog with increased visibility range */}
          
          <Suspense fallback={null}>
            <SceneContent />
          </Suspense>
        </Canvas>
      </div>
      
      <div className={styles.controlsInfo}>
        WASD / Arrow Keys to move | Click 3D buttons to interact
      </div>
      
      <MobileControls onMove={(data) => console.log('Mobile move:', data)} />
    </div>
  );
};

export default WelcomeScene; 