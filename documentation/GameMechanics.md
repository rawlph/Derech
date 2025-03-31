# Mars Colony Management Game Mechanics Documentation

## Core Game Loop

The Mars Colony Management Game operates on a round-based system where players manage resources, assign workforce, construct buildings, respond to issues, and expand their colony on the Martian surface.

### Game Loop Overview

1. **Resource Management**
   - Monitor and allocate key resources (power, water, minerals, colony goods)
   - Balance production against consumption

2. **Building & Task Management**
   - Deploy specialized buildings (mining operations, solar arrays, etc.)
   - Assign workforce to tasks
   - Monitor operational status of facilities

3. **Issue Resolution**
   - Respond to random events and issues
   - Make strategic choices with resource tradeoffs

4. **Colony Expansion**
   - Construct new facilities to extend capabilities
   - Research technologies to unlock new options
   - Deconstruct outdated or inefficient buildings

5. **Round Advancement**
   - End current round to progress time
   - Trigger production cycles, building progress, and potential issues

## Resource System

### Resource Types

- **Power (⚡)**: Primary energy resource for operations
- **Water (💧)**: Essential life support resource
- **Minerals (⛏️)**: Raw materials used for construction
- **Colony Goods (📦)**: Manufactured products for construction and maintenance
- **Research Points (🔬)**: Used for technology advancement
- **Workforce (👷)**: Derived from population (80% of total population)

### Resource Generation & Consumption

- **Base Power Production**: +5 power units per round
- **Population Water Consumption**: 1 water unit per population per round
- **Building-Specific Generation**: Buildings generate resources based on type and location
- **Shutdown Power Savings**: Shutdown buildings save 80% of their normal power consumption

## Building & Task System

### Building Lifecycle

1. **Deployment**: Buildings require:
   - Valid terrain type
   - Resource costs
   - Assigned workforce
   - Construction duration (in rounds)

2. **Construction**: Buildings show completion percentage during deployment
   - Progress = 100 / duration per round

3. **Operational**: Once construction is complete, buildings become operational
   - Generate resources
   - Can be affected by issues

4. **Shutdown**: Buildings can be temporarily shutdown
   - Reduces resource consumption
   - Preserves workforce assignment
   - Visually appears dimmed
   - Automatically restored at the end of round

5. **Deconstruction**: Players can remove buildings through deconstruction
   - Takes 4 rounds to complete
   - Progress increases by 25% each round
   - Returns assigned workforce upon completion
   - Visual appearance changes during deconstruction (reddish tint, growing transparency)
   - After 50% completion, buildings appear in wireframe mode

### Task Types and Resource Generation

| Building Type | Resource Generated | Base Amount | Location Bonus | Rate (Rounds) |
|---------------|-------------------|------------|----------------|--------------|
| Mining Operation | Minerals | 5 | +50% per mountain height level | Every round |
| Solar Array | Power | 10 | None | Every round |
| Geothermal Plant | Power | 25 | None | Every round |
| Water Well | Water | 15 | None | Every round |
| Scout Outpost | Research Points | 2 | None | Every round |

## Issue System

### Issue Generation

- Each building type has a defined issue rate (chance of triggering an issue)
- Rates are defined in `buildingIssueRates` in the issues.ts configuration:

| Building Type | Issue Rate (Rounds) |
|---------------|---------------------|
| Mining Operation | 6 |
| Water Well | 8 |
| Scout Outpost | 2 |
| Geothermal Plant | 16 |
| Solar Array | 4 |

- Issues only generate for buildings in 'operational' status
- Only one issue can be active per building at a time
- Issue checks occur during the end of each round

### Issue Resolution

1. When an issue occurs, players receive a notification
2. Players can view the issue details in the Issue Window
3. Each issue offers multiple resolution choices, each with:
   - Potential resource costs
   - Different outcome effects
   - Possible shutdown consequences
4. After selecting a choice:
   - Resource costs are deducted
   - Outcome effects are applied
   - Building status may change (e.g., to 'shutdown')
   - The issue is marked as resolved

### Issue Examples

#### 1. Dust Storm Warning
- **Title**: Dust Storm Warning
- **Description**: A massive dust storm approaching the facility
- **Choices**:
  1. **Temporarily shut down systems**:
     - No resource cost
     - Results in facility shutdown
     - Resource effects: -5 Power, -3 Minerals
  2. **Deploy emergency dust shields**:
     - Costs: 10 Power
     - Facility remains operational
     - Resource effects: -5 Power, -1 Minerals
  3. **Apply experimental dust-repelling coating**:
     - Costs: 15 Research Points
     - Facility remains operational
     - Resource effects: +5 Research Points (from field test data)

