Task: Noise-to-Waveform Animation for Mobile Web Game
Create a lightweight animation in Three.js, R3F, Drei, React, and Vite for a mobile web game:
Initial State: Two lines (100 points each) with noisy y-positions (Perlin noise via simplex-noise), colored with a mix of red, green, blue.

Final State: Lines transition into two sine wave audio visuals (top: red, bottom: blue), offset vertically (y = 1, -1).

Transition: Use a progress value (0 to 1) from a minigame to interpolate positions and colors. Animate waveforms over time after progress = 1.

Performance: Use Line with BufferGeometry, LineBasicMaterial, and vertex colors. Update only position/color attributes in useFrame.

Setup: Install simplex-noise. Provide a full R3F component (NoiseLines) and example scene with progress tied to a timer.

