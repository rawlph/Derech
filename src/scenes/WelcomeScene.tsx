import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Text, Stars, SpotLight, Plane, Cylinder, Box } from '@react-three/drei';
import { Suspense, useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { useGameStore } from '@store/store';
import MobileControls from '@components/MobileControls';
import styles from '@styles/WelcomeScene.module.css';

// NEW: Temple-like Structure Component
interface TempleStructureProps {
  position: [number, number, number];
  rotationY?: number;
  infoText?: string; // Optional prop for the text content
}

const TempleStructure = ({ position, rotationY = 0, infoText }: TempleStructureProps) => {
  const platformSize: [number, number, number] = [15, 1, 15]; // Width, Height, Depth
  const columnHeight = 10;
  const columnRadius = 0.8;
  const cornerOffset = platformSize[0] / 2 - columnRadius * 1.5; // Offset columns slightly inward
  const tablePosition: [number, number, number] = [0, platformSize[1] + 0.75, 0]; // Center Y of table base
  const tableArgs: [number, number, number] = [platformSize[0] * 0.6, 9.5, 1]; // Actual table dimensions (W, H, D)

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
          <Text
            position={[
                tablePosition[0], // Same X as table
                tablePosition[1] + tableArgs[1] / 2 - 0.2, // Position near top edge of table (Center Y + Half Height - Small Offset)
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
  const leftTempleText = `[DERECH MOSES GAMEPLAY]
- You manage a Mars Colony.
- Balance Resources
  (Power, Water, Materials, Goods, Workforce)
- Acquire RP (Research Points)
- Unlock upgrades & complexity.
- TO BE ADDED: immersive puzzles & flavor`;

  const rightTempleText = `[PLANNED NEXT]
- Refine game balance
- Add story progression (AI Embodiment)

[SCOPE]
- Research embodiment 3D puzzles
- AI progressively embodies
- AI can help colony more efficiently
- Unlock more game complexity`;

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
  getPosition: () => THREE.Vector3;
}

// Add a new prop type for Player to accept the handle ref
interface PlayerProps extends PortalProps { // Include existing PortalProps if needed
    handleRef?: React.Ref<PlayerHandle>;
}

// Simple player representation - Separated Group ref and Handle ref
const Player = forwardRef<THREE.Group, PlayerProps>(({ position = [0, 0, 5], handleRef }, ref) => {
  const [playerPosition, setPlayerPosition] = useState(() => new THREE.Vector3(...position));
  const speed = useRef(0.15);
  const keys = useRef<Record<string, boolean>>({});
  const mobileInput = useRef({ x: 0, y: 0 });
  // No internal groupRef needed now, forwardRef ('ref') handles the Group

  // Keyboard controls setup (remains the same)
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.code] = true; };
      const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      return () => {
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('keyup', handleKeyUp);
      };
  }, []);

  // Expose custom methods using useImperativeHandle, BUT link it to the SEPARATE handleRef prop
  useImperativeHandle(handleRef, () => ({ // Use handleRef prop here
      handleMobileMove: (data: { x: number; y: number }) => {
          mobileInput.current = data;
      },
      getPosition: () => playerPosition,
  }), [playerPosition]);


  useFrame(() => {
      // ... movement logic using setPlayerPosition ...
      const moveDirection = new THREE.Vector3(0, 0, 0);
      if (keys.current['KeyW'] || keys.current['ArrowUp']) moveDirection.z -= 1;
      if (keys.current['KeyS'] || keys.current['ArrowDown']) moveDirection.z += 1;
      if (keys.current['KeyA'] || keys.current['ArrowLeft']) moveDirection.x -= 1;
      if (keys.current['KeyD'] || keys.current['ArrowRight']) moveDirection.x += 1;
      if (moveDirection.lengthSq() === 0 && (mobileInput.current.x !== 0 || mobileInput.current.y !== 0)) {
          moveDirection.x += mobileInput.current.x;
          moveDirection.z -= mobileInput.current.y;
      }
      if (moveDirection.lengthSq() > 0) {
          moveDirection.normalize();
          setPlayerPosition(current => current.clone().add(moveDirection.multiplyScalar(speed.current)));
      }
      mobileInput.current = { x: 0, y: 0 };

      // Update player mesh position using the forwarded group ref
      if (ref && typeof ref !== 'function' && ref.current) {
          ref.current.position.copy(playerPosition);
          // Crucially update world matrix for bounding box calculations
          ref.current.updateMatrixWorld();
      }
  });

  // Assign the forwarded ref (for the Group) directly to the group element
  return (
     <group ref={ref} position={position}> {/* Use the forwarded 'ref' directly */}
         <mesh position={[0, 0.75, 0]}>
             <capsuleGeometry args={[0.5, 0.5, 4, 8]} />
             <meshStandardMaterial color="#1E90FF" />
         </mesh>
     </group>
  );
});

// Display names for debugging
PortalToVibeverse.displayName = 'PortalToVibeverse';
StartPortal.displayName = 'StartPortal';
Player.displayName = 'Player';

