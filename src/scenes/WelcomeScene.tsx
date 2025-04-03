import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Text, Stars, SpotLight, Plane, Cylinder, Box, Html } from '@react-three/drei';
import { Suspense, useRef, useEffect, useState, forwardRef, useImperativeHandle, useMemo, ReactNode } from 'react';
import * as THREE from 'three';
import { useGameStore } from '@store/store';
import MobileControls from '@components/MobileControls';
import styles from '@styles/WelcomeScene.module.css';

// NEW: Interface for visitor log entries
interface VisitorLogEntry {
  username: string;
  timestamp: number;
  color?: string;
  referrer?: string;
}

// NEW: TreasureChest component for entry log
interface TreasureChestProps {
  position: [number, number, number];
  scale?: number;
  rotation?: [number, number, number];
}

const TreasureChest = ({ position, scale = 1, rotation = [0, 0, 0] }: TreasureChestProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const chestRef = useRef<THREE.Group>(null);
  const [visitors, setVisitors] = useState<VisitorLogEntry[]>([]);
  const particlesRef = useRef<THREE.Points>(null);
  const hoverRef = useRef(false);
  
  // Generate particles for the chest
  const particleCount = 50;
  const particlePositions = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      // Create particles in a field around the chest
      positions[i3] = (Math.random() - 0.5) * 2; // x
      positions[i3 + 1] = Math.random() * 2; // y - mostly above
      positions[i3 + 2] = (Math.random() - 0.5) * 2; // z
    }
    return positions;
  }, []);

  // Load visitor log from localStorage on mount
  useEffect(() => {
    const storedVisitors = localStorage.getItem('visitorLog');
    if (storedVisitors) {
      try {
        setVisitors(JSON.parse(storedVisitors));
      } catch (e) {
        console.error("Failed to parse visitor log:", e);
        // Initialize with empty array if parse fails
        setVisitors([]);
      }
    }
  }, []);

  useFrame((state) => {
    if (chestRef.current) {
      // Add subtle floating animation
      chestRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
      
      // Add subtle rotation
      chestRef.current.rotation.y = rotation[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      
      // Add pulsing effect to the glow
      if (chestRef.current.children.length > 0) {
        const pointLight = chestRef.current.children.find(
          child => child instanceof THREE.PointLight
        ) as THREE.PointLight | undefined;
        
        if (pointLight) {
          pointLight.intensity = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.3;
        }
      }
    }
    
    // Animate particles
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.getAttribute('position').array as Float32Array;
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Move particles upward slowly
        positions[i3 + 1] += 0.01;
        
        // Add slight horizontal drift
        positions[i3] += Math.sin(state.clock.elapsedTime * 0.5 + i * 0.1) * 0.002;
        positions[i3 + 2] += Math.cos(state.clock.elapsedTime * 0.5 + i * 0.1) * 0.002;
        
        // If particle moves too far up, reset it
        if (positions[i3 + 1] > 2.5) {
          positions[i3] = (Math.random() - 0.5) * 2;
          positions[i3 + 1] = 0;
          positions[i3 + 2] = (Math.random() - 0.5) * 2;
        }
      }
      
      particlesRef.current.geometry.getAttribute('position').needsUpdate = true;
    }
  });

  const handleChestClick = () => {
    setIsOpen(!isOpen);
  };
  
  const handleChestHover = () => {
    hoverRef.current = true;
  };
  
  const handleChestUnhover = () => {
    hoverRef.current = false;
  };

  // Format timestamp to readable date
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Convert rotation array to Euler for Three.js
  const eulerRotation = useMemo(() => new THREE.Euler(rotation[0], rotation[1], rotation[2]), [rotation]);

  return (
    <group position={position} scale={scale} rotation={eulerRotation}>
      {/* Treasure chest base */}
      <group 
        ref={chestRef} 
        onClick={handleChestClick}
        onPointerOver={handleChestHover}
        onPointerOut={handleChestUnhover}
      >
        {/* Chest base */}
        <Box args={[1.5, 0.8, 1]} position={[0, 0.4, 0]}>
          <meshStandardMaterial color="#8B4513" roughness={0.8} metalness={0.2} />
        </Box>
        
        {/* Chest lid */}
        <Box args={[1.5, 0.4, 1]} position={[0, 0.9, -0.25]} rotation={[isOpen ? -0.8 : 0, 0, 0]}>
          <meshStandardMaterial color="#A0522D" roughness={0.7} metalness={0.3} />
        </Box>
        
        {/* Metal details */}
        <Box args={[1.6, 0.1, 1.1]} position={[0, 0.4, 0]}>
          <meshStandardMaterial color="#B8860B" roughness={0.5} metalness={0.8} />
        </Box>
        
        {/* Lock */}
        <Box args={[0.3, 0.3, 0.2]} position={[0, 0.7, 0.5]}>
          <meshStandardMaterial color="#DAA520" roughness={0.4} metalness={0.9} />
        </Box>
        
        {/* Gold coins/treasures peeking out if open */}
        {isOpen && (
          <group position={[0, 0.6, 0]}>
            {/* Multiple small gold spheres to represent coins */}
            {[...Array(8)].map((_, index) => (
              <mesh 
                key={index}
                position={[
                  (Math.random() - 0.5) * 0.8, 
                  Math.random() * 0.3, 
                  (Math.random() - 0.5) * 0.6
                ]}
                scale={0.1 + Math.random() * 0.1}
              >
                <sphereGeometry args={[1, 12, 12]} />
                <meshStandardMaterial color="#FFD700" metalness={1} roughness={0.2} />
              </mesh>
            ))}
          </group>
        )}
        
        {/* Small glow effect */}
        <pointLight position={[0, 0.5, 0]} distance={2} intensity={0.5} color="#FFD700" />
        
        {/* Label with hovering effect */}
        <Text
          position={[0, 1.2, 0]}
          rotation={[0, 0, 0]}
          fontSize={0.2}
          color="#FFD700"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          ENTRY LOG
        </Text>
      </group>
      
      {/* Particle effect */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={particleCount} array={particlePositions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          color="#FFD700"
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
        />
      </points>
      
      {/* Visitor log UI */}
      {isOpen && (
        <Html position={[0, 2, 0]} transform scale={1.5} rotation={eulerRotation}>
          <div className={styles.visitorLogContainer}>
            <div className={styles.visitorLogHeader}>
              <h3>VISITOR LOG</h3>
              <button className={styles.closeButton} onClick={() => setIsOpen(false)}>×</button>
            </div>
            <div className={styles.visitorLogContent}>
              {visitors.length === 0 ? (
                <p className={styles.noVisitors}>No visitors recorded yet</p>
              ) : (
                <ul className={styles.visitorList}>
                  {visitors.map((visitor, index) => (
                    <li key={index} className={styles.visitorItem}>
                      <span 
                        className={styles.visitorName} 
                        style={{ color: visitor.color || '#FFD700' }}
                      >
                        {visitor.username || 'Unknown Visitor'}
                      </span>
                      <span className={styles.visitorTimestamp}>
                        {formatDate(visitor.timestamp)}
                      </span>
                      {visitor.referrer && (
                        <span className={styles.visitorReferrer}>
                          from: {visitor.referrer}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

// NEW: Function to record visitor information
const recordVisitorEntry = () => {
  // Check if the user came through a portal
  const urlParams = new URLSearchParams(window.location.search);
  const isPortalVisitor = urlParams.get('portal') === 'true';
  
  if (!isPortalVisitor) return; // Only record portal visitors
  
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
  visitorLog.unshift(newVisitor); // Add to beginning of array
  
  // Limit to last 20 visitors
  if (visitorLog.length > 20) {
    visitorLog = visitorLog.slice(0, 20);
  }
  
  // Save back to localStorage
  localStorage.setItem('visitorLog', JSON.stringify(visitorLog));
};

// NEW: Temple-like Structure Component
interface TempleStructureProps {
  position: [number, number, number];
  rotationY?: number;
  infoText?: string | ReactNode; // Updated to accept ReactNode
}

const TempleStructure = ({ position, rotationY = 0, infoText }: TempleStructureProps) => {
  const platformSize: [number, number, number] = [15, 1, 15]; // Width, Height, Depth
  const columnHeight = 10;
  const columnRadius = 0.8;
  const cornerOffset = platformSize[0] / 2 - columnRadius * 1.5; // Offset columns slightly inward
  const tablePosition: [number, number, number] = [0, platformSize[1] + 0.75, 0]; // Center Y of table base
  const tableArgs: [number, number, number] = [platformSize[0] * 0.6, 16.5, 1]; // Actual table dimensions (W, H, D)

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Base Platform */}
      <Box args={platformSize} position={[0, platformSize[1] / 2, 0]}>
        <meshStandardMaterial
          color="#a0a0a0" // Light grey stone color
          roughness={0.8}
          metalness={0.2}
        />
      </Box>

      {/* Corner Columns */}
      {[
        [cornerOffset, platformSize[1] + columnHeight / 2, cornerOffset],
        [-cornerOffset, platformSize[1] + columnHeight / 2, cornerOffset],
        [cornerOffset, platformSize[1] + columnHeight / 2, -cornerOffset],
        [-cornerOffset, platformSize[1] + columnHeight / 2, -cornerOffset],
      ].map((colPos, i) => (
        <Cylinder key={i} args={[columnRadius, columnRadius, columnHeight, 16]} position={colPos as [number, number, number]}>
          <meshStandardMaterial
            color="#b0b0b0" // Slightly different grey
            roughness={0.7}
            metalness={0.3}
          />
        </Cylinder>
      ))}

      {/* Conditionally render Info Table and Text */}
      {infoText && (
        <>
          <Box args={tableArgs} position={tablePosition}>
            <meshStandardMaterial
              color="#555555"
              roughness={0.5}
              metalness={0.1}
           />
          </Box>
          {typeof infoText === 'string' ? (
            <Text
              position={[
                  tablePosition[0], // Same X as table
                  tablePosition[1] + tableArgs[1] / 2 - 0.2, // Position near top edge of table
                  tablePosition[2] + tableArgs[2] / 2 + 0.05 // Position slightly in front of table's front face
              ]}
              rotation={[0, 0, 0]} // Stand upright
              fontSize={0.35}
              color="#FFFFFF"
              anchorX="center"
              anchorY="top" // Anchor text block to its top edge
              maxWidth={tableArgs[0] * 0.9}
              lineHeight={1.5}
              whiteSpace="normal"
              overflowWrap="break-word"
            >
              {infoText}
            </Text>
          ) : (
            // If it's a ReactNode, just render it directly
            infoText
          )}
        </>
      )}
    </group>
  );
};

// Renamed and Redesigned: MarsLabEnvironment -> MuseumEnvironment
const MuseumEnvironment = () => {
  // Create a wide, museum-like environment
  const floorSize = 200;
  const wallHeight = 30;

  // Define the text content for each temple
  const leftTempleText = (
    <Html transform position={[0, 5.5, 0.55]} className="content" style={{ width: '270px', pointerEvents: 'auto' }}>
      <div style={{ 
        color: 'white', 
        fontSize: '14px', 
        lineHeight: '1.5',
        textAlign: 'left',
        padding: '10px'
      }}>
        <h3 style={{ marginBottom: '10px', fontSize: '16px' }}>[GAMEPLAY]</h3>
        <ul style={{ paddingLeft: '20px', fontSize: '13px' }}>
          <li>Start New Colony</li>
          <li>3 Main Buildings, 5 buildables</li>
          <li>Balance Power/Water and various resources</li>
          <li>accumulate Research Points (=RP)</li>
          <li>unlock upgrades</li>
          <li>SOON: 3d Puzzle Area & Flavor</li>
        </ul>
      </div>
    </Html>
  );

  const rightTempleText = (
    <Html transform position={[0, 5.5, 0.55]} className="content" style={{ width: '270px', pointerEvents: 'auto' }}>
      <div style={{ 
        color: 'white', 
        fontSize: '14px', 
        lineHeight: '1.5',
        textAlign: 'left',
        padding: '10px'
      }}>
        <h3 style={{ marginBottom: '10px', fontSize: '16px' }}>
          <a 
            href="./changes.html" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              color: '#3498db', 
              textDecoration: 'underline',
              fontWeight: 'bold'
            }}
          >
            CLICK HERE FOR RECENT CHANGES
          </a>
        </h3>
        
        <p style={{ marginBottom: '15px', fontSize: '13px' }}>
          Latest update: Mobile Responsiveness Enhancement - Updated the mobile UI experience across multiple components including improved viewport settings for better scaling on mobile devices.
        </p>
        
        <h3 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '16px' }}>[SCOPE]</h3>
        <ul style={{ paddingLeft: '20px', fontSize: '13px' }}>
          <li>Research embodiment 3D puzzles</li>
          <li>AI progressively embodies</li>
          <li>AI can help colony more efficiently</li>
          <li>Unlock more game complexity</li>
        </ul>
      </div>
    </Html>
  );

  return (
    <group>
      {/* Polished Floor */}
      <Plane args={[floorSize, floorSize]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <meshStandardMaterial
          color="#cccccc" // Light polished stone/concrete
          roughness={0.3}
          metalness={0.4}
          envMapIntensity={0.5} // Add slight reflections if environment map is present
        />
      </Plane>

      {/* Optional: Faint Grid Overlay on floor */}
      <gridHelper args={[floorSize, 40, '#888888', '#bbbbbb']} position={[0, 0.01, 0]} />

      {/* Surrounding Walls (Optional - can leave open or add partial walls) */}
       {/* Example: Back Wall */}
       <Plane args={[floorSize, wallHeight]} position={[0, wallHeight/2, -floorSize/2]} rotation={[0, 0, 0]}>
         <meshStandardMaterial color="#b0b0b0" side={THREE.DoubleSide} roughness={0.8} />
       </Plane>
       {/* Example: Side Walls */}
       <Plane args={[floorSize, wallHeight]} position={[-floorSize/2, wallHeight/2, 0]} rotation={[0, Math.PI/2, 0]}>
          <meshStandardMaterial color="#b0b0b0" side={THREE.DoubleSide} roughness={0.8} />
       </Plane>
       <Plane args={[floorSize, wallHeight]} position={[floorSize/2, wallHeight/2, 0]} rotation={[0, -Math.PI/2, 0]}>
           <meshStandardMaterial color="#b0b0b0" side={THREE.DoubleSide} roughness={0.8} />
       </Plane>
       {/* Front wall left open for entry view */}

       {/* NEW: Add Treasure Chest for Entry Log */}
       <TreasureChest
         position={[-15, 0, -35]}
         rotation={[0, Math.PI / 1, 0]}
         scale={1.8}
       />

       {/* Temple Structures with specific text */}
       <TempleStructure
         position={[-30, 0, -25]}
         rotationY={Math.PI / 6}
         infoText={leftTempleText}
       />
       <TempleStructure // Center temple - NO info text, will hold portal
         position={[0, 0, -40]}
         rotationY={0}
       />
       <TempleStructure
         position={[30, 0, -25]}
         rotationY={-Math.PI / 6}
         infoText={rightTempleText}
       />

      {/* Atmosphere/Fog - Kept subtle */}
      {/* Removed the explicit plane, relying on scene fog now */}
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

const PortalToVibeverse = forwardRef<THREE.Group, PortalProps>(({ position = [0, 2, -15], scale = 0.4 }, ref) => {
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

// Define the type for the handle exposed by Player
export interface PlayerHandle {
  handleMobileMove: (data: { x: number; y: number }) => void;
  handleMobileLook: (data: { x: number; y: number }) => void;
  getPosition: () => THREE.Vector3;
}

interface PlayerProps {
    handleRef?: React.Ref<PlayerHandle>;
    position?: [number, number, number];
    invertLook?: boolean; // Add invert look prop
}

// Simple player representation - Separated Group ref and Handle ref
const Player = forwardRef<THREE.Group, PlayerProps>(({ position = [0, 0, 5], handleRef, invertLook = false }, ref) => {
    const [playerPosition, setPlayerPosition] = useState(() => new THREE.Vector3(...position));
    const speed = useRef(0.15);
    const lookSensitivity = useRef(0.05); // Sensitivity for look rotation
    const mouseLookSensitivity = useRef(0.005); // Sensitivity for mouse look - lower than joystick
    const keys = useRef<Record<string, boolean>>({});
    const mobileMoveInput = useRef({ x: 0, y: 0 }); // Rename for clarity
    const mobileLookInput = useRef({ x: 0, y: 0 }); // New ref for look input
    const isMouseDown = useRef(false);
    const lastMousePosition = useRef({ x: 0, y: 0 });
    const floatOffset = useRef(0);
    const shouldAutoLevel = useRef(false); // Track if auto-leveling should occur
    const autoLevelSpeed = 0.05; // Speed of auto-leveling
    const forwardDirection = useRef(new THREE.Vector3(0, 0, -1));
    const sphereRef = useRef<THREE.Group>(null);
    const particlesRef = useRef<THREE.Points>(null);
    const mainSphereRef = useRef<THREE.Mesh>(null);
    const secondSphereRef = useRef<THREE.Mesh>(null);
    const timeRef = useRef(0);
    
    // Keyboard controls setup
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { 
            keys.current[e.code] = true;
        };
        const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Mouse controls for desktop users
    useEffect(() => {
        const handleMouseDown = (e: MouseEvent) => {
            // Only handle left mouse button (button 0)
            if (e.button === 0) {
                isMouseDown.current = true;
                shouldAutoLevel.current = false; // Stop auto-leveling while dragging
                lastMousePosition.current = { x: e.clientX, y: e.clientY };
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (isMouseDown.current) {
                // Calculate mouse movement delta
                const deltaX = e.clientX - lastMousePosition.current.x;
                const deltaY = e.clientY - lastMousePosition.current.y;
                
                if (ref && typeof ref !== 'function' && ref.current) {
                    // Ensure proper rotation order
                    ref.current.rotation.order = 'YXZ';
                    
                    // Apply horizontal rotation first (prevents gimbal lock issues)
                    ref.current.rotation.y -= deltaX * mouseLookSensitivity.current;
                    
                    // Then vertical rotation - apply inversion if needed
                    const verticalDelta = invertLook ? deltaY : -deltaY;
                    ref.current.rotation.x += verticalDelta * mouseLookSensitivity.current;
                    
                    // Clamp vertical rotation with slightly increased margin
                    const maxVerticalRotation = Math.PI / 2 - 0.15;
                    ref.current.rotation.x = Math.max(-maxVerticalRotation, 
                                                 Math.min(maxVerticalRotation, ref.current.rotation.x));
                    
                    // Normalize Y rotation
                    if (ref.current.rotation.y > Math.PI) {
                        ref.current.rotation.y -= 2 * Math.PI;
                    } else if (ref.current.rotation.y < -Math.PI) {
                        ref.current.rotation.y += 2 * Math.PI;
                    }
                    
                    // Update the quaternion
                    ref.current.updateMatrixWorld();
                }
                
                // Update last position
                lastMousePosition.current = { x: e.clientX, y: e.clientY };
            }
        };

        const handleMouseUp = () => {
            isMouseDown.current = false;
            // Start auto-leveling after drag finishes
            shouldAutoLevel.current = true;
        };

        const handleMouseLeave = () => {
            isMouseDown.current = false;
            shouldAutoLevel.current = true;
        };

        // Add event listeners to the document
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mouseleave', handleMouseLeave);

        // Clean up
        return () => {
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [ref, invertLook]); // Add invertLook to dependencies

    // Expose custom methods using useImperativeHandle, BUT link it to the SEPARATE handleRef prop
    useImperativeHandle(handleRef, () => ({ // Use handleRef prop here
        handleMobileMove: (data: { x: number; y: number }) => {
            mobileMoveInput.current = data; // Store the mobile input
        },
        handleMobileLook: (data: { x: number; y: number }) => { // Add look handler
            mobileLookInput.current = data; // Store the look input
        },
        getPosition: () => playerPosition,
    }), [playerPosition]);


    useFrame((state, delta) => {
        const moveDirection = new THREE.Vector3(0, 0, 0);
        // --- Keyboard Movement ---
        if (keys.current['KeyW'] || keys.current['ArrowUp']) moveDirection.z -= 1;
        if (keys.current['KeyS'] || keys.current['ArrowDown']) moveDirection.z += 1;
        if (keys.current['KeyA'] || keys.current['ArrowLeft']) moveDirection.x -= 1;
        if (keys.current['KeyD'] || keys.current['ArrowRight']) moveDirection.x += 1;

        // --- Mobile Movement ---
        // Apply mobile input if no keyboard input OR if it's the only input source
        if ((moveDirection.lengthSq() === 0 && (mobileMoveInput.current.x !== 0 || mobileMoveInput.current.y !== 0)) ||
            (mobileMoveInput.current.x !== 0 || mobileMoveInput.current.y !== 0)) {
            moveDirection.x += mobileMoveInput.current.x;
            moveDirection.z -= mobileMoveInput.current.y; // Y joystick maps to Z movement
        }

        // --- Apply Movement with improved rotation handling ---
        if (moveDirection.lengthSq() > 0) {
            moveDirection.normalize();
            
            // Apply movement relative to player's current rotation
            if (ref && typeof ref !== 'function' && ref.current) {
                const rotatedDirection = moveDirection.clone().applyQuaternion(ref.current.quaternion);
                setPlayerPosition(current => current.clone().add(rotatedDirection.multiplyScalar(speed.current)));
                
                // Reset auto-leveling if the player is moving
                shouldAutoLevel.current = false;
            } else {
                // Fallback if ref not ready
                setPlayerPosition(current => current.clone().add(moveDirection.multiplyScalar(speed.current)));
            }
        }

        // --- Normalize rotation to prevent flipping ---
        if (ref && typeof ref !== 'function' && ref.current) {
            // Normalize Y rotation to keep it between -π and π
            if (ref.current.rotation.y > Math.PI) {
                ref.current.rotation.y -= 2 * Math.PI;
            } else if (ref.current.rotation.y < -Math.PI) {
                ref.current.rotation.y += 2 * Math.PI;
            }
            
            // Prevent flipping by clamping rotation more strictly
            const maxVerticalRotation = Math.PI / 2 - 0.15; // Increased margin to prevent edge cases
            if (ref.current.rotation.x > maxVerticalRotation) {
                ref.current.rotation.x = maxVerticalRotation;
            } else if (ref.current.rotation.x < -maxVerticalRotation) {
                ref.current.rotation.x = -maxVerticalRotation;
            }
            
            // Ensure rotation order is correctly set (YXZ is typically best for first-person controls)
            ref.current.rotation.order = 'YXZ';
            
            // Update the quaternion after changing rotation
            ref.current.updateMatrixWorld();
        }

        // --- Auto-level rotation ---
        if (shouldAutoLevel.current && ref && typeof ref !== 'function' && ref.current) {
            // Smoothly interpolate back to horizontal (0) rotation
            if (Math.abs(ref.current.rotation.x) > 0.01) { // Only adjust if not already close to level
                // Adaptive auto-leveling - faster recovery from extreme angles
                const absRotation = Math.abs(ref.current.rotation.x);
                const normalizedRotation = absRotation / (Math.PI / 2); // 0 to 1 scale
                
                // Higher recovery speed when at more extreme angles
                let recoverySpeed = autoLevelSpeed;
                if (normalizedRotation > 0.6) {
                    // Up to 3x faster recovery from extreme angles
                    recoverySpeed = autoLevelSpeed * (1 + normalizedRotation * 2);
                }
                
                // Apply smoothing with the adaptive recovery speed
                ref.current.rotation.x *= (1 - recoverySpeed);
                
                // If very close to zero, just snap to level
                if (Math.abs(ref.current.rotation.x) < 0.01) {
                    ref.current.rotation.x = 0;
                    shouldAutoLevel.current = false; // Stop auto-leveling once complete
                }
            } else {
                ref.current.rotation.x = 0; // Snap to exactly 0 when close
                shouldAutoLevel.current = false; // Stop auto-leveling once complete
            }
        }

         // --- Mobile Look Rotation with improved handling ---
         if (ref && typeof ref !== 'function' && ref.current && (mobileLookInput.current.x !== 0 || mobileLookInput.current.y !== 0)) {
             // Ensure proper rotation order
             ref.current.rotation.order = 'YXZ';
             
             // Horizontal rotation (always apply first)
             ref.current.rotation.y -= mobileLookInput.current.x * lookSensitivity.current;
             
             // Add vertical rotation for mobile controls, with inversion support
             if (mobileLookInput.current.y !== 0) {
                 // Apply Y input to X rotation (vertical look) with inversion
                 const verticalInput = invertLook ? mobileLookInput.current.y : -mobileLookInput.current.y;
                 
                 // Calculate the potential new rotation to check if it would exceed limits
                 const potentialNewRotation = ref.current.rotation.x + (verticalInput * lookSensitivity.current);
                 
                 // Define strict rotation limits - slightly tighter than the general max
                 const maxVerticalRotation = Math.PI / 2 - 0.2; // More conservative limit for mobile
                 
                 // Check if the potential rotation would exceed limits
                 if (potentialNewRotation > maxVerticalRotation || potentialNewRotation < -maxVerticalRotation) {
                     // If we're already close to limits, apply very reduced movement
                     if (Math.abs(ref.current.rotation.x) > maxVerticalRotation * 0.8) {
                         // Apply greatly reduced movement - allows small adjustments even near limits
                         ref.current.rotation.x += verticalInput * lookSensitivity.current * 0.2;
                     } else {
                         // Apply moderately reduced movement when getting close to limits
                         ref.current.rotation.x += verticalInput * lookSensitivity.current * 0.5;
                     }
                 } else {
                     // Normal case - full rotation speed when not near limits
                     ref.current.rotation.x += verticalInput * lookSensitivity.current;
                 }
                 
                 // Final safety clamp to absolutely ensure we don't exceed limits
                 const absoluteMaxRotation = Math.PI / 2 - 0.1;
                 ref.current.rotation.x = Math.max(-absoluteMaxRotation, 
                                              Math.min(absoluteMaxRotation, ref.current.rotation.x));
                 
                 // Disable auto-leveling while actively looking with mobile controls
                 shouldAutoLevel.current = false;
             }
         } else if (!isMouseDown.current && !mobileLookInput.current.x && !mobileLookInput.current.y) {
             // Enable auto-leveling when not using mobile look controls and not dragging
             shouldAutoLevel.current = true;
         }

        // No longer resetting mobile inputs each frame - they are managed by MobileControls
        
        // Update player mesh position using the forwarded group ref
        if (ref && typeof ref !== 'function' && ref.current) {
            ref.current.position.copy(playerPosition);
            // Crucially update world matrix for bounding box calculations AND rotation changes
            ref.current.updateMatrixWorld(true); // Force update including descendants
        }
        
        // Update time values for animations - simpler animation approach
        timeRef.current += delta;
        
        // Animate floating effect
        floatOffset.current += delta * 1.5;
        if (sphereRef.current) {
            sphereRef.current.position.y = 1.0 + Math.sin(floatOffset.current) * 0.2;
            sphereRef.current.rotation.y += delta * 0.5;
        }
        
        // Animate particles with less computation
        if (particlesRef.current && particlesRef.current.geometry.attributes.position) {
            const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
            // Only update a subset of particles each frame for better performance
            const updateCount = Math.min(positions.length / 3, 20); // Update up to 20 particles per frame
            const startIdx = Math.floor(Math.random() * (positions.length / 3 - updateCount)) * 3;
            
            for (let i = 0; i < updateCount * 3; i += 3) {
                const idx = startIdx + i;
                // Simple sine-based movement
                positions[idx] += Math.sin(timeRef.current + idx * 0.01) * 0.001;
                positions[idx+1] += Math.cos(timeRef.current + idx * 0.01) * 0.001;
                
                // Simple boundary check
                const dist = Math.sqrt(positions[idx]**2 + positions[idx+1]**2 + positions[idx+2]**2);
                if (dist > 2) {
                    positions[idx] *= 0.98;
                    positions[idx+1] *= 0.98;
                    positions[idx+2] *= 0.98;
                }
            }
            particlesRef.current.geometry.attributes.position.needsUpdate = true;
        }
        
        // Simplified material animation
        if (mainSphereRef.current?.material) {
            const mat = mainSphereRef.current.material as THREE.MeshStandardMaterial;
            mat.emissiveIntensity = 0.2 + Math.sin(timeRef.current * 2) * 0.1;
        }
        
        if (secondSphereRef.current?.material) {
            const mat = secondSphereRef.current.material as THREE.MeshStandardMaterial;
            mat.emissiveIntensity = 0.2 + Math.sin(timeRef.current * 2 + Math.PI) * 0.1;
        }
    });

    const generateNebulaSphere = (radius: number, count: number) => {
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        
        for (let i = 0; i < count; i++) {
            const idx = i * 3;
            // Create points in a spherical volume with more density near the surface
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const rho = radius * (0.8 + Math.random() * 0.6); // Between 80% and 140% of radius
            
            positions[idx] = rho * Math.sin(phi) * Math.cos(theta);
            positions[idx+1] = rho * Math.sin(phi) * Math.sin(theta);
            positions[idx+2] = rho * Math.cos(phi);
            
            // Create color gradient between blue and teal
            const mixFactor = Math.random();
            // Blue to teal color mapping with variation
            colors[idx] = 0.08 + mixFactor * 0.02; // R: from blue (0.08) to teal (0.10)
            colors[idx+1] = 0.4 + mixFactor * 0.44; // G: from blue (0.4) to teal (0.84)
            colors[idx+2] = 0.9 - mixFactor * 0.28; // B: from blue (0.9) to teal (0.62)
            
            // Varied particle sizes - but keep them smaller
            sizes[i] = 0.01 + Math.random() * 0.03;
        }
        
        return { positions, colors, sizes };
    };
    
    // Create simpler noise texture for performance
    const generateNoiseTexture = () => {
        const size = 64; // Smaller texture size
        const data = new Uint8Array(size * size * 4);
        
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const idx = (i * size + j) * 4;
                
                // Simpler noise pattern
                const nx = i / size * 4;
                const ny = j / size * 4;
                
                // Simple noise approximation
                const noise = Math.sin(nx) * Math.sin(ny) * 0.5;
                
                const value = (noise + 1) * 0.5 * 255;
                
                data[idx] = value;
                data[idx+1] = value;
                data[idx+2] = value;
                data[idx+3] = 255;
            }
        }
        
        const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.needsUpdate = true;
        return texture;
    };
    
    // Create textures only once with reduced particle count for mobile
    const noiseTexture = useMemo(() => generateNoiseTexture(), []);
    const nebulaData = useMemo(() => generateNebulaSphere(1.5, 200), []); // Reduced from 1000 to 200 particles

    // Assign the forwarded ref (for the Group) directly to the group element
    return (
        <group ref={ref} position={position}> {/* Use the forwarded 'ref' directly */}
            {/* Direction indicator arrow */}
            <arrowHelper args={[new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 1.2, 0), 1, 0xffff00]} />
            
            {/* Floating Yin-Yang sphere */}
            <group ref={sphereRef} position={[0, 1.0, 0]}>
                {/* Nebula particles - reduced count for performance */}
                <points ref={particlesRef}>
                    <bufferGeometry>
                        <bufferAttribute attach="attributes-position" count={nebulaData.positions.length / 3} array={nebulaData.positions} itemSize={3} />
                        <bufferAttribute attach="attributes-color" count={nebulaData.colors.length / 3} array={nebulaData.colors} itemSize={3} />
                        <bufferAttribute attach="attributes-size" count={nebulaData.sizes.length} array={nebulaData.sizes} itemSize={1} />
                    </bufferGeometry>
                    <pointsMaterial 
                        size={0.05} 
                        vertexColors={true} 
                        transparent={true} 
                        opacity={0.7}
                        depthWrite={false}
                        blending={THREE.AdditiveBlending}
                        sizeAttenuation={true}
                    />
                </points>
                
                {/* Main sphere - blue side with simplified materials */}
                <mesh ref={mainSphereRef}>
                    <sphereGeometry args={[0.8, 32, 32]} /> {/* Reduced from 64 to 32 segments */}
                    <meshStandardMaterial 
                        color="#1E88E5" 
                        roughness={0.2} 
                        metalness={0.8} 
                        emissive="#1E88E5" 
                        emissiveIntensity={0.4}
                        bumpMap={noiseTexture}
                        bumpScale={0.02}
                    />
                </mesh>
                
                {/* Complementary half-sphere with simplified materials */}
                <mesh ref={secondSphereRef} position={[0, 0, 0]} rotation={[0, 0, Math.PI]}>
                    <sphereGeometry args={[0.82, 32, 32, 0, Math.PI]} /> {/* Reduced from 64 to 32 segments */}
                    <meshStandardMaterial 
                        color="#06D6A0" 
                        roughness={0.2} 
                        metalness={0.8} 
                        emissive="#06D6A0" 
                        emissiveIntensity={0.4}
                        bumpMap={noiseTexture}
                        bumpScale={0.02}
                    />
                </mesh>
                
                {/* Small teal dot in blue side with glow */}
                <mesh position={[0, 0.4, 0]}>
                    <sphereGeometry args={[0.16, 16, 16]} /> {/* Already optimized */}
                    <meshStandardMaterial 
                        color="#06D6A0" 
                        roughness={0.1} 
                        metalness={0.9} 
                        emissive="#06D6A0" 
                        emissiveIntensity={0.7}
                    />
                </mesh>
                
                {/* Small blue dot in teal side with glow */}
                <mesh position={[0, -0.4, 0]}>
                    <sphereGeometry args={[0.16, 16, 16]} /> {/* Already optimized */}
                    <meshStandardMaterial 
                        color="#1E88E5" 
                        roughness={0.1} 
                        metalness={0.9} 
                        emissive="#1E88E5" 
                        emissiveIntensity={0.7}
                    />
                </mesh>
                
                {/* Single light for better performance */}
                <pointLight position={[0, 0, 0]} distance={4} intensity={1.2} color="#FFFFFF" />
                
                {/* Reduced energy beam effect */}
                <group rotation={[0, Math.PI/4, 0]}>
                    {[...Array(3)].map((_, i) => ( // Reduced from 5 to 3 beams
                        <mesh key={i} position={[0, 0, 0]} rotation={[0, Math.PI * 2 * i / 3, 0]}>
                            <torusGeometry args={[0.9, 0.02, 6, 16, Math.PI * 0.3]} /> {/* Simplified geometry */}
                            <meshBasicMaterial 
                                color={i % 2 === 0 ? "#1E88E5" : "#06D6A0"} 
                                transparent={true} 
                                opacity={0.7} 
                            />
                        </mesh>
                    ))}
                </group>
            </group>
        </group>
    );
});

// Display names for debugging
PortalToVibeverse.displayName = 'PortalToVibeverse';
StartPortal.displayName = 'StartPortal';
Player.displayName = 'Player';

// Main scene content component
interface SceneContentProps {
    invertLook?: boolean;
}

const SceneContent = forwardRef<
    {
        handleMobileInput: (data: { x: number; y: number }) => void;
        handleMobileLook: (data: { x: number; y: number }) => void;
    },
    SceneContentProps
>((props, ref) => {
    const setGameView = useGameStore(state => state.setGameView);
    const previousGameView = useGameStore(state => state.previousGameView);
    const currentRound = useGameStore(state => state.currentRound);
    const activeTasks = useGameStore(state => state.activeTasks);
    const playerGroupRef = useRef<THREE.Group | null>(null);
    const playerHandleRef = useRef<PlayerHandle | null>(null);
    const exitPortalBoxRef = useRef(new THREE.Box3());
    const startPortalBoxRef = useRef(new THREE.Box3());
    const exitPortalRef = useRef<THREE.Group | null>(null);
    const startPortalRef = useRef<THREE.Group | null>(null);
    const controlsRef = useRef<any>(null);
    const [cameFromPortal, setCameFromPortal] = useState(false);
    const [refUrl, setRefUrl] = useState('');
    const [showInstructions, setShowInstructions] = useState(false);
    const [showAbout, setShowAbout] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    // Handler for MOVE input
    const handleMobileInputInternal = (data: { x: number; y: number }) => {
        playerHandleRef.current?.handleMobileMove?.(data); // Use optional chaining
    };

    // NEW: Handler for LOOK input
    const handleMobileLookInternal = (data: { x: number; y: number }) => {
        playerHandleRef.current?.handleMobileLook?.(data); // Use optional chaining
    };

    useImperativeHandle(ref, () => ({
        handleMobileInput: handleMobileInputInternal,
        handleMobileLook: handleMobileLookInternal, // Expose the look handler
    }), [handleMobileInputInternal, handleMobileLookInternal]); // Add new handler to dependencies

    const handleReturnToColony = () => {
        setGameView('management');
    };

    // Check if a colony exists (round > 1 or active tasks exist)
    const colonyExists = () => {
        return currentRound > 1 || Object.keys(activeTasks).length > 0;
    };

    // Handle Start Colony button click
    const handleStartColony = () => {
        // If a colony already exists, show confirmation dialog
        if (colonyExists()) {
            setShowConfirmation(true);
        } else {
            // No existing colony, start a new one directly
            setGameView('management');
        }
    };

    // Handle confirmation to start a new colony
    const handleConfirmNewColony = () => {
        // Reset game state
        const { resetColony } = useGameStore.getState();
        resetColony(); // This will reset state and set gameView to 'management'
        setShowConfirmation(false);
    };

    // Cancel new colony creation
    const handleCancelNewColony = () => {
        setShowConfirmation(false);
    };

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const hasPortalParam = urlParams.get('portal') === 'true';
        const refUrlParam = urlParams.get('ref');
        let startPos = new THREE.Vector3(0, 0, 5);
        if (hasPortalParam && refUrlParam) {
            setCameFromPortal(true);
            setRefUrl(refUrlParam);
            startPos = new THREE.Vector3(0, 0, 15);
        }
        if (controlsRef.current) {
            controlsRef.current.target.copy(startPos);
            controlsRef.current.update();
        }
    }, []);

    useFrame((state) => {
        const { camera } = state;
        if (!playerGroupRef.current || !playerHandleRef.current || !controlsRef.current) return;

        const playerWorldPos = playerGroupRef.current.position; // Get position directly from group ref now
        const playerQuaternion = playerGroupRef.current.quaternion; // Get rotation

        // Calculate camera offset relative to player's rotation
        const cameraOffset = new THREE.Vector3(0, 5, 12); // Base offset behind player
        const rotatedOffset = cameraOffset.clone().applyQuaternion(playerQuaternion);
        const desiredCameraPosition = playerWorldPos.clone().add(rotatedOffset);

        // Smoothly move camera to desired position
        camera.position.lerp(desiredCameraPosition, 0.05);

        // Camera always looks at the player's position with slight adjustment for vertical look
        // Calculate a look target that's slightly ahead of the player based on rotation
        const lookOffset = new THREE.Vector3(0, 0, -5); // Look ahead of player
        const rotatedLookOffset = lookOffset.clone().applyQuaternion(playerQuaternion);
        const lookTarget = playerWorldPos.clone().add(rotatedLookOffset);
        camera.lookAt(lookTarget);

        // Update OrbitControls target
        if (controlsRef.current) {
             controlsRef.current.target.lerp(lookTarget, 0.1); // Now follow the look target instead of just player position
             controlsRef.current.update(); // Necessary after manual target change
        }


        if (!exitPortalRef.current && !startPortalRef.current) return;
        if (playerGroupRef.current instanceof THREE.Object3D) {
            const playerBox = new THREE.Box3().setFromObject(playerGroupRef.current);
            const interactionDistance = 3;
            if (exitPortalRef.current) {
                exitPortalBoxRef.current.setFromObject(exitPortalRef.current);
                const portalCenter = exitPortalBoxRef.current.getCenter(new THREE.Vector3());
                const playerCenter = playerBox.getCenter(new THREE.Vector3());
                const portalDistance = playerCenter.distanceTo(portalCenter);
                if (portalDistance < interactionDistance && playerBox.intersectsBox(exitPortalBoxRef.current)) {
                    const currentParams = new URLSearchParams(window.location.search); const newParams = new URLSearchParams(); newParams.append('portal', 'true'); newParams.append('username', 'DerechPlayer'); newParams.append('color', 'blue'); newParams.append('speed', '5'); const currentHost = window.location.host; const currentPath = window.location.pathname; const refValue = `${currentHost}${currentPath}`; newParams.append('ref', refValue); for (const [key, value] of currentParams) { if (key !== 'ref' && key !== 'portal') { newParams.append(key, value); } } const paramString = newParams.toString(); window.location.href = 'https://portal.pieter.com' + (paramString ? '?' + paramString : '');
                }
            }
            if (startPortalRef.current && cameFromPortal) {
                 startPortalBoxRef.current.setFromObject(startPortalRef.current);
                 const portalCenter = startPortalBoxRef.current.getCenter(new THREE.Vector3());
                 const playerCenter = playerBox.getCenter(new THREE.Vector3());
                 const portalDistance = playerCenter.distanceTo(portalCenter);
                 if (portalDistance < interactionDistance && playerBox.intersectsBox(startPortalBoxRef.current)) {
                     let url = refUrl; if (!url.startsWith('http://') && !url.startsWith('https://')) { url = 'https://' + url; } const currentParams = new URLSearchParams(window.location.search); const newParams = new URLSearchParams(); for (const [key, value] of currentParams) { if (key !== 'ref' && key !== 'portal') { newParams.append(key, value); } } const paramString = newParams.toString(); window.location.href = url + (paramString ? '?' + paramString : '');
                 }
             }
          }
    });

    const instructionsText = `[INSTRUCTIONS]
1. START COLONY MISSION: Enter Management Mode.
2. RETURN TO 3D AREA: Use the PORTAL ROOM button.`;

    return (
        <>
            <ambientLight intensity={0.6} color="#d0d0e0" />
            <directionalLight position={[-20, 30, 20]} intensity={1.0} castShadow color="#ffffff" shadow-mapSize={[1024, 1024]} shadow-camera-left={-50} shadow-camera-right={50} shadow-camera-top={50} shadow-camera-bottom={-50} shadow-camera-far={100} shadow-camera-near={1}/>
            <SpotLight position={[0, 25, 10]} angle={0.5} penumbra={0.4} intensity={1.5} color="#fff8f0" castShadow distance={80} decay={1}/>
            <SpotLight position={[-30, 20, -15]} angle={0.4} penumbra={0.5} intensity={1} color="#f0e8ff" distance={60} decay={1.2} />
            <SpotLight position={[30, 20, -15]} angle={0.4} penumbra={0.5} intensity={1} color="#f0e8ff" distance={60} decay={1.2} />
            <SpotLight position={[0, 20, -30]} angle={0.4} penumbra={0.5} intensity={1} color="#f0e8ff" distance={60} decay={1.2} />
            <hemisphereLight color="#e0e5ff" groundColor="#606080" intensity={0.4} />
            <Stars radius={150} depth={80} count={1500} factor={5} fade speed={0.5} />
            <MuseumEnvironment />
            <Player ref={playerGroupRef} handleRef={playerHandleRef} key="player-component" invertLook={props.invertLook} />

            <InteractiveButton position={[0, 1.5, 0]} text="Start Colony Mission" onClick={handleStartColony} color="#4CAF50"/>
            <InteractiveButton position={[8, 1.5, 0]} text="About" onClick={() => { setShowAbout(!showAbout); setShowInstructions(false); }} color="#2196F3"/>
            <InteractiveButton
                position={[-8, 1.5, 0]}
                text="Instructions"
                onClick={() => {
                    setShowInstructions(!showInstructions);
                    setShowAbout(false);
                }}
                color="#FFC107"
            />
            
            {/* Add Return to Colony button if coming from management */}
            {previousGameView === 'management' && (
                <InteractiveButton
                    position={[0, 3, 0]}
                    text="Return to Colony"
                    onClick={handleReturnToColony}
                    color="#FF5722" // Orange color to differentiate it
                />
            )}

            {/* Confirmation Dialog for Starting New Colony */}
            {showConfirmation && (
                <Html
                    position={[0, 4, 0]}
                    center
                    occlude
                >
                    <div
                        style={{
                            background: 'rgba(34, 34, 34, 0.9)',
                            color: 'white',
                            padding: '20px',
                            borderRadius: '8px',
                            width: '300px',
                            fontFamily: 'sans-serif',
                            fontSize: '14px',
                            textAlign: 'center',
                            border: '2px solid #FF5722',
                            boxShadow: '0 0 10px rgba(0,0,0,0.5)'
                        }}
                    >
                        <p style={{ margin: '0 0 15px 0', fontWeight: 'bold', fontSize: '16px' }}>Warning!</p>
                        <p style={{ margin: '0 0 20px 0' }}>
                            You already have a colony in progress. Starting a new colony mission will reset your current progress.
                            <br /><br />
                            Are you sure you want to proceed?
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleConfirmNewColony();
                                }}
                                style={{
                                    background: '#4CAF50',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Start New Colony
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelNewColony();
                                }}
                                style={{
                                    background: '#F44336',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </Html>
            )}

            {showInstructions && (
                <group position={[-8, 4, 0]}>
                    <Plane args={[7, 2.5]} rotation={[0, 0, 0]} >
                         <meshStandardMaterial color="#222222" side={THREE.DoubleSide} transparent opacity={0.8} />
                    </Plane>
                    <Text
                         position={[0, 0, 0.1]}
                         fontSize={0.3}
                         color="#FFFFFF"
                         maxWidth={6.5}
                         lineHeight={1.4}
                         anchorX="center"
                         anchorY="middle"
                         whiteSpace="normal"
                         overflowWrap="break-word"
                    >
                        {instructionsText}
                    </Text>
                </group>
            )}

             {showAbout && (
                <Html
                    position={[8, 2.5, 0]}
                    center
                    occlude
                >
                    <div
                        style={{
                            background: 'rgba(34, 34, 34, 0.8)',
                            color: 'white',
                            padding: '15px 20px',
                            borderRadius: '5px',
                            width: '250px',
                            fontFamily: 'sans-serif',
                            fontSize: '14px',
                            textAlign: 'center',
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowAbout(false);
                        }}
                    >
                        <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>[ABOUT]</p>
                        <p style={{ margin: 0 }}>
                            Derech Project by{' '}
                            <a
                                href="https://x.com/rawlph"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#61dafb' }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                @rawlph
                            </a>
                        </p>
                         <p style={{ margin: '10px 0 0 0', fontSize: '12px', opacity: 0.7 }}>(Click to close)</p>
                    </div>
                </Html>
            )}

            <PortalToVibeverse ref={exitPortalRef} position={[0, 2, -40]} scale={0.5} />
            {cameFromPortal && <StartPortal ref={startPortalRef} position={[0, 2, 15]} />}
            <OrbitControls
                ref={controlsRef}
                enablePan={false}
                enableRotate={false}
                enableZoom={true}
                maxPolarAngle={Math.PI / 2 + 0.2}
                minPolarAngle={Math.PI / 16}
                minDistance={3}
                maxDistance={20}
            />
        </>
    );
});

// Main component
const WelcomeScene = () => {
    // Set to true to enable debug logging for mobile controls
    const DEBUG_MOBILE_CONTROLS = false;
    
    const [isLoading, setIsLoading] = useState(true);
    // Add invertLook state with localStorage persistence
    const [invertLook, setInvertLook] = useState(() => {
        // Try to load from localStorage on mount
        try {
            const savedValue = localStorage.getItem('invertLook');
            return savedValue === 'true';
        } catch (e) {
            return false; // Default to false if localStorage fails
        }
    });
    
    const sceneContentRef = useRef<{
        handleMobileInput: (data: { x: number; y: number }) => void;
        handleMobileLook: (data: { x: number; y: number }) => void;
    } | null>(null);

    // Save invertLook preference to localStorage when it changes
    useEffect(() => {
        try {
            localStorage.setItem('invertLook', invertLook.toString());
        } catch (e) {
            console.error('Failed to save invertLook preference to localStorage:', e);
        }
    }, [invertLook]);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1500);
        
        // NEW: Record visitor entry when component mounts
        recordVisitorEntry();
        
        return () => clearTimeout(timer);
    }, []);

    const handleMobileInput = (data: { x: number; y: number }) => {
        sceneContentRef.current?.handleMobileInput?.(data);
    };

    const handleMobileLook = (data: { x: number; y: number }) => {
        sceneContentRef.current?.handleMobileLook?.(data);
    };

    // Toggle handler for invertLook
    const toggleInvertLook = () => {
        setInvertLook(prev => !prev);
    };

    return (
        <div className={styles.sceneContainer}>
            {isLoading && ( <div className={styles.loadingOverlay}> <div className={styles.loadingSpinner} /> <p>Loading PORTAL ROOM...</p> </div> )}
            <div className={styles.canvasContainer}>
                <Canvas shadows camera={{ position: [0, 15, 25], fov: 60 }}>
                    <color attach="background" args={['#1a1a2a']} />
                    <fog attach="fog" args={['#303045', 30, 120]} />
                    <Suspense fallback={null}>
                        <SceneContent ref={sceneContentRef} invertLook={invertLook} />
                    </Suspense>
                </Canvas>
            </div>
            
            {/* Settings Panel */}
            <div className={styles.settingsPanel}>
                <div className={styles.settingsTitle}>
                    <span>⚙️ Controls</span>
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
                    <span>Invert Look</span>
                </div>
            </div>
            
            <div className={styles.controlsInfo}>
                Desktop: WASD, Mouse Drag Look<br/>
                Mobile: Left stick move, Right stick look
            </div>
            <MobileControls 
                onMove={handleMobileInput} 
                onLook={handleMobileLook} 
                debug={DEBUG_MOBILE_CONTROLS}
                invertLook={invertLook}
            />
        </div>
    );
};

SceneContent.displayName = 'SceneContent';

export default WelcomeScene; 