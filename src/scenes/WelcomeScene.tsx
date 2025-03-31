import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Text } from '@react-three/drei';
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

// 3D Button component
interface ButtonProps {
  position: [number, number, number];
  text: string;
  onClick: () => void;
  color?: string;
}

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
          emissive={hovered ? color : "#000000"}
          emissiveIntensity={hovered ? 0.5 : 0}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
      <Text
        position={[0, 0, 0.3]}
        fontSize={0.5}
        color="#000000"
        anchorX="center"
        anchorY="middle"
      >
        {text}
      </Text>
    </group>
  );
};

// Portal component based on provided code
interface PortalProps {
  position?: [number, number, number];
}

const PortalToVibeverse = forwardRef<THREE.Group, PortalProps>(({ position = [-15, 0, -20] }, ref) => {
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
  const particleCount = 1000;
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
    <group ref={ref} position={position} rotation={[0.35, 0, 0]}>
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
        position={[0, 15, 0]}
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
const StartPortal = forwardRef<THREE.Group, PortalProps>(({ position = [0, 0, 10] }, ref) => {
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
  const particleCount = 1000;
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
    <group ref={ref} position={position} rotation={[0.35, 0, 0]}>
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
        position={[0, 15, 0]}
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
      
      if (portalDistance < 10 && playerBox.intersectsBox(exitPortalBoxRef.current)) {
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
      
      if (portalDistance < 10 && playerBox.intersectsBox(startPortalBoxRef.current)) {
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
      {/* Lights */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      
      {/* Low-poly environment */}
      <LowPolyEnvironment />
      
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
          <color attach="background" args={['#120807']} /> {/* Dark space background */}
          <fog attach="fog" args={['#240f0c', 30, 100]} /> {/* Mars-like atmospheric fog */}
          
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