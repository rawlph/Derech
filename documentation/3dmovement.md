# 3D Movement System Documentation

## Tech Stack Components Used
- **React Three Fiber (R3F)**: Core framework for rendering 3D scenes in React
- **Three.js**: Underlying 3D library providing quaternion-based rotation and vector mathematics
- **@react-three/drei**: Utility components like `Text` and `Html` for UI elements
- **TypeScript**: Type safety for movement and rotation calculations
- **nipplejs**: Mobile joystick controls implementation

## Movement System Overview

### Core Components
1. **Player Component**
   - Implemented as a forwarded ref component (`forwardRef`)
   - Manages both position and rotation state
   - Handles input from multiple control schemes

2. **Position Management**
   ```typescript
   const [playerPosition, setPlayerPosition] = useState(() => new THREE.Vector3(...position));
   ```
   - Uses React state for position tracking
   - Position updates trigger React's render cycle

3. **Movement Parameters**
   ```typescript
   const speed = useRef(0.15);
   const lookSensitivity = useRef(0.05);
   const mouseLookSensitivity = useRef(0.005);
   ```
   - Speed: Base movement velocity
   - Look Sensitivity: Rotation speed for mobile controls
   - Mouse Look Sensitivity: Reduced sensitivity for mouse input

### Movement Controls

#### Keyboard Input (WASD/Arrow Keys)
- Handled through `useEffect` event listeners
- Movement direction stored in `keys.current` ref
- Supports simultaneous key presses for diagonal movement

#### Mouse Look Controls
1. **Mouse Event Handling**
   ```typescript
   const handleMouseMove = (e: MouseEvent) => {
     const deltaX = e.clientX - lastMousePosition.current.x;
     const deltaY = e.clientY - lastMousePosition.current.y;
   }
   ```
   - Tracks mouse movement delta
   - Updates rotation based on movement distance

2. **Rotation Order**
   ```typescript
   ref.current.rotation.order = 'YXZ';
   ```
   - Uses YXZ Euler order for stable first-person controls
   - Prevents gimbal lock issues

#### Mobile Controls (nipplejs)
1. **Dual Joystick System**
   - Left joystick: Movement direction
   - Right joystick: Look/rotation control
   - Both joysticks use normalized vector input (-1 to 1)

2. **Touch Input Processing**
   ```typescript
   mobileMoveInput.current = { x: data.vector.x, y: data.vector.y };
   mobileLookInput.current = { x: data.vector.x, y: data.vector.y };
   ```
   - Continuous input updates at 60fps
   - Smooth interpolation between input values

### Flying Movement System

#### Movement Direction Calculation
```typescript
const rotatedDirection = moveDirection.clone().applyQuaternion(ref.current.quaternion);
```
- Uses full quaternion rotation for true 3D movement
- Movement always follows look direction, including vertical

#### Rotation Constraints and Smoothing

1. **Vertical Rotation Limits**
   ```typescript
   const maxVerticalRotation = Math.PI / 2 - 0.15;
   ref.current.rotation.x = Math.max(-maxVerticalRotation, 
                                   Math.min(maxVerticalRotation, ref.current.rotation.x));
   ```
   - Prevents complete vertical flips
   - Maintains ~75° up/down limit

2. **Rotation Normalization**
   ```typescript
   if (ref.current.rotation.y > Math.PI) {
       ref.current.rotation.y -= 2 * Math.PI;
   }
   ```
   - Keeps rotation values within -π to π range
   - Ensures consistent control behavior

3. **Auto-Leveling System**
   ```typescript
   if (shouldAutoLevel.current) {
       ref.current.rotation.x *= (1 - autoLevelSpeed);
   }
   ```
   - Smoothly returns view to horizontal when not actively looking
   - Uses exponential decay for natural feel

### Camera System

1. **Camera Following**
   ```typescript
   const cameraOffset = new THREE.Vector3(0, 5, 12);
   const rotatedOffset = cameraOffset.clone().applyQuaternion(playerQuaternion);
   ```
   - Maintains fixed distance from player
   - Smoothly follows player rotation

2. **Look Target**
   ```typescript
   const lookOffset = new THREE.Vector3(0, 0, -5);
   const lookTarget = playerWorldPos.clone().add(rotatedLookOffset);
   ```
   - Camera aims slightly ahead of player
   - Creates more natural following behavior

## Performance Considerations

1. **Reference Usage**
   - Heavy use of `useRef` for values that don't need renders
   - Prevents unnecessary component updates

2. **Matrix Updates**
   ```typescript
   ref.current.updateMatrixWorld();
   ```
   - Explicit matrix updates after rotation changes
   - Ensures accurate world transformations

3. **Movement Smoothing**
   - Input values normalized before application
   - Lerp-based smoothing for camera movement
   - Delta-time independent speed calculations

## Limitations and Constraints

1. **Movement Boundaries**
   - Currently no collision detection
   - No terrain interaction
   - Infinite movement range

2. **Performance Impact**
   - Quaternion calculations every frame
   - Matrix updates for rotation changes
   - Camera position/rotation interpolation

## Future Improvements

1. **Potential Enhancements**
   - Collision detection system
   - Momentum/inertia system
   - Environment interaction
   - Speed boost mechanics

2. **Optimization Opportunities**
   - Batch matrix updates
   - Optimize quaternion calculations
   - Add movement boundary system 