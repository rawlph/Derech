# Game Loop and Resources

This document outlines the core game loop and the management of resources within the colony.

## Game Loop Overview

The game progresses in rounds. When the player initiates the "End Round" action, the following sequence of events occurs:

1.  **Resource Consumption Calculation:** Determines total power and water consumed by the population and operational buildings.
    *   *Development Note:* Consumption logic is handled within the `endRound` function in `src/store/store.ts`. Population consumption is `population * 1` water (modified by research). Building power consumption is defined in `src/config/tasks.ts` (`powerConsumption`).
2.  **Resource Generation Calculation:** Calculates resources produced by operational buildings and base colony functions. Penalties for low power/water are applied here, potentially reducing or stopping mineral/research generation.
    *   *Development Note:* Generation logic is part of `endRound` in `src/store/store.ts`. Base yields are defined in `src/config/tasks.ts` (`resourceYield`). Dome generation (Colony Goods, Research Points) is handled by `generateDomeResources` and tracked in `domeGeneration` state within `src/store/store.ts`.
3.  **Task Progress Update:** Advances the progress of buildings currently under construction ('deploying') or deconstruction. Checks for completion.
    *   *Development Note:* Managed by `updateTaskProgress` in `src/store/store.ts`. Duration is defined in `src/config/tasks.ts`.
4.  **Dome Project Progress Update:** Advances progress for active Research, Living Area, and Production projects. Checks for completion.
    *   *Development Note:* Managed by `processDomeProjects` in `src/store/store.ts`, calling specific update functions like `updateResearchProgress`. Project configurations are in `src/config/research.ts`, `src/config/livingAreaProjects.ts`, and `src/config/productionProjects.ts`.
5.  **Issue Check:** Determines if new issues arise for operational buildings based on defined rates.
    *   *Development Note:* Handled by `checkForNewIssues` in `src/store/store.ts`. Rates are defined in `buildingIssueRates` within `src/config/issues.ts`.
6.  **Facility Restoration:** Automatically brings buildings from 'shutdown' status back to 'operational'.
    *   *Development Note:* Logic within `endRound` in `src/store/store.ts`.
7.  **Population Growth Check:** Determines if conditions (positive water, sufficient colony goods) have been met for the required duration to increase population.
    *   *Development Note:* Handled by `checkPopulationGrowth` in `src/store/store.ts`. Threshold is defined in `domeGeneration` state.
8.  **Resource Balance Update:** Applies all calculated resource changes (generation and consumption) to the main resource pools. Calculates resource trends.
    *   *Development Note:* Final resource update occurs near the end of `endRound` in `src/store/store.ts`. Trends are stored in `resourceTrends`.
9.  **Workforce Recalculation:** Updates `totalWorkforce` based on population and `availableWorkforce` based on assignments.
    *   *Development Note:* Calculated within `endRound` in `src/store/store.ts`.
10. **Round Advancement:** Increments the `currentRound` counter.
11. **Visual Feedback:** Displays floating numbers for generated resources.
    *   *Development Note:* Handled by the `FloatingResourceNumbers` component (`src/components/management/FloatingResourceNumbers.tsx`) triggered by `roundResourceGenerations` state, and `RoundTransition` component (`src/components/management/RoundTransition.tsx`).

## Colony Resources

| Resource | Symbol | Description | State Variable (`store.ts`) |
|---|---|---|---|
| Power | ⚡ | Energy required for most buildings and projects. Shortages impact production and research. | `power` |
| Water | 💧 | Essential for population survival and some projects. Shortages impact production, research and population growth. | `water` |
| Minerals | ⛏️ | Raw materials used for construction and production projects. | `minerals` |
| Colony Goods | 📦 | Processed goods used for advanced projects, population needs, and some issue resolutions. | `colonyGoods` |
| Research Points | 🔬 | Used to unlock new technologies and projects via the Research Dome. | `researchPoints` |
| Population | 🧑‍🤝‍🧑 | Number of colonists. Determines workforce and base water consumption. Grows slowly under good conditions. | `population` |
| Workforce | 👷 | The portion of the population available for tasks (`totalWorkforce = population * 0.8`). Divided into `availableWorkforce` and assigned workforce. | `totalWorkforce`, `availableWorkforce` |