#### 2. Solar Radiation Surge (Punishing)
- **Title**: Solar Radiation Surge
- **Description**: Massive solar flare exposing the facility to dangerous radiation
- **Choices**:
  1. **Evacuate personnel and power down sensitive systems**:
     - No resource cost
     - Results in facility shutdown
     - Resource effects: -8 Power, -5 Colony Goods
  2. **Divert power to emergency radiation shielding**:
     - Costs: 15 Power, 5 Water
     - Facility remains operational
     - Resource effects: -5 Power, -2 Colony Goods
  3. **Deploy experimental ionospheric deflector**:
     - Costs: 20 Research Points, 5 Power
     - Facility remains operational
     - Resource effects: +8 Research Points

#### 3. Phobos Power Alignment (Beneficial)
- **Title**: Phobos Power Alignment
- **Description**: Rare orbital alignment creating gravitational conditions that amplify power systems
- **Choices**:
  1. **Maintain standard operations**:
     - No resource cost
     - Modest safe benefit
     - Resource effects: +10 Power
  2. **Temporarily overclock power systems**:
     - No resource cost
     - Maximum gain with some equipment strain
     - Resource effects: +25 Power, -2 Minerals
  3. **Deploy sensors to study the phenomenon**:
     - Costs: 5 Research Points
     - Balanced approach with research benefits
     - Resource effects: +15 Power, +15 Research Points

#### 4. Ancient Martian Discovery (Beneficial)
- **Title**: Ancient Martian Discovery
- **Description**: Discovery of preserved microfossils potentially proving ancient life on Mars
- **Choices**:
  1. **Dedicate staff to study the find**:
     - No resource cost
     - Scientific approach
     - Resource effects: +20 Research Points, -2 Minerals
  2. **Announce the discovery to boost colony morale**:
     - No resource cost
     - Focus on morale and productivity
     - Resource effects: +10 Colony Goods, +5 Minerals
  3. **Catalog the site with research equipment**:
     - Costs: 10 Research Points
     - Scientific investment for major gains
     - Resource effects: +30 Research Points, +5 Colony Goods, +5 Minerals

### Issue Types

The game features two categories of issues:

1. **General Issues**: These can occur on various buildings and include both harmful (e.g., dust storms, radiation) and beneficial (e.g., Phobos alignment) events. Most are repeatable.

2. **Research-Locked Special Issues**: These are building-specific, non-repeatable events that unlock only after completing specific research projects. They typically provide significant benefits or strategic choices:

| Building Type | Required Research | Special Issue |
|--------------|-------------------|---------------|
| Scout Outpost | Enhanced Rover Optics | Ancient Structure Detected - discovery of an abandoned early expedition site |
| Mining Operation | Efficient Mining Drills | Rich Subsurface Mineral Vein - discovery of valuable mineral deposits |
| Water Well | Atmospheric Water Capture | Subterranean Ice Chamber - discovery of pristine ice deposits |

These special issues provide unique narrative moments and significant resource boosts that reward research investment and strategic building placement.

## Research and Project System

### Dome Types and Projects

The colony has three central domes, each with different specializations and project types:

1. **Research Dome:** Scientific and exploration projects
   - Uses Research Points to fund projects
   - Focuses on technology advancement and exploration capabilities
   - Projects typically improve efficiency or unlock new features

2. **Living Dome:** Living conditions and population projects
   - Uses Colony Goods, Power, and sometimes Minerals
   - Focuses on improving population capacity and quality of life
   - Projects typically improve resource consumption or workforce capabilities

3. **Production Dome:** Manufacturing and resource projects
   - Uses Minerals, Colony Goods, and Power
   - Focuses on improving production efficiency and resource extraction
   - Projects typically reduce costs or increase production yields

### Research Projects

Research projects are started at the Research Dome and primarily require Research Points. Each project has:
- Resource cost (Research Points)
- Duration (rounds to complete)
- Effect description detailing gameplay benefits

| Project Name | Cost (RP) | Duration | Effect |
|--------------|-----------|----------|--------|
| Enhanced Rover Optics | 15 | 9 | Increases Scout Outpost exploration range by 25%. Unlocks Ancient Structure detection. |
| Efficient Mining Drills | 25 | 10 | Increases mineral yield from Mining Operations by 20%. Unlocks Rich Subsurface Mineral Vein detection. |
| Atmospheric Water Capture | 30 | 11 | Increases water production from Water Wells by 15%. Unlocks Subterranean Ice Chamber detection. |
| Project Embodiment: Phase 0 | 50 | 12 | Increases Research Point generation by 10%. Lays groundwork for advanced technologies. |
| Regolith Detoxifying Bacteria | 35 | 11 | Reduces water consumption by 10%. Makes Martian soil safer for growing food. |
| Seismic Mapping Accuracy | 40 | 11 | Increases power output from Geothermal Plants by 25%. Allows precise placement for maximum efficiency. |

### Living Area Projects

Living projects are started at the Living Dome and primarily use Colony Goods and Power:

