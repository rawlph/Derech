# Issues and Projects

This document describes the system for random events (Issues) affecting buildings and the long-term projects managed by the central colony domes.

## Issue System

Issues represent unexpected events, both beneficial and harmful, that can occur at operational buildings.

### Issue Generation

*   **Trigger:** Issues can potentially generate for any building in the 'operational' status at the end of each round.
*   **Rate:** Each building type has a base rate determining how frequently issues might occur (lower number = more frequent).
    *   *Development Note:* Rates defined in `buildingIssueRates` within `src/config/issues.ts`. Check occurs in `checkForNewIssues` in `src/store/store.ts`.

    | Building Type | Base Issue Rate (Rounds) |
    |---|---|
    | Mining Operation | 24 |
    | Water Well | 32 |
    | Scout Outpost | 8 |
    | Geothermal Plant | 64 |
    | Solar Array | 16 |

*   **Conditions:**
    *   Only one issue can be active per building at a time.
    *   An issue won't generate if the rounds since the last issue for that specific building are less than its defined rate.
    *   Some issues require specific research to be completed before they can appear.
    *   *Development Note:* Logic handled in `checkForNewIssues` (`src/store/store.ts`), checking `lastIssueRounds` state and `requiresResearch` property in `src/config/issues.ts`.

### Issue Resolution Process

1.  **Notification:** When an issue occurs, a dialogue message alerts the player.
A visual indicator appears on the affected tile/building.
    *   *Development Note:* Dialogue triggered in `checkForNewIssues`. Visual indicators rendered by `HexTileInstances.tsx` based on `buildingIssues` state.
2.  **Investigation:** The player selects the affected tile and can click an "Issues" or similar button in the `ManagementUI` to open the `IssueWindow`.
    *   *Development Note:* UI flow in `ManagementUI.tsx`, triggering `showIssueWindow` in `src/store/store.ts`.
3.  **Decision:** The `IssueWindow` displays the issue's title, description, image (if available), and resolution choices.
    *   Each choice shows its text, potential resource costs, and implies an outcome.
    *   Choices requiring unaffordable resources are disabled.
    *   *Development Note:* UI Component: `src/components/ui/IssueWindow.tsx`. Fetches issue details via `getCurrentIssue` (`src/store/store.ts`). Resource check via `canAffordChoice`.
4.  **Confirmation:** The player selects a choice. An outcome description is shown, and the player confirms.
5.  **Execution:**
    *   Resource costs (if any) are deducted.
    *   Outcome effects (resource changes) are applied.
    *   The building's status might change (e.g., to 'shutdown' if the choice dictates).
    *   The issue instance is marked as 'resolved' in the `buildingIssues` state.
    *   The `IssueWindow` closes.
    *   *Development Note:* Logic handled by `resolveIssue` function in `src/store/store.ts`.

### Issue Examples (Summarized)

*   *Development Note:* Full definitions in `src/config/issues.ts`.

| Issue ID | Title | Type | Description | Key Choices & Outcomes |
|---|---|---|---|---|
| `duststorm-basic` | Dust Storm Warning | General (Harmful) | Approaching dust storm threatens equipment. | Shutdown (lose P, M), Shield (cost P, M; lose less P, M), Nanocoat (cost P, M; gain RP, M) |
| `radiation-surge` | Solar Radiation Surge | General (Harmful) | Solar flare poses radiation risk. | Shutdown (lose P, Goods; gain small RP), Shield (cost P, W, Goods; lose less P, Goods; gain M), Deflector (cost P, Goods, M; gain large RP, P, Goods) |
| `phobos-alignment` | Phobos Power Alignment | General (Beneficial) | Orbital alignment boosts power systems. | Standard Ops (+P, Goods), Overclock (+Large P, -M, +small RP), Study (cost RP, P; +Good P, +Large RP, +Goods) |
| `martian-discovery` | Ancient Martian Discovery | General (Beneficial, Unique) | Microfossils discovered. | Study (+RP, -M, +Goods), Announce (+Large Goods, +M, +W), Catalog (cost P, Goods, RP; +Huge RP, +Goods, +M, +P) |
| `ancient-structure-discovered` | Ancient Structure Detected | Research-Locked (Scout) | Artificial structure found via enhanced optics. | Expedition (cost P, W, Goods; gain M, RP, Goods), Remote Survey (cost P, Goods, M; gain Large RP, M, P), Mark Coords (+small RP, +Goods) |
| `subsurface-mineral-vein` | Rich Subsurface Mineral Vein | Research-Locked (Mining) | Concentrated rare minerals detected via advanced drills. | Excavate (cost P, Goods, M; gain Huge M, -P, +small RP), Targeted Drill (cost P, Goods, M; gain Large M, +RP, +W), Research Protocol (cost P, Goods, RP; gain V.Large M, +Large RP, +Goods, +P) |
| `subterranean-ice-chamber` | Subterranean Ice Chamber | Research-Locked (Water) | Pristine ice deposit found via atmospheric capture tech. | Preserve (cost P, Goods, RP; gain W, Large RP, Goods), Celebrate (cost P, Goods; gain Large W, Large Goods, M), Hydroponics (cost Goods, P, M; gain Good W, V.Large Goods, +RP, +P) |

