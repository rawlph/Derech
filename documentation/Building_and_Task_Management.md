# Building and Task Management

This document covers the lifecycle of buildings and deployable tasks in the game, from deployment to operation and potential removal.

## Building/Task Lifecycle

### 1. Deployment

Initiating the construction of a new building or task requires meeting several conditions:

*   **Valid Terrain:** The selected tile must be of a type compatible with the chosen building/task.
    *   *Development Note:* Checked in `assignWorkforceToTask` in `src/store/store.ts` against `targetTileType` defined in `src/config/tasks.ts`.
*   **Resource Costs:** The player must possess sufficient Power, Minerals, and/or Colony Goods.
    *   *Development Note:* Costs defined in `cost` within `src/config/tasks.ts`. Checked via `deductResources` in `assignWorkforceToTask` (`src/store/store.ts`).
*   **Workforce Availability:** Sufficient `availableWorkforce` must be free to meet the `workforceRequired`.
    *   *Development Note:* Checked in `assignWorkforceToTask` (`src/store/store.ts`). Requirement defined in `workforceRequired` in `src/config/tasks.ts`.
*   **Tile Availability:** The target tile must not already have an active task or building.
    *   *Development Note:* Checked in `assignWorkforceToTask` (`src/store/store.ts`) by examining `taskId` and `building` properties of the `TileData`.
*   **No Duplicate Deployment:** A task of the same *type* cannot already be in the 'deploying' status elsewhere.
    *   *Development Note:* Checked in `assignWorkforceToTask` (`src/store/store.ts`).

Upon successful initiation:
*   Resources are deducted.
*   Workforce is assigned (reducing `availableWorkforce`).
*   A new entry is added to the `activeTasks` state with 'deploying' status and 0% progress.
*   The `taskId` is associated with the target `TileData`.
*   *Development Note:* See `assignWorkforceToTask` function in `src/store/store.ts`. UI interaction is handled in `src/components/ui/ManagementUI.tsx` (`handleDeployTask`).

### 2. Construction / Deployment Progress

*   Each round, progress increases by `100 / duration` percent.
*   Visual indicators (e.g., progress bars, construction site models) might represent this phase.
    *   *Development Note:* Progress updated in `updateTaskProgress` (`src/store/store.ts`). Task duration is defined in `src/config/tasks.ts`. Visuals like progress lines are handled by `TaskProgressLines.tsx`.

### 3. Operational Status

*   Once progress reaches 100%, the task status changes to 'operational'.
*   The corresponding `building` name (e.g., 'Mining Operation') is added to the `TileData`.
*   The building begins its function (e.g., generating resources, consuming power).
*   It becomes susceptible to issues.
    *   *Development Note:* Status change and building assignment happen in `updateTaskProgress` (`src/store/store.ts`). Resource generation/consumption occurs in `endRound` based on 'operational' status. Issue checks (`checkForNewIssues`) target operational buildings.
*   Operational buildings are rendered using their specific models.
    *   *Development Note:* Models defined in `operationalModelPath` (`src/config/tasks.ts`) and potentially `modelPath` (`src/config/buildings.ts`). Rendered via `BuildingInstances.tsx` and `TaskTransportModels.tsx`.

### 4. Shutdown Status (Temporary)

*   Buildings can enter a 'shutdown' status, often as a result of resolving an issue.
*   **Effects:**
    *   Significantly reduces resource consumption (approx. 80% power saving).
    *   Halts resource generation.
    *   Workforce remains assigned.
    *   Visuals are dimmed.
*   **Restoration:** Buildings automatically return to 'operational' status at the end of the shutdown phase (currently, this means the start of the next round after the issue resolution triggered the shutdown).
    *   *Development Note:* Status managed in `activeTasks`. Power savings calculated in `endRound`. Automatic restoration logic is also in `endRound`. Dimming visuals would be handled in the rendering components (`BuildingInstances.tsx` etc.) based on task status.

### 5. Deconstruction

Players can choose to remove an operational building.

*   **Initiation:** Player selects the 'Deconstruct' action.
    *   *Development Note:* UI action likely in `ManagementUI.tsx`, calling `recallWorkforce` in `src/store/store.ts`.
*   **Process:**
    *   Task status changes to 'deconstructing'.
    *   Takes 4 rounds to complete (progress increases by 25% each round).
    *   Workforce remains assigned during deconstruction.
    *   Visuals change: Reddish tint, increasing transparency, switching to wireframe after 50%.
*   **Completion:**
    *   Building model is removed.
    *   `building` and `taskId` are removed from the `TileData`.
    *   Assigned workforce is returned to the `availableWorkforce` pool.
    *   Notification is displayed.
    *   *Development Note:* Status change and progress handled by `recallWorkforce` and `updateTaskProgress` in `src/store/store.ts`. Workforce return happens upon completion in `updateTaskProgress`. Visual changes need implementation in rendering components (`BuildingInstances.tsx`) based on 'deconstructing' status and `deconstructProgress`.

*   **Restriction:** Buildings with unresolved issues cannot be deconstructed.
    *   *Development Note:* This check needs to be implemented in the UI or `recallWorkforce` action.

## Task Types & Deployment Costs

This table summarizes the deployable tasks/buildings and their initial requirements.

| Building Type | Target Terrain | Power Cost | Minerals Cost | Colony Goods Cost | Workforce Required | Duration (Rounds) | Operational Model |
|---|---|---|---|---|---|---|---|
| Mining Operation | Mountain | 15 | 0 | 10 | 3 | 9 | `mars_workforce_mining.glb` |
| Scout Outpost | Plains, Mountain | 10 | 0 | 5 | 1 | 3 | `mars_building_scout.glb` |
| Solar Array | Plains | 0 | 20 | 5 | 2 | 6 | `mars_solar.glb` |
| Geothermal Plant | Plains | 0 | 30 | 15 | 5 | 15 | `mars_thermal.glb` |
| Water Well | Ice Deposit | 15 | 20 | 0 | 3 | 6 | `mars_waterwell.glb` |

*   *Development Note:* All data sourced from `src/config/tasks.ts`.

## Initial Colony Buildings

These buildings exist at the start of the game and are not deployed via the standard task system. They manage colony-wide projects.

| Building Name | Location (q,r) | Function | Associated UI Window |
|---|---|---|---|
| Living Dome | (0,0) | Manages Living Area Projects, influences population growth. | `LivingDomeWindow.tsx` |
| Production Dome | (1,0) | Manages Production Projects, base Colony Goods generation. | `ProductionDomeWindow.tsx` |
| Research Dome | (-1,0) | Manages Research Projects, base Research Point generation. | `ResearchWindow.tsx` |

*   *Development Note:* Initial placement in `generateInitialGrid` (`src/store/store.ts`). Config potentially in `src/config/buildings.ts`. UI interactions via `ManagementUI.tsx` triggering store actions like `showLivingDomeWindow`.