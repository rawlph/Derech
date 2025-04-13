# Unified 3D Scene Framework Implementation Plan
src/
├── components/
│   ├── Player.jsx         	 # Player sphere with movement logic
│   ├── CameraControls.jsx 	 # Camera following and orbiting
│   ├── WelcomeScene.jsx 	 # Example 3D intro screen
	├── AudioPuzzleScene.jsx # Example 3D puzzle scene2
│   └── ManagementArea.jsx   # Management scene (no movement)
├── hooks/
│   ├── useKeyboard.js    # Desktop input hook
│   └── useNipple.js      # Mobile joystick hook
├── store.ts              # Zustand store for state management
├── App.jsx               # Main app with scene switching
└── main.jsx              # Entry point

## Movement System Overview
**Goal**: Player controls a floating sphere. The floating sphere will:
Move smoothly in the direction the camera is facing, giving intuitive controls relative to what the player sees.

Work seamlessly on both desktop (W/A/S/D keys + mouse) and mobile (virtual joystick + touch gestures).

Avoid gimbal lock and spiraling by using quaternions (handled by Three.js) and constraining camera rotations.

Allow freedom to navigate a museum-like space while keeping the controls forgiving and easy to use.

## Here’s how we’ll break it down:
1. Player Movement
The sphere moves in the XZ plane (horizontal), floating at a fixed height (e.g., Y = 1).

Movement is based on the camera’s orientation, so "forward" is always where the player is looking.

Desktop: W (forward), S (backward), A (strafe left), D (strafe right).

Mobile: A virtual joystick (e.g., using nipple.js) controls direction.

2. Camera Control
The camera follows the sphere smoothly and orbits around it, allowing the player to look around.

Desktop: Mouse drag rotates the camera.

Mobile: Touch gestures rotate the camera.

We’ll use OrbitControls from @react-three/drei to handle this, with constraints to prevent flipping or spiraling.

3. Error Tolerance
Quaternions: Three.js uses quaternions for rotations, naturally avoiding gimbal lock.

Rotation Limits: We’ll cap the camera’s vertical angle to prevent upside-down views.

Smoothness: Linear interpolation (lerping) ensures the camera follows the sphere without jittering.

4. Implementation
We’ll create a Player component for the sphere and a CameraControls component to manage the camera. The movement will be updated every frame using R3F’s useFrame hook.
How It Works
Movement Direction
The sphere moves relative to the camera’s view. For example, pressing "W" moves it in the direction the camera is facing, projected onto the horizontal plane.

We calculate:
Forward Direction: From the sphere to the camera, flattened to the XZ plane (Y = 0).

Right Direction: Perpendicular to forward, also in the XZ plane.

Input (e.g., W/A/S/D or joystick) combines these directions to move the sphere.

Smooth Following
The camera’s target (where it looks) is set to the sphere’s position and updated with lerping, creating a smooth follow effect.

Players can rotate the camera around the sphere to look around, and the movement adjusts accordingly.

Controls
Desktop: W/A/S/D for movement, mouse drag to rotate the camera.

Mobile: Virtual joystick for movement, swipe gestures to rotate the camera.

# Code Implementation
Here’s a complete setup for our movement system in ThreeJS, with R3F, Drei and cannon-es.
Player Component
This handles the sphere’s movement based on input and camera orientation.
javascript

import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Custom hooks for input (you’d need to implement these)
import { useKeyboard } from './hooks/useKeyboard'; // Tracks W/A/S/D keys
import { useNipple } from './hooks/useNipple';   // Tracks virtual joystick (e.g., nipple.js)

function Player({ setPlayerRef }) {
  const ref = useRef();              // Reference to the sphere mesh
  const { camera } = useThree();     // Access the Three.js camera
  const keys = useKeyboard();        // Keyboard input state
  const joystick = useNipple();      // Joystick input state

  // Pass the ref to the parent (for camera to follow)
  useEffect(() => {
    if (setPlayerRef) setPlayerRef(ref);
  }, [ref, setPlayerRef]);

  useFrame((state, delta) => {
    if (!ref.current) return;

    const playerPos = ref.current.position;

    // Calculate movement directions
    const toCamera = camera.position.clone().sub(playerPos); // Vector from player to camera
    const forward = toCamera.clone().setY(0).normalize();    // Forward direction (XZ plane)
    const right = new THREE.Vector3(0, 1, 0).cross(forward).normalize(); // Right direction

    // Get input
    let moveX = joystick.current.x; // Left/right (A/D or joystick X)
    let moveZ = joystick.current.y; // Forward/backward (W/S or joystick Y)

    // Add keyboard input
    if (keys.current.w) moveZ += 1;
    if (keys.current.s) moveZ -= 1;
    if (keys.current.a) moveX -= 1;
    if (keys.current.d) moveX += 1;

    // Normalize diagonal movement to prevent faster speeds
    const moveVec = new THREE.Vector2(moveX, moveZ);
    if (moveVec.length() > 1) moveVec.normalize();

    // Calculate final movement direction
    const moveDir = right.clone().multiplyScalar(moveVec.x).add(forward.clone().multiplyScalar(moveVec.y));

    // Update position
    const speed = 5; // Meters per second (adjust as needed)
    playerPos.add(moveDir.multiplyScalar(speed * delta));
  });

  return (
    <mesh ref={ref} position={[0, 1, 0]}> {/* Float at Y = 1 */}
      <sphereGeometry args={[0.5, 32, 32]} /> {/* Smaller sphere */}
      <meshStandardMaterial color="blue" />
    </mesh>
  );
}

export default Player;

## Camera Controls Component
This makes the camera follow the sphere and allows rotation.
javascript

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

function CameraControls({ playerRef }) {
  const controlsRef = useRef();

  useFrame(() => {
    if (playerRef.current && controlsRef.current) {
      const targetPos = playerRef.current.position;
      // Smoothly update the camera target to the player’s position
      controlsRef.current.target.lerp(targetPos, 0.1);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      minDistance={2}        // Closest distance to sphere
      maxDistance={10}       // Farthest distance
      maxPolarAngle={Math.PI / 2} // Prevent camera from going below the sphere
      enablePan={false}      // Disable panning for simplicity
    />
  );
}

export default CameraControls;

## Scene Component
This ties everything together.
javascript

import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import Player from './Player';
import CameraControls from './CameraControls';

function Scene() {
  const playerRef = useRef();

  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      
      {/* The floating sphere */}
      <Player setPlayerRef={(ref) => (playerRef.current = ref)} />
      
      {/* Camera that follows the sphere */}
      <CameraControls playerRef={playerRef} />
      
      {/* Simple floor for context */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="gray" />
      </mesh>
    </Canvas>
  );
}

export default Scene;

## Notes on the Implementation
Input Hooks:
useKeyboard: A custom hook to track W/A/S/D keys (e.g., using window.addEventListener for key events).

useNipple: A hook for virtual joystick input using nipple.js. On mobile, this provides x (left/right) and y (forward/backward) values between -1 and 1.

Smooth Movement:
The sphere moves at a constant speed (5 meters/second), adjusted by delta (time between frames) for frame-rate independence.

Diagonal movement is normalized to prevent faster speeds when moving in two directions.

Error Tolerance:
Gimbal Lock: Avoided by using Three.js’s quaternion-based rotations in OrbitControls.

Spiraling: Prevented by limiting the camera’s maxPolarAngle to π/2 (90 degrees), keeping it above the horizon.

Adjustments:
Tweak speed (e.g., 3 or 10) to match our 3d Area’s scale.

Adjust the sphere’s size (sphereGeometry args) or height (position={[0, 1, 0]}) as needed.

