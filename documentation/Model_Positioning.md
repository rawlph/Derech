# Model Positioning System

This document explains how 3D models are positioned, scaled, and visualized in the Mars colony management game, providing guidance for developers adding or modifying building and task models.

## Table of Contents
1. [Core Positioning System](#core-positioning-system)
2. [Height and Y-Offset System](#height-and-y-offset-system)
3. [Model Scale Configuration](#model-scale-configuration)
4. [Rotation System](#rotation-system)
5. [Debug Visualization Tools](#debug-visualization-tools)
6. [Special Case Handling](#special-case-handling)
7. [Workflow for Model Adjustments](#workflow-for-model-adjustments)

## Core Positioning System

The game uses a hexagonal grid with an axial coordinate system (`q`, `r`). The `axialToWorld` function in `hexUtils.ts` converts hex coordinates to 3D world space.

### Base Positioning Mechanics:

1. **Tile Surface Calculation**:
   ```typescript
   // Calculate Position
   const tileWorldPos = axialToWorld(tile.q, tile.r);
   const heightOffset = tile.height * (TILE_THICKNESS * 0.8);
   const surfaceY = heightOffset + TILE_THICKNESS / 2;
   ```

2. **Model Position**:
   ```typescript
   // Apply Y offset from config
   const yOffset = config.yOffset !== undefined ? config.yOffset : 0.05;
   const taskY = surfaceY + yOffset;
   const position = new THREE.Vector3(tileWorldPos.x, taskY, tileWorldPos.z);
   ```

The system places models at hex grid coordinate positions and then applies height adjustments for mountains and configured offsets.

## Height and Y-Offset System

Height in the game consists of two components:

1. **Tile Height**: Integer values (0-2) defining base elevation for mountains, affecting the position of everything on that tile:
   ```typescript
   // mountain height calculation
   const heightOffset = tile.height * (TILE_THICKNESS * 0.8);
   ```

2. **Y-Offset**: Configured per model type in task or building configs:
   ```typescript
   yOffset: 0.05, // Standard position slightly above tile surface
   ```

### Effective Y-Offset Examples:
- **Standard Building**: `yOffset = 0.15` (slightly raised)
- **Mining Model**: `yOffset = 0.05` (just above surface)
- **Scout Outpost**: `yOffset = 0.1` with extra `-0.3` adjustment in code
- **Solar Panel**: `yOffset = 0.01` (very close to surface)

### Special Case: Scout Outpost

Scout outposts have custom positioning logic to handle placement issues:
```typescript
// Special case for scout outposts
if (taskState.type.includes('scout')) {
    const adjustedPosition = new THREE.Vector3(
        position.x,
        position.y - 0.3, // Apply a fixed downward offset
        position.z
    );
}
```

## Model Scale Configuration

Model scale is configured in the respective config files and loaded into instances.

### Building Scale (in buildings.ts):
```typescript
scale: [0.06, 0.06, 0.06], // Living/Research/Production domes
```

### Task/Workforce Scale (in tasks.ts):
```typescript
scale: [0.0008, 0.0008, 0.0008], // Mining workforce (extremely small)
scale: [0.04, 0.04, 0.04],        // Scout outpost (small)
scale: [0.15, 0.15, 0.15],        // Solar panels (medium)
```

### Scale Considerations:
- **Uniform Scaling**: Use the same value for all three dimensions to maintain proportions
- **Scale Hierarchy**: Buildings > Solar > Scout > Mining
- **Small Values**: Some models may need extremely small scale values (e.g., mining at 0.0008)
- **Testing**: Use debug visualization to verify size

## Rotation System

Model rotation is handled in two ways:

1. **Fixed Rotation** (current approach):
   ```typescript
   // Standard models face forward (Z-axis)
   const rotation = new THREE.Euler(0, 0, 0);
   ```

2. **Special Case Rotation**:
   ```typescript
   // Mining models are rotated to lie flat
   if (task.type.includes('mining')) {
       rotation = new THREE.Euler(Math.PI/2, 0, 0);
   }
   ```

Previously, models would rotate to face the center tile, but this has been removed in favor of fixed orientations.

## Debug Visualization Tools

The system includes built-in debug visualization for model positioning:

1. **Colored Wireframe Spheres**:
   - **Red**: Scout outpost position
   - **Blue**: Solar panel position
   - **Green**: Mining/other model position
   - **Yellow**: Base tile surface position

2. **Console Logging**:
   ```
   Task deploy-scout at 1,2: Y=0.200 (base=0.100, offset=0.100)
   Rendering 1 instances of /models/mars_building_scout.glb
     - Task deploy-scout-1,2: Position 0.200, Scale 0.04,0.04,0.04
   ```

To see these visualizations, check the browser console and the wireframe spheres in the scene.

## Special Case Handling

Some models require special handling due to their geometry or intended placement:

1. **Mining Workforce**:
   - Rotated 90° around X-axis to lie flat on the tile
   - Extremely small scale: `[0.0008, 0.0008, 0.0008]`

2. **Scout Outpost**:
   - Additional position adjustment: `-0.3` on Y axis
   - Position is calculated in a special case block

3. **Solar Panels**:
   - Larger scale than buildings: `[0.15, 0.15, 0.15]`
   - Very low Y-offset: `0.01`

## Workflow for Model Adjustments

Follow this workflow when adjusting model positioning:

1. **Start with Config Properties**:
   - Adjust `scale` and `yOffset` in the appropriate config file
   - Start with conservative values similar to existing models

2. **Verify with Debug Visualization**:
   - Check the wireframe spheres to see actual positions
   - Review console logs for exact positioning values

3. **Fine-tune Special Cases**:
   - If regular properties don't provide enough control, add special case handling
   - For example, the scout outpost's additional offset

4. **Document Changes**:
   - Note any special requirements or behaviors with your model
   - Update this document for significant positioning system changes

### Example Process:

To adjust a scout outpost's position:
1. Change the `yOffset` value in `tasks.ts`
2. If needed, adjust the `-0.3` special offset in `TaskVisuals.tsx`
3. Check position using the red wireframe debug sphere
4. Review console logs to see exact Y position values

## Best Practices

1. **Consistent Scaling**: Maintain proportional scaling between different model types
2. **Small Offsets**: Start with small yOffset values (0.01-0.1) and adjust gradually
3. **Validate Visually**: Always check changes with debug visualization
4. **Avoid Z-Fighting**: Keep slight offsets between models and tile surfaces (≥0.01)
5. **Model Preparation**: When possible, orient and scale models correctly in Blender before export

By following these guidelines, models should integrate consistently and predictably within the game world. 