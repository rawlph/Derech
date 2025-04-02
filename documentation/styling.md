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

### 3. Mobile Device-Specific Positioning Issues

#### Problem: Window Display Inconsistencies Across Mobile Devices

We discovered critical positioning issues with modal windows (Research, Production, and Living Domes) on specific mobile devices. The modal windows were working correctly on some devices while being cut off at the top on others.

**Root Causes:**
- Viewport height (`vh`) units behaving inconsistently across browsers/devices
- Different handling of `position: fixed` elements on various mobile browsers
- Browser UI elements (address bars, navigation bars) affecting the visible viewport
- Device-specific pixel density and resolution differences affecting layout calculations
- Conflict between overflow settings in parent containers

**Affected Devices:**
- Samsung Galaxy S20 Ultra (915 × 412px): Modal windows cut off at top
- iPhone 14 Pro Max (932 × 430px): Modal windows cut off at top
- Samsung Galaxy S8+ (740 × 360px): Initially worked but needed positioning adjustment

#### Solution: Device-Specific Media Queries with Fixed Positioning Strategy

We implemented a comprehensive solution:

1. **Resolution-Based Media Queries**:
   - Created targeted breakpoints for specific device width ranges
   - Added distinct styling for small (≤740px), medium (741-800px) and large (801-950px) mobile devices

2. **Fixed Positioning Strategy**:
   - Used `position: fixed` with explicit `top` positioning that varies by device size
   - For larger devices (S20 Ultra, iPhone Pro Max): `top: 100px`
   - For medium devices: `top: 70px`
   - For smaller devices: `top: 60px`
   - Created device-specific exceptions for Galaxy S8 with a custom positioning approach

3. **Viewport Meta Tag Optimization**:
   - Added `viewport-fit=cover` and `user-scalable=0` to prevent zooming issues
   - Ensured proper meta viewport settings for notched devices

4. **Layout Overhaul for Problematic Devices**:
   - Created completely different positioning approaches for different device classes
   - For Galaxy S8: Applied a relative-positioned, top-left aligned layout
   - For larger devices: Used fixed positioning with increased top margin

Example from the CSS:
```css
/* Base mobile styles */
@media only screen and (max-width: 800px) {
    .windowContainer {
        position: fixed;
        top: 60px;
        /* Other base styles */
    }
}

/* Large mobile devices (S20 Ultra, iPhone Pro Max) */
@media only screen and (min-width: 801px) and (max-width: 950px) {
    .windowContainer {
        top: 100px;
        max-height: 75vh;
    }
}

/* Galaxy S8 specific adjustment */
@media only screen and (min-width: 730px) and (max-width: 750px) {
    .overlay {
        display: flex;
        align-items: flex-start;
        justify-content: flex-start;
        padding: 15px 0 0 15px;
    }
    
    .windowContainer {
        position: relative;
        top: auto;
        left: auto;
        transform: none;
        /* Other S8 specific styles */
    }
}
```

### 4. Inconsistent Component Styling

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

Implement a common base CSS file that can be imported or used as a reference by component-specific CSS:

```css
/* Base component styles that could be extracted */
.modalOverlay {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  box-sizing: border-box;
}

.modalWindow {
  background-color: rgba(25, 15, 10, 0.9);
  color: #e0d8d0;
  border: 1px solid rgba(217, 119, 93, 0.6);
  border-radius: 10px;
  max-width: 900px;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Then in component-specific CSS */
.overlay {
  composes: modalOverlay;
  /* Component-specific overrides */
}

.windowContainer {
  composes: modalWindow;
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

### 4. Mobile-First Approach with Device Testing

Adopt a mobile-first design approach with thorough device testing:

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

**Enhanced Device Testing Strategy:**
1. Test on various physical devices or accurate emulators
2. Group devices by resolution and create targeted breakpoints
3. Test landscape and portrait orientations
4. Create device-specific overrides when necessary
5. Document device-specific behaviors in comments

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
- Fixed positioning issues on mobile

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
   - **Important**: Test on actual physical devices when possible
   - Create a device matrix with key test cases
   - Document specific device quirks

5. **Mobile-Specific Issues To Watch For**:
   - Fixed positioning behaving differently across browsers
   - Viewport height (`vh`) calculations varying with browser UI
   - Safe area insets on notched devices
   - Touch scrolling behavior
   - Dynamic address bar resizing affecting layout

## Device Testing Matrix

| Device Category | Example Devices | Width Range | Issues to Watch For | Recommended CSS Approach |
|----------------|-----------------|-------------|---------------------|-------------------------|
| Small Mobile | iPhone SE, Galaxy S8 | <750px | Limited space, element crowding | Custom positioning, simplified UI |
| Medium Mobile | iPhone 12/13, Pixel 6 | 750-850px | Varied handling of fixed elements | Fixed position with medium offset |
| Large Mobile | S20 Ultra, iPhone Pro Max | >850px | Top content may be cut off | Large top offsets (100px+) |
| Tablets | iPad, Galaxy Tab | >950px | Excessive whitespace | Desktop-like layout with adjusted spacing |

## Conclusion

The Mars Colony Management game's UI has a consistent visual identity but requires careful attention to device-specific layout issues. The challenges with responsive layouts and component consistency can be addressed through shared styles, CSS variables, device-specific media queries, and better documentation.

By implementing these recommendations and learning from our device compatibility investigations, we can create a more maintainable and consistent styling system that works reliably across all viewport sizes, devices, and interaction states. 