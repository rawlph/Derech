import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useGameStore } from '@store/store';
import styles from '@styles/WelcomeScene.module.css';

// Simple Button Component
interface NavigationButtonProps {
  position: [number, number, number];
  text: string;
  onClick: () => void;
  color?: string;
}

const NavigationButton: React.FC<NavigationButtonProps> = ({ 
  position, 
  text, 
  onClick, 
  color = "#4CAF50" 
}) => {
  const [hovered, setHovered] = useState(false);
  const buttonRef = useRef<THREE.Group>(null);

  return (
    <group
      ref={buttonRef}
      position={position}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <mesh>
        <boxGeometry args={[3, 1, 0.2]} />
        <meshStandardMaterial 
          color={hovered ? "#FFFFFF" : color} 
          emissive={color}
          emissiveIntensity={hovered ? 0.8 : 0.5}
        />
      </mesh>
      <Text
        position={[0, 0, 0.11]}
        fontSize={0.3}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
      >
        {text}
      </Text>
    </group>
  );
};

// Create a portal that keeps the original portal functionality
const PortalToVibeverse: React.FC<{ position?: [number, number, number] }> = ({ position = [0, 3, -10] }) => {
  const portalRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (portalRef.current) {
      portalRef.current.rotation.y += 0.002;
    }
  });
  
  return (
    <group ref={portalRef} position={position}>
      <mesh>
        <torusGeometry args={[2, 0.3, 16, 32]} />
        <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <circleGeometry args={[1.7, 32]} />
        <meshBasicMaterial color="#00ff00" opacity={0.7} transparent={true} side={THREE.DoubleSide} />
      </mesh>
      <Text
        position={[0, -2.5, 0]}
        fontSize={0.4}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        VIBEVERSE PORTAL
      </Text>
    </group>
  );
};

