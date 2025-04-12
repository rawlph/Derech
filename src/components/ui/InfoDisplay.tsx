import React, { useRef } from 'react';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';

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
}

/**
 * InfoDisplay component - a black monolith-like display with text
 * Can display either 3D text or HTML content
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
  disableOcclusion = false
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Calculate position adjustment based on font size to maintain proper spacing
  const contentTopPosition = height/2 - 1.0 - (contentFontSize - 0.15);

  return (
    <group 
      position={position} 
      rotation={new THREE.Euler(...rotation)}
    >
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
      ) : (
        <Html
          position={[0, height/2 - 1.2, depth/2 + 0.01]}
          transform
          scale={htmlScale}
          occlude={!disableOcclusion}
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
      )}
    </group>
  );
};

export default InfoDisplay; 