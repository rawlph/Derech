import { useThree, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

// This component now configures the main camera, it doesn't render one itself
const ColonyCameraSetup = () => {
    const { size, camera, invalidate } = useThree();
    const aspect = size.width / size.height;
    const isResizing = useRef(false);

    // --- Dynamic View Size Logic ---
    const isLandscape = aspect > 1;
    const portraitViewSize = 20;
    const landscapeViewSize = 16; // Adjusted based on previous tests
    const viewSize = useMemo(() => {
        return isLandscape ? landscapeViewSize : portraitViewSize;
    }, [isLandscape]);
    // ---

    // Store previous size to detect changes
    const [prevSize, setPrevSize] = useState({ width: size.width, height: size.height });

    // Effect to handle resizing and trigger updates
    useEffect(() => {
        // Check if size actually changed
        if (size.width !== prevSize.width || size.height !== prevSize.height) {
             console.log(
                "Camera Size Changed - W:", size.width, "H:", size.height,
                "Aspect:", aspect.toFixed(2), "Landscape:", isLandscape, "ViewSize:", viewSize
            );

            // Update the camera properties directly
            if (camera instanceof THREE.OrthographicCamera) {
                camera.left = (-aspect * viewSize) / 2;
                camera.right = (aspect * viewSize) / 2;
                camera.top = viewSize / 2;
                camera.bottom = -viewSize / 2;
                camera.updateProjectionMatrix(); // Crucial: Update matrix after changing bounds
                console.log("Orthographic bounds updated, projection matrix updated.");
            }
             setPrevSize({ width: size.width, height: size.height }); // Update previous size
             invalidate(); // Force R3F re-render
        }
    }, [size, aspect, viewSize, camera, prevSize, invalidate]); // Dependencies


    // Set initial camera properties only once on mount
    useEffect(() => {
         // We can be more certain it's Orthographic now due to the Canvas prop
         if (camera instanceof THREE.OrthographicCamera) {
            camera.position.set(0, 35, 15);
            camera.zoom = 1;
            camera.lookAt(0, 0, 0);
            
            // Set explicit near/far planes
            camera.near = 0.1;
            camera.far = 2000; // Increased far plane significantly
            
            const initialAspect = size.width / size.height;
            const initialViewSize = (initialAspect > 1) ? landscapeViewSize : portraitViewSize;
            camera.left = (-initialAspect * initialViewSize) / 2;
            camera.right = (initialAspect * initialViewSize) / 2;
            camera.top = initialViewSize / 2;
            camera.bottom = -initialViewSize / 2;
            camera.updateProjectionMatrix();
            console.log("Initial Orthographic Camera properties set (with far plane).");
            invalidate();
         }
    }, [camera, invalidate, size.width, size.height, landscapeViewSize, portraitViewSize]); // Added dependencies size, landscape/portraitViewSize

    // This component doesn't render anything itself
    return null;
};

export default ColonyCameraSetup; 