// Main scene content component
const SceneContent = forwardRef<
    { handleMobileInput: (data: { x: number; y: number }) => void },
    {}
>((props, ref) => {
    const setGameView = useGameStore(state => state.setGameView);
    const playerGroupRef = useRef<THREE.Group | null>(null);
    const playerHandleRef = useRef<PlayerHandle | null>(null);
    const exitPortalBoxRef = useRef(new THREE.Box3());
    const startPortalBoxRef = useRef(new THREE.Box3());
    const exitPortalRef = useRef<THREE.Group | null>(null);
    const startPortalRef = useRef<THREE.Group | null>(null);
    const controlsRef = useRef<any>(null);
    const [cameFromPortal, setCameFromPortal] = useState(false);
    const [refUrl, setRefUrl] = useState('');
    const [showHelp, setShowHelp] = useState(false);
    const [showAbout, setShowAbout] = useState(false);

    const handleMobileInputInternal = (data: { x: number; y: number }) => {
        if (playerHandleRef.current?.handleMobileMove) {
            playerHandleRef.current.handleMobileMove(data);
        }
    };

    useImperativeHandle(ref, () => ({
        handleMobileInput: handleMobileInputInternal,
    }), [handleMobileInputInternal]);

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
        const playerWorldPos = playerHandleRef.current.getPosition();
        const cameraOffset = new THREE.Vector3(0, 5, 12);
        const desiredCameraPosition = playerWorldPos.clone().add(cameraOffset);
        camera.position.lerp(desiredCameraPosition, 0.05);
        camera.lookAt(playerWorldPos);

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
2. RETURN TO 3D AREA: Use the Research Center in Management Mode.`;

    const aboutText = `[ABOUT]
Derech Project by @rawlph`;

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
            <Player ref={playerGroupRef} handleRef={playerHandleRef} key="player-component" />

            <InteractiveButton position={[0, 1.5, 0]} text="Start Colony Mission" onClick={() => setGameView('management')} color="#4CAF50"/>
            <InteractiveButton position={[8, 1.5, 0]} text="About" onClick={() => { setShowAbout(!showAbout); setShowHelp(false); }} color="#2196F3"/>
            <InteractiveButton
                position={[-8, 1.5, 0]}
                text="Instructions"
                onClick={() => {
                    setShowHelp(!showHelp);
                    setShowAbout(false);
                }}
                color="#FFC107"
            />

            {showHelp && (
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
                <group position={[8, 4, 0]}>
                    <Plane args={[5, 1.5]} rotation={[0, 0, 0]}>
                         <meshStandardMaterial color="#222222" side={THREE.DoubleSide} transparent opacity={0.8}/>
                    </Plane>
                    <Text
                         position={[0, 0, 0.1]}
                         fontSize={0.35}
                         color="#FFFFFF"
                         maxWidth={4.5}
                         lineHeight={1.4}
                         anchorX="center"
                         anchorY="middle"
                         whiteSpace="normal"
                         overflowWrap="break-word"
                    >
                         {aboutText}
                    </Text>
                </group>
            )}

            <PortalToVibeverse ref={exitPortalRef} position={[0, 2, -40]} scale={0.5} />
            {cameFromPortal && <StartPortal ref={startPortalRef} position={[0, 2, 15]} />}
            <OrbitControls ref={controlsRef} enablePan={false} enableZoom={true} maxPolarAngle={Math.PI / 2 - 0.05} minPolarAngle={0} minDistance={3} maxDistance={80}/>
        </>
    );
});

// Main component
const WelcomeScene = () => {
    const [isLoading, setIsLoading] = useState(true);
    const sceneContentRef = useRef<{ handleMobileInput: (data: { x: number; y: number }) => void } | null>(null);

    useEffect(() => {
      const timer = setTimeout(() => setIsLoading(false), 1500);
      return () => clearTimeout(timer);
    }, []);

    const handleMobileInput = (data: { x: number; y: number }) => {
         if (sceneContentRef.current?.handleMobileInput) {
             sceneContentRef.current.handleMobileInput(data);
         } else {
             console.warn('SceneContent handleMobileInput not available yet.');
         }
    };

    return (
        <div className={styles.sceneContainer}>
            {isLoading && ( <div className={styles.loadingOverlay}> <div className={styles.loadingSpinner} /> <p>Loading Museum Portal...</p> </div> )}
            <div className={styles.canvasContainer}>
                <Canvas shadows camera={{ position: [0, 15, 25], fov: 60 }}>
                    <color attach="background" args={['#1a1a2a']} />
                    <fog attach="fog" args={['#303045', 30, 120]} />
                    <Suspense fallback={null}>
                        <SceneContent ref={sceneContentRef} />
                    </Suspense>
                </Canvas>
            </div>
            <div className={styles.controlsInfo}> WASD / Arrow Keys: Move | Mouse Drag: Look | Click: Interact </div>
            <MobileControls onMove={handleMobileInput} />
        </div>
    );
};

SceneContent.displayName = 'SceneContent';

export default WelcomeScene; 