| Project Name | Cost | Duration | Effect |
|--------------|------|----------|--------|
| Atmospheric Scrubbers Mk.II | 20 Colony Goods, 5 Power | 8 | Reduces power consumption of the Living Dome by 10%. Improves overall colony health. |
| Modular Housing Unit | 35 Colony Goods, 15 Minerals | 10 | Increases colony population capacity by 5. Enables more workforce for critical tasks. |
| Communal Recreation Hub | 25 Colony Goods, 8 Power | 9 | Increases workforce efficiency by 10%. Colonists are happier and more productive. |
| Youth Hydroponic Education | 15 Colony Goods, 3 Power | 8 | Reduces food-related Colony Goods consumption by 15%. Teaches the next generation of Martian farmers. |
| Solar Radiation Interference | 18 Colony Goods, 12 Power, 8 Minerals | 9 | Reduces negative effects of solar radiation events by 30%. Keeps communication lines open during solar storms. |

### Production Dome Projects

Production projects are started at the Production Dome and primarily use Minerals and Colony Goods:

| Project Name | Cost | Duration | Effect |
|--------------|------|----------|--------|
| Optimized Assembly Line | 25 Minerals, 10 Power | 9 | Increases Colony Goods production efficiency by 15%. More output from the same materials. |
| Advanced Tool Fabrication | 40 Minerals, 15 Colony Goods | 11 | Reduces workforce requirements for all production tasks by 10%. Better tools mean fewer workers needed. |
| Production Power Rerouting | 30 Colony Goods, 5 Power | 10 | Reduces power consumption of Production Dome operations by 20%. More efficient energy distribution. |
| Modular Hydroponic Systems | 30 Minerals, 20 Colony Goods, 8 Power | 10 | Increases food production by 25%. Reduces water consumption in hydroponics by 15%. |
| Thermal Vapor Extractors | 35 Minerals, 15 Colony Goods, 10 Power | 10 | Reduces power consumption of Water Wells by 25%. Increases water extraction efficiency by 10%. |

### Project Lifecycle

1. **Initiation**: Player selects a project and pays the resource cost
2. **Progress**: Each round adds progress based on the formula: Progress = 100 / duration per round
3. **Completion**: When a project reaches 100% completion:
   - A completion message is displayed
   - The project's effects are applied to the game systems
   - The project moves to the "Completed Projects" list
   - Visual UI updates: "Start" buttons change to "Finished!" (green to blue)

### Project Interface

The research and project windows allow players to:
- View active project progress with progress bars
- See available projects with costs and effect descriptions
- Browse completed projects to remember their effects
- Start new projects if sufficient resources are available

## Building Deployment Costs

### Task Deployment Costs

| Building Type | Power Cost | Minerals Cost | Colony Goods Cost | Workforce Required | Duration (Rounds) |
|---------------|------------|--------------|-------------------|-------------------|-------------------|
| Mining Operation | 20 | 0 | 10 | 3 | 2 |
| Scout Outpost | 10 | 0 | 5 | 1 | 1 |
| Solar Array | 0 | 15 | 5 | 2 | 3 |
| Geothermal Plant | 0 | 25 | 10 | 5 | 4 |
| Water Well | 15 | 20 | 0 | 3 | 3 |

## Deconstruction Mechanics

### Process Overview

1. **Initiation**: Player selects "Deconstruct" option for an operational building
2. **Status Change**: Building enters 'deconstructing' status with 0% progress
3. **Visual Transformation**:
   - Building turns reddish color
   - Gradually becomes more transparent as deconstruction progresses
   - At 50% deconstruction, building switches to wireframe rendering
4. **Progress**: Each round adds 25% to deconstruction progress (4 rounds total)
5. **Completion**: When progress reaches 100%:
   - Building is removed
   - Tile is cleared
   - Workforce is returned to the available pool
   - Notification is displayed

### Deconstruction Visual States

| Progress | Appearance |
|----------|------------|
| 0-25% | Slightly reddish tint, minor transparency |
| 26-50% | Redder color, 30-50% transparency |
| 51-75% | Red wireframe, 50-70% transparency |
| 76-99% | Red wireframe, 70-90% transparency |
| 100% | Removed |

### Restrictions

- Buildings with unresolved issues cannot be deconstructed until the issue is resolved
- Deconstruction cannot be cancelled once started

## Rendering and Visual System

Buildings and tasks use different rendering systems depending on their status:

### Status-Based Rendering

| Status | Visual Appearance |
|--------|-------------------|
| Deploying | Normal model with progress indicator |
| Operational | Normal model |
| Shutdown | Dimmed model (darker by 50%) |
| Deconstructing | Reddish model with increasing transparency and wireframe |

## Round Cycle Processing

When the player ends a round, the following processes execute in sequence:

1. Task progress updates (construction advancement)
2. Resource generation from operational facilities
3. Base resource consumption and production
4. Building issue generation based on building-specific rates
5. Research and project progress updates
6. Restoration of shutdown facilities to operational status
7. Resource balance updates
8. Workforce recalculation
9. Round counter increment

## Development Notes

- The event system framework exists but is currently disabled (chance set to 0)
- The game tracks both 'building' types (permanent structures) and 'task' operations (deployable activities)
- Issue rates are configurable on a per-building-type basis in issues.ts
- Building resource generation and costs are defined in tasks.ts
- Research and project effects are defined in their respective configuration files 