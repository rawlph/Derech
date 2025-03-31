import { Canvas, useThree } from '@react-three/fiber';
import HexGrid from '@components/management/HexGrid';
import { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
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
            // Access the underlying WebGL context
            const glContext = gl.getContext() as WebGLRenderingContext;
            if (glContext) {
                const loseContext = glContext.getExtension('WEBGL_lose_context');
                if (loseContext) {
                    console.log('ManagementScene: Forcing WebGL context reset');
                    // Release resources immediately
                    loseContext.loseContext();
                    // Restore after a short delay (optional)
                    setTimeout(() => {
                        try {
                            loseContext.restoreContext();
                            console.log('ManagementScene: WebGL context restored');
                        } catch (e) {
                            // Ignore errors during restoration
                        }
                    }, 100);
                }
            }
        };
    }, [gl]);
    
    return null;
};

const ManagementScene = () => {
    return (
        // Ensure canvas allows shadows
        <Canvas shadows orthographic>
            {/* The camera prop can be used for initial settings, but ColonyCameraSetup handles it now */}
            {/* <camera position={[0, 35, 15]} zoom={1} near={0.1} far={1000} /> */}
            <color attach="background" args={['#502825']} /> {/* Slightly brighter Mars reddish-brown */}
            <fog attach="fog" args={['#502825', 70, 180]} /> {/* Match background color, slightly increased visible range */}
            <HexGrid />
            <SceneCleanup />
        </Canvas>
    );
};

export default ManagementScene; 