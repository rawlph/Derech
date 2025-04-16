import { create } from 'zustand'
import * as THREE from 'three'
import { getTaskConfig } from '@config/tasks'; // Import task config getter
import { getRandomFlavourMessage } from '@config/flavourMessages'; // Import flavour message utilities
import { researchProjects } from '@config/research'; // Import research projects
import { livingAreaProjects } from '@config/livingAreaProjects'; // Import living area projects
import { productionProjects } from '@config/productionProjects'; // Import production projects
import { ResourceGeneration } from '@components/management/FloatingResourceNumbers';

// Define interfaces for grid data
export interface TileData {
  q: number;
  r: number;
  type: 'Plains' | 'Ice Deposit' | 'Mountain'; // Changed Water to Ice Deposit
  height: number; // 0-2 for mountains, 0 for other types
  building: string | null;
  resources: Record<string, number>;
  taskId?: string | null; // Optional: Link tile to an active task ID
}

export interface GridTiles {
  [key: string]: TileData; // Key is "q,r"
}

// Track resource changes from previous round
export interface ResourceTrends {
  power: 'up' | 'down' | 'same' | null;
  water: 'up' | 'down' | 'same' | null;
  minerals: 'up' | 'down' | 'same' | null;
  colonyGoods: 'up' | 'down' | 'same' | null;
  researchPoints: 'up' | 'down' | 'same' | null;
}

// NEW: Track resource trend history
export interface ResourceTrendHistory {
  power: ('up' | 'down' | 'same' | null)[];
  water: ('up' | 'down' | 'same' | null)[];
  minerals: ('up' | 'down' | 'same' | null)[];
  colonyGoods: ('up' | 'down' | 'same' | null)[];
  researchPoints: ('up' | 'down' | 'same' | null)[];
}

// --- Task Management ---
export interface TaskState {
  id: string; // Unique ID, e.g., "mining-q-r"
  type: 'deploy-mining' | 'mining-operational' | 'deploy-scout' | 'scout-operational' | 'build-solar' | 'build-geothermal' | 'build-waterwell';
  targetTileKey: string; // "q,r"
  assignedWorkforce: number;
  progress: number; // 0-100, represents deployment completion %
  duration: number; // Rounds needed for deployment
  status: 'deploying' | 'operational' | 'event-pending' | 'shutdown' | 'idle' | 'deconstructing'; // Added 'deconstructing'
  eventDetails?: any; // Store event-specific data if needed
  deconstructProgress?: number; // Added for deconstruction progress tracking
}

export interface DialogueChoice {
  text: string;
  action: () => void;
}

// Interface for the dialogue state
export interface DialogueState {
  isVisible: boolean;
  message: string;
  avatar?: string; // Optional avatar path
  speakerName?: string; // Character name
  choices?: DialogueChoice[]; // Dialogue choices for player
}

// --- NEW: Research Projects ---
export interface ActiveResearch {
  id: string;          // Project ID matching config
  name: string;        // Display name
  progress: number;    // 0-100 completion percentage
  duration: number;    // Total rounds needed
  startedRound: number; // When the research started
  type: 'research' | 'production' | 'living'; // Type of project
}

// Interface for dome specific generation values and cycles
export interface DomeGenerationValues {
  colonyGoodsCycle: number; // Production dome: Counts up to 5 rounds
  colonyGoodsBaseAmount: number; // Production dome: Base production amount
  researchCycle: number; // Research dome: Counts up to 4 rounds
  researchBaseAmount: number; // Research dome: Base production amount
  populationCycle: number; // Living dome: Counts up to 10 rounds with sufficient resources
  populationGrowthThreshold: number; // Living dome: Number of consecutive rounds with sufficient resources
  waterPositive: boolean; // Was water positive last round?
  colonyGoodsSufficient: boolean; // Were colony goods sufficient last round?
}

// Define the store state interface
interface GameState {
  // --- Resources ---
  power: number;
  water: number;
  population: number;
  researchPoints: number;
  colonyGoods: number;
  minerals: number; // NEW: Raw minerals resource

  // --- Flow Points ---
  flowPoints: number;
  activeFlowTier: 'basic' | 'strong' | 'master' | null;

  // --- Insights ---
  embodimentInsight: number; // NEW: Track embodiment insights gained

  // --- Previous Round Resources ---
  previousRoundResources: {
    power: number;
    water: number;
    minerals: number;
    colonyGoods: number;
    researchPoints: number;
  };
  
  // --- Resource Trends ---
  resourceTrends: ResourceTrends;
  
  // --- NEW: Resource Trend History ---
  resourceTrendHistory: {
    power: ('up' | 'down' | 'same' | null)[];
    water: ('up' | 'down' | 'same' | null)[];
    minerals: ('up' | 'down' | 'same' | null)[];
    colonyGoods: ('up' | 'down' | 'same' | null)[];
    researchPoints: ('up' | 'down' | 'same' | null)[];
  };

  // --- Audio Settings ---
  isMuted: boolean;
  audioVolume: number;

  // --- Workforce ---
  totalWorkforce: number; // NEW: Calculated from population
  availableWorkforce: number; // NEW: Workforce not assigned to tasks

  // --- Game State ---
  currentRound: number;
  gridTiles: GridTiles;
  selectedTile: TileData | null;
  gameView: 'management' | 'puzzle' | 'menu' | 'welcome';  // Added 'welcome' view type
  previousGameView: 'management' | 'puzzle' | 'menu' | 'welcome' | null; // Track the previous view
  activeTasks: Record<string, TaskState>; // NEW: Ongoing tasks

  // --- Audio Puzzle ---
  audioPuzzleProgress: number; // Progress of the audio puzzle (0-1)
  isAudioPuzzleCompleted: boolean; // NEW: Track if the audio puzzle part of embodiment project is completed

  // --- NEW: Dialogue State ---
  dialogueMessage: DialogueState | null; // Use null when hidden

  // --- NEW: Track last flavour message round ---
  lastFlavourRound: number;

  // --- NEW: Research State ---
  isResearchWindowVisible: boolean;
  activeResearch: ActiveResearch | null; // Currently active research project
  completedResearch: string[]; // Array of research project IDs that have been completed
  
  // --- NEW: Living Dome State ---
  isLivingDomeWindowVisible: boolean;
  activeLivingProject: ActiveResearch | null; // Currently active living project
  completedLivingProjects: string[]; // Completed living projects
  
  // --- NEW: Production Dome State ---
  isProductionDomeWindowVisible: boolean;
  activeProductionProject: ActiveResearch | null; // Currently active production project
  completedProductionProjects: string[]; // Completed production projects

  // --- NEW: Add property to track low water penalty status ---
  isLowWaterPenaltyActive: boolean;

  // --- Penalty Flags ---
  isLowPowerPenaltyActive: boolean; // NEW

  // --- Resource Generation Tracking ---
  roundResourceGenerations: ResourceGeneration[];

  // --- Dome Generation Tracking ---
  domeGeneration: DomeGenerationValues;

  // --- NEW: Tutorial Window State ---
  isTutorialWindowVisible: boolean;

  // --- NEW: Flow Window State ---
  isFlowWindowVisible: boolean;

  // --- Actions ---
  // Resource Management
  addPower: (amount: number) => void;
  addWater: (amount: number) => void;
  addMinerals: (amount: number) => void; // NEW
  deductResources: (costs: { power?: number; water?: number; minerals?: number; colonyGoods?: number; researchPoints?: number }) => boolean; // NEW Helper

  // Flow Points Management
  addFlowPoints: (amount: number) => void;
  updateFlowTier: () => 'basic' | 'strong' | 'master' | null;
  
  // Insight Management
  incrementEmbodimentInsight: () => void; // NEW: Action to increment embodiment insights

  // Round Management
  endRound: () => void;

  // Grid Management
  initializeGrid: (radius: number) => void;
  getTile: (q: number, r: number) => TileData | undefined;
  selectTile: (q: number, r: number) => void;
  deselectTile: () => void;
  updateTile: (q: number, r: number, updates: Partial<TileData>) => void; // NEW Helper

  // View Management
  setGameView: (view: 'management' | 'puzzle' | 'menu' | 'welcome') => void;
  resetColony: () => void; // NEW: Reset colony state but keep grid
  
  // --- Audio Puzzle Management ---
  updateAudioPuzzleProgress: (progress: number) => void;
  markAudioPuzzleCompleted: () => void; // NEW: Function to mark audio puzzle as completed
  
  // Task Management Actions (NEW)
  assignWorkforceToTask: (taskType: TaskState['type'], targetTile: TileData, workforce: number) => AssignTaskResult;
  updateTaskProgress: () => boolean;
  generateTaskResources: () => void;
  triggerTaskEvent: (taskId: string, eventType: string) => void; // Simplified event trigger
  resolveTaskEvent: (taskId: string, outcome: any) => void;
  recallWorkforce: (taskId: string) => void;

  // --- NEW: Dialogue Actions ---
  showDialogue: (message: string, avatar?: string, speakerName?: string, choices?: DialogueChoice[]) => void;
  hideDialogue: () => void;

  // --- NEW: Research Actions ---
  showResearchWindow: () => void;
  hideResearchWindow: () => void;
  startResearch: (projectId: string) => boolean; // Start a research project
  updateResearchProgress: () => void; // Update progress on research
  
