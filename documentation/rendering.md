# 3D Rendering and Model Compression

This document outlines the 3D rendering approach and model compression techniques used in the Mars Colony management game.

## Rendering Framework

The game uses React Three Fiber (R3F), a React renderer for Three.js, which provides a declarative way to create 3D scenes. Key components include:

- **Three.js**: The underlying 3D library that handles WebGL rendering
- **React Three Fiber**: React reconciler for Three.js
- **Drei**: A collection of useful helpers for React Three Fiber

## Model Loading

### GLTF Models

The game primarily uses glTF (GL Transmission Format) models for buildings and environmental elements. glTF is an efficient, open standard for 3D assets that offers:

- Efficient transmission of 3D assets
- Runtime-neutral format
- Minimized runtime processing
- Support for materials, textures, animations, and scene hierarchies

Models are loaded using the `useGLTF` hook from the Drei library, which wraps Three.js's `GLTFLoader`. For more direct control, some components use `useLoader` with `GLTFLoader` directly.

### Model Loading Approaches

The game implements three strategies for model loading:

1. **Instanced Rendering**: For multiple instances of the same model type
   ```typescript
   <Instances geometry={buildingGeometry} material={buildingMaterial}>
     {instances.map(instance => (
       <Instance position={instance.position} rotation={instance.rotation} scale={instance.scale} />
     ))}
   </Instances>
   ```

2. **Direct Model Rendering**: For specialized cases requiring individual control
   ```typescript
   const model = useLoader(GLTFLoader, modelPath, configureLoader);
   return <primitive object={model.scene} scale={scale} />;
   ```

3. **Mixed Approach**: For complex upgrades, rendering the base model using instances and overlaying with unique upgrade models

## Draco Compression

### What is Draco?

Draco is an open-source library for compressing and decompressing 3D geometric meshes developed by Google. It reduces the size of 3D models, allowing for:

- Faster loading times
- Reduced bandwidth usage
- More efficient storage

### Implementation

Our game uses Draco compression for building upgrade models to reduce file sizes. This requires:

1. **Draco Loader Setup**:
   ```typescript
   const dracoLoader = new DRACOLoader();
   dracoLoader.setDecoderPath('/Derech/draco/');
   ```

2. **Configuring GLTFLoader**:
   ```typescript
   const gltfLoader = new GLTFLoader();
   gltfLoader.setDRACOLoader(dracoLoader);
   ```

3. **Decoder Files**: The Draco decoder files must be available in the public directory:
   - `draco_decoder.js`
   - `draco_decoder.wasm`
   - `draco_wasm_wrapper.js`

### Preloading

To optimize performance, the game preloads all building models when the scene loads:

```typescript
useEffect(() => {
  Object.values(buildingConfigs).forEach(config => {
    if (config.modelPath) {
      preloadModel(config.modelPath);
    }
    if (config.upgradeModelPath) {
      preloadModel(config.upgradeModelPath);
    }
  });
}, []);
```

## Complex Model Handling

### Detecting Model Upgrades

Building upgrades are applied based on completed projects:

```typescript
const hasUpgrade = useMemo(() => {
  if (!config.upgradeModelPath) return false;
  
  if (buildingName === 'Living Dome') {
    return completedLivingProjects.includes('upgrade-living-dome');
  } else if (buildingName === 'Production Dome') {
    return completedProductionProjects.includes('upgrade-production-dome');
  } else if (buildingName === 'Research Dome') {
    return completedResearch.includes('upgrade-research-dome');
  }
  return false;
}, [buildingName, completedLivingProjects, completedProductionProjects, completedResearch]);
```

### Rendering Strategies for Upgrades

The game uses a layering approach for upgrades, rendering the upgrade model slightly above the base model:

```typescript
const upgradePosition = new THREE.Vector3(
  position.x,
  position.y + 0.15, // Add a small offset to prevent z-fighting
  position.z
);
```

## Performance Optimizations

1. **Instancing**: Reduces draw calls for multiple identical objects
2. **Model Compression**: Reduces file sizes and loading times
3. **Conditional Rendering**: Only renders visible elements
4. **State-Based Model Swapping**: Upgrades and status changes trigger model changes without full remounts

## Rendering Debug Tools

For debugging model loading and positioning issues, the application includes:

- Console logging of model structure and mesh counts
- Ability to add visual indicators (colored spheres) for position verification
- Status indicators for building states (operational, shutdown) 