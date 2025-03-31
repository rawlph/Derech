# Best_Practices.md - Development Guidelines

## 1. Introduction

This document provides a set of best practices and guidelines for developing the Mars colony management game using the chosen tech stack: React, React Three Fiber (R3F), Drei, Zustand, Vite, NippleJS, and TailwindCSS. Following these practices will help maintain code quality, performance, and manageability.

## 2. Project Structure & Organization

* **Modular Design:** Organize your codebase into logical folders (e.g., `components/`, `hooks/`, `state/` (for Zustand), `utils/`, `scenes/` (for R3F scenes), `assets/`).
* **Component Granularity:** Break down UI and 3D scenes into smaller, reusable components with clear responsibilities.
* **Consistent Naming:** Use clear and consistent naming conventions for files, components, variables, and functions.

## 3. State Management (Zustand)

* **Single Source of Truth:** Use Zustand as the central store for global application state (resources, grid data, game phase, active quests, etc.).
* **Selectors for Performance:** Access state in components using selectors to prevent unnecessary re-renders when unrelated parts of the state change (e.g., `const resources = useColonyStore(state => state.resources);`).
* **Actions for Mutations:** Modify state only through actions defined within your store setup. Keep state logic separate from component logic.
* **Store Organization:** Consider organizing your store into slices if it becomes very large, though a single store is often sufficient for moderate complexity.

## 4. React & R3F Development

* **Declarative Scenes:** Embrace R3F's declarative approach to defining your ThreeJS scene graph within React components.
* **Leverage Drei:** Utilize Drei's extensive helpers (`<OrthographicCamera>`, `<OrbitControls>`, `<Instances>`, `<Instance>`, `<useGLTF>`, lighting, shapes, etc.) to avoid boilerplate code.
* **Memoization:** Use `React.useMemo` for expensive calculations or to stabilize object/array props passed down to memoized components. Use `React.useCallback` to stabilize event handler functions passed as props. Apply judiciously where performance bottlenecks are identified.
* **Custom Hooks:** Encapsulate reusable logic (especially complex R3F or state interactions) into custom hooks.
* **Component Cleanup:** R3F automatically handles much of the ThreeJS object disposal when components unmount. However, be mindful of manual subscriptions or effects that might need cleanup in a `useEffect` return function.

## 5. HTML UI & R3F Canvas Integration (Key Rules)

* **Layering via CSS:**
    * Use a common parent container with `position: relative`.
    * Position the R3F `<Canvas>` (or its wrapper) using `position: absolute` and a lower `z-index` (e.g., `z-index: 1`). Make it fill the container (`top: 0`, `left: 0`, `width: 100%`, `height: 100%`).
    * Position HTML UI overlay container(s) using `position: absolute` and a higher `z-index` (e.g., `z-index: 10`).
* **Interaction Management (`pointer-events`):**
    * Set `pointer-events: none;` on the main UI overlay container(s) to allow clicks/touches to pass through to the R3F canvas by default.
    * Set `pointer-events: auto;` (or leave default) **only** on the specific HTML UI elements that need to be interactive (buttons, inputs, draggable elements).
* **Communication Bridge (Zustand):**
    * Use the shared Zustand store as the *single* mechanism for communication between HTML UI elements (outside the Canvas) and 3D scene elements (inside the Canvas).
    * UI events trigger Zustand actions -> State changes -> 3D scene reacts.
    * 3D scene events trigger Zustand actions -> State changes -> UI reacts.

## 6. 3D Performance Optimization (R3F/ThreeJS)

* **Instancing:** Use `InstancedMesh` (via Drei's `<Instances>`/`<Instance>`) **aggressively** for rendering many similar objects (hex tiles, trees, rocks). This is often the single biggest performance win.
* **Geometry Sharing:** Reuse the same geometry instance for all instances of a particular mesh type.
* **Texture Optimization:**
    * Use appropriate texture dimensions (powers of two often preferred, but not strictly required anymore). Keep sizes reasonable (e.g., 1024x1024, 512x512).
    * Consider efficient texture formats like KTX2 / Basis Universal (requires specific loaders/encoding) for significantly smaller file sizes and GPU memory usage, especially on mobile. Standard formats are JPG (no alpha), PNG (with alpha). WebP is also a good option.
* **Draw Call Reduction:** Instancing helps immensely. Also, consider merging static geometry where appropriate (though less applicable for interactive hex grids).
* **Level of Detail (LOD):** If scenes become very complex or viewed from varying distances, consider implementing LOD (using `THREE.LOD` or manual logic) to swap models based on distance (less relevant for fixed orthographic view).
* **Lighting & Shadows:** Lights and dynamic shadows are expensive. Use minimal lights needed for the desired look. Bake lighting/shadows into textures for static elements if possible. For dynamic scenes, limit the number and range of shadow-casting lights.
* **Asset Loading:** Preload assets (models, textures) using Drei's `<useGLTF.preload>` or similar techniques, ideally showing a loading indicator.
* **Monitoring:** Use tools like `react-three-perf` during development to monitor draw calls, frame rate, and geometry counts.

## 7. Styling (TailwindCSS)

* **Utility-First:** Apply Tailwind utility classes directly to your HTML elements (outside the canvas) for styling.
* **Configuration:** Customize theme (colors, fonts, spacing) in `tailwind.config.js`.
* **Keep it Clean:** Use `@apply` sparingly; prefer component composition and direct utility application.

## 8. Mobile & Web Considerations

* **Responsive Design:** Ensure both the HTML UI and the R3F canvas layout adapt fluidly to different screen sizes using responsive units and techniques. Test aspect ratio handling for the camera.
* **Touch Input:** Implement and test touch controls (like NippleJS for movement) thoroughly on actual devices or emulators.
* **Performance Budget:** Mobile devices have tighter performance constraints. Profile and optimize with mobile targets in mind (especially GPU limitations).
* **Cross-Browser/Device Testing:** Test early and often on target browsers (Chrome, Firefox, Safari) and representative mobile devices/OS versions.

## 9. Development Workflow

* **Vite:** Leverage Vite's fast Hot Module Replacement (HMR) for rapid iteration.
* **Browser DevTools:** Use the browser's built-in developer tools extensively (Inspector, Console, Network, Performance).
* **React/ThreeJS DevTools:** Install and use the corresponding browser extensions for debugging component hierarchy, state, props, and the ThreeJS scene graph.
* **Version Control (Git):** Use Git diligently for source control, branching, and collaboration.
* **AI Assistance:** Use tools like Cursor and CodeRabbitAI to accelerate development, refactor code, and catch potential issues, but always review and understand the generated code.

By keeping these guidelines in mind, you can build a more robust, performant, and maintainable game application.