  // --- NEW: Living Dome Actions ---
  showLivingDomeWindow: () => void;
  hideLivingDomeWindow: () => void;
  startLivingProject: (projectId: string) => boolean; // Start a living area project
  updateLivingProjectProgress: () => void; // Update progress on living project
  
  // --- NEW: Production Dome Actions ---
  showProductionDomeWindow: () => void;
  hideProductionDomeWindow: () => void;
  startProductionProject: (projectId: string) => boolean; // Start a production project
  updateProductionProjectProgress: () => void; // Update progress on production project

  // --- NEW: Resource Generation Actions ---
  clearResourceGenerations: () => void;

  // --- NEW: Emergency Reset Colony ---
  emergencyResetColony: () => void;

  // --- NEW: Dome Resource Generation Actions ---
  generateDomeResources: () => void;
  checkPopulationGrowth: () => boolean; // Returns true if population increased

  // Add a flag to prevent endRound spam
  isEndingRound: boolean;

  // --- Audio Actions ---
  toggleMute: () => void;
  setVolume: (volume: number) => void;

  // --- Helper Functions ---
  processDomeProjects: (dialogueAlreadyShown: boolean) => boolean; // Returns true if a message was shown

  // --- NEW: Tutorial Actions ---
  showTutorialWindow: () => void;
  hideTutorialWindow: () => void;

  // --- NEW: Flow Actions ---
  showFlowWindow: () => void;
  hideFlowWindow: () => void;
  getConsecutivePositiveTrends: (resourceKey: keyof ResourceTrendHistory) => number; // Helper to get consecutive positive trends for a resource

  // --- NEW: Resource Sidebar State ---
  isResourceSidebarOpen: boolean;

  // --- NEW: Resource Sidebar Actions ---
  setResourceSidebarOpen: (isOpen: boolean) => void;
}

// Define return types for assignWorkforceToTask
type AssignTaskResult = true | 'insufficient_workforce' | 'insufficient_resources' | 'tile_occupied' | 'building_present' | 'config_missing' | 'task_type_deploying';

// Helper to generate initial grid data
const generateInitialGrid = (radius: number): GridTiles => {
  const tiles: GridTiles = {};
  
  // First pass: Generate basic terrain
  for (let q = -radius; q <= radius; q++) {
    for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) {
      const key = `${q},${r}`;
      // Initial type assignment
      let type: TileData['type'] = 'Plains';
      let height = 0; // Default height
      
      // Ice Deposit generation (sparse)
      if (Math.random() < 0.05) type = 'Ice Deposit';
      
      tiles[key] = {
        q,
        r,
        type,
        height,
        building: null,
        resources: {},
        taskId: null, // Initialize taskId
      };
    }
  }
  
  // Second pass: Generate mountain clusters
  const mountainClusters = 3; // Number of mountain clusters
  for (let i = 0; i < mountainClusters; i++) {
    // Pick a random existing tile for cluster center
    const keys = Object.keys(tiles);
    const centerKey = keys[Math.floor(Math.random() * keys.length)];
    const [centerQ, centerR] = centerKey.split(',').map(Number);
    
    // Don't place mountains near the center colony
    if (Math.abs(centerQ) < 2 && Math.abs(centerR) < 2) continue;
    
    // Make center a mountain with height 2
    if(tiles[centerKey]) { // Ensure tile exists
      tiles[centerKey].type = 'Mountain';
      tiles[centerKey].height = 2;
    }
    
    // Get neighbors in a radius of 2
    const clusterRadius = 2;
    for (let dq = -clusterRadius; dq <= clusterRadius; dq++) {
      for (let dr = -clusterRadius; dr <= clusterRadius; dr++) {
        // Skip if outside the valid range for a circle in hex coordinates
        if (Math.abs(dq) + Math.abs(dr) + Math.abs(dq+dr) > clusterRadius*2) continue;
        if (dq === 0 && dr === 0) continue; // Skip center tile itself

        const nq = centerQ + dq;
        const nr = centerR + dr;
        const neighborKey = `${nq},${nr}`;
        
        // Skip if neighbor doesn't exist or is an ice deposit
        if (!tiles[neighborKey] || tiles[neighborKey].type === 'Ice Deposit') continue;
        
        // Calculate probability based on distance from center
        const distance = Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq+dr)); // Hex distance from center
        const probability = 1 - (distance / (clusterRadius + 1)); // Adjusted probability curve
        
        // More likely to be mountain closer to center
        if (Math.random() < probability * 0.9) { // Increased probability slightly
          tiles[neighborKey].type = 'Mountain';
          
          // Height decreases with distance from center
          if (distance === 1) {
            // Higher chance of height 1 or 2
            tiles[neighborKey].height = Math.max(tiles[neighborKey].height, Math.random() < 0.6 ? 1 : 2);
          } else { // distance === 2
            // Mostly height 1
            tiles[neighborKey].height = Math.max(tiles[neighborKey].height, 1);
          }
        }
      }
    }
  }
  
  // Add initial colony structures (ensuring they're on flat plains)
  const ensureFlatPlain = (q: number, r: number) => {
    const key = `${q},${r}`;
    if (tiles[key]) {
      tiles[key].type = 'Plains';
      tiles[key].height = 0;
    }
  }
  ensureFlatPlain(0,0);  // Flow Project Site
  ensureFlatPlain(-1,0); // Research Dome
  ensureFlatPlain(-1,1); // Living Dome
  ensureFlatPlain(0,1);  // Production Dome

  // Assign buildings to their tiles
  if (tiles['0,0']) tiles['0,0'].building = 'Flow Project Site';  // New Flow Project Site
  if (tiles['-1,1']) tiles['-1,1'].building = 'Living Dome';
  if (tiles['0,1']) tiles['0,1'].building = 'Production Dome';
  if (tiles['-1,0']) tiles['-1,0'].building = 'Research Dome';

  return tiles;
};


