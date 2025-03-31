# Hexgrid2.md - 3D Hexagonal Grid Implementation (Current)

## 1. Purpose

This document outlines the current implementation of the interactive 3D hexagonal grid used for the Mars colony management view. It leverages React, React Three Fiber (R3F), Drei, and Zustand, aiming for a visually appealing and performant representation suitable for web and mobile. The visual style uses an orthographic projection with interactive camera controls.

## 2. Core Concepts (Still Applicable)

*   **3D Rendering (R3F/ThreeJS):** The grid is rendered in a 3D space using ThreeJS, managed declaratively via React Three Fiber (R3F) within a `<Canvas>` component (`src/scenes/ManagementScene.tsx`).
*   **Hexagonal Grid Mathematics:** Logic for calculating hexagon positions, neighbors, etc., is handled by utility functions (in `src/utils/hexUtils.ts`), primarily using an **axial coordinate system** (`q`, `r`). Key functions like `axialToWorld` and `worldToAxial` are used.
*   **Orthographic Projection:** An `OrthographicCamera` is used, managed by the `<ColonyCameraSetup />` component (`src/components/management/ColonyCamera.tsx`) and enabled via the `orthographic` prop on the main `<Canvas>`. This ensures tiles appear at a consistent scale.
*   **Instancing (Drei/ThreeJS):** `<Instances>` and `<Instance>` from Drei are used extensively in `HexTileInstances.tsx` and `BuildingInstances.tsx` to efficiently render potentially large numbers of tiles and buildings, respectively.
*   **State Management (Zustand):** Global game state, including the `gridTiles` data, `selectedTile`, resources, etc., is managed by a Zustand store (`src/store/store.ts`), accessed via the `useGameStore` hook. Visual components react to changes in this store.

## 3. Current Implementation Details

**A. Canvas Setup (`ManagementScene.tsx`)**

*   The R3F `<Canvas>` is configured in `src/scenes/ManagementScene.tsx`.
*   Key props used:
    *   `shadows`: Enables shadow rendering.
    *   `orthographic`: Sets up the scene for orthographic projection (camera configured separately).
    *   `<color attach="background" args={['#3D1A0A']} />`: Sets the scene background color.
    *   `<fog attach="fog" args={['#3D1A0A', 60, 180]} />`: Adds distance fog matching the background color.

**B. Camera Setup (`ColonyCamera.tsx`, `HexGrid.tsx`)**

*   The `<ColonyCameraSetup />` component configures the main `OrthographicCamera`.
*   `<OrbitControls>` from Drei are added in `src/components/management/HexGrid.tsx` to allow user interaction (pan, zoom, rotate within limits). Damping is enabled for smoother movement.

**C. Lighting (`HexGrid.tsx`)**

*   The scene uses:
    *   `<ambientLight intensity={0.7} />`: Provides base illumination.
    *   `<directionalLight ... />`: Simulates a primary light source (sun), configured with color, position, intensity, and shadow properties (including shadow map size and camera frustum for shadows).

**D. Hex Grid Logic (`hexUtils.ts`)**

*   Contains core hexagonal grid math functions (`axialToWorld`, `worldToAxial`).
*   Exports constants and pre-calculated values:
    *   `TILE_THICKNESS`: Defines the height of the hex tile geometry.
    *   `hexGeometry`: A shared `THREE.CylinderGeometry` instance (6 sides) for the tiles.
    *   `tileMaterials`: A map or object containing pre-defined `THREE.Material` instances for different terrain types (e.g., `Plains`, `Water`).
    *   `selectedMaterial`: A distinct material used to highlight the selected tile.

**E. Grid Data Management (Zustand - `store.ts`)**

*   The `useGameStore` hook provides access to:
    *   `gridTiles`: An object where keys are `"q,r"` strings and values are `TileData` objects containing `q`, `r`, `type`, `building`, etc.
    *   `selectedTile`: Stores the `TileData` of the currently selected tile, or `null`.
    *   `selectTile(q, r)`: Action to update the `selectedTile` state.
    *   `deselectTile()`: Action to set `selectedTile` back to `null`.
    *   Other game state (resources, round number, etc.).

