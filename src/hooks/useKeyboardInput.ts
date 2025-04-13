import { useEffect, useRef } from 'react';

interface KeyboardState {
  forward: number;
  right: number;
  up: number;
  keys: {
    w: boolean;
    a: boolean;
    s: boolean;
    d: boolean;
    space: boolean;
    c: boolean;
  };
}

/**
 * Hook to handle keyboard input for movement
 * @returns Object with normalized movement values and raw key state
 */
export const useKeyboardInput = () => {
  // Use ref to avoid re-renders on key press
  const keyboardState = useRef<KeyboardState>({
    forward: 0,
    right: 0,
    up: 0,
    keys: { w: false, a: false, s: false, d: false, space: false, c: false }
  });

  useEffect(() => {
    // Handle keydown
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.repeat) {
        const key = e.key.toLowerCase();
        if (key === 'w' || key === 'arrowup') {
          keyboardState.current.keys.w = true;
        } else if (key === 'a' || key === 'arrowleft') {
          keyboardState.current.keys.a = true;
        } else if (key === 's' || key === 'arrowdown') {
          keyboardState.current.keys.s = true;
        } else if (key === 'd' || key === 'arrowright') {
          keyboardState.current.keys.d = true;
        } else if (key === ' ') {
          keyboardState.current.keys.space = true;
        } else if (key === 'c') {
          keyboardState.current.keys.c = true;
        }
        updateMovement();
      }
    };

    // Handle keyup
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') {
        keyboardState.current.keys.w = false;
      } else if (key === 'a' || key === 'arrowleft') {
        keyboardState.current.keys.a = false;
      } else if (key === 's' || key === 'arrowdown') {
        keyboardState.current.keys.s = false;
      } else if (key === 'd' || key === 'arrowright') {
        keyboardState.current.keys.d = false;
      } else if (key === ' ') {
        keyboardState.current.keys.space = false;
      } else if (key === 'c') {
        keyboardState.current.keys.c = false;
      }
      updateMovement();
    };

    // Update movement values based on key state
    const updateMovement = () => {
      const { keys } = keyboardState.current;
      
      // Calculate forward/backward movement (1, 0, or -1)
      let forward = 0;
      if (keys.w) forward += 1;
      if (keys.s) forward -= 1;
      
      // Calculate right/left movement (1, 0, or -1)
      let right = 0;
      if (keys.d) right += 1;
      if (keys.a) right -= 1;
      
      // Calculate up/down movement (1, 0, or -1)
      let up = 0;
      if (keys.space) up += 1;
      if (keys.c) up -= 1;
      
      // Update state
      keyboardState.current.forward = forward;
      keyboardState.current.right = right;
      keyboardState.current.up = up;
    };

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return keyboardState;
}; 