import { useMemo, useRef } from 'react';
import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useGameStore, TaskStatus } from '@store/store'; // Assuming TaskStatus enum/type exists
import { axialToWorld, TILE_THICKNESS } from '@utils/hexUtils';
import * as THREE from 'three';

// Define which task statuses represent an ongoing process
const IN_PROGRESS_STATUSES: TaskStatus[] = ['deploying', 'constructing', 'researching']; // Adjust this based on your actual TaskStatus values

const TaskProgressLine = ({ taskKey, startPos, endPos }: { taskKey: string, startPos: THREE.Vector3, endPos: THREE.Vector3 }) => {
    const lineRef = useRef<any>(); // Use 'any' for now, Drei's Line ref type might be complex

    useFrame(({ clock }) => {
        if (lineRef.current) {
            // Animate the dash offset to create a moving/pulsing effect
            lineRef.current.material.uniforms.dashOffset.value = -clock.getElapsedTime() * 0.5;
        }
    });

    const points = useMemo(() => [startPos, endPos], [startPos, endPos]);

    return (
        <Line
            ref={lineRef}
            key={taskKey}
            points={points}
            color="yellow"
            lineWidth={1.5} // Adjust for desired thickness
            dashed={true}
            dashScale={5}  // How many dashes/gaps fit in the line's length
            dashSize={0.3} // Length of a dash segment relative to dashScale
            gapSize={0.15} // Length of a gap segment relative to dashScale
        />
    );
};

const TaskProgressLines = () => {
    const activeTasks = useGameStore((state) => state.activeTasks);
    const gridTiles = useGameStore((state) => state.gridTiles);

    // Memoize the calculation of line data
    const lineData = useMemo(() => {
        const centerTileKey = '0,0';
        const centerTile = gridTiles[centerTileKey];
        if (!centerTile) return []; // Cannot draw lines without center tile

        // Calculate base Y slightly above the center tile surface
        const centerHeightOffset = centerTile.height * (TILE_THICKNESS * 0.8);
        const centerSurfaceY = centerHeightOffset + TILE_THICKNESS / 2 + 0.2; // Add offset
        const centerPos = axialToWorld(centerTile.q, centerTile.r);
        const startPos = new THREE.Vector3(centerPos.x, centerSurfaceY, centerPos.z);

        const lines = [];
        for (const task of Object.values(activeTasks)) {
            // Check if task status is considered "in progress"
            if (IN_PROGRESS_STATUSES.includes(task.status as TaskStatus)) {
                const targetTile = gridTiles[task.targetTileKey];
                if (targetTile) {
                    // Calculate base Y slightly above the target tile surface
                    const targetHeightOffset = targetTile.height * (TILE_THICKNESS * 0.8);
                    const targetSurfaceY = targetHeightOffset + TILE_THICKNESS / 2 + 0.2; // Add offset
                    const targetPos = axialToWorld(targetTile.q, targetTile.r);
                    const endPos = new THREE.Vector3(targetPos.x, targetSurfaceY, targetPos.z);

                    lines.push({
                        key: `progress-${task.id}`,
                        startPos: startPos,
                        endPos: endPos,
                    });
                }
            }
        }
        return lines;

    }, [activeTasks, gridTiles]);

    return (
        <group>
            {lineData.map(data => (
                <TaskProgressLine
                    key={data.key}
                    taskKey={data.key}
                    startPos={data.startPos}
                    endPos={data.endPos}
                />
            ))}
        </group>
    );
};

export default TaskProgressLines; 