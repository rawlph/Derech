import { useMemo, useEffect, useCallback } from 'react';
// Update imports
import { useGLTF, Instances, Instance } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';
import { useGameStore, TileData } from '@store/store';
import { axialToWorld, TILE_THICKNESS } from '@utils/hexUtils';
import { buildingConfigs, getBuildingConfig } from '@config/buildings';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// Set up Draco loader to be used by GLTFLoader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/Derech/draco/'); // Path to the Draco decoder files

// Prepare GLTFLoader with Draco support
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

// Preload models with Draco support
const preloadModel = (path: string) => {
  console.log(`Preloading model: ${path}`);
  gltfLoader.load(path, () => {
    console.log(`Preloaded model: ${path}`);
  });
  return path;
};

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

    // Get state to check for completed upgrade projects
    const completedLivingProjects = useGameStore(state => state.completedLivingProjects);
    const completedProductionProjects = useGameStore(state => state.completedProductionProjects);
    const completedResearch = useGameStore(state => state.completedResearch);

    // Determine if we should show the upgrade model
    const hasUpgrade = useMemo(() => {
        if (!config.upgradeModelPath) return false;
        
        if (buildingName === 'Living Dome') {
            return completedLivingProjects.includes('upgrade-living-dome');
        } else if (buildingName === 'Production Dome') {
            return completedProductionProjects.includes('upgrade-production-dome');
        } else if (buildingName === 'Research Dome') {
            return completedResearch.includes('upgrade-research-dome');
        }
        return false;
    }, [buildingName, config, completedLivingProjects, completedProductionProjects, completedResearch]);

    // --- Load base model ---
    const { scene } = useGLTF(config.modelPath);

    // Debug: Log the full scene structure
    useEffect(() => {
        console.log(`Debugging model structure for ${buildingName}:`);
        let meshCount = 0;
        
        scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                meshCount++;
                console.log(`- Mesh #${meshCount}: ${child.name || 'unnamed'}`);
                console.log(`  - Geometry: vertices=${child.geometry.attributes.position.count}`);
                console.log(`  - Material: ${Array.isArray(child.material) ? 
                    `${child.material.length} materials` : 
                    child.material.type}`);
            } else if (child.name) {
                console.log(`- Other object: ${child.name} (type: ${child.type})`);
            }
        });
        
        console.log(`Total meshes in ${buildingName}: ${meshCount}`);
    }, [scene, buildingName]);

    // --- Geometry and Material Extraction for base model ---
    const buildingGeometry = useMemo(() => {
        let geometry: THREE.BufferGeometry | null = null;
        let meshCount = 0;
        
        // First check if there's a single mesh that contains everything
        scene.traverse((child) => {
            if (child instanceof THREE.Mesh && child.isMesh) {
                meshCount++;
                // If this is the first mesh or it has a lot more vertices than our current geometry,
                // use this one (assuming larger meshes are more likely to be the main model)
                if (!geometry || 
                    (child.geometry.attributes.position.count > geometry.attributes.position.count * 1.5)) {
                    if (geometry) {
                        console.log(`Replacing geometry with larger mesh for ${buildingName}`);
                    }
                    geometry = child.geometry.clone();
                }
            }
        });
        
        if (!geometry) {
            console.warn(`No mesh geometry found for ${buildingName} in ${config.modelPath}`);
        } else if (meshCount > 1) {
            console.log(`Model ${buildingName} has ${meshCount} meshes, using the largest one`);
        }
        
        return geometry;
    }, [scene, buildingName, config.modelPath]);

    // --- Restore original material extraction for base model ---
    const buildingMaterial = useMemo(() => {
        let material: THREE.Material | THREE.Material[] | null = null;
        scene.traverse((child) => {
            if (child instanceof THREE.Mesh && child.isMesh && !material) {
                if (Array.isArray(child.material)) {
                    material = child.material.map(m => m.clone());
                } else {
                    material = child.material.clone();
                }
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

    // --- Load upgrade model if available and needed ---
    const upgradeModel = useMemo(() => {
        if (!hasUpgrade || !config.upgradeModelPath) {
            return null;
        }

        console.log(`Loading upgrade model for ${buildingName}: ${config.upgradeModelPath}`);
        try {
            // Load the model directly - don't use useGLTF hook here to avoid React issues
            const model = useGLTF(config.upgradeModelPath);
            
            // Add debugging to check what was loaded
            console.log(`Successfully loaded upgrade model for ${buildingName}:`, model);
            console.log(`Model scene children:`, model.scene.children);
            
            // Check if any meshes were found
            let foundMeshes = false;
            model.scene.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    console.log(`Found mesh in upgrade model:`, child.name, child);
                    foundMeshes = true;
                }
            });
            
            if (!foundMeshes) {
                console.warn(`No meshes found in upgrade model for ${buildingName}`);
            }
            
            return model;
        } catch (error) {
            console.error(`Failed to load upgrade model for ${buildingName}:`, error);
            return null;
        }
    }, [hasUpgrade, buildingName, config.upgradeModelPath]);

    // --- Extract geometry and material for upgrade model ---
    const upgradeGeometry = useMemo(() => {
        if (!upgradeModel || !upgradeModel.scene) return null;

        let geometry: THREE.BufferGeometry | null = null;
        let meshCount = 0;
        
        // Debug: Log the upgrade model structure
        console.log(`Debugging UPGRADE model structure for ${buildingName}:`);
        
        upgradeModel.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                meshCount++;
                console.log(`- Upgrade Mesh #${meshCount}: ${child.name || 'unnamed'}`);
                console.log(`  - Geometry: vertices=${child.geometry.attributes.position.count}`);
                
                // Similar to base model, get the largest mesh
                if (!geometry || 
                    (child.geometry.attributes.position.count > geometry.attributes.position.count * 1.5)) {
                    if (geometry) {
                        console.log(`Replacing upgrade geometry with larger mesh for ${buildingName}`);
                    }
                    geometry = child.geometry.clone();
                }
            } else if (child.name) {
                console.log(`- Other upgrade object: ${child.name} (type: ${child.type})`);
            }
        });
        
        console.log(`Total meshes in ${buildingName} upgrade: ${meshCount}`);
        
        if (!geometry) {
            console.warn(`No mesh geometry found for upgrade ${buildingName} in ${config.upgradeModelPath}`);
        } else if (meshCount > 1) {
            console.log(`Upgrade model ${buildingName} has ${meshCount} meshes, using the largest one`);
        }
        
        return geometry;
    }, [upgradeModel, buildingName, config.upgradeModelPath]);

    // --- Render upgrade with original scene for complex models ---
    const renderUpgradeDirectly = useMemo(() => {
        // For complex models with multiple meshes, we'll render the full scene instead
        return hasUpgrade && upgradeModel && (!upgradeGeometry || upgradeModel.scene.children.length > 1);
    }, [hasUpgrade, upgradeModel, upgradeGeometry]);

    // Return and position a copy of the complete scene instead of just the mesh
    const cloneUpgradeScene = useCallback((position: THREE.Vector3, rotation: THREE.Euler, scale: THREE.Vector3) => {
        if (!upgradeModel || !upgradeModel.scene) return null;
        
        // Clone the entire scene
        const clonedScene = upgradeModel.scene.clone();
        
        // Position the scene group
        clonedScene.position.copy(position);
        clonedScene.rotation.copy(rotation);
        clonedScene.scale.copy(scale);
        
        return clonedScene;
    }, [upgradeModel]);

    const upgradeMaterial = useMemo(() => {
        if (!upgradeModel || !upgradeModel.scene) return null;

        let material: THREE.Material | THREE.Material[] | null = null;
        upgradeModel.scene.traverse((child) => {
            if (child instanceof THREE.Mesh && child.isMesh && !material) {
                if (Array.isArray(child.material)) {
                    material = child.material.map(m => m.clone());
                } else {
                    material = child.material.clone();
                }
            }
        });
        
        if (!material) {
            console.warn(`No mesh material found for upgrade ${buildingName} in ${config.upgradeModelPath}`);
        }
        
        // Apply common properties or adjustments if needed
        const applyProps = (mat: THREE.Material) => {
            if (mat instanceof THREE.MeshStandardMaterial) {
                // Decrease roughness slightly to make them less 'dull'
                mat.roughness = Math.max(0., mat.roughness * 0.6);
                // Ensure metalness isn't too high if they are non-metals
                mat.metalness = Math.min(0.1, mat.metalness);
            }
            mat.needsUpdate = true;
        }
        
        if (material) {
            if (Array.isArray(material)) {
                const materialArray = material as THREE.Material[];
                materialArray.forEach(applyProps);
            } else {
                applyProps(material);
            }
        }
        
        return material || new THREE.MeshStandardMaterial({ color: 'purple', name: 'Fallback Material' });
    }, [upgradeModel, buildingName, config.upgradeModelPath]);

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
                
                // Don't force Scout Outposts to shutdown anymore (removed debugging code)
                
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

            {/* Render building upgrades if available and the building is operational */}
            {hasUpgrade && upgradeGeometry && upgradeMaterial && operationalInstances.length > 0 && !renderUpgradeDirectly && (
                <Instances
                    geometry={upgradeGeometry}
                    material={upgradeMaterial}
                    castShadow
                    receiveShadow
                >
                    {operationalInstances.map(({ key, position, rotation, config: instanceConfig }) => {
                        // Position the upgrade slightly above the base building
                        const upgradePosition = new THREE.Vector3(
                            position.x,
                            position.y + 0.15, // Add a small offset to prevent z-fighting
                            position.z
                        );
                        
                        console.log(`Rendering upgrade for ${key} at position`, upgradePosition);
                        
                        return (
                            <Instance
                                key={`upgrade-${key}`}
                                position={upgradePosition}
                                rotation={rotation}
                                scale={instanceConfig?.scale || [0.04, 0.04, 0.04]}
                            />
                        );
                    })}
                </Instances>
            )}

            {/* Render complex upgrades (with multiple meshes) directly using the full scene */}
            {hasUpgrade && renderUpgradeDirectly && operationalInstances.length > 0 && upgradeModel && (
                <>
                    {operationalInstances.map(({ key, position, rotation, config: instanceConfig }) => {
                        // Position the upgrade slightly above the base building
                        const upgradePosition = new THREE.Vector3(
                            position.x,
                            position.y + 0.15, // Add a small offset to prevent z-fighting
                            position.z
                        );
                        
                        console.log(`Rendering complex upgrade for ${key} at position`, upgradePosition);
                        
                        const scale = instanceConfig?.scale || [0.04, 0.04, 0.04];
                        const scaleVector = new THREE.Vector3(scale[0], scale[1], scale[2]);
                        
                        // Create a unique key for this upgrade instance
                        const upgradeKey = `full-upgrade-${key}`;
                        
                        // Direct model rendering approach - create a group and add a clone of the model
                        // This avoids some issues with the primitive component
                        return (
                            <group 
                                key={upgradeKey}
                                position={upgradePosition}
                                rotation={rotation}
                                scale={scaleVector}
                            >
                                {/* Debug sphere to verify position */}
                                <mesh position={[0, 0.5, 0]}>
                                    <sphereGeometry args={[0.2, 16, 16]} />
                                    <meshBasicMaterial color="green" transparent opacity={0.7} />
                                </mesh>
                                
                                {/* Clone and add the model */}
                                {(() => {
                                    // Create a clone to avoid React reconciliation issues
                                    const modelClone = upgradeModel.scene.clone();
                                    console.log(`Created model clone for ${upgradeKey}:`, modelClone);
                                    
                                    // Return the clone as a primitive
                                    return (
                                        <primitive
                                            object={modelClone}
                                            castShadow
                                            receiveShadow
                                        />
                                    );
                                })()}
                            </group>
                        );
                    })}
                </>
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

            {/* Add direct model loader component for each upgrade */}
            {hasUpgrade && operationalInstances.length > 0 && config.upgradeModelPath && (
                <>
                    {operationalInstances.map(({ key, position, rotation, config: instanceConfig }) => {
                        // Position the upgrade slightly above the base building
                        const upgradePosition = new THREE.Vector3(
                            position.x,
                            position.y + 0.15, // Add a small offset to prevent z-fighting
                            position.z
                        );
                        
                        const scale = instanceConfig?.scale || [0.04, 0.04, 0.04];
                        
                        // Ensure modelPath is not undefined
                        if (!config.upgradeModelPath) return null;
                        
                        return (
                            <DirectModelLoader
                                key={`direct-model-${key}`}
                                modelPath={config.upgradeModelPath}
                                position={upgradePosition}
                                rotation={rotation}
                                scale={scale}
                            />
                        );
                    })}
                </>
            )}
        </>
    );
};

