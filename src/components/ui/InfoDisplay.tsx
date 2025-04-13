import React, { useRef, useMemo } from 'react';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface InfoDisplayProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
  depth?: number;
  title?: string;
  content: string | React.ReactNode;
  titleColor?: string;
  backgroundColor?: string;
  emissiveColor?: string;
  emissiveIntensity?: number;
  htmlContent?: boolean;
  htmlScale?: number;
  maxWidth?: number;
  contentFontSize?: number;
  contentLineHeight?: number;
  disableOcclusion?: boolean;
  frameColor?: string;
  glowColor?: string;
  glowIntensity?: number;
  occludeOpacity?: number;
  distanceFactor?: number;
  zIndexRange?: [number, number];
}

/**
 * InfoDisplay component - a black monolith-like display with text
 * Can display either 3D text or HTML content
 * Now with a sci-fi frame around it
 */
const InfoDisplay: React.FC<InfoDisplayProps> = ({
  position = [0, 1, 0],
  rotation = [0, 0, 0],
  width = 4,
  height = 2.5,
  depth = 0.2,
  title,
  content,
  titleColor = '#FFFFFF',
  backgroundColor = '#008080',
  emissiveColor = '#008080',
  emissiveIntensity = 0.3,
  htmlContent = false,
  htmlScale = 0.1,
  maxWidth = 400,
  contentFontSize = 0.15,
  contentLineHeight = 1.3,
  disableOcclusion = false,
  frameColor = '#333333',
  glowColor = '#00ccff',
  glowIntensity = 0.5,
  occludeOpacity = 0.3,
  distanceFactor,
  zIndexRange = [0, 10]
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const frameRef = useRef<THREE.Group>(null);
  const glowPulseRef = useRef<number>(0);
  
  // Animate glow pulse effect
  useFrame((_, delta) => {
    glowPulseRef.current += delta * 1.5;
    if (glowPulseRef.current > Math.PI * 2) {
      glowPulseRef.current -= Math.PI * 2;
    }
    
    // Apply subtle glow animation to frame elements
    if (frameRef.current) {
      frameRef.current.children.forEach(child => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          // Only affect materials with glow
          if (child.userData.isGlowing) {
            const pulseValue = (Math.sin(glowPulseRef.current) + 1) * 0.5; // 0 to 1
            child.material.emissiveIntensity = glowIntensity * 0.5 + pulseValue * glowIntensity * 0.5;
          }
        }
      });
    }
  });

  // Calculate position adjustment based on font size to maintain proper spacing
  const contentTopPosition = height/2 - 1.0 - (contentFontSize - 0.15);
  
  // Generate frame materials
  const frameMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: frameColor,
      roughness: 0.4,
      metalness: 0.8
    });
  }, [frameColor]);
  
  const glowMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: glowColor,
      roughness: 0.3,
      metalness: 0.5,
      emissive: glowColor,
      emissiveIntensity: glowIntensity
    });
  }, [glowColor, glowIntensity]);
  
  // Border width for frame elements
  const borderWidth = 0.08;
  const cornerSize = 0.15;
  
  // Creates a corner piece for the frame
  const createCorner = (xPos: number, yPos: number, rotation: number = 0) => {
    return (
      <group position={[xPos * (width/2 + borderWidth/2), yPos * (height/2 + borderWidth/2), 0]} rotation={[0, 0, rotation]}>
        {/* Corner piece */}
        <mesh material={frameMaterial} position={[0, 0, 0]}>
          <boxGeometry args={[cornerSize * 2, cornerSize * 2, depth + 0.05]} />
        </mesh>
        
        {/* Glowing accent */}
        <mesh 
          material={glowMaterial} 
          position={[0, 0, depth/2 + 0.03]}
          userData={{ isGlowing: true }}
        >
          <ringGeometry args={[cornerSize * 0.4, cornerSize * 0.6, 16]} />
        </mesh>
      </group>
    );
  };
  
  // Creates a "tech detail" element
  const createTechDetail = (pos: [number, number, number], size: [number, number, number] = [0.2, 0.2, 0.05]) => {
    return (
      <group position={pos}>
        <mesh material={frameMaterial}>
          <boxGeometry args={size} />
        </mesh>
        
        {/* Small glowing accent */}
        <mesh 
          material={glowMaterial} 
          position={[0, 0, size[2]/2 + 0.01]} 
          scale={[0.5, 0.5, 1]}
          userData={{ isGlowing: true }}
        >
          <circleGeometry args={[size[0] * 0.3, 8]} />
        </mesh>
      </group>
    );
  };
  
  // Create an anchor/mounting point
  const createAnchor = (xPos: number, yPos: number) => {
    return (
      <group position={[xPos, yPos, -depth/2 - 0.1]}>
        <mesh material={frameMaterial}>
          <cylinderGeometry args={[0.08, 0.15, 0.3, 8]} />
        </mesh>
        
        {/* Connection "wires" */}
        <mesh material={frameMaterial} position={[0, -0.2, 0]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.4, 6]} />
        </mesh>
        
        {/* Glow tip */}
        <mesh 
          material={glowMaterial} 
          position={[0, 0, -0.15]} 
          userData={{ isGlowing: true }}
        >
          <sphereGeometry args={[0.05, 8, 8]} />
        </mesh>
      </group>
    );
  };

  // HTML content with improved occlusion
  const htmlContentElement = useMemo(() => {
    if (!htmlContent) return null;
    
    return (
      <Html
        position={[0, height/2 - 1.2, depth/2 + 0.01]}
        transform
        scale={htmlScale}
        occlude={!disableOcclusion}
        // @ts-ignore - Additional props for improved occlusion
        occludeOpacity={occludeOpacity}
        zIndexRange={zIndexRange}
        distanceFactor={distanceFactor}
        style={{
          width: `${maxWidth}px`,
          backgroundColor: 'transparent',
          padding: '10px',
          color: 'white',
          textAlign: 'center',
        }}
      >
        {content}
      </Html>
    );
  }, [content, height, depth, htmlScale, htmlContent, disableOcclusion, maxWidth, occludeOpacity, zIndexRange, distanceFactor]);

  return (
    <group 
      position={position} 
      rotation={new THREE.Euler(...rotation)}
    >
      {/* Frame assembly */}
      <group ref={frameRef}>
        {/* Frame border - horizontal parts */}
        <mesh 
          material={frameMaterial} 
          position={[0, (height/2 + borderWidth/2), 0]}
        >
          <boxGeometry args={[width + borderWidth*2, borderWidth, depth + 0.02]} />
        </mesh>
        
        <mesh 
          material={frameMaterial} 
          position={[0, -(height/2 + borderWidth/2), 0]}
        >
          <boxGeometry args={[width + borderWidth*2, borderWidth, depth + 0.02]} />
        </mesh>
        
        {/* Frame border - vertical parts */}
        <mesh 
          material={frameMaterial} 
          position={[(width/2 + borderWidth/2), 0, 0]}
        >
          <boxGeometry args={[borderWidth, height, depth + 0.02]} />
        </mesh>
        
        <mesh 
          material={frameMaterial} 
          position={[-(width/2 + borderWidth/2), 0, 0]}
        >
          <boxGeometry args={[borderWidth, height, depth + 0.02]} />
        </mesh>
        
        {/* Corner pieces */}
        {createCorner(1, 1, 0)}
        {createCorner(-1, 1, Math.PI/2)}
        {createCorner(1, -1, -Math.PI/2)}
        {createCorner(-1, -1, Math.PI)}
        
        {/* Tech details scattered around the frame */}
        {createTechDetail([width/2 - 0.6, height/2 + borderWidth, 0])}
        {createTechDetail([-width/2 + 0.6, height/2 + borderWidth, 0])}
        {createTechDetail([width/2 - 0.4, -height/2 - borderWidth, 0])}
        {createTechDetail([-width/2 + 0.4, -height/2 - borderWidth, 0])}
        
        {/* Side tech details */}
        {createTechDetail([width/2 + borderWidth, height/3, 0], [0.05, 0.3, 0.08])}
        {createTechDetail([-width/2 - borderWidth, -height/3, 0], [0.05, 0.3, 0.08])}
        
        {/* Mounting anchors */}
        {createAnchor(width/2 - 0.5, 0)}
        {createAnchor(-width/2 + 0.5, 0)}
        
        {/* Glowing edges along the central display */}
        <mesh 
          material={glowMaterial} 
          position={[0, height/2, depth/2 + 0.01]} 
          userData={{ isGlowing: true }}
        >
          <boxGeometry args={[width - 0.3, 0.03, 0.01]} />
        </mesh>
        
        <mesh 
          material={glowMaterial} 
          position={[0, -height/2, depth/2 + 0.01]} 
          userData={{ isGlowing: true }}
        >
          <boxGeometry args={[width - 0.3, 0.03, 0.01]} />
        </mesh>
      </group>
      
      {/* The monolith box */}
      <mesh 
        ref={meshRef}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial 
          color={backgroundColor}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          roughness={0.8}
        />
      </mesh>

      {/* Title - always uses 3D Text */}
      {title && (
        <Text
          position={[0, height/2 - 0.3, depth/2 + 0.01]}
          fontSize={0.25}
          color={titleColor}
          anchorX="center"
          anchorY="middle"
        >
          {title}
        </Text>
      )}

      {/* Content - can be either 3D Text or HTML */}
      {!htmlContent ? (
        <Text
          position={[0, contentTopPosition, depth/2 + 0.01]}
          fontSize={contentFontSize}
          color="#FFFFFF"
          anchorX="center"
          anchorY="top"
          maxWidth={width - 0.6} // Adjusted for larger font sizes
          lineHeight={contentLineHeight}
        >
          {content as string}
        </Text>
      ) : htmlContentElement}
    </group>
  );
};

export default InfoDisplay; 