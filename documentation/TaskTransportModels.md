# TaskTransportModels - Transport Vehicle Animation Implementation

## 1. Purpose

This component adds animated transport vehicles that move along task progress lines when tasks are being deployed. These vehicles visually represent the progress of a task, moving from the colony center (0,0) to the target tile as the task progresses.

## 2. Core Features

- **Progressive Movement**: Transport vehicles move along the task line based on the task's progress percentage.
- **Animated Transitions**: When a round ends and progress updates, vehicles smoothly animate to their new positions.
- **Automatic Orientation**: Vehicles automatically rotate to face the direction of travel.
- **Memory Management**: Proper cleanup of 3D resources when the component unmounts or models are no longer needed.

## 3. Implementation Details

### Models
- `transport.glb` - Basic transport vehicle used throughout the task deployment

### Position Calculation
- Vehicles are positioned along a line from the colony center (0,0) to the target tile
- Position is calculated using linear interpolation (LERP) based on task progress

### Progress Animation
- When task progress changes (usually when a round ends), vehicles smoothly animate to their new positions over a set duration
- Animation uses an ease-in-out function for natural movement
- Models rotate to face the direction of travel

## 4. Integration

The component automatically:
1. Monitors the `activeTasks` state in the game store
2. Filters for tasks with "deploying" status
3. Creates and positions transport models for each active task
4. Animates models when task progress changes
5. Removes models when tasks complete

## 5. Usage

No special configuration is needed. Simply include the `<TaskTransportModels />` component in your render hierarchy, typically alongside `<TaskProgressLines />` in the `HexGrid` component.

## 6. Future Enhancements

Potential future improvements:
- Add additional vehicle types for different task types
- Add particle effects or trails behind vehicles
- Add sound effects during movement
- Add hover information display showing task details

## 7. Dependencies

- React Three Fiber (R3F) and Drei for 3D rendering
- Zustand store for tracking task state
- ThreeJS for underlying 3D operations 