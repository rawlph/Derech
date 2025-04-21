import { Environment, OrbitControls, useGLTF, Sky, Preload } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect, useMemo } from 'react';
import ColonyCameraSetup from './ColonyCamera';
import HexTileInstances from './HexTileInstances';
import BuildingInstances from './BuildingInstances';
import TaskVisuals from './TaskVisuals';
import TaskProgressLines from './TaskProgressLines';
import TaskTransportModels from './TaskTransportModels';
import BaseConnectionLines from './BaseConnectionLines';
import InitialFuelLines from './InitialFuelLines';
import FlowProjectSite from './FlowProjectSite';
import StarterBuildingFloors from './StarterBuildingFloors';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { taskConfigs } from '@config/tasks';
import * as THREE from 'three';

const HexGrid = () => {
    const controlsRef = useRef<OrbitControlsImpl>(null);
    const { camera, gl, scene } = useThree();

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

    // Add soft shadows setup
    useEffect(() => {
        // Configure renderer for better shadows
        if (gl) {
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.2;
        }
        
        // Add subtle ambient occlusion
        scene.background = new THREE.Color('#3D1F1D');
    }, [gl, scene]);

    return (
        <>
            <ColonyCameraSetup />

            {/* --- Enhanced Lighting --- */}
            {/* Reduced ambient light for better shadow contrast */}
            <ambientLight intensity={0.4} color={'#E8D9C5'} />
            
            {/* Main directional light (sun) with improved shadows */}
            <directionalLight
                color={'#FFE0B3'}
                position={[50, 100, 30]}
                intensity={1.6}
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
            
            {/* Secondary rim light for depth */}
            <directionalLight 
                color={'#F08C8C'} 
                position={[-40, 20, -30]} 
                intensity={0.4} 
                castShadow={false} 
            />
            
            {/* Accent point light */}
            <pointLight
                position={[20, 15, 20]}
                intensity={30}
                color={'#FFC773'}
                distance={100}
                decay={2}
            />
            
            {/* Subtle blue fill from opposite side */}
            <pointLight
                position={[-30, 10, -20]}
                intensity={20}
                color={'#A6CFFF'}
                distance={80}
                decay={2}
            />

            {/* Sky for ambient light and atmosphere */}
            <Sky
                distance={450000}
                sunPosition={[50, 30, 30]}
                inclination={0.52}
                azimuth={0.25}
                mieCoefficient={0.001}
                mieDirectionalG={0.8}
                rayleigh={0.5}
                turbidity={10}
            />

            {/* Add environment map for subtle reflections */}
            <Environment 
                preset="sunset" 
                background={false}
                resolution={256} // Lower resolution for performance
            />

            {/* More realistic fog with gradient effect */}
            <fog attach="fog" args={['#7A3E3B', 90, 200]} />

            <HexTileInstances />
            <BuildingInstances />
            <TaskVisuals />
            <TaskProgressLines />
            <TaskTransportModels />
            <BaseConnectionLines />
            <InitialFuelLines />
            <StarterBuildingFloors />
            <FlowProjectSite />

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
            
            <Preload all />
        </>
    );
};

export default HexGrid; 