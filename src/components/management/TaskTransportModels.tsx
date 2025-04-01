import { useMemo, useRef, useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore, TaskState } from '@store/store';
import { axialToWorld, TILE_THICKNESS } from '@utils/hexUtils';
import * as THREE from 'three';

// Define which task statuses represent an ongoing process
const IN_PROGRESS_STATUSES: TaskState['status'][] = ['deploying'];

// Model path for transport vehicle
const TRANSPORT_MODEL_PATH = '/Derech/models/transport.glb';

// Animation constants
const ANIMATION_DURATION = 2.5; // seconds for a complete animation

// Define the transport models with their properties
interface TransportModelInfo {
  key: string;
  taskId: string;
  modelPath: string;
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  progress: number;
  prevProgress: number;
  animationStartProgress: number;
  animationTargetProgress: number;
  startTime: number;
}

// Individual transport model component
const TransportModel = ({
  modelPath,
  startPos,
  endPos,
  progress,
  prevProgress,
  animationStartProgress,
  animationTargetProgress,
  startTime,
  taskId,
}: TransportModelInfo) => {
  const { scene } = useGLTF(modelPath);
  const modelRef = useRef<THREE.Group | null>(null);
  const { clock } = useThree();
  
  // Clone the model scene to avoid modifying the original
  const modelScene = useMemo(() => {
    return scene.clone();
  }, [scene]);

  // Set up the model
  useEffect(() => {
    if (modelRef.current) {
      // Clear existing children
      while (modelRef.current.children.length > 0) {
        modelRef.current.remove(modelRef.current.children[0]);
      }
      
      // Add the cloned scene
      modelRef.current.add(modelScene);
    }
    
    // Cleanup on unmount
    return () => {
      if (modelRef.current) {
        while (modelRef.current.children.length > 0) {
          modelRef.current.remove(modelRef.current.children[0]);
        }
      }
    };
  }, [modelScene]);

  // Animation effect
  useFrame(() => {
    if (!modelRef.current) return;

    // Calculate how far we are in the animation (0-1)
    const elapsedTime = clock.getElapsedTime() - startTime;
    const animationProgress = Math.min(elapsedTime / ANIMATION_DURATION, 1);
    
    // Apply a smooth easing function
    const eased = animationProgress < 0.5 
      ? 2 * animationProgress * animationProgress 
      : 1 - Math.pow(-2 * animationProgress + 2, 2) / 2;
      
    // Calculate current task progress
    let currentProgress;
    
    if (animationProgress < 1) {
      // Still animating - interpolate between start and target
      currentProgress = animationStartProgress + 
        (animationTargetProgress - animationStartProgress) * eased;
    } else {
      // Animation complete - use the actual task progress
      currentProgress = progress;
    }
    
    // Calculate position along the line (0-1)
    const t = currentProgress / 100;
    
    // Update position
    const newPosition = new THREE.Vector3().lerpVectors(startPos, endPos, t);
    modelRef.current.position.copy(newPosition);
    
    // Calculate direction to face
    const direction = new THREE.Vector3().subVectors(endPos, startPos).normalize();
    
    // Set rotation to face the movement direction
    if (direction.x !== 0 || direction.z !== 0) {
      const angle = Math.atan2(direction.x, direction.z);
      modelRef.current.rotation.y = angle + Math.PI/4; // 45° rotation to the left
    }
  });

  return (
    <group ref={modelRef} />
  );
};

