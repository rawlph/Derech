import { Canvas, useThree } from '@react-three/fiber';
import HexGrid from '@components/management/HexGrid';
import { useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import FloatingResourceNumbers from '@components/management/FloatingResourceNumbers';
import RoundTransition from '@components/management/RoundTransition';
// Removed MainScene.module.css import as it's deleted

// Helper component to handle cleanup when Scene unmounts
const SceneCleanup = () => {
    const { gl } = useThree();
    
    useEffect(() => {
        // When component unmounts
        return () => {
            // Clear all GLTF cached models
            useGLTF.clear([]);
            
            // Force context loss and restoration
            const glContext = gl.getContext() as WebGLRenderingContext;
            if (glContext) {
                const loseContext = glContext.getExtension('WEBGL_lose_context');
                if (loseContext) {
                    console.log('ManagementScene: Forcing WebGL context reset');
                    loseContext.loseContext();
                    setTimeout(() => {
                        try {
                            loseContext.restoreContext();
                            console.log('ManagementScene: WebGL context restored');
                        } catch (e) {
                            // Ignore errors
                        }
                    }, 100);
                }
            }
        };
    }, [gl]);
    
    return null;
};

// Removed BackgroundFixer component

const ManagementScene = () => {
    // Removed containerRef and related useEffect
    
    return (
        // Container div removed, rely on App.tsx container
        <Canvas 
            shadows 
            orthographic
            gl={{ 
                alpha: true, // Enable transparency
                antialias: true,
                stencil: false,
                depth: true,
                premultipliedAlpha: false,
                preserveDrawingBuffer: false,
                powerPreference: 'high-performance'
            }}
            onCreated={({ gl, scene, camera }) => {
                // Ensure scene background is null (transparent)
                scene.background = null;
                gl.setClearColor(0, 0); // Transparent clear color
                gl.render(scene, camera);
            }}
            style={{ background: 'transparent' }} // Explicitly transparent
        >
            {/* <color attach="background" args={['#251210']} /> Removed */}
            
            <HexGrid />
            <FloatingResourceNumbers />
            <RoundTransition />
            <SceneCleanup />
        </Canvas>
    );
};

export default ManagementScene; 