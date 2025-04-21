import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useKeyboardInput } from '../../hooks/useKeyboardInput';
import { useNippleInput } from '../../hooks/useNippleInput';

interface MovementInput {
  forward: number;
  right: number;
  up: number;
  isTouchActive: boolean;
  joystickTouchId: number | null;
}

// Create a context for the movement input
const MovementContext = createContext<React.MutableRefObject<MovementInput>>({
  current: { forward: 0, right: 0, up: 0, isTouchActive: false, joystickTouchId: null }
});

// Hook to consume the movement context
export const useMovementInput = () => useContext(MovementContext);

interface InputControllerProps {
  children: React.ReactNode;
  nippleContainerId: string;
  verticalNippleContainerId?: string;
}

/**
 * Component that unifies keyboard and joystick input and provides movement values via context
 */
export const InputController: React.FC<InputControllerProps> = ({ 
  children, 
  nippleContainerId,
  verticalNippleContainerId
}) => {
  // Get input from hooks
  const keyboardInput = useKeyboardInput();
  const nippleInput = useNippleInput(nippleContainerId, verticalNippleContainerId);
  
  // Create a combined movement ref that will be provided via context
  const movementInput = useRef<MovementInput>({
    forward: 0,
    right: 0,
    up: 0,
    isTouchActive: false,
    joystickTouchId: null
  });
  
  // Update the combined movement values on each render
  useEffect(() => {
    // Create a callback to update movement values
    const updateMovement = () => {
      const keyboard = keyboardInput.current;
      const nipple = nippleInput.current;
      
      // Prioritize nipple input for horizontal movement if it's active
      const forward = nipple.active ? nipple.forward : keyboard.forward;
      const right = nipple.active ? nipple.right : keyboard.right;
      
      // Prioritize vertical nipple for up/down if it's active
      const up = nipple.verticalActive ? nipple.up : keyboard.up;
      
      // Get touch state from nipple
      const isTouchActive = nipple.isTouchActive || false;
      
      // Get joystick touch ID
      const joystickTouchId = nipple.joystickTouchId || null;
      
      // Update movement values
      movementInput.current = {
        forward,
        right,
        up,
        isTouchActive,
        joystickTouchId
      };
      
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