**F. Rendering Tiles (`HexTileInstances.tsx`)**

*   **Instancing:** Uses `<Instances>` for performance.
    *   Separate `<Instances>` components are used for different material types (e.g., one for basic tiles using `tileMaterials.Plains` as a base, one for `tileMaterials.Water`). This allows efficient rendering when materials differ significantly.
    *   Instances receive per-instance `color` props for terrain variation within the 'basic' group.
*   **Selection Highlight:** The currently selected tile is rendered as a separate, single `<mesh>` using the `selectedMaterial`, positioned based on the `selectedInstance` data derived from the store. Clicking this mesh triggers `deselectTile`.
*   **Outlines:** Tile outlines are rendered using `THREE.LineSegments` with an `EdgesGeometry` derived from `hexGeometry`. A `lineMaterial` is used. These are rendered in a `<group>` by mapping over `allInstancesData`. `polygonOffset` is used on the material to help prevent z-fighting with the tile fill.
*   **Interaction:** An `onClick` handler is attached to the `<Instances>` components.
    *   It uses `event.stopPropagation()` to prevent unintended event bubbling.
    *   It calculates the clicked axial coordinates using `worldToAxial(event.point)`.
    *   Calls the `selectTile` action from the Zustand store.

**G. Rendering Buildings (`BuildingInstances.tsx`)**

*   **Instancing Per Type:** Uses a `<SingleBuildingTypeInstances>` helper component for each building type defined in `buildingConfigs`. Each helper renders one `<Instances>` component.
*   **Model Loading:** Uses Drei's `useGLTF` hook to load building models specified in `src/config/buildings.ts`. Models are preloaded using `useGLTF.preload`.
*   **Geometry/Material Extraction:**
    *   Extracts geometry and material from the loaded GLTF scene (`scene.traverse`).
    *   **Crucially, it clones the geometry and material** (`geometry.clone()`, `material.clone()`) to prevent conflicts between different `<Instances>` components or potential modifications.
    *   Applies minor adjustments to materials (e.g., reducing roughness, limiting metalness).
    *   Includes fallback material and warnings if geometry/material extraction fails.
*   **Positioning:** Calculates the world position for each building instance based on its tile's `axialToWorld` position, adding a vertical offset (`buildingY`) to place it on top of the tile.
*   **Configuration:** Reads model paths and default scales from `src/config/buildings.ts`.
*   **Shadows:** Building instances are configured to `castShadow` and `receiveShadow`.

**H. Interaction Summary**

*   **Tile Selection:** Click on a tile instance -> `worldToAxial` -> `selectTile` action.
*   **Tile Deselection:** Click on the highlighted selected tile mesh -> `deselectTile` action.
*   **Camera Control:** Use mouse/touch via `<OrbitControls>` for panning, zooming, and rotating the view.
*   **(Future):** Building interaction is not yet implemented in `BuildingInstances.tsx`.

## 4. Key Resources

*   **Red Blob Games - Hexagonal Grids:** Still the definitive guide for the underlying math.
    *   [https://www.redblobgames.com/grids/hexagons/](https://www.redblobgames.com/grids/hexagons/)

## 5. Current Code Structure

The code related to the hex grid is primarily located in:

*   `src/scenes/ManagementScene.tsx`: Top-level scene component holding the Canvas.
*   `src/components/management/`: Folder containing specific grid-related components:
    *   `HexGrid.tsx`: Sets up lights, controls, and renders tile/building instances.
    *   `HexTileInstances.tsx`: Renders hex tiles (fill, outlines, selection) using instancing.
    *   `BuildingInstances.tsx`: Renders building models using instancing per type.
    *   `ColonyCamera.tsx`: (Assumed) Configures the orthographic camera.
*   `src/utils/hexUtils.ts`: Hex grid math functions, geometry, materials.
*   `src/store/store.ts`: Zustand store definition (`useGameStore`).
*   `src/config/buildings.ts`: Configuration for building types (model paths, scale).
*   `public/models/`: Location of GLTF/GLB building models.

This structure maintains a good separation of concerns for the 3D hex grid visualization and its associated logic and state. 