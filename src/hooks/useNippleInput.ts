import { useEffect, useRef } from 'react';
import nipplejs, { JoystickManager, JoystickOutputData } from 'nipplejs';

interface NippleState {
  forward: number;
  right: number;
  up: number;
  active: boolean;
  verticalActive: boolean;
  isTouchActive: boolean; // Track if any touch is currently active
  joystickTouchId: number | null; // Track which touch ID is controlling the joystick
}

/**
 * Hook to handle nipplejs joystick input for movement
 * @param containerId ID of the HTML element that will contain the joystick
 * @param verticalContainerId ID of the HTML element that will contain the vertical joystick
 * @returns Object with normalized movement values
 */
export const useNippleInput = (containerId: string, verticalContainerId?: string) => {
  // State ref with default values if joystick initialization fails
  const nippleState = useRef<NippleState>({
    forward: 0,
    right: 0,
    up: 0,
    active: false,
    verticalActive: false,
    isTouchActive: false,
    joystickTouchId: null
  });

  const joystickManager = useRef<JoystickManager | null>(null);
  const verticalJoystickManager = useRef<JoystickManager | null>(null);
  const containerExistsRef = useRef(false);
  const verticalContainerExistsRef = useRef(false);
  
  // For touch handling
  const touchStartRef = useRef<{ time: number, touchId: number | null }>({ time: 0, touchId: null });
  const activationDelayMs = 50; // Shorter delay for more responsive controls
  
  // Track if joysticks are being actively used
  const isJoystickActiveRef = useRef(false);
  const isVerticalJoystickActiveRef = useRef(false);

  useEffect(() => {
    // Early container validation
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with id '${containerId}' not found for nipplejs. Mobile joystick controls will be unavailable.`);
      containerExistsRef.current = false;
      return;
    }

    containerExistsRef.current = true;

    // Check for vertical joystick container
    const verticalContainer = verticalContainerId ? document.getElementById(verticalContainerId) : null;
    if (verticalContainerId && !verticalContainer) {
      console.error(`Container with id '${verticalContainerId}' not found for vertical nipplejs. Vertical joystick controls will be unavailable.`);
      verticalContainerExistsRef.current = false;
    } else if (verticalContainer) {
      verticalContainerExistsRef.current = true;
    }

    // Add global touch event listeners to better track all touches
    const handleGlobalTouchStart = (e: TouchEvent) => {
      // Track if any touch starts within our joystick containers
      const mainJoystickRect = container.getBoundingClientRect();
      const vertJoystickRect = verticalContainer ? verticalContainer.getBoundingClientRect() : null;
      
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        const isInMainJoystick = 
          touch.clientX >= mainJoystickRect.left && 
          touch.clientX <= mainJoystickRect.right &&
          touch.clientY >= mainJoystickRect.top && 
          touch.clientY <= mainJoystickRect.bottom;
          
        const isInVertJoystick = vertJoystickRect ? (
          touch.clientX >= vertJoystickRect.left && 
          touch.clientX <= vertJoystickRect.right &&
          touch.clientY >= vertJoystickRect.top && 
          touch.clientY <= vertJoystickRect.bottom
        ) : false;
        
        if (isInMainJoystick || isInVertJoystick) {
          // This touch started in one of our joysticks
          // Mark it as a joystick touch to prevent camera controls from using it
          nippleState.current.joystickTouchId = touch.identifier;
          break;
        }
      }
    };
    
    const handleGlobalTouchEnd = (e: TouchEvent) => {
      // Check if the released touch was our joystick touch
      let joystickTouchReleased = true;
      
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === nippleState.current.joystickTouchId) {
          joystickTouchReleased = false;
          break;
        }
      }
      
      if (joystickTouchReleased) {
        // Our joystick touch was released
        nippleState.current.joystickTouchId = null;
        
        // If neither joystick is active, also reset isTouchActive
        if (!isJoystickActiveRef.current && !isVerticalJoystickActiveRef.current) {
          nippleState.current = {
            ...nippleState.current,
            isTouchActive: false
          };
        }
      }
    };
    
    // Add these global listeners
    document.addEventListener('touchstart', handleGlobalTouchStart, { passive: false });
    document.addEventListener('touchend', handleGlobalTouchEnd, { passive: false });

    // Define event handlers outside try/catch for cleanup access
    // Handle joystick start
    const handleStart = (evt: Event, data: JoystickOutputData) => {
      // Immediately mark touch as active without waiting for delay
      touchStartRef.current = {
        time: Date.now(),
        touchId: data.identifier
      };
      
      // Immediately set joystick as active - don't wait for move event
      isJoystickActiveRef.current = true;
      
      nippleState.current = {
        ...nippleState.current,
        isTouchActive: true,
        joystickTouchId: data.identifier
      };
    };
    
    // Handle joystick movement
    const handleMove = (evt: Event, data: JoystickOutputData) => {
      // Skip the delay completely - assume intent immediately
      const isActiveTouch = touchStartRef.current.touchId === data.identifier;
      
      if (isActiveTouch) {
        // Extract vector data with some smoothing
        const forward = data.vector.y; 
        const right = data.vector.x;
        
        // Update state
        nippleState.current = {
          ...nippleState.current,
          forward,
          right,
          active: true,
          isTouchActive: true,
          joystickTouchId: data.identifier
        };
      }
    };

    // Handle joystick end event
    const handleEnd = () => {
      // Reset horizontal movement when joystick is released
      isJoystickActiveRef.current = false;
      
      const verticalStillActive = isVerticalJoystickActiveRef.current;
      
      nippleState.current = {
        ...nippleState.current,
        forward: 0,
        right: 0,
        active: false,
        // Only reset isTouchActive if vertical joystick is also not active
        isTouchActive: verticalStillActive
      };
      
      // Clear touch tracking
      touchStartRef.current = { time: 0, touchId: null };
    };

    // Handle vertical joystick start
    const handleVerticalStart = (evt: Event, data: JoystickOutputData) => {
      // Similar to horizontal but track for vertical
      touchStartRef.current = {
        time: Date.now(),
        touchId: data.identifier
      };
      
      isVerticalJoystickActiveRef.current = true;
      
      nippleState.current = {
        ...nippleState.current,
        isTouchActive: true,
        joystickTouchId: data.identifier
      };
    };
    
    // Handle vertical joystick movement
    const handleVerticalMove = (evt: Event, data: JoystickOutputData) => {
      // Similar delay logic for vertical movement
      const timeSinceStart = Date.now() - touchStartRef.current.time;
      const isActiveTouch = touchStartRef.current.touchId === data.identifier;
      const significantMovement = Math.abs(data.vector.y) > 0.4;
      
      if (isActiveTouch && (timeSinceStart > activationDelayMs || significantMovement)) {
        // Extract vertical data - normalized values between -1 and 1
        // Use Y axis for up/down - positive is up, negative is down
        const up = -data.vector.y; // Inverted for intuitive control (up is positive)
        
        // Update state while preserving horizontal movement
        nippleState.current = {
          ...nippleState.current,
          up,
          verticalActive: true,
          isTouchActive: true,
          joystickTouchId: data.identifier
        };
      }
    };

    // Handle vertical joystick end event
    const handleVerticalEnd = () => {
      // Reset vertical movement when joystick is released
      isVerticalJoystickActiveRef.current = false;
      
      const horizontalStillActive = isJoystickActiveRef.current;
      
      nippleState.current = {
        ...nippleState.current,
        up: 0,
        verticalActive: false,
        // Only reset isTouchActive if horizontal joystick is also not active
        isTouchActive: horizontalStillActive
      };
      
      // Clear touch tracking
      touchStartRef.current = { time: 0, touchId: null };
    };

    try {
      // Initialize main joystick with improved settings
      joystickManager.current = nipplejs.create({
        zone: container,
        mode: 'static',
        position: { bottom: '90px', right: '90px' },
        color: 'rgba(255, 255, 255, 0.7)', // More visible
        size: 120,
        lockX: false,
        lockY: false,
        dynamicPage: true,
        threshold: 0.05, // More sensitive
        fadeTime: 50, // Faster fade
        multitouch: true, // Enable multitouch
      });

      // Add event listeners
      joystickManager.current.on('start', handleStart);
      joystickManager.current.on('move', handleMove);
      joystickManager.current.on('end', handleEnd);

      // Initialize vertical joystick if container exists
      if (verticalContainerExistsRef.current && verticalContainer) {
        verticalJoystickManager.current = nipplejs.create({
          zone: verticalContainer,
          mode: 'static',
          position: { bottom: '90px', left: '90px' },
          color: 'rgba(255, 255, 255, 0.7)', // More visible
          size: 120,
          lockX: true, // Lock X axis to only allow vertical movement
          lockY: false,
          dynamicPage: true,
          threshold: 0.05, // More sensitive
          fadeTime: 50, // Faster fade
          multitouch: true, // Enable multitouch
        });

        // Add event listeners for vertical joystick
        verticalJoystickManager.current.on('start', handleVerticalStart);
        verticalJoystickManager.current.on('move', handleVerticalMove);
        verticalJoystickManager.current.on('end', handleVerticalEnd);
      }
    } catch (error) {
      // Handle nipplejs initialization errors
      console.error('Failed to initialize nipplejs joystick:', error);
      containerExistsRef.current = false;
      // State already has default values, so no additional fallback needed
    }

    // Cleanup
    return () => {
      // Remove global listeners
      document.removeEventListener('touchstart', handleGlobalTouchStart);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    
      if (joystickManager.current) {
        try {
          joystickManager.current.off('start', handleStart);
          joystickManager.current.off('move', handleMove);
          joystickManager.current.off('end', handleEnd);
          joystickManager.current.destroy();
        } catch (error) {
          console.error('Error cleaning up nipplejs instance:', error);
        }
      }

      if (verticalJoystickManager.current) {
        try {
          verticalJoystickManager.current.off('start', handleVerticalStart);
          verticalJoystickManager.current.off('move', handleVerticalMove);
          verticalJoystickManager.current.off('end', handleVerticalEnd);
          verticalJoystickManager.current.destroy();
        } catch (error) {
          console.error('Error cleaning up vertical nipplejs instance:', error);
        }
      }
    };
  }, [containerId, verticalContainerId]);

  return nippleState;
}; 