// Create the store
export const useGameStore = create<GameState>((set, get) => ({
  // Initial Resource Values
  power: 100,
  water: 100,
  population: 10,
  researchPoints: 0,
  colonyGoods: 50,
  minerals: 50, // Start with more minerals

  // Flow Points
  flowPoints: 0,
  activeFlowTier: null,

  // Insights
  embodimentInsight: 0, // NEW: Start with 0 embodiment insights

  // Initial Workforce (derived)
  totalWorkforce: 8, // Example: 10 pop * 0.8 = 8
  availableWorkforce: 8,

  // Initial Game State
  currentRound: 1,
  gridTiles: {}, // Initialized below
  selectedTile: null,
  gameView: 'welcome',  // Changed from 'management' to 'welcome'
  previousGameView: null, // Initially null
  activeTasks: {}, // Start with no active tasks
  dialogueMessage: null, // Initialize dialogue as hidden
  lastFlavourRound: 0, // Initialize last flavour round
  isLowWaterPenaltyActive: false, // Initialize penalty flag
  isLowPowerPenaltyActive: false, // NEW: Initialize power penalty flag
  
  // Audio Puzzle
  audioPuzzleProgress: 0, // Initialize audio puzzle progress to 0
  isAudioPuzzleCompleted: false, // Initialize audio puzzle completion status
  
  // --- NEW: Initial Research State ---
  isResearchWindowVisible: false, // Initially hidden
  // --- NEW: Initial Living Dome State ---
  isLivingDomeWindowVisible: false, // Initially hidden
  // --- NEW: Initial Production Dome State ---
  isProductionDomeWindowVisible: false, // Initially hidden
  // --- NEW: Initial Tutorial State ---
  isTutorialWindowVisible: false, // Initially hidden
  
  // --- NEW: Flow Window State ---
  isFlowWindowVisible: false, // Initially hidden

  // --- NEW: Research State ---
  activeResearch: null, // Initially no active research project
  completedResearch: [], // Array of research project IDs that have been completed
  
  // --- NEW: Living Dome State ---
  activeLivingProject: null, // Initially no active living project
  completedLivingProjects: [], // Completed living projects
  
  // --- NEW: Production Dome State ---
  activeProductionProject: null, // Initially no active production project
  completedProductionProjects: [], // Completed production projects

  // --- Resource Generation Tracking ---
  roundResourceGenerations: [],

  // --- Dome Generation Tracking ---
  domeGeneration: {
    colonyGoodsCycle: 0,
    colonyGoodsBaseAmount: 3, // Base: +3 every 5 rounds
    researchCycle: 0,
    researchBaseAmount: 1, // Base: +1 every 4 rounds
    populationCycle: 0,
    populationGrowthThreshold: 10, // Need 10 consecutive rounds with sufficient resources
    waterPositive: true, // Start assuming positive water
    colonyGoodsSufficient: true, // Start assuming sufficient goods
  },

  // --- Previous Round Resources ---
  previousRoundResources: {
    power: 100,
    water: 100,
    minerals: 50,
    colonyGoods: 50,
    researchPoints: 0
  },
  
  // --- Resource Trends ---
  resourceTrends: {
    power: 'same',
    water: 'same',
    minerals: 'same',
    colonyGoods: 'same',
    researchPoints: 'same'
  },
  
  // --- NEW: Resource Trend History ---
  resourceTrendHistory: {
    power: [],
    water: [],
    minerals: [],
    colonyGoods: [],
    researchPoints: []
  },

  // --- Audio Settings ---
  isMuted: false,
  audioVolume: 50,

  // --- Actions ---
  addPower: (amount) => set((state) => ({ power: state.power + amount })),
  addWater: (amount) => set((state) => ({ water: state.water + amount })),
  addMinerals: (amount) => set((state) => ({ minerals: state.minerals + amount })),
  deductResources: (costs) => {
    const state = get();
    const enoughResources =
      (costs.power === undefined || state.power >= costs.power) &&
      (costs.water === undefined || state.water >= costs.water) &&
      (costs.minerals === undefined || state.minerals >= costs.minerals) &&
      (costs.colonyGoods === undefined || state.colonyGoods >= costs.colonyGoods) &&
      (costs.researchPoints === undefined || state.researchPoints >= costs.researchPoints);

    if (enoughResources) {
      set({
        power: state.power - (costs.power || 0),
        water: state.water - (costs.water || 0),
        minerals: state.minerals - (costs.minerals || 0),
        colonyGoods: state.colonyGoods - (costs.colonyGoods || 0),
        researchPoints: state.researchPoints - (costs.researchPoints || 0),
      });
      return true;
    }
    console.warn("Not enough resources to deduct:", costs);
    return false;
  },

  // Add flag for debouncing endRound calls
  isEndingRound: false,

  endRound: () => {
    // Prevent multiple simultaneous endRound calls
    if (get().isEndingRound) {
      console.log("Ignoring endRound call - already processing a round end");
      return;
    }
    
    // Set flag to prevent further calls
    set({ isEndingRound: true });
    
    console.log("--- Ending Round", get().currentRound, "---");
    let dialogueShownThisRound = false; // Flag to prevent multiple popups

    // Clear any existing resource generations to avoid accumulation
    set({ roundResourceGenerations: [] });
    
    // Initialize resource change tracking
    const resourceChanges = {
      power: 0,
      water: 0,
      minerals: 0,
      colonyGoods: 0,
      researchPoints: 0
    };
    
    // ----- STEP 1: Calculate ALL resource consumption -----
    const { population } = get();
    
    // Calculate power consumption from buildings
    let totalPowerConsumed = 0;
    const currentTasks = get().activeTasks;
    Object.values(currentTasks).forEach(task => {
      if (task.status === 'operational') {
        const taskConfig = getTaskConfig(task.type);
        if (taskConfig?.powerConsumption && taskConfig.powerConsumption > 0) {
          let consumption = taskConfig.powerConsumption;
          
          // Apply project effects for power consumption
          if (task.type === 'build-waterwell' && get().completedProductionProjects.includes('thermal-extractors')) {
            consumption *= 0.75; // Apply 25% reduction
          }
          
          totalPowerConsumed += consumption;
        }
      }
    });
    
    // Add base colony power consumption
    totalPowerConsumed += 2; // Base consumption for domes/life support
    resourceChanges.power -= totalPowerConsumed;
    console.log(`Total Power Consumption this round: ${totalPowerConsumed.toFixed(2)}`);
    
    // Calculate water consumption
    let waterConsumed = population * 1;
    
    // Apply research effects for water consumption
    if (get().completedResearch.includes('detoxifying-bacteria')) {
      waterConsumed *= 0.85; // Apply 15% reduction
    }
    
    resourceChanges.water -= waterConsumed;
    console.log(`Total Water Consumption this round: ${waterConsumed.toFixed(2)}`);
    
    // ----- STEP 2: Calculate ALL resource generation -----
    
    // Base power production
    const powerProduced = 5; // Base power production
    resourceChanges.power += powerProduced;
    
    // Calculate shutdown power savings
    let shutdownPowerSavings = 0;
    Object.values(currentTasks).forEach(task => {
      if (task.status === 'shutdown') {
        const taskConfig = getTaskConfig(task.type);
        if (taskConfig?.powerConsumption && taskConfig.powerConsumption > 0) {
          let operationalConsumption = taskConfig.powerConsumption;
          // Apply consumption reduction effects even when calculating savings
          if (task.type === 'build-waterwell' && get().completedProductionProjects.includes('thermal-extractors')) {
            operationalConsumption *= 0.75;
          }
          const savedPower = Math.round(operationalConsumption * 0.8);
          shutdownPowerSavings += savedPower;
        } else if (taskConfig?.cost.power) {
          // Fallback for older logic if needed
          const normalOperationPowerCost = Math.round(taskConfig.cost.power * 0.25);
          const savedPower = Math.round(normalOperationPowerCost * 0.8);
          shutdownPowerSavings += savedPower;
        }
      }
    });
    resourceChanges.power += shutdownPowerSavings;
    console.log(`Shutdown Power Savings: ${shutdownPowerSavings.toFixed(2)}`);
    
    // ----- STEP 3: Collect resource generations from buildings -----
    
    // Check for resource penalties first
    const lowWaterPenalty = get().water < 0;
    const lowPowerPenalty = get().power < 0;
    
    // Track individual building resource generation for visual effects
    const resourceGenerations: ResourceGeneration[] = [];
    
    Object.values(currentTasks).forEach(task => {
      if (task.status === 'operational') {
        const taskConfig = getTaskConfig(task.type);
        const tile = get().gridTiles[task.targetTileKey];
        if (taskConfig?.resourceYield && tile) {
          const resourceType = taskConfig.resourceYield.resource;
          let yieldAmount = taskConfig.resourceYield.baseAmount;
          let generateResource = true; // Flag to control generation
          
          // Apply penalties (Power penalty check first)
          if (lowPowerPenalty && (resourceType === 'minerals' || resourceType === 'researchPoints')) {
            generateResource = false;
          } else if (lowWaterPenalty && (resourceType === 'minerals' || resourceType === 'researchPoints')) {
            generateResource = false;
          }
          
          // Apply project bonuses if resource generation is not skipped
          if (generateResource) {
            // Apply project effects for resource generation
            if (resourceType === 'minerals' && task.type === 'deploy-mining') {
              if (get().completedResearch.includes('improved-extraction')) {
                yieldAmount *= 1.25; // +25%
              }
              // Apply mountain height bonus after research bonus
              if (tile.type === 'Mountain') {
                const heightBonus = tile.height * 0.5;
                yieldAmount *= (1 + heightBonus);
              }
            } else if (resourceType === 'water' && task.type === 'build-waterwell') {
              if (get().completedResearch.includes('water-reclamation-1')) {
                yieldAmount *= 1.20; // +20%
              }
              if (get().completedProductionProjects.includes('thermal-extractors')) {
                yieldAmount *= 1.10; // +10% (multiplicative)
              }
            } else if (resourceType === 'researchPoints' && task.type === 'deploy-scout') {
              if (get().completedResearch.includes('embodiment-prelim')) {
                yieldAmount *= 1.15; // +15%
              }
            } else if (resourceType === 'power' && task.type === 'build-geothermal') {
              if (get().completedResearch.includes('seismic-mapping')) {
                yieldAmount *= 1.30; // +30%
              }
            }
            
            // Floor the yield after all bonuses
            yieldAmount = Math.floor(yieldAmount);
            
            // Add to individual generation tracking for visualization
            resourceGenerations.push({
              taskId: task.id,
              targetTileKey: task.targetTileKey,
              type: task.type,
              resourceType,
              amount: yieldAmount
            });
            
            // Add to resource changes
            switch (resourceType) {
              case 'minerals':
                resourceChanges.minerals += yieldAmount;
                break;
              case 'researchPoints':
                resourceChanges.researchPoints += yieldAmount;
                break;
              case 'power':
                resourceChanges.power += yieldAmount;
                break;
              case 'water':
                resourceChanges.water += yieldAmount;
                break;
              case 'colonyGoods':
                resourceChanges.colonyGoods += yieldAmount;
                break;
            }
          }
        }
      }
    });
    
    // ----- STEP 4: Calculate dome-based resource generation -----
    
    const { colonyGoodsCycle, colonyGoodsBaseAmount, researchCycle, researchBaseAmount } = get().domeGeneration;
    
    let updatedColonyGoodsCycle = colonyGoodsCycle + 1;
    let updatedResearchCycle = researchCycle + 1;
    let colonyGoodsGenerated = 0;
    let researchPointsGenerated = 0;
    
    // Production Dome: Generate colony goods every 5 rounds
    if (updatedColonyGoodsCycle >= 5) {
      // Start with base amount
      colonyGoodsGenerated = colonyGoodsBaseAmount;
      
      // Apply production project bonuses
      if (get().completedProductionProjects.includes('optimize-assembly')) {
        // Add 15% bonus from Optimized Assembly Line
        colonyGoodsGenerated = Math.round((colonyGoodsGenerated * 1.15) * 100) / 100;
        console.log(`Production bonus applied: ${colonyGoodsGenerated}`);
      }
      
      updatedColonyGoodsCycle = 0;
      
      // Add to resource generations for visualization
      resourceGenerations.push({
        taskId: 'production-dome',
        targetTileKey: '0,1', // Production Dome is at 0,1 (changed from 1,0)
        type: 'production-dome',
        resourceType: 'colonyGoods',
        amount: colonyGoodsGenerated
      });
      
      // Add the generated goods to the resource changes
      resourceChanges.colonyGoods += colonyGoodsGenerated;
    }
    
    // Research Dome: Generate research points every 4 rounds
    if (updatedResearchCycle >= 4) {
      researchPointsGenerated = researchBaseAmount;
      updatedResearchCycle = 0;
      
      // Add to resource generations for visualization
      resourceGenerations.push({
        taskId: 'research-dome',
        targetTileKey: '-1,0', // Research Dome is at -1,0 (unchanged)
        type: 'research-dome',
        resourceType: 'researchPoints',
        amount: researchPointsGenerated
      });
      
      // Add the generated research points to the resource changes
      resourceChanges.researchPoints += researchPointsGenerated;
    }
    
    // Save dome generation cycle updates
    set(state => ({
      domeGeneration: {
        ...state.domeGeneration,
        colonyGoodsCycle: updatedColonyGoodsCycle,
        researchCycle: updatedResearchCycle
      },
      // Add resource generations for visualization
      roundResourceGenerations: resourceGenerations
    }));
    
    // Log resource changes
    console.log(`Resource changes this round - Power: ${resourceChanges.power.toFixed(2)}, Water: ${resourceChanges.water.toFixed(2)}, Minerals: ${resourceChanges.minerals}, RP: ${resourceChanges.researchPoints}, Goods: ${resourceChanges.colonyGoods}`);
    
    // ----- STEP 5: Process the rest of round logic -----
    
    // 1. Update Task Progress & Status
    const taskCompletedMessageShown = get().updateTaskProgress();
    if (taskCompletedMessageShown) {
      dialogueShownThisRound = true;
    }
    
    // 4. Trigger Random Events (placeholder, remains disabled)
    // TEMPORARILY DISABLED: Events are disabled for now

    // 5. Check for Building Issues
    // get().checkForNewIssues();
    
    // 6. Restore shutdown facilities
    set(state => {
      const updatedTasks = { ...state.activeTasks };
      let restoredCount = 0;
      
      Object.entries(updatedTasks).forEach(([taskId, task]) => {
        if (task.status === 'shutdown') {
          updatedTasks[taskId] = {
            ...task,
            status: 'operational'
          };
          restoredCount++;
        }
      });
      
      if (restoredCount > 0) {
        console.log(`Restored ${restoredCount} shutdown facilities to operational status.`);
      }
      
      return { activeTasks: updatedTasks };
    });
    
    // 7. Update Research and Project Progress
    const projectsUpdated = get().processDomeProjects(dialogueShownThisRound);
    dialogueShownThisRound = dialogueShownThisRound || projectsUpdated;

    // 8. Check for Flavour Text
    const currentRoundState = get().currentRound; // Get state *before* setting next round
    const lastFlavourRoundState = get().lastFlavourRound;
    const roundsSinceFlavour = currentRoundState - lastFlavourRoundState;
    const shouldCheckFlavour = roundsSinceFlavour >= 5; // Min 5 rounds passed

    if (!dialogueShownThisRound && shouldCheckFlavour) {
        const chance = 0.3 + (roundsSinceFlavour - 5) * 0.1; // Increase chance after 5 rounds
        if (Math.random() < Math.min(chance, 0.8)) { // Cap chance at 80%
            const flavour = getRandomFlavourMessage();
            get().showDialogue(
              flavour.message, 
              flavour.avatar,
              flavour.avatar?.includes('Fem') ? "Colonist" : "Engineer"
            );
            set({ lastFlavourRound: currentRoundState }); // Update last round shown
            dialogueShownThisRound = true;
            console.log(`Showing flavour text (Round ${currentRoundState}, Last: ${lastFlavourRoundState})`)
        }
    }

    // Check population growth conditions and update cycle
    const populationGrew = get().checkPopulationGrowth();
    if (populationGrew) {
      dialogueShownThisRound = true;
    }

    // ----- STEP 6: Apply all resource changes at once -----
    setTimeout(() => {
    set((state) => {
        // Store current resource values before applying changes
        const previousValues = {
          power: state.power,
          water: state.water,
          minerals: state.minerals,
          colonyGoods: state.colonyGoods,
          researchPoints: state.researchPoints
        };
        
        // Calculate new resource values based on current values plus changes
        const newPower = state.power + resourceChanges.power;
        const newWater = state.water + resourceChanges.water;
        const newMinerals = state.minerals + resourceChanges.minerals;
        const newColonyGoods = state.colonyGoods + resourceChanges.colonyGoods;
        const newResearchPoints = state.researchPoints + resourceChanges.researchPoints;
        
        // Calculate resource trends
        const newResourceTrends: ResourceTrends = {
          power: newPower > previousValues.power ? 'up' : newPower < previousValues.power ? 'down' : 'same',
          water: newWater > previousValues.water ? 'up' : newWater < previousValues.water ? 'down' : 'same',
          minerals: newMinerals > previousValues.minerals ? 'up' : newMinerals < previousValues.minerals ? 'down' : 'same',
          colonyGoods: newColonyGoods > previousValues.colonyGoods ? 'up' : newColonyGoods < previousValues.colonyGoods ? 'down' : 'same',
          researchPoints: newResearchPoints > previousValues.researchPoints ? 'up' : newResearchPoints < previousValues.researchPoints ? 'down' : 'same'
        };
        
        // NEW: Update resource trend history
        const newResourceTrendHistory: ResourceTrendHistory = {
          power: [newResourceTrends.power, ...state.resourceTrendHistory.power].slice(0, 99),
          water: [newResourceTrends.water, ...state.resourceTrendHistory.water].slice(0, 99),
          minerals: [newResourceTrends.minerals, ...state.resourceTrendHistory.minerals].slice(0, 99),
          colonyGoods: [newResourceTrends.colonyGoods, ...state.resourceTrendHistory.colonyGoods].slice(0, 99),
          researchPoints: [newResourceTrends.researchPoints, ...state.resourceTrendHistory.researchPoints].slice(0, 99)
        };
        
        // --- Check penalty states based on new values ---
        const wasPowerPenaltyActive = state.isLowPowerPenaltyActive;
        const isPowerPenaltyNowActive = newPower < 0;
        if (isPowerPenaltyNowActive && !wasPowerPenaltyActive && !dialogueShownThisRound) {
          get().showDialogue(
            "Critical Alert: Power reserves empty! Non-essential systems shutting down. Production and research capabilities severely impacted.",
            '/Derech/avatars/ColonistAvatarMal5.jpg',
            "Chief Engineer"
          );
          dialogueShownThisRound = true;
        }

        const wasWaterPenaltyActive = state.isLowWaterPenaltyActive;
        const isWaterPenaltyNowActive = newWater < 0;
        if (isWaterPenaltyNowActive && !wasWaterPenaltyActive && !dialogueShownThisRound) {
          get().showDialogue(
            "Warning: Water reserves depleted! Critical systems diverting resources. Mineral and Research output may be affected.",
            '/Derech/avatars/ColonistAvatarFem2.jpg',
            "Life Support Officer"
          );
        }

        // Recalculate workforce
      const newTotalWorkforce = Math.floor(state.population * 0.8);
      const currentAssigned = Object.values(state.activeTasks).reduce((sum, task) => sum + task.assignedWorkforce, 0);
      const newAvailableWorkforce = Math.max(0, newTotalWorkforce - currentAssigned);

      // Update the flow tier based on the current resource trends
      const activeTier = get().updateFlowTier();
      
      // Add flow points based on the active tier
      if (activeTier) {
        let flowPointsToAdd = 0;
        
        switch (activeTier) {
          case 'master':
            flowPointsToAdd = 4;
            break;
          case 'strong':
            flowPointsToAdd = 2;
            break;
          case 'basic':
            flowPointsToAdd = 1;
            break;
        }
        
        if (flowPointsToAdd > 0) {
          get().addFlowPoints(flowPointsToAdd);
          console.log(`Added ${flowPointsToAdd} Flow Points (${activeTier} tier active)`);
        }
      }

      return {
        currentRound: state.currentRound + 1,
          power: Math.max(0, newPower),
          water: Math.max(0, newWater),
          minerals: Math.max(0, newMinerals),
          colonyGoods: Math.max(0, newColonyGoods),
          researchPoints: Math.max(0, newResearchPoints),
          
          // Store previous values for next round comparison
          previousRoundResources: {
            power: newPower,
            water: newWater,
            minerals: newMinerals,
            colonyGoods: newColonyGoods,
            researchPoints: newResearchPoints
          },
          
          // Set new resource trends
          resourceTrends: newResourceTrends,
          
          // Set new resource trend history
          resourceTrendHistory: newResourceTrendHistory,
          // selectedTile: null, // Removed to keep tile selected between rounds
        totalWorkforce: newTotalWorkforce,
        availableWorkforce: newAvailableWorkforce,
          isLowWaterPenaltyActive: isWaterPenaltyNowActive,
          isLowPowerPenaltyActive: isPowerPenaltyNowActive,
          isEndingRound: false // Reset the flag when done
      };
    });
      
    console.log("Round Ended. New Round:", get().currentRound);
      console.log(`Resources - Power: ${get().power.toFixed(2)}, Water: ${get().water.toFixed(2)}, Minerals: ${get().minerals}, Colony Goods: ${get().colonyGoods}, Research: ${get().researchPoints}`);
      console.log(`Penalties - Power: ${get().isLowPowerPenaltyActive}, Water: ${get().isLowWaterPenaltyActive}`);
    console.log("Available Workforce:", get().availableWorkforce, "/", get().totalWorkforce);
    }, 500); // Short delay to allow for visuals
  },

  initializeGrid: (radius) => {
    set({ gridTiles: generateInitialGrid(radius) });
    // Initial workforce calculation
    const pop = get().population;
    const totalWf = Math.floor(pop * 0.8);
    set({ totalWorkforce: totalWf, availableWorkforce: totalWf });
    console.log("Grid Initialized with radius:", radius);
  },

  getTile: (q, r) => {
    return get().gridTiles[`${q},${r}`];
  },

  selectTile: (q, r) => {
    const tile = get().getTile(q, r);
    if (tile) {
      set({ selectedTile: tile });
      console.log("Selected Tile:", tile);
    } else {
      set({ selectedTile: null})
      console.log(`Tile at ${q},${r} not found.`);
    }
  },

  deselectTile: () => set({ selectedTile: null }),

  updateTile: (q, r, updates) => {
    const key = `${q},${r}`;
    set((state) => {
      if (state.gridTiles[key]) {
        return {
          gridTiles: {
            ...state.gridTiles,
            [key]: { ...state.gridTiles[key], ...updates },
          },
        };
      }
      return {}; // No change if tile doesn't exist
    });
  },

  setGameView: (view) => set(state => ({
    gameView: view, 
    previousGameView: state.gameView 
  })),

  resetColony: () => {
    console.log("Resetting colony to initial state...");
    
    set({
      power: 100,
      water: 100,
      population: 10,
      researchPoints: 0,
      colonyGoods: 50,
      minerals: 20,
      totalWorkforce: 8,
      availableWorkforce: 8,
      currentRound: 1,
      gridTiles: {}, // Will be replaced by initializeGrid call
      selectedTile: null, // Reset selected tile when resetting colony
      gameView: 'management', // Changed from 'welcome' to 'management' to go directly to new colony
      previousGameView: 'welcome',
      activeTasks: {},
      dialogueMessage: null,
      lastFlavourRound: 0,
      audioPuzzleProgress: 0, // Reset audio puzzle progress
      isResearchWindowVisible: false,
      activeResearch: null,
      completedResearch: [],
      isLivingDomeWindowVisible: false,
      activeLivingProject: null,
      completedLivingProjects: [],
      isProductionDomeWindowVisible: false,
      activeProductionProject: null,
      completedProductionProjects: [],
      isTutorialWindowVisible: false, // Reset tutorial window visibility
      isLowWaterPenaltyActive: false, // Initialize penalty flag
      isLowPowerPenaltyActive: false, // NEW: Initialize power penalty flag
      previousRoundResources: {
        power: 100,
        water: 100,
        minerals: 50,
        colonyGoods: 50,
        researchPoints: 0
      },
      resourceTrends: {
        power: 'same',
        water: 'same',
        minerals: 'same',
        colonyGoods: 'same',
        researchPoints: 'same'
      },
      resourceTrendHistory: {
        power: [],
        water: [],
        minerals: [],
        colonyGoods: [],
        researchPoints: []
      },
      isFlowWindowVisible: false, // Reset flow window visibility
      flowPoints: 0,
      activeFlowTier: null,
    });
    
    // Initialize a fresh grid with radius 5
    useGameStore.getState().initializeGrid(5);
    console.log("Colony reset. Game state initialized with fresh grid.");
  },

  emergencyResetColony: () => {
    console.log("EMERGENCY: Executing colony reset");
    
    // Start with collecting the IDs of all operational tasks
    const activeTasks = get().activeTasks;
    const taskIdsToRemove: string[] = [];
    
    // Identify all active tasks
    Object.values(activeTasks).forEach(task => {
      taskIdsToRemove.push(task.id);
    });
    
    // Clean up the grid - remove buildings and taskIds
    set(state => {
      const updatedGridTiles = { ...state.gridTiles };
      
      // Remove building and taskId from all tiles except the initial domes
      Object.keys(updatedGridTiles).forEach(key => {
        if (!['0,1', '-1,1', '-1,0'].includes(key)) { 
          // Keep the initial domes intact
          updatedGridTiles[key] = {
            ...updatedGridTiles[key],
            building: null,
            taskId: null
          };
        }
      });
      
      // Reset resource values and dome generation cycles
      return {
        power: 100,
        water: 100,
        minerals: 20,
        colonyGoods: 20,
        activeTasks: {},
        gridTiles: updatedGridTiles,
        isLowWaterPenaltyActive: false,
        isLowPowerPenaltyActive: false,
        roundResourceGenerations: [],
        previousRoundResources: {
          power: 100,
          water: 100,
          minerals: 20,
          colonyGoods: 20,
          researchPoints: state.researchPoints
        },
        resourceTrends: {
          power: 'same',
          water: 'same',
          minerals: 'same',
          colonyGoods: 'same',
          researchPoints: 'same'
        },
        domeGeneration: {
          ...state.domeGeneration,
          colonyGoodsCycle: 0,
          researchCycle: 0,
          populationCycle: 0,
          waterPositive: true,
          colonyGoodsSufficient: true
        },
        resourceTrendHistory: {
          power: [],
          water: [],
          minerals: [],
          colonyGoods: [],
          researchPoints: []
        },
        isFlowWindowVisible: false, // Reset flow window visibility
        flowPoints: 0,
        activeFlowTier: null,
      };
    });
    
    // Show a dialogue with recovery information
    get().showDialogue(
      "Emergency recovery completed. All buildings have been deconstructed and resources have been reset. The colony can now rebuild.",
      '/Derech/avatars/AiHelper.jpg'
    );
    
    console.log("Emergency reset complete - resources restored and buildings removed");
  },

  // --- Task Management Actions Implementation ---
  assignWorkforceToTask: (taskType, targetTile, workforce): AssignTaskResult => {
    const { availableWorkforce, activeTasks } = get();
    const taskConfig = getTaskConfig(taskType);

    if (!taskConfig) {
      console.error(`Task config not found for type: ${taskType}`);
      return 'config_missing';
    }

    if (workforce > availableWorkforce) {
      console.warn("Not enough available workforce.");
      return 'insufficient_workforce';
    }
    if (workforce !== taskConfig.workforceRequired) {
      console.warn(`Incorrect workforce amount specified. Required: ${taskConfig.workforceRequired}`);
      return 'insufficient_workforce';
    }

    // Check tile state *before* deducting resources
    const tileKey = `${targetTile.q},${targetTile.r}`;
    const currentTileState = get().gridTiles[tileKey];
    if (!currentTileState) {
        console.error(`Tile ${tileKey} not found in current state!`);
        return 'tile_occupied';
    }
    if (currentTileState.taskId) {
        console.warn(`Tile ${tileKey} already has an active task.`);
        return 'tile_occupied';
    }
    if (currentTileState.building) {
        console.warn(`Tile ${tileKey} already has a building: ${currentTileState.building}`);
        return 'building_present';
    }

    // Check if this task type is already deploying *anywhere*
    const isTaskTypeDeploying = Object.values(activeTasks).some(task =>
      task.type === taskType && task.status === 'deploying'
    );
    if (isTaskTypeDeploying) {
        console.warn(`Task type ${taskType} is already being deployed elsewhere.`);
        return 'task_type_deploying';
    }

    // Deduct resource costs *after* validating tile and workforce
    if (!get().deductResources(taskConfig.cost)) {
      console.warn("Not enough resources for task:", taskConfig.name);
      return 'insufficient_resources';
    }

    // Assign workforce and create task if all checks pass
    const taskId = `${taskType}-${tileKey}`;
    const newTask: TaskState = {
      id: taskId,
      type: taskType,
      targetTileKey: tileKey,
      assignedWorkforce: workforce,
      progress: 0,
      duration: taskConfig.duration,
      status: 'deploying',
    };

    set((state) => {
      // Make a copy of the gridTiles object
      const updatedGridTiles = { ...state.gridTiles };

      // Update the specific tile with the taskId using the correct key
      if (updatedGridTiles[tileKey]) {
        updatedGridTiles[tileKey] = {
          ...updatedGridTiles[tileKey],
          taskId: taskId
        };
      }

      return {
        availableWorkforce: state.availableWorkforce - workforce,
        activeTasks: { ...state.activeTasks, [taskId]: newTask },
        gridTiles: updatedGridTiles
      };
    });

    console.log(`Task ${taskId} (${taskConfig.name}) assigned to tile ${tileKey} with ${workforce} workforce.`);
    return true;
  },

  updateTaskProgress: (): boolean => {
    const { gridTiles } = get();
    const tasksCompletedMessages: Array<{ message: string; avatar?: string }> = [];
    const deconstructionCompletedMessages: Array<{ message: string; avatar?: string }> = [];

    set((state) => {
      const updatedTasks = { ...state.activeTasks };
      const taskIdsToRemove: string[] = [];
      const updatedGridTiles = { ...state.gridTiles };
      let progressMade = false;
      let workforceToReturn = 0;
      
      Object.values(updatedTasks).forEach(task => {
        if (task.status === 'deploying') {
          task.progress += 100 / task.duration;
          if (task.progress >= 100) {
            task.progress = 100;
            task.status = 'operational';
            const taskConfig = getTaskConfig(task.type);
            const tile = gridTiles[task.targetTileKey];
            const taskName = taskConfig?.name || 'Unknown Task';
            const coords = tile ? `(${tile.q}, ${tile.r})` : '(Unknown Tile)';
            
            if (tile) {
              const [q, r] = task.targetTileKey.split(',').map(Number);
              
              let buildingName = null;
              if (task.type === 'deploy-scout') buildingName = 'Scout Outpost';
              else if (task.type === 'build-solar') buildingName = 'Solar Array';
              else if (task.type === 'build-geothermal') buildingName = 'Geothermal Plant';
              else if (task.type === 'deploy-mining') buildingName = 'Mining Operation';
              else if (task.type === 'build-waterwell') buildingName = 'Water Well';
              
              if (updatedGridTiles[task.targetTileKey]) {
                updatedGridTiles[task.targetTileKey] = {
                  ...updatedGridTiles[task.targetTileKey],
                  building: buildingName
                };
              }
            }
            
            tasksCompletedMessages.push({
                message: `${taskName} completed on tile ${coords}`,
                avatar: '/Derech/avatars/AiHelper.jpg'
            });
            console.log(`Task ${task.id} deployment complete, now operational.`);
          }
          progressMade = true;
        }
        
        else if (task.status === 'deconstructing') {
          const deconstructProgress = (task.deconstructProgress || 0) + 25;
          task.deconstructProgress = deconstructProgress;
          
          if (deconstructProgress >= 100) {
            taskIdsToRemove.push(task.id);
            workforceToReturn += task.assignedWorkforce;
            
            const tile = gridTiles[task.targetTileKey];
            if (tile) {
              const coords = `(${tile.q}, ${tile.r})`;
              const buildingName = tile.building || 'Building';
              
              deconstructionCompletedMessages.push({
                message: `Deconstruction of ${buildingName} at ${coords} completed.`,
                avatar: '/Derech/avatars/AiHelper.jpg'
              });
              
              if (updatedGridTiles[task.targetTileKey]) {
                updatedGridTiles[task.targetTileKey] = {
                  ...updatedGridTiles[task.targetTileKey],
                  building: null,
                  taskId: null
                };
              }
            }
            
            console.log(`Task ${task.id} deconstruction complete, removing.`);
          }
          
          progressMade = true;
        }
      });
      
      const remainingTasks = { ...updatedTasks };
      taskIdsToRemove.forEach(id => {
        delete remainingTasks[id];
      });
      
      if (!progressMade) return {};
      
      return { 
        activeTasks: remainingTasks,
        gridTiles: updatedGridTiles,
        availableWorkforce: state.availableWorkforce + workforceToReturn
      };
    });

    if (tasksCompletedMessages.length > 0) {
      const firstCompletion = tasksCompletedMessages[0];
      get().showDialogue(
        firstCompletion.message, 
        firstCompletion.avatar,
        "Operations Officer"
      );
      return true;
    }
    
    if (tasksCompletedMessages.length === 0 && deconstructionCompletedMessages.length > 0) {
      const firstDeconstructionMessage = deconstructionCompletedMessages[0];
      get().showDialogue(
        firstDeconstructionMessage.message, 
        firstDeconstructionMessage.avatar,
        "Operations Officer"
      );
      return true;
    }
    
    return false;
  },

  generateTaskResources: () => {
    const state = get();
    const { completedResearch, completedProductionProjects } = state;
    // Check for penalties first
    const lowWaterPenalty = state.isLowWaterPenaltyActive;
    const lowPowerPenalty = state.isLowPowerPenaltyActive;

    if (lowWaterPenalty) {
      console.warn("Low Water Penalty ACTIVE: Mineral and Research Point generation may be reduced or stopped.");
    }
    if (lowPowerPenalty) {
      console.warn("Low Power Penalty ACTIVE: Mineral and Research Point generation may be reduced or stopped.");
    }

    let totalMineralsGenerated = 0;
    let totalResearchPointsGenerated = 0;
    let totalPowerGenerated = 0;
    let totalWaterGenerated = 0;
    
    // Track individual building resource generation
    const resourceGenerations: ResourceGeneration[] = [];
    
    Object.values(state.activeTasks).forEach(task => {
      if (task.status === 'operational') {
        const taskConfig = getTaskConfig(task.type);
        const tile = state.gridTiles[task.targetTileKey];
        if (taskConfig?.resourceYield && tile) {
          const resourceType = taskConfig.resourceYield.resource;
          let yieldAmount = taskConfig.resourceYield.baseAmount;
          let generateResource = true; // Flag to control generation

          // Apply penalties (Power penalty check first)
          if (lowPowerPenalty && (resourceType === 'minerals' || resourceType === 'researchPoints')) {
              console.log(`Task ${task.id} (${task.type}) generation skipped due to low POWER.`);
              generateResource = false;
          } else if (lowWaterPenalty && (resourceType === 'minerals' || resourceType === 'researchPoints')) { // Water penalty check
              console.log(`Task ${task.id} (${task.type}) generation skipped due to low WATER.`);
              generateResource = false;
          }
          // --- END Penalties ---

          // Apply project bonuses if resource generation is not skipped
          if (generateResource) {
            let bonusApplied = false; // Log helper
            // --- APPLY PROJECT EFFECTS: Resource Generation ---
            if (resourceType === 'minerals' && task.type === 'deploy-mining') {
              if (completedResearch.includes('improved-extraction')) {
                yieldAmount *= 1.25; // +25%
                bonusApplied = true;
              }
              // Apply mountain height bonus *after* research bonus
              if (tile.type === 'Mountain') {
            const heightBonus = tile.height * 0.5;
                yieldAmount *= (1 + heightBonus);
              }
            } else if (resourceType === 'water' && task.type === 'build-waterwell') {
              if (completedResearch.includes('water-reclamation-1')) {
                yieldAmount *= 1.20; // +20%
                bonusApplied = true;
              }
              if (completedProductionProjects.includes('thermal-extractors')) {
                yieldAmount *= 1.10; // +10% (multiplicative)
                bonusApplied = true;
              }
            } else if (resourceType === 'researchPoints' && task.type === 'deploy-scout') {
              if (completedResearch.includes('embodiment-prelim')) {
                yieldAmount *= 1.15; // +15%
                bonusApplied = true;
              }
            } else if (resourceType === 'power' && task.type === 'build-geothermal') {
              if (completedResearch.includes('seismic-mapping')) {
                yieldAmount *= 1.30; // +30%
                bonusApplied = true;
              }
            }
            // --- END PROJECT EFFECTS ---

            // Floor the yield *after* all bonuses
            yieldAmount = Math.floor(yieldAmount);
            if (bonusApplied) {
                console.log(`Project bonus applied to ${task.type} (${task.id}), new yield: ${yieldAmount}`);
            }

            // Add to individual generation tracking
            resourceGenerations.push({
              taskId: task.id,
              targetTileKey: task.targetTileKey,
              type: task.type,
              resourceType,
              amount: yieldAmount
            });

            // Add to totals
            if (resourceType === 'minerals') {
            totalMineralsGenerated += yieldAmount;
          } else if (resourceType === 'researchPoints') {
            totalResearchPointsGenerated += yieldAmount;
          } else if (resourceType === 'power') {
            totalPowerGenerated += yieldAmount;
          } else if (resourceType === 'water') {
            totalWaterGenerated += yieldAmount;
            }
          }
        }
      }
    });

    // Update resources based on generated amounts
    if (totalMineralsGenerated > 0) state.addMinerals(totalMineralsGenerated);
    if (totalResearchPointsGenerated > 0) set(s => ({ researchPoints: s.researchPoints + totalResearchPointsGenerated }));
    if (totalPowerGenerated > 0) state.addPower(totalPowerGenerated);
    if (totalWaterGenerated > 0) set(s => ({ water: s.water + totalWaterGenerated }));

    // Store the resource generations for visualization
      set(state => ({ 
      roundResourceGenerations: resourceGenerations
    }));

    // Consolidated log message
    if (totalMineralsGenerated > 0 || totalResearchPointsGenerated > 0 || totalPowerGenerated > 0 || totalWaterGenerated > 0) {
        console.log(`Total generated this round - Minerals: ${totalMineralsGenerated}, RP: ${totalResearchPointsGenerated}, Power: ${totalPowerGenerated}, Water: ${totalWaterGenerated}`);
    }
  },

  triggerTaskEvent: (taskId, eventType) => {
    console.log(`Event triggered for task ${taskId}: ${eventType}`);
    set((state) => {
      const updatedTasks = { ...state.activeTasks };
      if (updatedTasks[taskId]) {
        updatedTasks[taskId].status = 'event-pending';
        updatedTasks[taskId].eventDetails = { type: eventType, message: "An issue requires investigation!" };
        return { activeTasks: updatedTasks };
      }
      return {};
    });
  },

  resolveTaskEvent: (taskId, outcome) => {
    console.log(`Resolving event for task ${taskId} with outcome:`, outcome);
    set((state) => {
      const updatedTasks = { ...state.activeTasks };
      if (updatedTasks[taskId] && updatedTasks[taskId].status === 'event-pending') {
        updatedTasks[taskId].status = 'operational';
        updatedTasks[taskId].eventDetails = undefined;
        return { activeTasks: updatedTasks };
      }
      return {};
    });
  },

  recallWorkforce: (taskId) => {
    console.log(`Starting deconstruction for task ${taskId}`);
    
    const task = get().activeTasks[taskId];
    if (!task) {
      console.warn(`Task ${taskId} not found for deconstruction`);
      return;
    }
    
    set((state) => ({
      activeTasks: {
        ...state.activeTasks,
        [taskId]: {
          ...task,
          status: 'deconstructing',
          deconstructProgress: 0,
        }
      }
    }));
    
    console.log(`Task ${taskId} set to deconstructing status. Will complete in 4 rounds.`);
  },

  showDialogue: (message, avatar, speakerName, choices) => set({
    dialogueMessage: {
      isVisible: true,
      message,
      avatar,
      speakerName,
      choices
    }
  }),

  hideDialogue: () => {
    set({ dialogueMessage: null });
    console.log("Hiding Dialogue");
  },

  showResearchWindow: () => set({ isResearchWindowVisible: true }),
  hideResearchWindow: () => set({ isResearchWindowVisible: false }),

  showLivingDomeWindow: () => set({ isLivingDomeWindowVisible: true }),
  hideLivingDomeWindow: () => set({ isLivingDomeWindowVisible: false }),

  showProductionDomeWindow: () => set({ isProductionDomeWindowVisible: true }),
  hideProductionDomeWindow: () => set({ isProductionDomeWindowVisible: false }),

  showTutorialWindow: () => set({ isTutorialWindowVisible: true }),
  hideTutorialWindow: () => set({ isTutorialWindowVisible: false }),

  processDomeProjects: (dialogueAlreadyShown: boolean) => {
    let messageShown = false;
    const canShowMessage = !dialogueAlreadyShown;
    
    if (get().activeResearch) {
      const activeResearch = get().activeResearch;
      if (activeResearch) {
        const progressPerRound = 100 / activeResearch.duration;
        const newProgress = activeResearch.progress + progressPerRound;
        
        if (newProgress >= 100) {
          const completedProject = researchProjects[activeResearch.id];
          
          set(state => ({
            completedResearch: [...state.completedResearch, activeResearch.id],
            activeResearch: null
          }));
          
          if (canShowMessage) {
            get().showDialogue(
              `Research completed: ${activeResearch.name}. ${completedProject.effectDescription}`,
              '/Derech/avatars/AiHelper.jpg'
            );
            messageShown = true;
          }
          
          console.log(`Research project completed: ${activeResearch.name}`);
        } else {
          set({
            activeResearch: {
              ...activeResearch,
              progress: newProgress
            }
          });
          console.log(`Research progress: ${activeResearch.name} (${Math.floor(newProgress)}%)`);
        }
      }
    }
    
    if (get().activeLivingProject && (!messageShown || !canShowMessage)) {
      const activeLivingProject = get().activeLivingProject;
      if (activeLivingProject) {
        const progressPerRound = 100 / activeLivingProject.duration;
        const newProgress = activeLivingProject.progress + progressPerRound;
        
        if (newProgress >= 100) {
          const completedProject = livingAreaProjects[activeLivingProject.id];
          
          set(state => ({
            completedLivingProjects: [...state.completedLivingProjects, activeLivingProject.id],
            activeLivingProject: null
          }));
          
          if (canShowMessage && !messageShown) {
            get().showDialogue(
              `Living area project completed: ${activeLivingProject.name}. ${completedProject.effectDescription}`,
              '/Derech/avatars/AiHelper.jpg'
            );
            messageShown = true;
          }
          
          console.log(`Living area project completed: ${activeLivingProject.name}`);
        } else {
          set({
            activeLivingProject: {
              ...activeLivingProject,
              progress: newProgress
            }
          });
          console.log(`Living project progress: ${activeLivingProject.name} (${Math.floor(newProgress)}%)`);
        }
      }
    }
    
    if (get().activeProductionProject && (!messageShown || !canShowMessage)) {
      const activeProductionProject = get().activeProductionProject;
      if (activeProductionProject) {
        const progressPerRound = 100 / activeProductionProject.duration;
        const newProgress = activeProductionProject.progress + progressPerRound;
        
        if (newProgress >= 100) {
          const completedProject = productionProjects[activeProductionProject.id];
          
          set(state => ({
            completedProductionProjects: [...state.completedProductionProjects, activeProductionProject.id],
            activeProductionProject: null
          }));
          
          if (canShowMessage && !messageShown) {
            get().showDialogue(
              `Production project completed: ${activeProductionProject.name}. ${completedProject.effectDescription}`,
              '/Derech/avatars/AiHelper.jpg'
            );
            messageShown = true;
          }
          
          console.log(`Production project completed: ${activeProductionProject.name}`);
        } else {
          set({
            activeProductionProject: {
              ...activeProductionProject,
              progress: newProgress
            }
          });
          console.log(`Production project progress: ${activeProductionProject.name} (${Math.floor(newProgress)}%)`);
        }
      }
    }
    
    return messageShown;
  },

  clearResourceGenerations: () => set({ roundResourceGenerations: [] }),

  generateDomeResources: () => {
    const { colonyGoodsCycle, colonyGoodsBaseAmount, researchCycle, researchBaseAmount } = get().domeGeneration;
    
    let updatedColonyGoodsCycle = colonyGoodsCycle + 1;
    let updatedResearchCycle = researchCycle + 1;
    let colonyGoodsGenerated = 0;
    let researchPointsGenerated = 0;
    
    // Tracking for resource visualizations
    const resourceGenerations: ResourceGeneration[] = [];
    
    // Define resourceChanges object to track resource changes
    const resourceChanges = {
      power: 0,
      water: 0,
      minerals: 0,
      colonyGoods: 0,
      researchPoints: 0
    };
    
    // Production Dome: Generate colony goods every 5 rounds
    if (updatedColonyGoodsCycle >= 5) {
      // Start with base amount
      colonyGoodsGenerated = colonyGoodsBaseAmount;
      
      // Apply production project bonuses
      if (get().completedProductionProjects.includes('optimize-assembly')) {
        // Add 15% bonus from Optimized Assembly Line
        colonyGoodsGenerated = Math.round((colonyGoodsGenerated * 1.15) * 100) / 100;
        console.log(`Production bonus applied: ${colonyGoodsGenerated}`);
      }
      
      updatedColonyGoodsCycle = 0;
      
      // Add to resource generations for visualization
      resourceGenerations.push({
        taskId: 'production-dome',
        targetTileKey: '0,1', // Production Dome is at 0,1 (changed from 1,0)
        type: 'production-dome',
        resourceType: 'colonyGoods',
        amount: colonyGoodsGenerated
      });
      
      // Add the generated goods to the resource changes
      resourceChanges.colonyGoods += colonyGoodsGenerated;
    }
    
    // Research Dome: Generate research points every 4 rounds
    if (updatedResearchCycle >= 4) {
      researchPointsGenerated = researchBaseAmount;
      updatedResearchCycle = 0;
      
      // Add to resource generations for visualization
      resourceGenerations.push({
        taskId: 'research-dome',
        targetTileKey: '-1,0', // Research Dome is at -1,0 (unchanged)
        type: 'research-dome',
        resourceType: 'researchPoints',
        amount: researchPointsGenerated
      });
      
      // Add the generated research points to the resource changes
      resourceChanges.researchPoints += researchPointsGenerated;
    }
    
    // Update store with generated resources
    if (colonyGoodsGenerated > 0) {
      set(state => ({ colonyGoods: state.colonyGoods + colonyGoodsGenerated }));
    }
    
    if (researchPointsGenerated > 0) {
      set(state => ({ researchPoints: state.researchPoints + researchPointsGenerated }));
    }
    
    // Update dome generation cycles
    set(state => ({
      domeGeneration: {
        ...state.domeGeneration,
        colonyGoodsCycle: updatedColonyGoodsCycle,
        researchCycle: updatedResearchCycle
      },
      // Add resource generations to the existing ones
      roundResourceGenerations: resourceGenerations
    }));
  },
  
  // Check and apply population growth
  checkPopulationGrowth: () => {
    const { water, colonyGoods, population, domeGeneration } = get();
    const { populationCycle, populationGrowthThreshold } = domeGeneration;
    
    // Check if conditions are met:
    // 1. Water must be positive
    const waterPositive = water > 0;
    
    // 2. Colony goods must be at least 2x population
    const goodsThreshold = population * 2;
    const goodsSufficient = colonyGoods >= goodsThreshold;
    
    // Update condition tracking in state
    set(state => ({
      domeGeneration: {
        ...state.domeGeneration,
        waterPositive,
        colonyGoodsSufficient: goodsSufficient
      }
    }));
    
    // If either condition isn't met, reset the cycle counter
    if (!waterPositive || !goodsSufficient) {
      set(state => ({
        domeGeneration: {
          ...state.domeGeneration,
          populationCycle: 0
        }
      }));
      return false;
    }
    
    // Both conditions met, increment cycle counter
    const newCycle = populationCycle + 1;
    set(state => ({
      domeGeneration: {
        ...state.domeGeneration,
        populationCycle: newCycle
      }
    }));
    
    // Check if we've reached the threshold for population growth
    if (newCycle >= populationGrowthThreshold) {
      // Increase population by 1
      set(state => ({
        population: state.population + 1,
        domeGeneration: {
          ...state.domeGeneration,
          populationCycle: 0 // Reset counter after growth
        }
      }));
      
      // Show a message about population growth
      get().showDialogue(
        `Colony population has increased! A new colonist has been born. The colony now has ${get().population} residents.`, 
        '/Derech/avatars/ColonistAvatarFem2.jpg'
      );
      
      // Recalculate workforce - we're returning to endRound, which will do this anyway
      console.log(`Population increased to ${get().population}. Growth cycle reset.`);
      return true;
    }
    
    return false;
  },

  // --- Audio Actions ---
  toggleMute: () => set(state => ({ isMuted: !state.isMuted })),
  setVolume: (volume: number) => set(state => ({ audioVolume: volume })),

  // --- Audio Puzzle Management ---
  updateAudioPuzzleProgress: (progress: number) => set({ audioPuzzleProgress: progress }),
  markAudioPuzzleCompleted: () => {
    set({ isAudioPuzzleCompleted: true });
    console.log('Audio Puzzle marked as completed');
  },

  // Insight Management
  incrementEmbodimentInsight: () => set((state) => ({
    embodimentInsight: state.embodimentInsight + 1
  })),

  // --- NEW: Research Actions ---
  startResearch: (projectId: string) => {
    const project = researchProjects[projectId];
    if (!project) {
      console.warn(`Research project ${projectId} not found.`);
      return false;
    }
    
    if (get().activeResearch) {
      console.warn("There is already an active research project.");
      return false;
    }
    
    if (!get().deductResources(project.cost)) {
      console.warn("Not enough resources for research project:", project.name);
      return false;
    }
    
    set({
      activeResearch: {
        id: project.id,
        name: project.name,
        progress: 0,
        duration: project.duration,
        startedRound: get().currentRound,
        type: 'research'
      }
    });
    
    console.log(`Started research project: ${project.name}`);
    return true;
  },

  updateResearchProgress: () => {
    const { activeResearch, currentRound } = get();
    if (!activeResearch) return;
    
    const progressPerRound = 100 / activeResearch.duration;
    const newProgress = activeResearch.progress + progressPerRound;
    
    if (newProgress >= 100) {
      const completedProject = researchProjects[activeResearch.id];
      
      set(state => ({
        completedResearch: [...state.completedResearch, activeResearch.id],
        activeResearch: null
      }));
      
      get().showDialogue(
        `Research completed: ${activeResearch.name}. ${completedProject.effectDescription}`,
        '/Derech/avatars/AiHelper.jpg'
      );
      
      console.log(`Research project completed: ${activeResearch.name}`);
    } else {
      set({
        activeResearch: {
          ...activeResearch,
          progress: newProgress
        }
      });
    }
  },

  // --- NEW: Living Dome Actions ---
  startLivingProject: (projectId: string) => {
    const project = livingAreaProjects[projectId];
    if (!project) {
      console.warn(`Living project ${projectId} not found.`);
      return false;
    }
    
    if (get().activeLivingProject) {
      console.warn("There is already an active living area project.");
      return false;
    }
    
    if (!get().deductResources(project.cost)) {
      console.warn("Not enough resources for living area project:", project.name);
      return false;
    }
    
    set({
      activeLivingProject: {
        id: project.id,
        name: project.name,
        progress: 0,
        duration: project.duration,
        startedRound: get().currentRound,
        type: 'living'
      }
    });
    
    console.log(`Started living area project: ${project.name}`);
    return true;
  },

  updateLivingProjectProgress: () => {
    const { activeLivingProject, currentRound } = get();
    if (!activeLivingProject) return;
    
    const progressPerRound = 100 / activeLivingProject.duration;
    const newProgress = activeLivingProject.progress + progressPerRound;
    
    if (newProgress >= 100) {
      const completedProject = livingAreaProjects[activeLivingProject.id];
      
      set(state => ({
        completedLivingProjects: [...state.completedLivingProjects, activeLivingProject.id],
        activeLivingProject: null
      }));
      
      get().showDialogue(
        `Living area project completed: ${activeLivingProject.name}. ${completedProject.effectDescription}`,
        '/Derech/avatars/AiHelper.jpg'
      );
      
      console.log(`Living area project completed: ${activeLivingProject.name}`);
    } else {
      set({
        activeLivingProject: {
          ...activeLivingProject,
          progress: newProgress
        }
      });
    }
  },

  // --- NEW: Production Dome Actions ---
  startProductionProject: (projectId: string) => {
    const project = productionProjects[projectId];
    if (!project) {
      console.warn(`Production project ${projectId} not found.`);
      return false;
    }
    
    if (get().activeProductionProject) {
      console.warn("There is already an active production project.");
      return false;
    }
    
    if (!get().deductResources(project.cost)) {
      console.warn("Not enough resources for production project:", project.name);
      return false;
    }
    
    set({
      activeProductionProject: {
        id: project.id,
        name: project.name,
        progress: 0,
        duration: project.duration,
        startedRound: get().currentRound,
        type: 'production'
      }
    });
    
    console.log(`Started production project: ${project.name}`);
    return true;
  },

  updateProductionProjectProgress: () => {
    const { activeProductionProject, currentRound } = get();
    if (!activeProductionProject) return;
    
    const progressPerRound = 100 / activeProductionProject.duration;
    const newProgress = activeProductionProject.progress + progressPerRound;
    
    if (newProgress >= 100) {
      const completedProject = productionProjects[activeProductionProject.id];
      
      set(state => ({
        completedProductionProjects: [...state.completedProductionProjects, activeProductionProject.id],
        activeProductionProject: null
      }));
      
      get().showDialogue(
        `Production project completed: ${activeProductionProject.name}. ${completedProject.effectDescription}`,
        '/Derech/avatars/AiHelper.jpg'
      );
      
      console.log(`Production project completed: ${activeProductionProject.name}`);
    } else {
      set({
        activeProductionProject: {
          ...activeProductionProject,
          progress: newProgress
        }
      });
    }
  },

  // --- NEW: Flow Actions ---
  showFlowWindow: () => set({ isFlowWindowVisible: true }),
  hideFlowWindow: () => set({ isFlowWindowVisible: false }),

  // Flow Points Management
  addFlowPoints: (amount: number) => set((state) => ({ flowPoints: state.flowPoints + amount })),
  
  getConsecutivePositiveTrends: (resourceKey: keyof ResourceTrendHistory) => {
    const trends = get().resourceTrendHistory[resourceKey];
    if (!trends || trends.length === 0) return 0;
    
    let consecutiveCount = 0;
    
    // Count consecutive 'up' trends from the most recent (index 0) backwards
    for (let i = 0; i < trends.length; i++) {
      if (trends[i] === 'up') {
        consecutiveCount++;
      } else {
        break; // Break on first non-positive trend
      }
    }
    
    return consecutiveCount;
  },
  
  updateFlowTier: () => {
    const state = get();
    const resourceKeys = Object.keys(state.resourceTrendHistory) as (keyof ResourceTrendHistory)[];
    
    // Count how many resources have at least 20 consecutive positive rounds (for Master tier)
    const resourcesWith20ConsecutivePositive = resourceKeys.filter(key => 
      state.getConsecutivePositiveTrends(key) >= 20
    ).length;
    
    // Count how many resources have at least 10 consecutive positive rounds (for Strong tier)
    const resourcesWith10ConsecutivePositive = resourceKeys.filter(key => 
      state.getConsecutivePositiveTrends(key) >= 10
    ).length;
    
    // Count how many resources have at least 5 consecutive positive rounds (for Basic tier)
    const resourcesWith5ConsecutivePositive = resourceKeys.filter(key => 
      state.getConsecutivePositiveTrends(key) >= 5
    ).length;
    
    let newTier: 'basic' | 'strong' | 'master' | null = null;
    
    // Check if Master tier is active (all 5 resources for 20+ rounds)
    if (resourcesWith20ConsecutivePositive === 5) {
      newTier = 'master';
    }
    // Check if Strong tier is active (any 4 resources for 10+ rounds)
    else if (resourcesWith10ConsecutivePositive >= 4) {
      newTier = 'strong';
    }
    // Check if Basic tier is active (any 2 resources for 5+ rounds)
    else if (resourcesWith5ConsecutivePositive >= 2) {
      newTier = 'basic';
    }
    
    // Update the store with the new tier
    set({ activeFlowTier: newTier });
    
    return newTier;
  },

  // --- NEW: Resource Sidebar State ---
  isResourceSidebarOpen: false,

  // --- NEW: Resource Sidebar Actions ---
  setResourceSidebarOpen: (isOpen: boolean) => set({ isResourceSidebarOpen: isOpen }),

}));

useGameStore.getState().initializeGrid(5); 
