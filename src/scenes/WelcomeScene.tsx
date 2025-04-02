import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Text, Stars, SpotLight, Plane, Cylinder, Box, Html } from '@react-three/drei';
import { Suspense, useRef, useEffect, useState, forwardRef, useImperativeHandle, useMemo } from 'react';
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
  const leftTempleText = `[GAMEPLAY]
- Start New Colony
- 3 Main Buildings, 5 builables
- Balance Power/Water and various resources
- accumulate Research Points (=RP)
- unlock upgrades
- SOON: 3d Puzzle Area & Flavor`;

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
  handleMobileLook: (data: { x: number; y: number }) => void;
  getPosition: () => THREE.Vector3;
}

// Add a new prop type for Player to accept the handle ref
interface PlayerProps {
    handleRef?: React.Ref<PlayerHandle>;
    position?: [number, number, number];
}

// Simple player representation - Separated Group ref and Handle ref
const Player = forwardRef<THREE.Group, PlayerProps>(({ position = [0, 0, 5], handleRef }, ref) => {
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
    const sphereRef = useRef<THREE.Group>(null);
    const particlesRef = useRef<THREE.Points>(null);
    const mainSphereRef = useRef<THREE.Mesh>(null);
    const secondSphereRef = useRef<THREE.Mesh>(null);
    const timeRef = useRef(0);
    
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

    // Mouse controls for desktop users
    useEffect(() => {
        const handleMouseDown = (e: MouseEvent) => {
            // Only handle left mouse button (button 0)
            if (e.button === 0) {
                isMouseDown.current = true;
                lastMousePosition.current = { x: e.clientX, y: e.clientY };
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (isMouseDown.current) {
                // Calculate mouse movement delta
                const deltaX = e.clientX - lastMousePosition.current.x;
                
                // Update player rotation based on horizontal mouse movement
                if (ref && typeof ref !== 'function' && ref.current) {
                    ref.current.rotation.y -= deltaX * mouseLookSensitivity.current;
                }
                
                // Update last position
                lastMousePosition.current = { x: e.clientX, y: e.clientY };
            }
        };

        const handleMouseUp = () => {
            isMouseDown.current = false;
        };

        const handleMouseLeave = () => {
            isMouseDown.current = false;
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
    }, [ref]);

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

        // --- Apply Movement ---
        if (moveDirection.lengthSq() > 0) {
            moveDirection.normalize();
            // Apply movement relative to player's current rotation
            if (ref && typeof ref !== 'function' && ref.current) {
                 const rotatedDirection = moveDirection.clone().applyQuaternion(ref.current.quaternion);
                 setPlayerPosition(current => current.clone().add(rotatedDirection.multiplyScalar(speed.current)));
            } else {
                 // Fallback if ref not ready (shouldn't happen often)
                 setPlayerPosition(current => current.clone().add(moveDirection.multiplyScalar(speed.current)));
            }
        }

         // --- Mobile Look Rotation ---
         if (ref && typeof ref !== 'function' && ref.current && mobileLookInput.current.x !== 0) {
             // Rotate the player group around the Y axis based on the look joystick's X input
             ref.current.rotation.y -= mobileLookInput.current.x * lookSensitivity.current;
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
const SceneContent = forwardRef<
    {
        handleMobileInput: (data: { x: number; y: number }) => void;
        handleMobileLook: (data: { x: number; y: number }) => void;
    },
    {}
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

        // Camera always looks at the player's position
        camera.lookAt(playerWorldPos);

        // Update OrbitControls target to player position IF OrbitControls is used for rotation
        // If player rotation controls look, this might not be needed, or might need adjustment
        if (controlsRef.current) {
             controlsRef.current.target.lerp(playerWorldPos, 0.1); // Smoothly update target
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
            <Player ref={playerGroupRef} handleRef={playerHandleRef} key="player-component" />

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
    const [isLoading, setIsLoading] = useState(true);
    const sceneContentRef = useRef<{
        handleMobileInput: (data: { x: number; y: number }) => void;
        handleMobileLook: (data: { x: number; y: number }) => void;
    } | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    const handleMobileInput = (data: { x: number; y: number }) => {
        sceneContentRef.current?.handleMobileInput?.(data);
    };

    const handleMobileLook = (data: { x: number; y: number }) => {
        sceneContentRef.current?.handleMobileLook?.(data);
    };

    return (
        <div className={styles.sceneContainer}>
            {isLoading && ( <div className={styles.loadingOverlay}> <div className={styles.loadingSpinner} /> <p>Loading PORTAL ROOM...</p> </div> )}
            <div className={styles.canvasContainer}>
                <Canvas shadows camera={{ position: [0, 15, 25], fov: 60 }}>
                    <color attach="background" args={['#1a1a2a']} />
                    <fog attach="fog" args={['#303045', 30, 120]} />
                    <Suspense fallback={null}>
                        <SceneContent ref={sceneContentRef} />
                    </Suspense>
                </Canvas>
            </div>
            <div className={styles.controlsInfo}>
                Desktop: WASD, Mouse Drag Look<br/>
                Mobile: Left stick move, Right stick look
            </div>
            <MobileControls onMove={handleMobileInput} onLook={handleMobileLook} />
        </div>
    );
};

SceneContent.displayName = 'SceneContent';

export default WelcomeScene; 