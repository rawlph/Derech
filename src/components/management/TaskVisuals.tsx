import { useMemo, useEffect, useRef } from 'react';
import { useGLTF, Instances, Instance } from '@react-three/drei';
import { useGameStore, TaskState, TileData } from '@store/store';
import { axialToWorld, TILE_THICKNESS } from '@utils/hexUtils';
import { getTaskConfig, taskConfigs } from '@config/tasks';
import * as THREE from 'three';

// Interface to hold processed info needed for rendering each task instance
interface TaskInstanceInfo {
    key: string; // Unique key for React
    taskId: string;
    modelPath: string;
    position: THREE.Vector3;
    rotation: THREE.Euler;
    tileData: TileData;
    taskState: TaskState;
    scale: [number, number, number];
}

// Helper component to render instances for a *single* task model type
const SingleTaskTypeInstances = ({ modelPath, tasks }: { modelPath: string, tasks: TaskInstanceInfo[] }) => {
    if (tasks.length === 0) return null;

    // Store scene clones for cleanup
    const sceneClones = useRef<THREE.Group[]>([]);
    
    console.log(`Rendering ${tasks.length} instances of ${modelPath}`);
    
    // --- GLTF Loading ---
    const { scene } = useGLTF(modelPath);
    
    // Clean up resources when component unmounts or when tasks/modelPath changes
    useEffect(() => {
        // Return cleanup function
        return () => {
            // Dispose of all cloned scenes to prevent memory leaks
            sceneClones.current.forEach(clone => {
                // Traverse and dispose of geometries and materials
                clone.traverse((object) => {
                    if (object instanceof THREE.Mesh) {
                        if (object.geometry) {
                            object.geometry.dispose();
                        }
                        
                        if (object.material) {
                            if (Array.isArray(object.material)) {
                                object.material.forEach(material => material.dispose());
                            } else {
                                object.material.dispose();
                            }
                        }
                    }
                });
            });
            
            // Clear the references
            sceneClones.current = [];
        };
    }, [tasks, modelPath]);

    // Instead of extracting geometry and materials, we'll use the entire model scene
    return (
        <group>
            {tasks.map(({ key, position, rotation, scale, taskState }) => {
                // Clone scene once per task
                const clonedScene = scene.clone();
                
                // Apply dimmed materials for shutdown tasks
                if (taskState.status === 'shutdown') {
                    // Apply darkened material to indicate shutdown
                    clonedScene.traverse((object) => {
                        if (object instanceof THREE.Mesh) {
                            if (Array.isArray(object.material)) {
                                object.material = object.material.map(mat => {
                                    const clonedMat = mat.clone();
                                    if (clonedMat instanceof THREE.MeshStandardMaterial) {
                                        // Dim the material
                                        clonedMat.emissiveIntensity = 0.1;
                                        clonedMat.roughness = Math.min(1.0, clonedMat.roughness * 1.5);
                                        // Darken by 50%
                                        const color = clonedMat.color.clone();
                                        color.multiplyScalar(0.5);
                                        clonedMat.color = color;
                                        clonedMat.needsUpdate = true;
                                    }
                                    return clonedMat;
                                });
                            } else if (object.material) {
                                const clonedMat = object.material.clone();
                                if (clonedMat instanceof THREE.MeshStandardMaterial) {
                                    // Dim the material
                                    clonedMat.emissiveIntensity = 0.1;
                                    clonedMat.roughness = Math.min(1.0, clonedMat.roughness * 1.5);
                                    // Darken by 50%
                                    const color = clonedMat.color.clone();
                                    color.multiplyScalar(0.5);
                                    clonedMat.color = color;
                                    clonedMat.needsUpdate = true;
                                }
                                object.material = clonedMat;
                            }
                        }
                    });
                    
                    console.log(`Applied shutdown material to task ${taskState.id}`);
                }
                
                // Apply special material for deconstructing tasks
                else if (taskState.status === 'deconstructing') {
                    // Show deconstruction with redder, semi-transparent material
                    clonedScene.traverse((object) => {
                        if (object instanceof THREE.Mesh) {
                            if (Array.isArray(object.material)) {
                                object.material = object.material.map(mat => {
                                    const clonedMat = mat.clone();
                                    if (clonedMat instanceof THREE.MeshStandardMaterial) {
                                        // Make material redder for deconstruction
                                        const color = clonedMat.color.clone();
                                        color.r = Math.min(1.0, color.r * 1.5); // Increase red component
                                        color.g = Math.max(0.3, color.g * 0.7); // Reduce green component
                                        color.b = Math.max(0.3, color.b * 0.7); // Reduce blue component
                                        clonedMat.color = color;
                                        
                                        // Add transparency based on deconstruction progress
                                        clonedMat.transparent = true;
                                        const progress = taskState.deconstructProgress || 0;
                                        clonedMat.opacity = Math.max(0.3, 1.0 - (progress / 100) * 0.7);
                                        
                                        // Add wireframe to show deconstruction
                                        if (progress > 50) {
                                            clonedMat.wireframe = true;
                                        }
                                        
                                        clonedMat.needsUpdate = true;
                                    }
                                    return clonedMat;
                                });
                            } else if (object.material) {
                                const clonedMat = object.material.clone();
                                if (clonedMat instanceof THREE.MeshStandardMaterial) {
                                    // Make material redder for deconstruction
                                    const color = clonedMat.color.clone();
                                    color.r = Math.min(1.0, color.r * 1.5); // Increase red component
                                    color.g = Math.max(0.3, color.g * 0.7); // Reduce green component
                                    color.b = Math.max(0.3, color.b * 0.7); // Reduce blue component
                                    clonedMat.color = color;
                                    
                                    // Add transparency based on deconstruction progress
                                    clonedMat.transparent = true;
                                    const progress = taskState.deconstructProgress || 0;
                                    clonedMat.opacity = Math.max(0.3, 1.0 - (progress / 100) * 0.7);
                                    
                                    // Add wireframe to show deconstruction
                                    if (progress > 50) {
                                        clonedMat.wireframe = true;
                                    }
                                    
                                    clonedMat.needsUpdate = true;
                                }
                                object.material = clonedMat;
                            }
                        }
                    });
                    
                    console.log(`Applied deconstruction material to task ${taskState.id}, progress: ${taskState.deconstructProgress}%`);
                }
                
                // Store reference for cleanup
                sceneClones.current.push(clonedScene);
                
                // Special case for scout outposts - we need different handling
                if (taskState.type.includes('scout')) {
                    const adjustedPosition = new THREE.Vector3(
                        position.x,
                        position.y - 0.3, // Apply a fixed downward offset
                        position.z
                    );
                    
                    console.log(`Rendering scout outpost ${taskState.id} at ${adjustedPosition.x}, ${adjustedPosition.y}, ${adjustedPosition.z}, status: ${taskState.status}`);
                    
                    return (
                        <primitive 
                            key={key}
                            object={clonedScene} // Use pre-cloned scene
                            position={adjustedPosition}
                            rotation={rotation}
                            scale={scale || [0.02, 0.02, 0.02]}
                            visible={true} // Force visibility
                        />
                    );
                }
                
                // Standard handling for all task types (including mining now)
                return (
                    <primitive 
                        key={key}
                        object={clonedScene} // Use pre-cloned scene
                        position={position}
                        rotation={rotation}
                        scale={scale || [0.02, 0.02, 0.02]}
                        visible={true} // Force visibility
                    />
                );
            })}
        </group>
    );
};


