import { useMemo, useEffect } from 'react';
// Restore GLTF and Instancing imports, remove Sphere
import { useGLTF, Instances, Instance } from '@react-three/drei';
import { useGameStore, TileData } from '@store/store';
import { axialToWorld, TILE_THICKNESS } from '@utils/hexUtils';
import { buildingConfigs, getBuildingConfig } from '@config/buildings';
import * as THREE from 'three';

interface BuildingInstanceInfo {
    key: string;
    position: THREE.Vector3;
    rotation: THREE.Euler;
    tileData: TileData;
    config: ReturnType<typeof getBuildingConfig>;
    taskId: string | null; // Add taskId to track the associated task
    isShutdown: boolean; // Add status to track if building is shutdown
}

// Helper component to render instances for a *single* building type
const SingleBuildingTypeInstances = ({ buildingName }: { buildingName: string }) => {
    const config = getBuildingConfig(buildingName);
    if (!config) return null;

    // --- Restore GLTF Loading ---
    const { scene } = useGLTF(config.modelPath);

    // --- Geometry and Material Extraction ---
    // This part is crucial and might need adjustment based on your model structure.
    // It assumes the *first* mesh found in the GLTF scene holds the geometry/material.
    const buildingGeometry = useMemo(() => {
        let geometry: THREE.BufferGeometry | null = null;
        scene.traverse((child) => {
            if (child instanceof THREE.Mesh && child.isMesh && !geometry) {
                 // Important: Clone the geometry to prevent issues if multiple
                 // Instances components try to use the exact same geometry object
                 // simultaneously, especially if materials differ or matrix updates occur.
                geometry = child.geometry.clone();
                // Keep this log? Useful for confirming mesh names
                // console.log(`Geometry found for ${buildingName} in mesh:`, child.name);
            }
        });
         if (!geometry) {
            // Keep this warning
            console.warn(`No mesh geometry found for ${buildingName} in ${config.modelPath}`);
        }
        return geometry;
    }, [scene, buildingName, config.modelPath]); // Add dependencies

    // --- Restore original material extraction ---
    const buildingMaterial = useMemo(() => {
        let material: THREE.Material | THREE.Material[] | null = null;
        scene.traverse((child) => {
            if (child instanceof THREE.Mesh && child.isMesh && !material) {
                if (Array.isArray(child.material)) {
                    material = child.material.map(m => m.clone());
                } else {
                    material = child.material.clone();
                }
                 // console.log(`Material found for ${buildingName} in mesh:`, child.name);
            }
        });
         if (!material) {
            console.warn(`No mesh material found for ${buildingName} in ${config.modelPath}`);
        }
        // Apply common properties or adjustments if needed
        const applyProps = (mat: THREE.Material) => {
             if (mat instanceof THREE.MeshStandardMaterial) {
                 // Decrease roughness slightly to make them less 'dull'
                 mat.roughness = Math.max(0., mat.roughness * 0.6); // Example: Reduce roughness but keep some
                 // Ensure metalness isn't too high if they are non-metals
                 mat.metalness = Math.min(0.1, mat.metalness); // Explicitly lower metalness
             }
             mat.needsUpdate = true;
        }
        if (material) {
             // --- Fix Linter Error ---
             // Add explicit type check again inside the block
             if (Array.isArray(material)) {
                 // TypeScript needs confirmation here that material is still an array
                 const materialArray = material as THREE.Material[];
                 materialArray.forEach(applyProps);
             } else {
                 applyProps(material);
             }
             // --- End Fix ---
        }
        return material || new THREE.MeshStandardMaterial({ color: 'purple', name: 'Fallback Material' });
    }, [scene, buildingName, config.modelPath]);
    // ---

    const gridTiles = useGameStore((state) => state.gridTiles);
    const activeTasks = useGameStore((state) => state.activeTasks);

    // Find instances
    const instances = useMemo((): BuildingInstanceInfo[] => {
        const tileSurfaceY = TILE_THICKNESS / 2;
        const yOffset = 0.2;
        
        return Object.entries(gridTiles)
            .filter(([_, tileData]) => tileData.building === buildingName)
            .map(([key, tileData]) => {
                const tileWorldPos = axialToWorld(tileData.q, tileData.r);
                
                // Account for the tile's height
                const heightOffset = tileData.height * (TILE_THICKNESS * 0.8);
                const buildingY = heightOffset + tileSurfaceY + yOffset;
                
                const position = new THREE.Vector3(tileWorldPos.x, buildingY, tileWorldPos.z);
                
                // Use fixed rotation instead of facing center
                // No rotation means buildings face their default direction
                const rotation = new THREE.Euler(0, 0, 0);
                
                // Check for associated task and its status
                const taskId = tileData.taskId || null; // Convert undefined to null
                let isShutdown = false;
                
                // Enhanced shutdown detection
                if (taskId) {
                    // Check if task exists and its status
                    const task = activeTasks[taskId];
                    if (task) {
                        isShutdown = task.status === 'shutdown';
                        
                        // Debug log for shutdown status
                        console.log(`Task ${taskId} for ${buildingName} at tile ${key} status: ${task.status}`);
                        
                        if (isShutdown) {
                            console.log(`Building ${buildingName} at tile ${key} is shutdown due to task status`);
                        }
                    } else {
                        // This shouldn't happen normally, but log for debugging
                        console.warn(`Task ${taskId} referenced by tile ${key} does not exist`);
                    }
                }
                
                // ADDITIONAL CHECK: For Scout Outpost and other buildings that might be "tasks"
                // This is for buildings that are actually tasks deployed on tiles
                if (!isShutdown && buildingName.includes('Scout') && tileData.taskId) {
                    const task = activeTasks[tileData.taskId];
                    if (task && task.status === 'shutdown') {
                        isShutdown = true;
                        console.log(`Scout building at ${key} detected as shutdown via task status`);
                    }
                }
                
                // Force isShutdown to true for Scout Outpost as a test if we still have issues
                if (buildingName === 'Scout Outpost') {
                    // Debugging attempt - force shutdown for Scout Outpost
                    isShutdown = true;
                    console.log(`FORCING SCOUT OUTPOST AT ${key} TO SHUTDOWN STATE FOR TESTING`);
                }
                
                return { 
                    key: `${key}-${buildingName}`, 
                    position, 
                    rotation,
                    tileData, 
                    config,
                    taskId,
                    isShutdown 
                };
            });
    }, [gridTiles, buildingName, config, activeTasks]);

    // Check geometry/material/instances
    if (!buildingGeometry || !buildingMaterial || instances.length === 0) {
        if (instances.length > 0 && (!buildingGeometry || !buildingMaterial)) {
             // Keep this warning
             console.warn(`Skipping render for ${buildingName}: Geometry or Material missing.`);
         }
        return null;
    }

    // Get material for shutdown buildings
    const dimMaterial = useMemo(() => {
        console.log(`Creating dim material for ${buildingName}`);
        
        // Clone the original material but make it darker to indicate shutdown
        if (Array.isArray(buildingMaterial)) {
            const materials = buildingMaterial.map(m => {
                const clonedMat = m.clone();
                if (clonedMat instanceof THREE.MeshStandardMaterial) {
                    // Dim the material by reducing emissive, increasing roughness
                    clonedMat.emissiveIntensity = 0.1;
                    clonedMat.roughness = Math.min(1.0, clonedMat.roughness * 1.5);
                    // Apply a more significant darkening (was 0.7, now 0.5)
                    const color = clonedMat.color.clone();
                    color.multiplyScalar(0.5); // Darken by 50% for better visibility
                    clonedMat.color = color;
                    
                    // Ensure the material is visible
                    clonedMat.transparent = false;
                    clonedMat.opacity = 1.0;
                    clonedMat.visible = true;
                    clonedMat.needsUpdate = true;
                }
                return clonedMat;
            });
            console.log(`Created ${materials.length} dimmed materials for ${buildingName}`);
            return materials;
        } else {
            const clonedMat = buildingMaterial.clone();
            if (clonedMat instanceof THREE.MeshStandardMaterial) {
                // Dim the material by reducing emissive, increasing roughness
                clonedMat.emissiveIntensity = 0.1;
                clonedMat.roughness = Math.min(1.0, clonedMat.roughness * 1.5);
                // Apply a more significant darkening (was 0.7, now 0.5)
                const color = clonedMat.color.clone();
                color.multiplyScalar(0.5); // Darken by 50% for better visibility
                clonedMat.color = color;
                
                // Ensure the material is visible
                clonedMat.transparent = false;
                clonedMat.opacity = 1.0;
                clonedMat.visible = true;
                clonedMat.needsUpdate = true;
            }
            console.log(`Created single dimmed material for ${buildingName}`);
            return clonedMat;
        }
    }, [buildingMaterial, buildingName]);

    // Group instances by operational status
    const { operationalInstances, shutdownInstances } = useMemo(() => {
        const operational = instances.filter(i => !i.isShutdown);
        const shutdown = instances.filter(i => i.isShutdown);
        
        console.log(`${buildingName}: ${operational.length} operational, ${shutdown.length} shutdown`);
        
        return {
            operationalInstances: operational,
            shutdownInstances: shutdown
        };
    }, [instances, buildingName]);

    // Check if we have any shutdown instances and log for debugging
    useEffect(() => {
        if (shutdownInstances.length > 0) {
            console.log(`${buildingName} has ${shutdownInstances.length} shutdown instances`);
        }
    }, [shutdownInstances, buildingName]);

    return (
        <>
            {/* Render operational buildings */}
            {operationalInstances.length > 0 && (
                <Instances
                    geometry={buildingGeometry}
                    material={buildingMaterial}
                    castShadow
                    receiveShadow
                >
                    {operationalInstances.map(({ key, position, rotation, config: instanceConfig }) => (
                        <Instance
                            key={key}
                            position={position}
                            rotation={rotation}
                            scale={instanceConfig?.scale || [0.04, 0.04, 0.04]}
                        />
                    ))}
                </Instances>
            )}
            
            {/* Render shutdown buildings with dimmed material */}
            {shutdownInstances.length > 0 && (() => {
                // Log outside JSX
                console.log(`Rendering ${shutdownInstances.length} shutdown instances for ${buildingName}`);
                
                return (
                    <>
                        <Instances
                            geometry={buildingGeometry}
                            material={dimMaterial}
                            castShadow
                            receiveShadow
                        >
                            {shutdownInstances.map(({ key, position, rotation, config: instanceConfig }) => {
                                // Log outside JSX
                                console.log(`Rendering shutdown instance ${key} at position`, position);
                                return (
                                    <Instance
                                        key={key}
                                        position={position}
                                        rotation={rotation}
                                        scale={instanceConfig?.scale || [0.04, 0.04, 0.04]}
                                        visible={true} /* Force visibility */
                                    />
                                );
                            })}
                        </Instances>
                        
                        {/* Add a debug sphere at each shutdown building position to verify rendering */}
                        {shutdownInstances.map(({ key, position }) => (
                            <mesh
                                key={`debug-${key}`}
                                position={[position.x, position.y + 0.5, position.z]}
                            >
                                <sphereGeometry args={[0.3, 16, 16]} />
                                <meshBasicMaterial color="red" transparent opacity={0.7} />
                            </mesh>
                        ))}
                    </>
                );
            })()}
        </>
    );
};


// Main component - Restore preloading
const BuildingInstances = () => {
    console.log("Rendering BuildingInstances component");
    
    // --- Restore preloading ---
    Object.values(buildingConfigs).forEach(config => useGLTF.preload(config.modelPath));
    // ---

    return (
        <>
            {Object.keys(buildingConfigs).map(buildingName => (
                <SingleBuildingTypeInstances key={buildingName} buildingName={buildingName} />
            ))}
        </>
    );
};

export default BuildingInstances; 