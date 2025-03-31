Purpose: Oversee the Hex Grid Mars colony's development round-by-round.
Core Mechanics (Initial Version):
Resources: Define 4-5 basic resources (e.g., Power, Water, Population, ResearchPoints, Colony Goods). Store values in Zustand state.
Balance: Basic production/consumption per round (e.g., Population consumes Water, Power Plants produce Power, Colony goods produce satisfaction and morale, exploring a hex tile costs workforce). Update resources at the end of each round.
Progression: Explore hex grid and expand colony in breadth and depth. (Reach X colony size, reach Y Tech)
Quest/Event System: A simple array of possible events/quests in Zustand state. An event can be triggered (randomly or based on conditions) that sets the active quest/puzzle and transitions the game state.
Actions: Button to "End Round". Button(s) to trigger specific actions (e.g., "Allocate Workforce", "Start Research Project" - these might trigger events/puzzles).
UI:
Use React components.
Display current resource counts.
Display current round number.
Display colony goal/status (explore & research/health).
Button to end the round.
An area to display current events/alerts (e.g., "Power Shortage Detected! Investigate?"). This alert could trigger the transition to the Puzzle Area.
Visualization: Simple 2D UI. No complex 3D needed here initially. Hex Grid for Colony and Mars Exploration. 