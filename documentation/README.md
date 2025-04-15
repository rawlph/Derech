# Derech

A web-based 3D project built with React, Three.js, and Vite.

## Tech Stack

- **Build Tool**: Vite
- **UI Framework**: React
- **3D Rendering**: ThreeJS via React Three Fiber (R3F)
- **R3F Helpers**: Drei
- **State Management**: Zustand
- **Mobile Controls**: NippleJS
- **Styling**: CSS Modules

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev
```

### Build

```bash
# Build for production
npm run build

# Preview the production build
npm run preview
```

## Project Structure

```
/
├── public/            # Static assets
├── src/
│   ├── assets/        # Project assets (models, textures, etc.)
│   ├── components/    # Reusable React components
│   │   ├── input/     # Input controllers and handlers
│   │   ├── movement/  # Movement and camera controls
│   │   └── ui/        # User interface components
│   ├── config/        # Configuration files
│   ├── layouts/       # Layout components and scene structures
│   ├── scenes/        # 3D scene components
│   ├── store/         # Zustand state management
│   ├── styles/        # CSS and CSS modules
│   ├── utils/         # Utility functions and helpers
│   ├── App.tsx        # Main App component
│   └── main.tsx       # Entry point
├── documentation/     # Project documentation
└── example screenshots/ # Example visual references
```