import { Environment, OrbitControls, useGLTF, Preload, Stars } from '@react-three/drei';
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

    // Preload task models
    useMemo(() => {
        const modelPaths = new Set<string>();
        Object.values(taskConfigs).forEach(config => {
            if (config.operationalModelPath) {
                modelPaths.add(config.operationalModelPath);
            }
        });
        modelPaths.forEach(path => useGLTF.preload(path));
    }, []);

    // Add soft shadows setup
    useEffect(() => {
        if (gl) {
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.2;
            
            // Make scene background transparent to show CSS background
            scene.background = null;
        }
    }, [gl, scene]);

    return (
        <>
            <ColonyCameraSetup />
            
            {/* Add stars for space effect */}
            <Stars 
                radius={55}
                depth={30}
                count={5000}
                factor={8}
                saturation={2.0}
                fade={true}
                speed={0.6}
            />
            
            {/* --- Enhanced Lighting --- */}
            <ambientLight intensity={0.4} color={'#E8D9C5'} />
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
            <directionalLight 
                color={'#F08C8C'} 
                position={[-40, 20, -30]} 
                intensity={0.4} 
                castShadow={false} 
            />
            <pointLight
                position={[20, 15, 20]}
                intensity={30}
                color={'#FFC773'}
                distance={100}
                decay={2}
            />
            <pointLight
                position={[-30, 10, -20]}
                intensity={20}
                color={'#A6CFFF'}
                distance={80}
                decay={2}
            />
            <Environment 
                preset="sunset" 
                background={false}
                resolution={256}
            />

            {/* Fog for atmospheric depth */}
            <fog attach="fog" args={['#3D1B18', 150, 400]} />

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
                // Limit zoom for Orthographic camera
                minZoom={0.5} // Prevents zooming in too much (zoom < 1 zooms in)
                maxZoom={4}   // Prevents zooming out too much (zoom > 1 zooms out)
            />
            
            <Preload all />
        </>
    );
};

export default HexGrid; 