// Main component to manage rendering all operational task visuals
const TaskVisuals = () => {
    const activeTasks = useGameStore((state) => state.activeTasks);
    const gridTiles = useGameStore((state) => state.gridTiles);

    // Process tasks to get renderable instances, grouped by model path
    const tasksByModel = useMemo(() => {
        const groupedTasks: Record<string, TaskInstanceInfo[]> = {};

        Object.values(activeTasks).forEach(task => {
            const config = getTaskConfig(task.type);
            // Include shutdown AND deconstructing tasks as well as operational/event-pending tasks
            if (config?.operationalModelPath && (task.status === 'operational' || task.status === 'event-pending' || task.status === 'shutdown' || task.status === 'deconstructing')) {
                const tile = gridTiles[task.targetTileKey];
                if (!tile) return; // Skip if tile data is missing

                const modelPath = config.operationalModelPath;

                // Calculate Position
                const tileWorldPos = axialToWorld(tile.q, tile.r);
                const heightOffset = tile.height * (TILE_THICKNESS * 0.8);
                const surfaceY = heightOffset + TILE_THICKNESS / 2;
                
                // Use Y offset from config
                const yOffset = config.yOffset !== undefined ? config.yOffset : 0.05;
                const taskY = surfaceY + yOffset;
                const position = new THREE.Vector3(tileWorldPos.x, taskY, tileWorldPos.z);
                
                // Use fixed rotation for all task types
                const rotation = new THREE.Euler(0, 0, 0);

                // Log specific status for Scout Outposts for debugging
                if (task.type.includes('scout')) {
                    console.log(`Scout Outpost ${task.id} has status: ${task.status}, rendering in TaskVisuals`);
                }

                const instanceInfo: TaskInstanceInfo = {
                    key: `taskinstance-${task.id}`,
                    taskId: task.id,
                    modelPath: modelPath,
                    position: position,
                    rotation: rotation,
                    tileData: tile,
                    taskState: task,
                    scale: config.scale || [0.02, 0.02, 0.02], // Use config scale or default
                };

                if (!groupedTasks[modelPath]) {
                    groupedTasks[modelPath] = [];
                }
                groupedTasks[modelPath].push(instanceInfo);
            } else if (task.status === 'shutdown' && !config?.operationalModelPath) {
                console.warn(`Task ${task.id} type ${task.type} is shutdown but has no operational model path`);
            }
        });

        return groupedTasks;
    }, [activeTasks, gridTiles]);

    // Add cleanup for the GLTF cache on unmount
    useEffect(() => {
        return () => {
            // Clear the entire cache when this component unmounts (like when switching to puzzle view)
            // Pass an empty array to clear all cached models
            useGLTF.clear([]);
        };
    }, []);

    // Preload models but don't put in useMemo (useEffect is more appropriate for side effects)
    useEffect(() => {
        const modelPaths = new Set<string>();
        Object.values(taskConfigs).forEach(config => {
            if (config.operationalModelPath) {
                modelPaths.add(config.operationalModelPath);
            }
        });
        
        // Preload all task models
        modelPaths.forEach(path => useGLTF.preload(path));
        
        // No cleanup needed here as we'll clear everything in the parent useEffect
    }, []);

    return (
        <>
            {/* Regular task instances */}
            {Object.entries(tasksByModel).map(([modelPath, tasks]) => (
                <SingleTaskTypeInstances
                    key={modelPath}
                    modelPath={modelPath}
                    tasks={tasks}
                />
            ))}
        </>
    );
};

export default TaskVisuals; 