// Main scene content
const SceneContent: React.FC = () => {
  const setGameView = useGameStore(state => state.setGameView);
  const previousGameView = useGameStore(state => state.previousGameView);
  const currentRound = useGameStore(state => state.currentRound);
  const sphereRef = useRef<THREE.Group>(null);

  // Check if a colony exists
  const colonyExists = currentRound > 1;

  useFrame((state) => {
    if (sphereRef.current) {
      sphereRef.current.rotation.y += 0.01;
      sphereRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  const handleStartColony = () => {
    if (colonyExists) {
      if (window.confirm("You already have a colony. Start a new one?")) {
        const { resetColony } = useGameStore.getState();
        resetColony();
      }
    } else {
      setGameView('management');
    }
  };

  const handleReturnToColony = () => {
    setGameView('management');
  };

  const handleEnterPuzzle = () => {
    setGameView('puzzle');
  };

  // Handle portal click - preserve the portal functionality
  const handlePortalClick = () => {
    const currentParams = new URLSearchParams(window.location.search);
    const newParams = new URLSearchParams();
    newParams.append('portal', 'true');
    newParams.append('username', 'DerechPlayer');
    newParams.append('color', 'blue');
    
    const currentHost = window.location.host;
    const currentPath = window.location.pathname;
    const refValue = `${currentHost}${currentPath}`;
    newParams.append('ref', refValue);
    
    for (const [key, value] of currentParams) {
      if (key !== 'ref' && key !== 'portal') {
        newParams.append(key, value);
      }
    }
    
    const paramString = newParams.toString();
    window.location.href = 'https://portal.pieter.com' + (paramString ? '?' + paramString : '');
  };

  // Check if we came from a portal
  const cameFromPortal = new URLSearchParams(window.location.search).get('portal') === 'true';
  const refUrl = new URLSearchParams(window.location.search).get('ref');

  // Handle return through start portal
  const handleReturnPortal = () => {
    if (refUrl) {
      let url = refUrl;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      const currentParams = new URLSearchParams(window.location.search);
      const newParams = new URLSearchParams();
      for (const [key, value] of currentParams) {
        if (key !== 'ref' && key !== 'portal') {
          newParams.append(key, value);
        }
      }
      const paramString = newParams.toString();
      window.location.href = url + (paramString ? '?' + paramString : '');
    }
  };

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      
      {/* Main sphere - the only 3D object we keep besides buttons */}
      <group ref={sphereRef} position={[0, 0, 0]}>
        <mesh>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="#4A90E2" metalness={0.5} roughness={0.2} />
        </mesh>
      </group>

      {/* Navigation buttons */}
      <NavigationButton 
        position={[0, 2, 0]} 
        text="Start New Colony" 
        onClick={handleStartColony} 
        color="#4CAF50"
      />
      
      {colonyExists && (
        <NavigationButton 
          position={[0, 3, 0]} 
          text="Return to Colony" 
          onClick={handleReturnToColony} 
          color="#FF5722"
        />
      )}
      
      <NavigationButton 
        position={[0, 1, 0]} 
        text="Audio Puzzle Test" 
        onClick={handleEnterPuzzle} 
        color="#E91E63"
      />

      {/* Portal to Vibeverse - preserve functionality */}
      <group position={[0, 0, -10]} onClick={handlePortalClick}>
        <PortalToVibeverse />
      </group>

      {/* Return portal - only shown if coming from a portal */}
      {cameFromPortal && refUrl && (
        <group position={[0, 0, 10]} onClick={handleReturnPortal}>
          <mesh>
            <torusGeometry args={[2, 0.3, 16, 32]} />
            <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <circleGeometry args={[1.7, 32]} />
            <meshBasicMaterial color="#ff0000" opacity={0.7} transparent={true} side={THREE.DoubleSide} />
          </mesh>
          <Text
            position={[0, -2.5, 0]}
            fontSize={0.4}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            RETURN PORTAL
          </Text>
        </group>
      )}

      <OrbitControls enablePan={false} />
    </>
  );
};

// Record visitor entry from portal as in the original code
interface VisitorLogEntry {
  username: string;
  timestamp: number;
  color?: string;
  referrer?: string;
}

const recordVisitorEntry = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const isPortalVisitor = urlParams.get('portal') === 'true';
  
  if (!isPortalVisitor) return;
  
  const username = urlParams.get('username') || 'Anonymous Explorer';
  const color = urlParams.get('color') || '#FFFFFF';
  const referrer = urlParams.get('ref') || undefined;
  
  // Create new visitor entry
  const newVisitor: VisitorLogEntry = {
    username,
    timestamp: Date.now(),
    color,
    referrer
  };
  
  // Get existing visitor log
  let visitorLog: VisitorLogEntry[] = [];
  const storedVisitors = localStorage.getItem('visitorLog');
  
  if (storedVisitors) {
    try {
      visitorLog = JSON.parse(storedVisitors);
    } catch (e) {
      console.error("Failed to parse visitor log:", e);
    }
  }
  
  // Add new visitor to log
  visitorLog.unshift(newVisitor);
  
  // Limit to last 20 visitors
  if (visitorLog.length > 20) {
    visitorLog = visitorLog.slice(0, 20);
  }
  
  // Save back to localStorage
  localStorage.setItem('visitorLog', JSON.stringify(visitorLog));
};

// Main component
const WelcomeScene: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  // Record visitor entry on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    recordVisitorEntry();
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={styles.sceneContainer}>
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner} />
          <p>Loading...</p>
        </div>
      )}
      <div className={styles.canvasContainer}>
        <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
          <color attach="background" args={['#1a1a2a']} />
          <SceneContent />
        </Canvas>
      </div>
      
      <div className={styles.infoPanel}>
        <h2>Welcome to Derech</h2>
        <p>This is a minimal boilerplate scene.</p>
        <p>Use the buttons to navigate between scenes.</p>
      </div>
    </div>
  );
};

export default WelcomeScene; 