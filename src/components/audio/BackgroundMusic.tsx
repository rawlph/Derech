import { useEffect, useRef } from 'react';
import { useGameStore } from '@store/store';

const BackgroundMusic = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { isMuted, audioVolume, gameView } = useGameStore((state) => ({
    isMuted: state.isMuted,
    audioVolume: state.audioVolume,
    gameView: state.gameView
  }));

  // Create audio element on component mount
  useEffect(() => {
    const audio = new Audio('/Derech/sounds/RedSand.mp3');
    audio.loop = true;
    audioRef.current = audio;

    // Clean up on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle mute state changes
  useEffect(() => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = 0;
      } else {
        audioRef.current.volume = audioVolume / 100;
      }
    }
  }, [isMuted, audioVolume]);

  // Play/pause based on game view (only play in management view)
  useEffect(() => {
    if (!audioRef.current) return;

    if (gameView === 'management') {
      // Use a short timeout to avoid immediate autoplay restrictions
      const playPromise = audioRef.current.play();
      
      // Handle autoplay restrictions gracefully
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('Autoplay prevented:', error);
          // We'll rely on user interaction to start audio
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [gameView]);

  // This component doesn't render anything visible
  return null;
};

export default BackgroundMusic; 