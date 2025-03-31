# Portal Welcome Scene

## Overview
The Portal Welcome Scene serves as a 3D interactive entry point to the Derech Mars Colony Simulation, especially for players entering through the Vibeverse portal system. It provides a warm welcome environment with options to start the game or return to a previous game through portals.

## Key Features

### Low Poly 3D Environment
- Lightweight Mars-like terrain with low-poly mountains and rocks
- Optimized for fast loading and performance
- Ambient dust and atmosphere effects

### Portal System
- **Vibeverse Portal**: Green portal that transports players to the Vibeverse network
- **Return Portal**: Red portal that appears only when a player enters through a portal, allowing them to return to their previous game
- Particle effects and animations for visual appeal

### Interactive Elements
- 3D buttons for:
  - Starting the colony mission (entering Management mode)
  - About game information
  - Help/controls information
- Player character with WASD/Arrow key movement
- Mobile touch controls for mobile devices

## Technical Implementation

### Portal Logic
The welcome scene implements the Vibeverse portal system as specified in the documentation:
- If a player enters with `?portal=true` in the URL, a return portal will be displayed
- The return portal uses the `ref` parameter to allow the player to return to their previous game
- The Vibeverse portal passes player information (username, color, speed) to the Vibeverse network

### State Management
- Uses Zustand for global state management
- Transitions to the Management view when the player selects "Start Colony Mission"
- Automatically displays the welcome scene for new players or those entering through portals

### Responsive Design
- Works on both desktop and mobile devices
- Adjusts controls based on device capabilities
- Maintains performance across different device types

## Connection to Game
The welcome scene seamlessly connects to the main game through the Zustand state system:
- Changing `gameView` to 'management' transitions to the main colony management view
- The scene serves as both an entry point and a hub for connecting to other games via the Vibeverse portal

## Future Enhancements
- Character customization options
- Save/load game functionality
- More interactive elements in the welcome environment 