import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Color, CatmullRomCurve3 } from 'three';
import * as THREE from 'three';
import { useGameStore } from '@/store/store';
import { axialToWorld } from '@/utils/hexUtils';

interface FuelLineProps {
  from: Vector3;
  to: Vector3;
  color: string;
  thickness?: number;
  materialRef: React.RefObject<THREE.ShaderMaterial>;
}

// New approach: Separate the shader material creation
const createShaderMaterial = (color: string) => {
  return new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      color: { value: new Color(color) },
      flowOffset: { value: 0 },
      glowIntensity: { value: 0.6 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float flowOffset;
      uniform float glowIntensity;
      varying vec2 vUv;
      
      void main() {
        // Flow effect
        float flow = mod(vUv.x - flowOffset, 1.0);
        float flowGlow = smoothstep(0.0, 0.5, flow) * smoothstep(1.0, 0.5, flow) * 0.8;
        
        // Edge glow effect
        float edgeGlow = smoothstep(0.0, 0.4, vUv.y) * smoothstep(1.0, 0.6, vUv.y);
        
        // Combine effects
        vec3 finalColor = color * (0.4 + flowGlow + edgeGlow * glowIntensity);
        float opacity = 0.6 + flowGlow * 0.4;
        
        gl_FragColor = vec4(finalColor, opacity);
      }
    `
  });
};

const FuelLine: React.FC<FuelLineProps> = ({ from, to, color, thickness = 0.05, materialRef }) => {
  // Calculate midpoint for a slight curve
  const midpoint = new Vector3(
    (from.x + to.x) / 2,
    (from.y + to.y) / 2 + 0.3, // Slight lift in the middle
    (from.z + to.z) / 2
  );

  const numPoints = 20;
  const points = [];
  
  // Create curved line points
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    // Quadratic Bezier curve
    const x = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * midpoint.x + t * t * to.x;
    const y = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * midpoint.y + t * t * to.y;
    const z = (1 - t) * (1 - t) * from.z + 2 * (1 - t) * t * midpoint.z + t * t * to.z;
    points.push(new Vector3(x, y, z));
  }

  return (
    <mesh>
      <tubeGeometry args={[
        new CatmullRomCurve3(points),
        32,
        thickness,
        8,
        false
      ]} />
      <primitive object={materialRef.current || createShaderMaterial(color)} attach="material" />
    </mesh>
  );
};

const InitialFuelLines: React.FC = () => {
  const { gl, scene, camera } = useThree();
  const gridTiles = useGameStore(state => state.gridTiles);
  const dialogueMessage = useGameStore(state => state.dialogueMessage);
  
  // Refs for shader materials - initialized using useState instead of direct assignments
  const [materials, setMaterials] = useState<{
    research: THREE.ShaderMaterial | null,
    living: THREE.ShaderMaterial | null,
    production: THREE.ShaderMaterial | null
  }>({
    research: null,
    living: null,
    production: null
  });
  
  // Refs to access the materials
  const researchLineRef = useRef<THREE.ShaderMaterial>(null);
  const livingLineRef = useRef<THREE.ShaderMaterial>(null);
  const productionLineRef = useRef<THREE.ShaderMaterial>(null);
  
  // Animation frame ref to clean up
  const animationFrameRef = useRef<number | null>(null);
  
  // Flag to track if we need to force animation
  const [forceAnimate, setForceAnimate] = useState(false);
  
  // Initialize materials on component mount
  useEffect(() => {
    // Create materials
    const researchMaterial = createShaderMaterial('#4287f5');
    const livingMaterial = createShaderMaterial('#42f56f');
    const productionMaterial = createShaderMaterial('#f5a142');
    
    // Update state with created materials
    setMaterials({
      research: researchMaterial,
      living: livingMaterial,
      production: productionMaterial
    });
    
    return () => {
      // Dispose materials on unmount
      if (researchMaterial) researchMaterial.dispose();
      if (livingMaterial) livingMaterial.dispose();
      if (productionMaterial) productionMaterial.dispose();
    };
  }, []);
  
  // Set up animation loop using requestAnimationFrame
  useEffect(() => {
    let lastTime = 0;
    
    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000; // Convert to seconds
      lastTime = time;
      
      // Update all shader materials
      const updateMaterial = (material: THREE.ShaderMaterial | null) => {
        if (material && material.uniforms) {
          const currentOffset = material.uniforms.flowOffset.value || 0;
          material.uniforms.flowOffset.value = (currentOffset + delta * 0.5) % 1.0;
          material.needsUpdate = true;
        }
      };
      
      // Update materials from state
      updateMaterial(materials.research);
      updateMaterial(materials.living);
      updateMaterial(materials.production);
      
      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(animate);
      
      // Force a render to ensure updates are visible
      gl.render(scene, camera);
    };
    
    // Start animation loop
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      // Clean up animation loop on unmount
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [gl, scene, camera, materials]);
  
  // Special handling for dialogue visibility
  useEffect(() => {
    if (dialogueMessage?.isVisible && !forceAnimate) {
      // Dialogue is visible, force animations to keep running
      setForceAnimate(true);
      
      // Force material updates
      if (materials.research) materials.research.needsUpdate = true;
      if (materials.living) materials.living.needsUpdate = true;
      if (materials.production) materials.production.needsUpdate = true;
    }
  }, [dialogueMessage, forceAnimate, materials]);
  
  // Set up initial coordinates
  const centerTile = gridTiles["0,0"]; // 0,0 coordinate
  const researchDome = gridTiles["-1,0"]; // -1,0 coordinate
  const livingDome = gridTiles["-1,1"]; // -1,1 coordinate
  const productionDome = gridTiles["0,1"]; // 0,1 coordinate
  
  // If tiles don't exist yet, don't render
  if (!centerTile || !researchDome || !livingDome || !productionDome) {
    return null;
  }
  
  // Calculate 3D positions
  const centerPos = axialToWorld(centerTile.q, centerTile.r);
  const researchPos = axialToWorld(researchDome.q, researchDome.r);
  const livingPos = axialToWorld(livingDome.q, livingDome.r);
  const productionPos = axialToWorld(productionDome.q, productionDome.r);
  
  // Adjust y position slightly above ground
  const yOffset = 0.05;
  
  // Create position vectors
  const center = new Vector3(centerPos.x, yOffset, centerPos.z);
  const research = new Vector3(researchPos.x, yOffset, researchPos.z);
  const living = new Vector3(livingPos.x, yOffset, livingPos.z);
  const production = new Vector3(productionPos.x, yOffset, productionPos.z);

  return (
    <group>
      <FuelLine 
        from={research} 
        to={center} 
        color="#4287f5" 
        thickness={0.04} 
        materialRef={{ current: materials.research }}
      />
      <FuelLine 
        from={living} 
        to={center} 
        color="#42f56f" 
        thickness={0.04} 
        materialRef={{ current: materials.living }}
      />
      <FuelLine 
        from={production} 
        to={center} 
        color="#f5a142" 
        thickness={0.04} 
        materialRef={{ current: materials.production }}
      />
    </group>
  );
};

export default InitialFuelLines; 