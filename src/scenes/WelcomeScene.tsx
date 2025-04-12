import React, { useState, useEffect, useRef } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '@store/store';
import styles from '@styles/WelcomeScene.module.css';
import InteractiveSceneLayout from '../layouts/InteractiveSceneLayout';
import InfoDisplay from '../components/ui/InfoDisplay';

// Simple clickable object component (same as AudioPuzzleScene)
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
  color = '#4CAF50',
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

// Portal component - preserving original functionality
const PortalToVibeverse: React.FC<{ position?: [number, number, number], onClick: () => void }> = ({ 
  position = [0, 1, -10],
  onClick 
}) => {
  const portalRef = useRef<THREE.Group>(null);
  
  // Rotate the portal
  useFrame(() => {
    if (portalRef.current) {
      portalRef.current.rotation.y += 0.002;
    }
  });
  
  return (
    <group ref={portalRef} position={position} onClick={onClick}>
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

// Return Portal component
const ReturnPortal: React.FC<{ position?: [number, number, number], onClick: () => void, visible: boolean }> = ({ 
  position = [0, 1, 10],
  onClick,
  visible
}) => {
  if (!visible) return null;
  
  return (
    <group position={position} onClick={onClick}>
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
  );
};

// Scene content component
const WelcomeContent: React.FC = () => {
  const setGameView = useGameStore(state => state.setGameView);
  const currentRound = useGameStore(state => state.currentRound);
  
  // Check if a colony exists
  const colonyExists = currentRound > 1;
  
  // Handle start/enter colony
  const handleStartColony = () => {
    if (colonyExists) {
      if (window.confirm("You already have a colony. Start a new one?")) {
        const { resetColony } = useGameStore.getState();
        resetColony();
      }
    }
    setGameView('management');
  };

  // Handle enter puzzle
  const handleEnterPuzzle = () => {
    setGameView('puzzle');
  };

  // Handle portal click - preserve original functionality
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

  // Handle return through portal
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
      {/* Interactive button objects */}
      <InteractiveObject
        position={[5, 1, 0]}
        text={colonyExists ? "Return to Colony" : "Start New Colony"}
        color="#4CAF50"
        onClick={handleStartColony}
      />
      
      <InteractiveObject
        position={[-5, 1, 0]}
        text="Audio Puzzle"
        color="#E91E63"
        onClick={handleEnterPuzzle}
      />
      
      {/* Portal to Vibeverse - preserve functionality */}
      <PortalToVibeverse 
        position={[0, 1, -10]} 
        onClick={handlePortalClick} 
      />
      
      {/* Return portal - only shown if coming from a portal */}
      <ReturnPortal
        position={[0, 1, 10]}
        onClick={handleReturnPortal}
        visible={cameFromPortal && !!refUrl}
      />

      {/* Introduction InfoDisplay - left of the portal */}
      <InfoDisplay
        position={[-8, 1.5, -10]}
        rotation={[0, Math.PI/8, 0]}
        width={6}
        height={6}
        title="Welcome to Derech"
        content={`Derech is a Mars colony simulation where you control an AI called Moses.
        
Your goal is to assist Mars colonists in sustaining their base, exploring, and expanding across the red planet.

Through embodiment quests, the AI will learn about the physical world and its limitations, becoming more capable of helping the colonists.

Move around using WASD keys and mouse, or touch controls on mobile.`}
        contentFontSize={0.22}
        contentLineHeight={1.5}
      />
      
      
      {/* Changes InfoDisplay - right of the portal */}
      <InfoDisplay
        position={[8, 1.5, -10]}
        rotation={[0, -Math.PI/8, 0]}
        width={6}
        height={6}
        title="Recent Changes"
        content={
          <div>
            <p>View the latest development updates and changes to Derech.</p>
            <p style={{ marginTop: '20px' }}>
              <a 
                href="https://rawlph.github.io/Derech/changes.html" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  color: '#4CAF50', 
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  padding: '10px 15px',
                  border: '2px solid #4CAF50',
                  borderRadius: '4px',
                  display: 'inline-block',
                  marginTop: '10px'
                }}
              >
                Open Changes Page
              </a>
            </p>
          </div>
        }
        htmlContent={true}
        htmlScale={0.5}
        disableOcclusion={true}
      />
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

// Import useFrame from react-three-fiber for the portal rotation
import { useFrame } from '@react-three/fiber';

// Main component
const WelcomeScene: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simple loading simulation
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    // Record visitor entry on mount (preserve original functionality)
    recordVisitorEntry();
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={styles.sceneContainer}>
      {/* Loading overlay */}
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner} />
          <p>Loading Welcome Scene...</p>
        </div>
      )}

      {/* Use our InteractiveSceneLayout like AudioPuzzleScene */}
      <InteractiveSceneLayout
        backgroundColor="#1a1a2a"
        playerColor="#4A90E2"
        playerPosition={[0, 1, 0]}
        playerSpeed={5}
        // Camera settings optimized for exploration
        cameraMinDistance={2.5}
        cameraMaxDistance={5}
        cameraFollowSpeed={0.15}
        // Selfie stick effect for better backward movement
        selfieStickEffect={true}
        selfieStickMaxDistance={7}
        selfieStickSpeed={0.01}
      >
        <WelcomeContent />
      </InteractiveSceneLayout>
      
      {/* Info panel */}
      <div className={styles.infoPanel}>
        <h2>Welcome to Derech</h2>
        <p>Explore the area using WASD keys and mouse.</p>
        <p>On mobile, use the joystick in the bottom right and touch-drag to look around.</p>
        <p>Select a button to navigate or enter a portal.</p>
      </div>
    </div>
  );
};

export default WelcomeScene; 