## Research and Project System

Long-term colony improvements are managed through projects initiated at the three central domes.

### Project Types

1.  **Research Projects (Research Dome):** Focus on technological advancements, unlocking new capabilities, buildings, or improving efficiency. Primarily cost Research Points.
    *   *Development Note:* Config: `src/config/research.ts`. UI: `src/components/ui/ResearchWindow.tsx`. State: `activeResearch`, `completedResearch`.
2.  **Living Area Projects (Living Dome):** Improve colony quality of life, population capacity, morale, or resilience. Primarily cost Colony Goods and Power.
    *   *Development Note:* Config: `src/config/livingAreaProjects.ts`. UI: `src/components/ui/LivingDomeWindow.tsx`. State: `activeLivingProject`, `completedLivingProjects`.
3.  **Production Projects (Production Dome):** Enhance manufacturing efficiency, resource production, or create specialized equipment. Primarily cost Minerals, Colony Goods, and Power.
    *   *Development Note:* Config: `src/config/productionProjects.ts`. UI: `src/components/ui/ProductionDomeWindow.tsx`. State: `activeProductionProject`, `completedProductionProjects`.

### Project Lifecycle

1.  **Initiation:** Player selects an available project in the relevant dome window and pays the resource cost.
    *   Only one project per dome type can be active at a time.
    *   *Development Note:* UI actions trigger `startResearch`, `startLivingProject`, or `startProductionProject` in `src/store/store.ts`.
2.  **Progress:** Each round, the active project's progress increases by `100 / duration` percent.
    *   Progress is displayed via a progress bar in the respective dome window.
    *   *Development Note:* Progress updated by `processDomeProjects` in `src/store/store.ts`.
3.  **Completion:** When progress reaches 100%:
    *   The project's effects are applied permanently (e.g., resource generation bonuses, unlocking features).
    *   A completion message is displayed.
    *   The project ID is moved to the corresponding `completed...` list in the store state.
    *   The project is removed from the available list and shown in the completed section of the UI.
    *   *Development Note:* Completion logic within `processDomeProjects` (`src/store/store.ts`). Effect logic may reside in `endRound` or other relevant parts of the store, checking the `completed...` lists.

### Project Summaries

*   *Development Note:* Data below summarized from respective config files (`research.ts`, `livingAreaProjects.ts`, `productionProjects.ts`).

#### Research Projects

| Project Name | Cost (RP) | Duration | Effect |
|---|---|---|---|
| Enhanced Rover Optics | 20 | 7 | +25% Scout range, Unlocks Ancient Structure issue |
| Efficient Mining Drills | 30 | 8 | +25% Mineral yield, Unlocks Rich Vein issue |
| Atmospheric Water Capture | 35 | 9 | +20% Water yield, Unlocks Ice Chamber issue |
| Project Embodiment: Phase 0 | 60 | 10 | +15% Research Point generation |
| Regolith Detoxifying Bacteria | 40 | 8 | -15% Water consumption, Safer soil |
| Seismic Mapping Accuracy | 45 | 9 | +30% Geothermal Plant power output |

#### Living Area Projects

| Project Name | Cost | Duration | Effect |
|---|---|---|---|
| Atmospheric Scrubbers Mk.II | 20 G, 5 P | 8 | -10% Living Dome power use, Health boost |
| Modular Housing Unit | 35 G, 15 M | 10 | +5 Population capacity |
| Communal Recreation Hub | 25 G, 8 P | 9 | +10% Workforce efficiency |
| Youth Hydroponic Education | 15 G, 3 P | 8 | -15% Food Goods consumption |
| Solar Radiation Interference | 18 G, 12 P, 8 M | 9 | -30% Solar radiation event negative effects |

#### Production Projects

| Project Name | Cost | Duration | Effect |
|---|---|---|---|
| Optimized Assembly Line | 25 M, 10 P | 9 | +15% Colony Goods production efficiency |
| Advanced Tool Fabrication | 40 M, 15 G | 11 | -10% Workforce needed for production tasks |
| Production Power Rerouting | 30 G, 5 P | 10 | -20% Production Dome power consumption |
| Modular Hydroponic Systems | 30 M, 20 G, 8 P | 10 | +25% Food production, -15% Hydroponics water use |
| Thermal Vapor Extractors | 35 M, 15 G, 10 P | 10 | -25% Water Well power use, +10% Water extraction efficiency |