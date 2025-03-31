# Derech Project Structure

This document outlines the folder structure and organization of the Derech project.

## Root Structure

```
/
├── documentation/         # Project documentation
│   ├── Tech_Stack.md      # Technology stack information
│   └── Project_Structure.md  # This document
├── example screenshots/   # Visual references
├── public/                # Static assets that will be served directly
│   └── favicon.svg        # Project favicon
├── src/                   # Source code
│   ├── assets/            # Project assets (images, models, audio, etc.)
│   ├── components/        # Reusable React components
│   │   ├── Box.tsx        # Example 3D box component
│   │   └── MobileControls.tsx # Mobile joystick controls using nipplejs
│   ├── scenes/            # 3D scene components
│   │   └── MainScene.tsx  # Main 3D scene with environment setup
│   ├── store/             # State management with Zustand
│   │   └── store.ts       # Global state definitions and actions
│   ├── styles/            # CSS and CSS modules
│   │   ├── App.module.css # Styles for App component
│   │   ├── index.css      # Global styles
│   │   ├── MainScene.module.css # Styles for MainScene
│   │   └── MobileControls.module.css # Styles for mobile controls
│   ├── types/             # TypeScript type definitions
│   │   └── nipplejs.d.ts  # Custom type definitions for nipplejs
│   ├── App.tsx            # Main App component
│   ├── main.tsx           # Application entry point
│   └── vite-env.d.ts      # Vite environment type declarations
├── .eslintrc.cjs          # ESLint configuration
├── .gitignore             # Git ignore file
├── index.html             # HTML entry point
├── package.json           # Project dependencies and scripts
├── README.md              # Project documentation and instructions
├── tsconfig.json          # TypeScript configuration
├── tsconfig.node.json     # Node-specific TypeScript configuration
└── vite.config.ts         # Vite build tool configuration
```

## Key Directories Explained

### `/documentation`
Contains all project documentation, including technical specifications, guidelines, and architectural decisions.

### `/example screenshots`
Reference images for visual design and implementation.

### `/public`
Static assets that are served directly without being processed by the build pipeline.

### `/src`
The main source code directory, organized by functionality.

#### `/src/assets`
Contains all static files used in the application such as images, 3D models, textures, and audio files.

#### `/src/components`
Reusable React components that can be used across different parts of the application.
- `Box.tsx`: A reusable 3D box component with interactive features.
- `MobileControls.tsx`: Touch controls for mobile devices using nipplejs.

#### `/src/scenes`
Higher-level components that compose multiple components into cohesive scenes.
- `MainScene.tsx`: The primary 3D environment with camera, lighting, and scene objects.

#### `/src/store`
State management using Zustand.
- `store.ts`: Global state store with actions and selectors.

#### `/src/styles`
CSS and CSS module files for styling the application.
- CSS modules are used for component-specific styles with automatic scoping.
- `index.css` contains global styles applied to the entire application.

#### `/src/types`
TypeScript type definitions, especially for third-party libraries lacking official types.
- `nipplejs.d.ts`: Custom type definitions for the nipplejs joystick library.

## Technology Implementation

For details on the specific technologies used and their implementation, see `Tech_Stack.md`.

## Development Workflow

1. React components are created in `/src/components`
2. 3D scenes are assembled in `/src/scenes`
3. State is managed through Zustand stores in `/src/store`
4. Assets are organized in `/src/assets`
5. Component-specific styles use CSS modules in `/src/styles`

## Build Process

The project uses Vite as its build tool. The build process:
1. Compiles TypeScript to JavaScript
2. Processes CSS modules
3. Optimizes assets
4. Bundles all code and assets for production

The build configuration is defined in `vite.config.ts`. 