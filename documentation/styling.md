# Styling Guide & Best Practices

This document outlines the styling approach used in the Mars Colony Management game, common challenges encountered, and recommendations for maintaining a consistent and robust styling system.

## Current CSS Architecture

### CSS Modules Approach

The project uses CSS Modules (files with `.module.css` extension) to create component-scoped styles. This provides several benefits:

- **Style Encapsulation**: Styles are scoped to specific components, preventing global namespace collisions
- **Maintainability**: Component styles are co-located with their respective components
- **Readability**: Class names in markup directly correspond to the styles defined in the associated CSS module

### Component-Specific Styling

Each UI component has its own CSS module file in the `src/styles/` directory. For example:
- `ResearchWindow.module.css`
- `ProductionDomeWindow.module.css`
- `LivingDomeWindow.module.css`

## Common Challenges & Solutions

### 1. Responsive Design Issues

#### Problem: Multi-Column Layout on Mobile

We encountered an issue where project items in the Research, Production, and Living windows would display in multiple columns on mobile, especially after a project was started. This created a cramped and hard-to-read interface.

**Root Causes:**
- Flexbox layouts not properly adjusted for mobile
- Inconsistent container sizing
- Lack of explicit width calculations
- CSS inheritance issues causing unexpected layouts

#### Solution: Force Block-Level Display with Explicit Widths

We resolved the issue by making these key changes:
- Changed flex containers to block display on mobile
- Used explicit width calculations with `width: 100%` and `max-width: 100%`
- Applied `box-sizing: border-box` consistently
- Reduced side padding to maximize usable width
- Added proper parent-child container relationships

### 2. Layout Width Distribution

#### Problem: Content Not Using Available Space

Project items weren't expanding to fill available width, causing uneven layout and wasted space, particularly with the "Start Research/Project" buttons.

**Root Causes:**
- Improper flex item sizing (`flex-grow`, `flex-basis`, etc.)
- Inconsistent margin/padding between containers
- Multiple nested containers affecting width calculations

#### Solution: Explicit Flex Basis and Container Sizing

We fixed this by:
- Setting `.projectDetails` to `flex-basis: 75%` with a matching width
- Configuring button containers with `flex: 0 0 auto` to prevent unwanted growth
- Using `white-space: nowrap` on buttons to prevent text wrapping
- Reducing container horizontal padding
- Modifying active project sections to use calculated widths

### 3. Inconsistent Component Styling

We encountered similar styling issues across multiple components (Research, Production, Living windows) due to code duplication and lack of shared styles.

## Recommendations for Improvement

### 1. Create a Common Component Library

Implement a shared component library with standardized UI elements:

```typescript
// Example: SharedProjectItem.tsx
const SharedProjectItem = ({ 
  title, 
  description, 
  cost, 
  effect, 
  prerequisites, 
  onStart, 
  disabled 
}) => (
  <li className={styles.projectItem}>
    <div className={styles.projectContent}>
      <div className={styles.projectDetails}>
        <h3 className={styles.projectName}>{title}</h3>
        <p className={styles.projectDescription}>{description}</p>
        {/* Other content */}
      </div>
      <div className={styles.buttonContainer}>
        <button 
          className={styles.startButton} 
          onClick={onStart}
          disabled={disabled}
        >
          Start Project
        </button>
      </div>
    </div>
  </li>
);
```

### 2. Create Shared Base Styles

Implement a common base CSS file that can be imported by component-specific CSS:

```css
/* shared/projectStyles.css */
.projectItem {
  /* Common project item styles */
}

.projectDetails {
  /* Common project details styles */
}

/* Component-specific CSS */
@import '../shared/projectStyles.css';

.specialOverride {
  /* Component-specific overrides */
}
```

### 3. Use CSS Custom Properties (Variables)

Adopt CSS variables for consistent values across components:

```css
:root {
  --project-item-bg: rgba(40, 20, 15, 0.6);
  --project-item-border: rgba(217, 119, 93, 0.3);
  --accent-color: #FFA500;
  --button-primary: #4A7B4A;
  --button-hover: #5A8C5A;
  --button-disabled: #555;
}

.projectItem {
  background-color: var(--project-item-bg);
  border: 1px solid var(--project-item-border);
}
```

### 4. Mobile-First Approach

Adopt a mobile-first design approach:

```css
/* Base styles for mobile */
.projectItem {
  display: block;
  width: 100%;
  box-sizing: border-box;
}

/* Then enhance for larger screens */
@media (min-width: 768px) {
  .projectItem {
    display: flex;
    align-items: flex-start;
  }
}
```

### 5. Consistent Box Model

Ensure consistent box model usage by adding a global rule:

```css
* {
  box-sizing: border-box;
}
```

### 6. Styling Audit and Documentation

Regularly audit component styling for:
- Duplicate styles across components
- Inconsistent padding/margin patterns
- Flex layout issues
- Mobile compatibility
- Width calculations and overflow

Document common patterns and component usage in a style guide.

## Debugging CSS Issues

When troubleshooting layout issues:

1. **Inspect the DOM Structure**: 
   - Use browser developer tools to understand the actual element hierarchy
   - Check computed styles to see what rules are being applied/overridden

2. **Test with Temporary Debug Styles**:
   ```css
   .problematicElement {
     border: 2px solid red !important; /* Visualize boundaries */
     background-color: rgba(255, 0, 0, 0.2) !important;
   }
   ```

3. **Check Width Calculations**:
   - Verify `box-sizing` is applied correctly
   - Check for explicit width/height values that might conflict
   - Look for parent containers that might be limiting width

4. **Test Responsive Behavior**:
   - Test at multiple breakpoints
   - Use browser devtools to simulate different devices
   - Test actual project scenarios (e.g., active projects)

## Conclusion

The Mars Colony Management game's UI has a consistent visual identity but would benefit from more systematic CSS architecture. The challenges with responsive layouts and component consistency can be addressed through shared styles, CSS variables, and better documentation.

By implementing these recommendations, we can create a more maintainable and consistent styling system that works across all viewport sizes and interaction states. 