## Resource Generation and Consumption

### Generation

*   **Base Production:**
    *   Power: +5 per round (Implicit base generation).
    *   Colony Goods: +3 every 5 rounds (Production Dome cycle).
    *   Research Points: +1 every 4 rounds (Research Dome cycle).
    *   *Development Note:* Dome cycle logic is in `generateDomeResources` in `src/store/store.ts`. Base power is added directly in `endRound`.
*   **Building-Specific Generation (Operational Status):**
    *   *Development Note:* Yields defined in `resourceYield` within `src/config/tasks.ts`. Applied during `endRound` in `src/store/store.ts`. Bonuses from research/projects are applied here.

    | Building Type | Resource Generated | Base Amount | Location Bonus | Rate | Affected By Projects |
    |---|---|---|---|---|---|
    | Mining Operation | Minerals | 8 | +50% per mountain height level | Every round | `improved-extraction` (+25%) |
    | Solar Array | Power | 15 | None | Every round | - |
    | Geothermal Plant | Power | 30 | None | Every round | `seismic-mapping` (+30%) |
    | Water Well | Water | 12 | None | Every round | `water-reclamation-1` (+20%), `thermal-extractors` (+10% yield, -25% power cost) |
    | Scout Outpost | Research Points | 4 | None | Every round | `embodiment-prelim` (+15%) |

*   **Issue Outcomes:** Some issue resolution choices provide resource bonuses.
    *   *Development Note:* Defined in `outcomes.effects` for each choice in `src/config/issues.ts`. Applied during `resolveIssue` in `src/store/store.ts`.

### Consumption

*   **Population:**
    *   Water: 1 per colonist per round.
    *   *Development Note:* Calculated in `endRound`. Reduced by `detoxifying-bacteria` research (-15%).
*   **Building Operations (Operational Status):**
    *   Power is consumed by most operational buildings.
    *   *Development Note:* Defined by `powerConsumption` in `src/config/tasks.ts`. Applied during `endRound`. Reduced by `thermal-extractors` for Water Wells (-25%).
*   **Task Deployment:** Starting a new task/building construction requires an initial resource cost.
    *   *Development Note:* Defined by `cost` in `src/config/tasks.ts`. Deducted by `assignWorkforceToTask` calling `deductResources` in `src/store/store.ts`.
*   **Project Initiation:** Starting Research, Living, or Production projects requires resource costs.
    *   *Development Note:* Defined in `cost` within `src/config/research.ts`, `src/config/livingAreaProjects.ts`, `src/config/productionProjects.ts`. Deducted by `startResearch`, `startLivingProject`, `startProductionProject` calling `deductResources` in `src/store/store.ts`.
*   **Issue Resolution:** Some issue choices require resource costs.
    *   *Development Note:* Defined in `cost` for each choice in `src/config/issues.ts`. Deducted by `resolveIssue` calling `deductResources` in `src/store/store.ts`.
*   **Shutdown Power Savings:** Buildings in 'shutdown' status consume significantly less power (approx. 80% reduction of their normal operational cost).
    *   *Development Note:* Calculated within `endRound` in `src/store/store.ts`.

### Penalties

*   **Low Power (`power < 0`):** Prevents generation of Minerals and Research Points from buildings. Triggers a warning dialogue.
    *   *Development Note:* Checked in `endRound`. Flag: `isLowPowerPenaltyActive`.
*   **Low Water (`water < 0`):** Prevents generation of Minerals and Research Points from buildings. Halts population growth cycle. Triggers a warning dialogue.
    *   *Development Note:* Checked in `endRound` and `checkPopulationGrowth`. Flag: `isLowWaterPenaltyActive`.
