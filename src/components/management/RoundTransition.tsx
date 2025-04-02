import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '@store/store';
import * as THREE from 'three';

// Visual feedback when a round ends and resources are generated
const RoundTransition = () => {
  const [isAnimating, setIsAnimating] = useState(false);
  const startTime = useRef(0);
  const duration = 2000; // Animation duration in milliseconds
  const currentRound = useGameStore(state => state.currentRound);
  const resourceGenerations = useGameStore(state => state.roundResourceGenerations);
  const clearResourceGenerations = useGameStore(state => state.clearResourceGenerations);
  
  // Start animation when resource generations are available
  useEffect(() => {
    if (resourceGenerations.length > 0 && !isAnimating) {
      setIsAnimating(true);
      startTime.current = Date.now();
      console.log('Starting round transition animation');
    }
  }, [resourceGenerations, isAnimating]);

  // Reset on round change and force clear any pending resource generations
  useEffect(() => {
    setIsAnimating(false);
    
    // Clean up any lingering resource generations
    if (resourceGenerations.length > 0) {
      console.log(`Cleaning up ${resourceGenerations.length} lingering resource generations on round change`);
      clearResourceGenerations();
    }
  }, [currentRound, resourceGenerations.length, clearResourceGenerations]);
  
  // Force cleanup after 5 seconds of animation
  useEffect(() => {
    if (isAnimating) {
      const forceCleanupTimeout = setTimeout(() => {
        console.log("Force ending round transition animation");
        setIsAnimating(false);
        
        // Also clear any remaining resource generations
        if (resourceGenerations.length > 0) {
          clearResourceGenerations();
        }
      }, 5000); // Backup cleanup after 5 seconds
      
      return () => clearTimeout(forceCleanupTimeout);
    }
  }, [isAnimating, resourceGenerations.length, clearResourceGenerations]);

  useFrame(() => {
    if (!isAnimating) return;
    
    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(elapsed / duration, 1);
    
    // End animation when complete
    if (progress >= 1) {
      setIsAnimating(false);
    }
  });

  // No visual element in this component itself - it just controls timing for 
  // the FloatingResourceNumbers component through the store state
  return null;
};

export default RoundTransition; 