// Main component to manage all transport models
const TaskTransportModels = () => {
  const activeTasks = useGameStore((state) => state.activeTasks);
  const gridTiles = useGameStore((state) => state.gridTiles);
  const currentRound = useGameStore((state) => state.currentRound);
  const { clock } = useThree();
  
  // Track previous task progress values for animation
  const prevTasksRef = useRef<Record<string, { progress: number }>>({});
  
  // Store animation start times and other animation state
  const [animationState, setAnimationState] = useState<Record<string, {
    animationStartProgress: number;
    animationTargetProgress: number;
    startTime: number;
  }>>({});

  // Detect task progress changes and trigger animations
  useEffect(() => {
    const currentTaskProgress = Object.entries(activeTasks).reduce((acc, [id, task]) => {
      acc[id] = { progress: task.progress };
      return acc;
    }, {} as Record<string, { progress: number }>);
    
    // Check for progress changes
    let anyChanges = false;
    const updates: Record<string, {
      animationStartProgress: number;
      animationTargetProgress: number;
      startTime: number;
    }> = {};
    
    Object.entries(currentTaskProgress).forEach(([taskId, { progress }]) => {
      // Check if we have previous state for this task
      if (prevTasksRef.current[taskId]) {
        const prevProgress = prevTasksRef.current[taskId].progress;
        
        // If progress changed, update animation state
        if (prevProgress !== progress) {
          anyChanges = true;
          console.log(`Task ${taskId} progress changed: ${prevProgress}% -> ${progress}%`);
          
          updates[taskId] = {
            animationStartProgress: prevProgress,
            animationTargetProgress: progress,
            startTime: clock.getElapsedTime()
          };
        }
      } else {
        // New task - start animation from 0
        console.log(`New task detected: ${taskId} at ${progress}%`);
        updates[taskId] = {
          animationStartProgress: 0,
          animationTargetProgress: progress,
          startTime: clock.getElapsedTime()
        };
      }
    });
    
    // Update animation state with new/changed tasks
    if (Object.keys(updates).length > 0) {
      setAnimationState(prev => ({
        ...prev,
        ...updates
      }));
    }
    
    // Store current task progress for next comparison
    prevTasksRef.current = currentTaskProgress;
    
  }, [activeTasks, clock]);

  // Special trigger for round changes
  useEffect(() => {
    console.log(`Round changed to ${currentRound}`);
  }, [currentRound]);

  // Process tasks to get transport models
  const transportModels = useMemo(() => {
    const models: TransportModelInfo[] = [];
    
    // Get center tile coordinates
    const centerTileKey = '0,0';
    const centerTile = gridTiles[centerTileKey];
    if (!centerTile) return models;

    // Calculate center tile position
    const centerHeightOffset = centerTile.height * (TILE_THICKNESS * 0.8);
    const centerSurfaceY = centerHeightOffset + TILE_THICKNESS / 2 + 0.3;
    const centerPos = axialToWorld(centerTile.q, centerTile.r);
    const startPos = new THREE.Vector3(centerPos.x, centerSurfaceY, centerPos.z);

    // Process each task
    Object.entries(activeTasks).forEach(([taskId, task]) => {
      if (IN_PROGRESS_STATUSES.includes(task.status as TaskState['status'])) {
        const targetTile = gridTiles[task.targetTileKey];
        if (targetTile) {
          // Calculate target position
          const targetHeightOffset = targetTile.height * (TILE_THICKNESS * 0.8);
          const targetSurfaceY = targetHeightOffset + TILE_THICKNESS / 2 + 0.3;
          const targetPos = axialToWorld(targetTile.q, targetTile.r);
          const endPos = new THREE.Vector3(targetPos.x, targetSurfaceY, targetPos.z);

          // Get animation state or use defaults
          const animation = animationState[taskId] || {
            animationStartProgress: 0,
            animationTargetProgress: task.progress,
            startTime: clock.getElapsedTime()
          };

          models.push({
            key: `transport-${taskId}`,
            taskId,
            modelPath: TRANSPORT_MODEL_PATH,
            startPos,
            endPos,
            progress: task.progress,
            prevProgress: prevTasksRef.current[taskId]?.progress || 0,
            animationStartProgress: animation.animationStartProgress,
            animationTargetProgress: animation.animationTargetProgress,
            startTime: animation.startTime
          });
        }
      }
    });

    return models;
  }, [activeTasks, gridTiles, animationState, clock]);

  // Preload transport model
  useEffect(() => {
    console.log("Preloading transport model:", TRANSPORT_MODEL_PATH);
    useGLTF.preload(TRANSPORT_MODEL_PATH);
    
    return () => {
      useGLTF.clear([TRANSPORT_MODEL_PATH]);
    };
  }, []);

  return (
    <group>
      {transportModels.map(model => (
        <TransportModel
          key={model.key}
          taskId={model.taskId}
          modelPath={model.modelPath}
          startPos={model.startPos}
          endPos={model.endPos}
          progress={model.progress}
          prevProgress={model.prevProgress}
          animationStartProgress={model.animationStartProgress}
          animationTargetProgress={model.animationTargetProgress}
          startTime={model.startTime}
        />
      ))}
    </group>
  );
};

export default TaskTransportModels; 