// Helper component for direct model rendering
const DirectModelLoader = ({ 
    modelPath, 
    position,
    rotation,
    scale = [0.04, 0.04, 0.04]
}: { 
    modelPath: string, 
    position: THREE.Vector3,
    rotation: THREE.Euler,
    scale?: number[]
}) => {
    // Load the model directly with GLTFLoader with Draco support
    const model = useLoader(GLTFLoader, modelPath, (loader) => {
        // Cast loader to GLTFLoader to add Draco support
        (loader as GLTFLoader).setDRACOLoader(dracoLoader);
    });
    
    console.log(`DirectModelLoader: Loaded model from ${modelPath}:`, model);
    
    useEffect(() => {
        // Check if model loaded correctly
        if (model && model.scene) {
            console.log(`DirectModelLoader: Model scene for ${modelPath}:`, model.scene);
            
            // Count meshes
            let meshCount = 0;
            model.scene.traverse((child: THREE.Object3D) => {
                if (child instanceof THREE.Mesh) {
                    meshCount++;
                    console.log(`DirectModelLoader: Found mesh ${child.name}`);
                }
            });
            
            console.log(`DirectModelLoader: Found ${meshCount} meshes in model`);
        }
    }, [model, modelPath]);
    
    if (!model) return null;
    
    return (
        <group position={position} rotation={rotation}>
            {/* The actual model */}
            <primitive
                object={model.scene}
                scale={scale}
                castShadow
                receiveShadow
            />
        </group>
    );
};

// Main component - Update to use our custom loader
const BuildingInstances = () => {
    console.log("Rendering BuildingInstances component");
    
    // Preload all building models including upgrades
    useEffect(() => {
        Object.values(buildingConfigs).forEach(config => {
            if (config.modelPath) {
                preloadModel(config.modelPath);
            }
            if (config.upgradeModelPath) {
                preloadModel(config.upgradeModelPath);
            }
        });
    }, []);

    return (
        <>
            {Object.keys(buildingConfigs).map(buildingName => (
                <SingleBuildingTypeInstances key={buildingName} buildingName={buildingName} />
            ))}
        </>
    );
};

export default BuildingInstances; 