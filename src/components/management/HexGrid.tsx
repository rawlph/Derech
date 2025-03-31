import { Environment, OrbitControls, Stats, useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect, useMemo } from 'react';
import ColonyCameraSetup from './ColonyCamera';
import HexTileInstances from './HexTileInstances';
import BuildingInstances from './BuildingInstances';
import TaskVisuals from './TaskVisuals';
import TaskProgressLines from './TaskProgressLines';
import TaskTransportModels from './TaskTransportModels';
import BaseConnectionLines from './BaseConnectionLines';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { taskConfigs } from '@config/tasks';

const HexGrid = () => {
    const controlsRef = useRef<OrbitControlsImpl>(null);
    const { camera, gl } = useThree();

    // Keep frame update for damping if needed
    useFrame(() => {
        if (controlsRef.current?.enabled && controlsRef.current.enableDamping) {
           controlsRef.current.update();
        }
    });

    // Preload task models (moved here as preloading hooks need to be called consistently)
    useMemo(() => {
        const modelPaths = new Set<string>();
        Object.values(taskConfigs).forEach(config => {
            if (config.operationalModelPath) {
                modelPaths.add(config.operationalModelPath);
            }
        });
        modelPaths.forEach(path => useGLTF.preload(path));
        // console.log("Preloading task models in HexGrid:", Array.from(modelPaths)); // Keep one log
    }, []);

    return (
        <>
            <ColonyCameraSetup />

            {/* --- Enhanced Lighting --- */}
            <ambientLight intensity={0.5} color={'#FFF8E8'} /> {/* Warmer ambient light */}
            
            {/* Main directional light (sun) */}
            <directionalLight
                color={'#FFF5E0'}
                position={[50, 80, 30]}
                intensity={1.8}
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-camera-near={0.5}
                shadow-camera-far={200}
                shadow-camera-left={-50}
                shadow-camera-right={50}
                shadow-camera-top={50}
                shadow-camera-bottom={-50}
                shadow-bias={-0.0001}
            />
            
            {/* Secondary fill light */}
            <directionalLight 
                color={'#FDE8CD'} 
                position={[-30, 40, -20]} 
                intensity={0.7} 
                castShadow={false} 
            />

            {/* Add environment map for reflections (especially for ice) */}
            <Environment 
                preset="sunset" 
                background={false}
            />

            <HexTileInstances />
            <BuildingInstances />
            <TaskVisuals />
            <TaskProgressLines />
            <TaskTransportModels />
            <BaseConnectionLines />

            <OrbitControls
                ref={controlsRef}
                args={[camera, gl.domElement]}
                enableZoom={true}
                enablePan={true}
                enableRotate={true}
                minPolarAngle={0}
                maxPolarAngle={Math.PI / 2.1}
                enableDamping={true}
                dampingFactor={0.1}
                target={[0, 0, 0]}
                rotateSpeed={1.2}
            />
            
            {/* Temporarily remove Environment */}
            {/* <Environment preset="sunset" /> */}

            <Stats />
        </>
    );
};

export default HexGrid; 