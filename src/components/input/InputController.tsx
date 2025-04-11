import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useKeyboardInput } from '../../hooks/useKeyboardInput';
import { useNippleInput } from '../../hooks/useNippleInput';

interface MovementInput {
  forward: number;
  right: number;
}

// Create a context for the movement input
const MovementContext = createContext<React.MutableRefObject<MovementInput>>({
  current: { forward: 0, right: 0 }
});

// Hook to consume the movement context
export const useMovementInput = () => useContext(MovementContext);

interface InputControllerProps {
  children: React.ReactNode;
  nippleContainerId: string;
}

/**
 * Component that unifies keyboard and joystick input and provides movement values via context
 */
export const InputController: React.FC<InputControllerProps> = ({ 
  children, 
  nippleContainerId 
}) => {
  // Get input from hooks
  const keyboardInput = useKeyboardInput();
  const nippleInput = useNippleInput(nippleContainerId);
  
  // Create a combined movement ref that will be provided via context
  const movementInput = useRef<MovementInput>({
    forward: 0,
    right: 0
  });
  
  // Update the combined movement values on each render
  useEffect(() => {
    // Create a callback to update movement values
    const updateMovement = () => {
      const keyboard = keyboardInput.current;
      const nipple = nippleInput.current;
      
      // Prioritize nipple input if it's active
      if (nipple.active) {
        movementInput.current = {
          forward: nipple.forward,
          right: nipple.right
        };
      } else {
        movementInput.current = {
          forward: keyboard.forward,
          right: keyboard.right
        };
      }
      
      // Request next frame update
      frameId = requestAnimationFrame(updateMovement);
    };
    
    // Start the animation frame loop
    let frameId = requestAnimationFrame(updateMovement);
    
    // Cleanup
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, []);
  
  return (
    <MovementContext.Provider value={movementInput}>
      {children}
    </MovementContext.Provider>
  );
}; 