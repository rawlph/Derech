# Issues System Removal Plan

This document outlines how to remove the Issues system from the game completely.

## Component Analysis

The issues system consists of:

### 1. Core Files to Remove
- `src/components/ui/IssueWindow.tsx` ✅ (Already deleted)
- `src/config/issues.ts` ✅ (Already deleted)
- `src/styles/IssueWindow.module.css` ✅ (Already deleted)

### 2. Store Modifications Required
1. Remove issues-related imports at the top of `src/store/store.ts`:
   ```typescript
   import { buildingIssueRates, getIssueById, getRandomIssueForBuilding, Issue, IssueChoice, issues } from '@config/issues';
   ```

2. Remove issues-related interfaces from `src/store/store.ts`:
   ```typescript
   export interface BuildingIssueState {
     id: string;
     issueId: string;
     buildingId: string;
     tileKey: string;
     resolved: boolean;
   }
   ```

3. Remove these issue-related state properties from `GameState` interface:
   ```typescript
   buildingIssues: Record<string, BuildingIssueState>;
   activeIssueId: string | null;
   lastIssueRounds: Record<string, number>;
   isIssueWindowVisible: boolean;
   ```

4. Remove these issue-related actions from `GameState` interface:
   ```typescript
   showIssueWindow: (issueId: string) => void;
   hideIssueWindow: () => void;
   resolveIssue: (issueId: string, choiceId: string) => void;
   checkForNewIssues: () => void;
   getCurrentIssue: () => Issue | null;
   ```

5. Remove initial state declarations in the store:
   ```typescript
   buildingIssues: {},
   activeIssueId: null,
   lastIssueRounds: {},
   isIssueWindowVisible: false,
   ```

6. Remove these issue-related method implementations:
   - `checkForNewIssues()`
   - `showIssueWindow()`
   - `hideIssueWindow()`
   - `resolveIssue()`
   - `getCurrentIssue()`

7. Modify the `endRound()` function to remove this line:
   ```typescript
   get().checkForNewIssues();
   ```

### 3. Other Component Modifications

1. App.tsx
   - Remove import of IssueWindow
   - Remove issue-related hooks (isIssueWindowVisible, hideIssueWindow, resolveIssue, getCurrentIssue, activeIssueId)
   - Remove handleIssueResolution function
   - Remove the IssueWindow component render

2. ManagementUI.tsx
   - Remove issue-related imports/hooks from buildingIssues and showIssueWindow
   - Remove handleShowIssue function
   - Remove the Issue button from the UI (it's inside a conditional that checks for unresolved issues)

3. HexTileInstances.tsx
   - Modify the statusIndicators generation to remove 'issue' as a type
   - Remove logic that checks for issues using buildingIssues

4. hexUtils.ts
   - Modify the StatusIndicatorInfo interface to remove 'issue' from the type
   - Update getStatusIndicatorPosition and getStatusIndicatorMaterial to remove 'issue' handling

### 4. Documentation
- Remove documentation/Issues_and_Projects.md or update it to remove Issues-related content

## Implementation Order

1. ✅ Delete the core files: IssueWindow.tsx, issues.ts, and IssueWindow.module.css
2. Update App.tsx to remove IssueWindow component and related hooks/functions
3. Update ManagementUI.tsx to remove issues button and handleShowIssue function
4. Update HexTileInstances.tsx to remove issue indicators
5. Update hexUtils.ts to remove issue-related utilities
6. Update store.ts to remove all issue-related code
7. Update documentation

For future maintenance: If any code doesn't compile after these removals, search for additional references to "issue" or "issues" within the codebase and update accordingly. 