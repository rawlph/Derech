Build Tool: Vite
UI Framework: React
3D Rendering: ThreeJS via React Three Fiber (R3F)
R3F Helpers: Drei
State Management: Zustand (for global state like resources, progression, active quest)
Mobile Controls: NippleJS (for the 3D puzzle area)
Physics: No physics engine for core player movement. Implement simple kinematic movement with basic collision detection. Physics (e.g., cannon-es, the maintained fork of CannonJS) might be added later selectively for puzzle elements if required, but not for the player controller initially.
Styling: CSS Modules