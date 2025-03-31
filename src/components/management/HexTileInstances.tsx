import { useMemo, useRef, useEffect } from 'react';
import { Instances, Instance } from '@react-three/drei';
import { useGameStore, TileData } from '@store/store';
import {
    axialToWorld,
    hexGeometry,
    plainsHexGeometry,
    tileMaterials,
    selectedMaterial,
    TILE_THICKNESS,
    worldToAxial,
    statusIndicatorGeometry,
    getStatusIndicatorMaterial,
    getStatusIndicatorPosition
} from '@utils/hexUtils';
import * as THREE from 'three';
import { ThreeEvent, useFrame } from '@react-three/fiber';

interface InstanceInfo extends TileData {
    key: string;
    position: THREE.Vector3;
    color: THREE.Color;
    material: THREE.Material;
}

// Additional interface for support pillars
interface SupportPillarInfo {
    key: string;
    position: THREE.Vector3;
    parentTile: InstanceInfo;
}

// New interface for status indicators
interface StatusIndicatorInfo {
    key: string;
    position: THREE.Vector3;
    type: 'issue' | 'event' | 'operational' | 'shutdown' | 'none';
    tileKey: string;
}

const HexTileInstances = () => {
    // Reference for Ice Deposit material to animate
    const iceDepositMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
    
    // Reference to track selected tile mesh and edges for cleanup
    const selectedMeshRef = useRef<THREE.Mesh | null>(null);
    const edgeLinesRef = useRef<THREE.LineSegments[]>([]);
    
    // Add new ref for status indicators
    const statusIndicatorsMeshesRef = useRef<THREE.Mesh[]>([]);
    
    // Get the Ice Deposit material and store its reference
    useMemo(() => {
        const iceMaterial = tileMaterials['Ice Deposit'];
        if (iceMaterial && iceMaterial instanceof THREE.MeshStandardMaterial) {
            iceDepositMaterialRef.current = iceMaterial;
        }
    }, []);
    
    // Create geometries with proper disposal tracking
    const edgesGeometry = useMemo(() => {
        const geometry = new THREE.EdgesGeometry(hexGeometry, 1);
        // Register for cleanup in component unmount
        return geometry;
    }, []);
    
    const lineMaterial = useMemo(() => {
        const material = new THREE.LineBasicMaterial({
            color: 0x332222, // Darker reddish-brown that complements Mars terrain
            linewidth: 3,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1,
        });
        // Register for cleanup in component unmount
        return material;
    }, []);

    // Global cleanup function when component unmounts or when switching views
    useEffect(() => {
        // Create local, stable references to dispose later
        const localEdgesGeometry = edgesGeometry;
        const localLineMaterial = lineMaterial;
        
        // Updated cleanup function to include status indicators
        return () => {
            try {
                // Safely dispose the selected mesh
                if (selectedMeshRef.current) {
                    try {
                        // Dispose geometry if it exists
                        if (selectedMeshRef.current.geometry) {
                            selectedMeshRef.current.geometry.dispose();
                        }
                        
                        // Dispose material(s) if they exist
                        if (selectedMeshRef.current.material) {
                            if (Array.isArray(selectedMeshRef.current.material)) {
                                selectedMeshRef.current.material.forEach(m => {
                                    if (m) m.dispose();
                                });
                            } else {
                                selectedMeshRef.current.material.dispose();
                            }
                        }
                    } catch (error) {
                        // Silently handle errors to prevent component unmount failures
                    }
                    
                    // Clear reference
                    selectedMeshRef.current = null;
                }
                
                // Safely dispose line segments
                if (edgeLinesRef.current) {
                    // Create a safe copy to avoid issues if the array changes during iteration
                    const linesToDispose = [...edgeLinesRef.current].filter(Boolean);
                    
                    linesToDispose.forEach(line => {
                        if (!line) return;
                        
                        try {
                            // Dispose geometry
                            if (line.geometry) {
                                line.geometry.dispose();
                            }
                            
                            // Dispose material(s)
                            if (line.material) {
                                if (Array.isArray(line.material)) {
                                    line.material.forEach(m => {
                                        if (m) m.dispose();
                                    });
                                } else {
                                    line.material.dispose();
                                }
                            }
                        } catch (error) {
                            // Silently handle errors
                        }
                    });
                    
                    // Clear array
                    edgeLinesRef.current = [];
                }
                
                // Clean up status indicator meshes
                statusIndicatorsMeshesRef.current.forEach(mesh => {
                    if (!mesh) return;
                    
                    try {
                        if (mesh.geometry) mesh.geometry.dispose();
                        if (mesh.material) {
                            if (Array.isArray(mesh.material)) {
                                mesh.material.forEach(m => m && m.dispose());
                            } else {
                                mesh.material.dispose();
                            }
                        }
                    } catch (error) {
                        // Silently handle errors
                    }
                });
                statusIndicatorsMeshesRef.current = [];
                
                // Dispose shared resources
                if (localEdgesGeometry) {
                    try {
                        localEdgesGeometry.dispose();
                    } catch (error) {
                        // Silently handle errors
                    }
                }
                
                if (localLineMaterial) {
                    try {
                        localLineMaterial.dispose();
                    } catch (error) {
                        // Silently handle errors
                    }
                }
            } catch (error) {
                // Final fallback to prevent component unmount failures
                console.error("Error during cleanup:", error);
            }
        };
    }, [edgesGeometry, lineMaterial]);
    
    // Animation for ice glittering
    useFrame(({ clock }) => {
        if (iceDepositMaterialRef.current) {
            // Subtle pulsing emissive intensity based on time
            const t = clock.getElapsedTime();
            // Combine two sine waves for more natural shimmer
            const shimmer = (Math.sin(t * 2) * 0.5 + 0.5) * 0.7 + (Math.sin(t * 5) * 0.5 + 0.5) * 0.3;
            iceDepositMaterialRef.current.emissiveIntensity = 0.3 + shimmer * 0.4;
            // Slight color temperature shifts
            const hue = 0.55 + Math.sin(t * 0.5) * 0.02; // Subtle hue variation
            iceDepositMaterialRef.current.color.setHSL(hue, 0.6, 0.75 + shimmer * 0.2);
            
            iceDepositMaterialRef.current.needsUpdate = true;
        }
    });

    const gridTiles = useGameStore((state) => state.gridTiles);
    const selectTile = useGameStore((state) => state.selectTile);
    const selectedTileData = useGameStore((state) => state.selectedTile);
    const gameView = useGameStore((state) => state.gameView);
    const activeTasks = useGameStore((state) => state.activeTasks);
    const buildingIssues = useGameStore((state) => state.buildingIssues);

    // Height scale factor (how much Y position changes per height level)
    const heightScaleFactor = TILE_THICKNESS * 0.8;

    const allInstancesData = useMemo((): InstanceInfo[] => {
        if (!gridTiles) return []; // Safety check
        
        return Object.entries(gridTiles).map(([key, tileData]) => {
            const position = axialToWorld(tileData.q, tileData.r);
            const material = tileMaterials[tileData.type] || tileMaterials.Plains;
            const color = (material as THREE.MeshBasicMaterial | THREE.MeshStandardMaterial).color || new THREE.Color('grey');
            
            // Set the height based on the tile's height property
            position.y = tileData.height * heightScaleFactor;
            
            return { ...tileData, key, position, color, material };
        });
    }, [gridTiles, heightScaleFactor]);

    // Generate support pillars for elevated mountain tiles
    const supportPillars = useMemo((): SupportPillarInfo[] => {
        const pillars: SupportPillarInfo[] = [];
        
        // Loop through all tiles
        allInstancesData.forEach(tile => {
            // Only create pillars for elevated mountain tiles
            if (tile.type === 'Mountain' && tile.height > 0) {
                const numPillars = tile.height; // Number of pillars based on height
                
                // Create supporting tiles below this mountain
                for (let i = 0; i < numPillars; i++) {
                    const pillarPosition = new THREE.Vector3(
                        tile.position.x,
                        i * heightScaleFactor, // Position at each level below the surface
                        tile.position.z
                    );
                    
                    pillars.push({
                        key: `${tile.key}-pillar-${i}`,
                        position: pillarPosition,
                        parentTile: tile
                    });
                }
            }
        });
        
        return pillars;
    }, [allInstancesData, heightScaleFactor]);

    const { basicInstances, iceDepositInstances, mountainInstances } = useMemo(() => {
        const basic: InstanceInfo[] = [];
        const iceDeposits: InstanceInfo[] = [];
        const mountains: InstanceInfo[] = [];
        
        allInstancesData.forEach(instance => {
            if (selectedTileData && instance.q === selectedTileData.q && instance.r === selectedTileData.r) {
                return;
            }
            
            if (instance.type === 'Ice Deposit') {
                iceDeposits.push(instance);
            } else if (instance.type === 'Mountain') {
                mountains.push(instance);
            } else {
                basic.push(instance);
            }
        });
        
        return { basicInstances: basic, iceDepositInstances: iceDeposits, mountainInstances: mountains };
    }, [allInstancesData, selectedTileData]);

    // Safely get selected instance with error handling
    const selectedInstance = useMemo(() => {
        if (!selectedTileData || !allInstancesData.length) return null;
        
        try {
            return allInstancesData.find(inst => 
                inst.q === selectedTileData.q && 
                inst.r === selectedTileData.r
            ) || null;
        } catch (error) {
            console.error("Error finding selected instance:", error);
            return null;
        }
    }, [selectedTileData, allInstancesData]);

    const handleTileClick = (event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        if (event.point) {
            try {
                const clickedCoords = worldToAxial(event.point);
                selectTile(clickedCoords.q, clickedCoords.r);
            } catch (error) {
                console.error("Error selecting tile:", error);
            }
        } else {
            console.warn("Click event missing intersection point.");
        }
    };

    // Add effect to clear selection when switching to puzzle view
    useEffect(() => {
        if (gameView === 'puzzle') {
            // Deselect tile when entering puzzle view to avoid stale references
            useGameStore.getState().deselectTile();
        }
    }, [gameView]);

    // Store reference to selected mesh for cleanup
    const storeSelectedMeshRef = (mesh: THREE.Mesh) => {
        selectedMeshRef.current = mesh;
        return mesh;
    };

    // Store reference to line segments for cleanup
    const storeLineSegmentsRef = (lines: THREE.LineSegments) => {
        edgeLinesRef.current.push(lines);
        return lines;
    };

    // New function to store status indicator mesh references for cleanup
    const storeStatusIndicatorRef = (mesh: THREE.Mesh) => {
        statusIndicatorsMeshesRef.current.push(mesh);
        return mesh;
    };

    // Generate status indicators for tiles with buildings/tasks
    const statusIndicators = useMemo((): StatusIndicatorInfo[] => {
        if (!gridTiles || !activeTasks) return [];
        
        const indicators: StatusIndicatorInfo[] = [];
        
        // Check each tile with a taskId to determine its status
        Object.entries(gridTiles).forEach(([tileKey, tileData]) => {
            // Skip tiles without tasks
            if (!tileData.taskId) return;
            
            const task = activeTasks[tileData.taskId];
            if (!task) return;
            
            const worldPos = axialToWorld(tileData.q, tileData.r);
            worldPos.y += tileData.height * (TILE_THICKNESS * 0.8);
            
            let indicatorType: 'issue' | 'event' | 'operational' | 'shutdown' | 'none' = 'none';
            
            // Check for issues (highest priority)
            const hasIssue = Object.values(buildingIssues).some(
                issue => !issue.resolved && issue.buildingId === task.id
            );
            
            if (hasIssue) {
                indicatorType = 'issue';
            } 
            // Check for events (2nd priority)
            else if (task.status === 'event-pending') {
                indicatorType = 'event';
            }
            // Check for shutdown status (3rd priority)
            else if (task.status === 'shutdown') {
                indicatorType = 'shutdown';
            }
            // Check operational status (4th priority)
            else if (task.status === 'operational') {
                indicatorType = 'operational';
            }
            // Check if recently completed but shutdown
            else if (task.status === 'deploying') {
                // No indicator for deploying tasks
                return;
            }
            
            // Skip if no indicator needed
            if (indicatorType === 'none') return;
            
            indicators.push({
                key: `status-${tileKey}-${indicatorType}`,
                position: getStatusIndicatorPosition(worldPos, indicatorType),
                type: indicatorType,
                tileKey
            });
        });
        
        return indicators;
    }, [gridTiles, activeTasks, buildingIssues]);

    return (
        <>
            {/* Render support pillars for mountains */}
            {supportPillars.length > 0 && (
                <Instances
                    limit={supportPillars.length}
                    geometry={hexGeometry}
                    material={tileMaterials.Mountain}
                >
                    {supportPillars.map((pillar) => (
                        <Instance
                            key={pillar.key}
                            position={[pillar.position.x, pillar.position.y, pillar.position.z]}
                            color={(pillar.parentTile.material as THREE.MeshBasicMaterial).color}
                            scale={[1.005, 1, 1.005]}
                        />
                    ))}
                </Instances>
            )}

            {/* Render mountain tiles */}
            {mountainInstances.length > 0 && (
                <Instances
                    limit={mountainInstances.length}
                    geometry={hexGeometry}
                    material={tileMaterials.Mountain}
                    onClick={handleTileClick}
                >
                    {mountainInstances.map((instance) => (
                        <Instance
                            key={`${instance.key}-fill`}
                            position={[instance.position.x, instance.position.y, instance.position.z]}
                            color={(instance.material as THREE.MeshBasicMaterial).color}
                            scale={[1.005, 1, 1.005]}
                        />
                    ))}
                </Instances>
            )}

            {/* Render basic terrain tiles with plainsHexGeometry for displacement effect */}
            <Instances
                limit={basicInstances.length}
                geometry={plainsHexGeometry}
                material={tileMaterials.Plains}
                onClick={handleTileClick}
            >
                {basicInstances.map((instance) => (
                    <Instance
                        key={`${instance.key}-fill`}
                        position={[instance.position.x, instance.position.y, instance.position.z]}
                        color={(instance.material as THREE.MeshBasicMaterial).color}
                        scale={[
                            (1.0 + (Math.sin(instance.q * 0.5) * 0.02)) * 1.005,
                            1.0, 
                            (1.0 + (Math.cos(instance.r * 0.5) * 0.02)) * 1.005
                        ]}
                        rotation={[0, Math.sin(instance.q * instance.r * 0.05) * 0.05, 0]}
                    />
                ))}
            </Instances>

            {/* Render ice deposit tiles */}
            {iceDepositInstances.length > 0 && (
                <Instances
                    limit={iceDepositInstances.length}
                    geometry={hexGeometry}
                    material={tileMaterials['Ice Deposit']}
                    onClick={handleTileClick}
                >
                    {iceDepositInstances.map((instance) => (
                        <Instance
                            key={`${instance.key}-fill`}
                            position={[instance.position.x, instance.position.y, instance.position.z]}
                            scale={[1.005, 1, 1.005]}
                        />
                    ))}
                </Instances>
            )}

            {/* Render selected tile */}
            {selectedInstance && (
                <mesh
                    ref={storeSelectedMeshRef}
                    key={`${selectedInstance.key}-selected`}
                    geometry={hexGeometry}
                    material={selectedMaterial}
                    position={[selectedInstance.position.x, selectedInstance.position.y, selectedInstance.position.z]}
                    scale={[1.005, 1, 1.005]}
                    onClick={(e) => {
                        e.stopPropagation();
                        useGameStore.getState().deselectTile();
                    }}
                >
                </mesh>
            )}

            {/* Render wireframe outlines with proper reference tracking */}
            <group>
                {allInstancesData.map((instance) => (
                    <lineSegments
                        ref={storeLineSegmentsRef}
                        key={`${instance.key}-lines`}
                        geometry={edgesGeometry}
                        material={lineMaterial}
                        position={[instance.position.x, instance.position.y, instance.position.z]}
                    />
                ))}
            </group>

            {/* Render status indicators */}
            <group>
                {statusIndicators.map((indicator) => {
                    const material = getStatusIndicatorMaterial(indicator.type);
                    if (!material) return null;
                    
                    return (
                        <mesh
                            ref={storeStatusIndicatorRef}
                            key={indicator.key}
                            geometry={statusIndicatorGeometry}
                            material={material}
                            position={[indicator.position.x, indicator.position.y, indicator.position.z]}
                            // Add slight hovering animation
                            onUpdate={(self) => {
                                // Get unique animation seed from position
                                const seed = indicator.position.x * 0.1 + indicator.position.z * 0.2;
                                // Hover animation
                                self.position.y = indicator.position.y + Math.sin(Date.now() * 0.003 + seed) * 0.05;
                                // Subtle rotation animation for more attention
                                self.rotation.y = Date.now() * 0.001 + seed * 10;
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                // When clicked, select the tile
                                const [q, r] = indicator.tileKey.split(',').map(Number);
                                selectTile(q, r);
                            }}
                        />
                    );
                })}
            </group>
        </>
    );
};

export default HexTileInstances; 