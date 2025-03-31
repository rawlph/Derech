import { useMemo, useRef } from 'react';
import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '@store/store';
import { axialToWorld, TILE_THICKNESS } from '@utils/hexUtils';
import * as THREE from 'three';

// Connection type and color configuration
interface ConnectionType {
    sourceBuilding: string;
    targetTaskTypes: string[];
    color: string;
    lineWidth: number;
}

const connectionTypes: ConnectionType[] = [
    {
        sourceBuilding: 'Production Dome',
        targetTaskTypes: ['mining', 'solar', 'geothermal'],
        color: '#FF7F00', // Orange
        lineWidth: 2.5
    },
    {
        sourceBuilding: 'Research Dome',
        targetTaskTypes: ['scout'],
        color: '#00BFFF', // Teal blue
        lineWidth: 2.5
    },
    {
        sourceBuilding: 'Living Dome',
        targetTaskTypes: ['waterwell'],
        color: '#00FF7F', // Vivid green
        lineWidth: 2.5
    }
];

interface ConnectionLineProps {
    startPos: THREE.Vector3;
    endPos: THREE.Vector3;
    color: string;
    lineWidth: number;
    id: string;
}

const ConnectionLine = ({ startPos, endPos, color, lineWidth, id }: ConnectionLineProps) => {
    const lineRef = useRef<any>();
    
    useFrame(({ clock }) => {
        if (lineRef.current) {
            // Create pulsing effect - slightly animate line width
            const time = clock.getElapsedTime();
            const pulse = Math.sin(time * 2) * 0.2 + 1;
            lineRef.current.material.uniforms.dashOffset.value = -time * 0.3;
            lineRef.current.material.uniforms.linewidth.value = lineWidth * pulse;
        }
    });

    const points = useMemo(() => [startPos, endPos], [startPos, endPos]);

    return (
        <Line
            ref={lineRef}
            key={id}
            points={points}
            color={color}
            lineWidth={lineWidth}
            dashed={true}
            dashScale={5}
            dashSize={0.6} // Larger dash size than deployment lines
            gapSize={0.3} // Smaller gaps for more vivid appearance
        />
    );
};

const BaseConnectionLines = () => {
    const gridTiles = useGameStore((state) => state.gridTiles);
    const activeTasks = useGameStore((state) => state.activeTasks);
    const selectedTile = useGameStore((state) => state.selectedTile);

    const connectionLines = useMemo(() => {
        // If no tile is selected, don't show any lines
        if (!selectedTile || !selectedTile.building) return [];
        
        // Only show lines for the selected building type if it's one of our dome types
        const selectedDomeType = selectedTile.building;
        if (!['Production Dome', 'Research Dome', 'Living Dome'].includes(selectedDomeType)) {
            return [];
        }
        
        // Find dome positions - but now we only care about the selected dome
        const domePositions: Record<string, THREE.Vector3> = {};
        
        // Get the position of the selected dome
        const pos = axialToWorld(selectedTile.q, selectedTile.r);
        const heightOffset = selectedTile.height * (TILE_THICKNESS * 0.8);
        const surfaceY = heightOffset + TILE_THICKNESS / 2 + 0.3; // Slightly higher than task lines
        domePositions[selectedDomeType] = new THREE.Vector3(pos.x, surfaceY, pos.z);
        
        const lines: ConnectionLineProps[] = [];
        
        // Find matching connection type for the selected dome
        const relevantConnectionType = connectionTypes.find(ct => ct.sourceBuilding === selectedDomeType);
        if (!relevantConnectionType) return [];
        
        // Find operational tasks that match our selected dome's connection type
        Object.values(activeTasks).forEach(task => {
            // Check if any of the targetTaskTypes exists within the task.type string
            const matchesTaskType = relevantConnectionType.targetTaskTypes.some(taskType => 
                task.type.includes(taskType)
            );
            
            if (task.status === 'operational' && matchesTaskType) {
                const targetTile = gridTiles[task.targetTileKey];
                if (targetTile) {
                    const taskPos = axialToWorld(targetTile.q, targetTile.r);
                    const taskHeightOffset = targetTile.height * (TILE_THICKNESS * 0.8);
                    const taskSurfaceY = taskHeightOffset + TILE_THICKNESS / 2 + 0.25; // Position above the tile
                    const targetPos = new THREE.Vector3(taskPos.x, taskSurfaceY, taskPos.z);
                    
                    lines.push({
                        startPos: domePositions[selectedDomeType],
                        endPos: targetPos,
                        color: relevantConnectionType.color,
                        lineWidth: relevantConnectionType.lineWidth,
                        id: `connection-${selectedDomeType}-${task.id}`
                    });
                }
            }
        });
        
        return lines;
    }, [gridTiles, activeTasks, selectedTile]);

    // If no lines to show, don't render anything
    if (connectionLines.length === 0) {
        return null;
    }

    return (
        <group>
            {connectionLines.map(line => (
                <ConnectionLine
                    key={line.id}
                    id={line.id}
                    startPos={line.startPos}
                    endPos={line.endPos}
                    color={line.color}
                    lineWidth={line.lineWidth}
                />
            ))}
        </group>
    );
};

export default BaseConnectionLines; 