import { useEffect, useState, CSSProperties } from 'react'
import ManagementScene from '@scenes/ManagementScene'
import WelcomeScene from '@scenes/WelcomeScene'  // Import the new WelcomeScene
import AudioPuzzleScene from '@scenes/AudioPuzzleScene'  // Import the AudioPuzzleScene
import ManagementUI from '@components/ui/ManagementUI'
import { useGameStore } from '@store/store'
import styles from './styles/App.module.css'
import DialoguePopup from '@components/ui/DialoguePopup'
import ResearchWindow from '@components/ui/ResearchWindow'
import LivingDomeWindow from '@components/ui/LivingDomeWindow'
import ProductionDomeWindow from '@components/ui/ProductionDomeWindow'
import BackgroundMusic from '@components/audio/BackgroundMusic' // Import the BackgroundMusic component
import { TutorialWindow } from '@components/TutorialWindow'
import FlowWindowContainer from './components/ui/FlowWindowContainer' // Import FlowWindowContainer with relative path

// Add a style block for the Vibe Jam link
const vibeJamStyles: {
  link: CSSProperties;
  smallScreen: CSSProperties;
} = {
  link: {
    fontFamily: 'system-ui, sans-serif',
    position: 'fixed',
    bottom: '-1px',
    right: '-1px',
    padding: '7px',
    fontSize: '14px',
    fontWeight: 'bold',
    background: '#fff',
    color: '#000',
    textDecoration: 'none',
    borderTopLeftRadius: '12px',
    zIndex: 10000,
    border: '1px solid #fff'
  },
  // Add a media query programmatically for small screens
  smallScreen: {
    position: 'fixed',
    bottom: '0',
    left: '50%',
    transform: 'translateX(-50%)',
    right: 'auto',
    fontSize: '12px',
    padding: '5px',
    borderRadius: '8px 8px 0 0',
    zIndex: 10000
  }
};

function App() {
  // Access game state needed at the App level
  const gameView = useGameStore((state) => state.gameView)
  // Get dialogue state and actions from Zustand
  const dialogueMessage = useGameStore((state) => state.dialogueMessage)
  const hideDialogue = useGameStore((state) => state.hideDialogue)
  // --- Get Research Window state and actions ---
  const isResearchWindowVisible = useGameStore((state) => state.isResearchWindowVisible)
  const hideResearchWindow = useGameStore((state) => state.hideResearchWindow)
  // --- ---
  // --- NEW: Get Dome Window states and actions ---
  const isLivingDomeWindowVisible = useGameStore((state) => state.isLivingDomeWindowVisible)
  const hideLivingDomeWindow = useGameStore((state) => state.hideLivingDomeWindow)
  const isProductionDomeWindowVisible = useGameStore((state) => state.isProductionDomeWindowVisible)
  const hideProductionDomeWindow = useGameStore((state) => state.hideProductionDomeWindow)
  // --- Get Tutorial Window state and actions ---
  const isTutorialWindowVisible = useGameStore((state) => state.isTutorialWindowVisible)
  const hideTutorialWindow = useGameStore((state) => state.hideTutorialWindow)
  // --- ---

  // State for forcing remount on view change remains
  const [key, setKey] = useState(0)
  
  // State to track if we're on a small screen
  const [isSmallScreen, setIsSmallScreen] = useState(false)
  
  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      // Check specifically for Samsung S8+ landscape or similar small screens
      setIsSmallScreen(window.innerWidth <= 740 && window.innerHeight <= 360);
    };
    
    // Check initially
    checkScreenSize();
    
    // Add resize listener
    window.addEventListener('resize', checkScreenSize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  // Check for portal URL parameter on mount to set initial view
  useEffect(() => {
    // Check if we need to force welcome scene
    const urlParams = new URLSearchParams(window.location.search);
    const hasPortalParam = urlParams.get('portal') === 'true';
    if (hasPortalParam) {
      useGameStore.getState().setGameView('welcome');
    }
  }, []);

  // Handle transitions between views
  useEffect(() => {
    // When coming back to management view, force a remount of components
    if (gameView === 'management') {
      // First, ensure we're deselected
      useGameStore.getState().deselectTile()
      
      // Then use a slight delay to ensure state is updated before remounting
      setTimeout(() => {
        // Increment key to force remount of ManagementScene
        setKey(prevKey => prevKey + 1)
      }, 50)
    }
  }, [gameView])

  return (
    <div className={styles.appContainer}>
      {/* Audio */}
      <BackgroundMusic />
      
      {/* Welcome view - new portal welcome scene */}
      {gameView === 'welcome' && (
        <WelcomeScene />
      )}

      {/* Conditional rendering based on game view */}
      {gameView === 'management' && (
        <>
          {/* UI Layer */}
          <ManagementUI />

          {/* Canvas Layer with key for forced remounting */}
          <div className={styles.canvasContainer}>
            <ManagementScene key={`management-scene-${key}`} />
          </div>
        </>
      )}

      {gameView === 'puzzle' && (
        <AudioPuzzleScene />
      )}

      {/* Render the Dialogue Popup using Zustand state */}
      <DialoguePopup
        isVisible={dialogueMessage?.isVisible ?? false}
        message={dialogueMessage?.message ?? ''}
        avatarSrc={dialogueMessage?.avatar}
        speakerName={dialogueMessage?.speakerName}
        choices={dialogueMessage?.choices}
        onClose={hideDialogue} // Use hideDialogue action from the store
      />

      {/* --- Render the Research Window --- */}
      <ResearchWindow
        isVisible={isResearchWindowVisible}
        onClose={hideResearchWindow}
      />
      {/* --- --- */}

      {/* --- Render Dome Windows --- */}
      <LivingDomeWindow
        isVisible={isLivingDomeWindowVisible}
        onClose={hideLivingDomeWindow}
      />
      <ProductionDomeWindow
        isVisible={isProductionDomeWindowVisible}
        onClose={hideProductionDomeWindow}
      />
      {/* --- --- */}
      
      {/* --- Render Tutorial Window --- */}
      {isTutorialWindowVisible && <TutorialWindow />}
      {/* --- --- */}
      
      {/* Flow Window Container */}
      <FlowWindowContainer />
      
      {/* Vibe Jam Link */}
      <a 
        target="_blank" 
        href="https://jam.pieter.com" 
        style={isSmallScreen ? {...vibeJamStyles.link, ...vibeJamStyles.smallScreen} : vibeJamStyles.link}
      >
        🕹️ Vibe Jam 2025
      </a>
    </div>
  )
}

export default App 