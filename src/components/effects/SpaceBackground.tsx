import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

// Component for a single shooting star
const ShootingStar = ({ delay = 0 }) => {
  const ref = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  
  const startPosition = useMemo(() => {
    const x = (Math.random() - 0.5) * 200;
    const y = 50 + Math.random() * 40;
    const z = -50 - Math.random() * 50;
    return [x, y, z];
  }, []);
  
  const lifetime = useMemo(() => Math.random() * 15000 + 10000, []); // Longer lifetime for less frequent updates
  const startTime = useMemo(() => Date.now() + delay, [delay]);
  
  useFrame(() => {
    if (!ref.current || !materialRef.current) return;
    
    const elapsedTime = Date.now() - startTime;
    const cycleTime = lifetime;
    
    if (elapsedTime % cycleTime < 2000) {
      // Active phase
      ref.current.visible = true;
      const progress = (elapsedTime % 2000) / 2000;
      ref.current.position.set(
        startPosition[0] - progress * 100,
        startPosition[1] - progress * 80,
        startPosition[2]
      );
      
      // Fade out at the end of trajectory
      if (progress > 0.7) {
        materialRef.current.opacity = (1 - progress) * 3;
      } else {
        materialRef.current.opacity = 1;
      }
    } else {
      // Inactive phase
      ref.current.visible = false;
    }
  });
  
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.3, 4, 4]} />
      <meshBasicMaterial 
        ref={materialRef} 
        color="#FFFFFF" 
        transparent 
        opacity={1} 
      />
    </mesh>
  );
};

// Component for a distant moon
interface MoonProps {
  position: [number, number, number];
  size: number;
  color: string;
}

const Moon = ({ position, size, color }: MoonProps) => {
  return (
    <mesh position={position}>
      <sphereGeometry args={[size, 12, 12]} />
      <meshBasicMaterial
        color={color}
      />
    </mesh>
  );
};

// Main scene component with all space elements
const SpaceElements = () => {
  // Create a few shooting stars with different delays
  const shootingStars = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => (
      <ShootingStar key={i} delay={i * 3000} />
    ));
  }, []);
  
  // Create a few moons with different sizes and positions
  const moons = useMemo(() => [
    // Larger distant moon with slight red tint
    <Moon 
      key="moon1" 
      position={[-80, 40, -200]} 
      size={10} 
      color="#E0D0C8" 
    />,
    // Small moon with blueish tone
    <Moon 
      key="moon2" 
      position={[120, 20, -280]} 
      size={5} 
      color="#D0D8E0" 
    />
  ], []);
  
  return (
    <>
      {/* Reduced number of stars for better performance */}
      <Stars 
        radius={100}
        depth={50}
        count={2000}
        factor={5}
        saturation={0.6}
        fade={true}
        speed={0.1}
      />
      
      {/* Minimal ambient light */}
      <ambientLight intensity={0.1} />
      
      {/* Shooting stars */}
      {shootingStars}
      
      {/* Distant moons */}
      {moons}
    </>
  );
};

// Main component that renders the canvas
const SpaceBackground = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 0,
      pointerEvents: 'none',
    }}>
      <Canvas
        frameloop="demand"
        camera={{ position: [0, 0, 10], fov: 60 }}
        gl={{ 
          alpha: true, 
          antialias: false,
          powerPreference: 'default',
          depth: false
        }}
        style={{ background: 'transparent' }}
        performance={{ min: 0.5 }}
      >
        <SpaceElements />
      </Canvas>
    </div>
  );
};

export default SpaceBackground; 