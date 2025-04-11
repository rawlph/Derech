import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Simplified camera refs interface
export interface CameraRefs {
  playerRef: React.RefObject<THREE.Group>;
}

// Simple camera control that follows the player from behind
const useCameraControl = (
  refs: CameraRefs
) => {
  // Update camera position each frame to follow player
  useFrame((state) => {
    const { camera } = state;
    const { playerRef } = refs;
    
    // Skip if player ref not ready
    if (!playerRef?.current) return;

    // Simple following camera - position behind and above the player
    const targetPosition = new THREE.Vector3();
    playerRef.current.getWorldPosition(targetPosition);
    
    // Offset camera position to be behind and above player
    camera.position.set(
      targetPosition.x, 
      targetPosition.y + 5, 
      targetPosition.z + 10
    );
    
    // Make camera look at player
    camera.lookAt(targetPosition);
  });
};

export default useCameraControl; 