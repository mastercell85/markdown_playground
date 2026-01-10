# CSS Zen Garden - Steel Animation (Responsive & Modular)

## Overview

This is a responsive and modular version of the "Steel" CSS Zen Garden design by Steffen Knoeller. The design has been refactored to:

1. **Work at any screen size** from 800px and up (originally only worked at 1367px+)
2. **Use a modular panel system** where each animated window is standalone and easy to duplicate

## Quick Start

Open `index.html` in a browser. The animation will work at any viewport width 800px or larger, with proportional scaling at smaller sizes.

## Project Structure

### Core Files

```
index.html                    # Main HTML file

219.css                       # Main CSS import file
219-keyframes.css             # Animation keyframes
219-base.css                  # Base typography and styles
219-1367.css                  # Original animation styles (imported as base)

219-400.css                   # Mobile styles (400-799px)
219-800-compat.css            # Compatibility layer for 800px+
219-1367-scaled.css           # Responsive scaling + modular panel imports
219-1600.css                  # Large screen enhancements (1600px+)
219-bg.css                    # Background images

219-custom-hide.css           # Rules to hide unwanted elements
```

### Modular Panel System

```
219-panel-base.css            # Shared base styles and CSS variables
219-panel-header.css          # Header panel (CSS ZEN GARDEN title)
219-panel-preamble.css        # Preamble panel (The Road to Enlightenment)
219-panel-summary.css         # Summary panel (download links)
219-panel-benefits.css        # Benefits panel (right-side article)
```

### Assets

```
bg1.svg, bg2.svg              # Background graphics
hook1.svg, hook2.svg, hook3.svg  # Panel hooks
layer.svg                     # Panel layer graphic
layer-frame.svg               # Panel frame graphic
layer-middle.svg              # Panel middle graphic
footer.svg                    # Footer icons
```

## How It Works

### Import Chain

The main `219.css` file imports stylesheets conditionally based on viewport width:

```css
/* Base styles and animations */
@import url("219-keyframes.css");
@import url("219-base.css");

/* Mobile styles (400-799px) */
@import url("219-400.css") all and (min-width: 400px) and (max-width: 799px);

/* Desktop animation (800px+) */
@import url("219-800-compat.css") all and (min-width: 800px);
@import url("219-1367-scaled.css") all and (min-width: 800px);
@import url("219-1600.css") all and (min-width: 1600px);
@import url("219-bg.css") all and (min-width: 400px);

/* Content hiding (loads last) */
@import url("219-custom-hide.css");
```

### Responsive Scaling

The animation uses **proportional scaling** at different breakpoints:

- **1367px+**: Original design at 100% scale
- **1024-1366px**: Scaled to 75% (`calc(value * 0.75)`)
- **800-1023px**: Scaled to 55% (`calc(value * 0.55)`)

This is handled in `219-1367-scaled.css` with media queries.

## Modular Panel System

### Current Panels

Each animated window is a standalone module:

| Panel | File | Position | Width | Hook | Behavior |
|-------|------|----------|-------|------|----------|
| Header | `219-panel-header.css` | Center top | 450px | hook3.svg | Drops to center on hover |
| Preamble | `219-panel-preamble.css` | Left side | 495px | hook1.svg | Retracts to top, drops to 10% on hover |
| Summary | `219-panel-summary.css` | Right side | 450px | hook2.svg | Retracts to top, drops to 40% on hover |
| Benefits | `219-panel-benefits.css` | Right side | 460px | hook3.svg | Retracts to top, appears at 8vh on hover |

### Panel Architecture

Each panel file is self-contained with:

- **CSS custom properties** for easy configuration
- **All styling** for that specific panel
- **Hook and frame elements** (::before, ::after)
- **Hover states** and transitions
- **Typography** specific to that panel

### Adding a New Panel

#### Method 1: Duplicate an Existing Panel

1. **Copy a panel file**
   ```bash
   cp 219-panel-preamble.css 219-panel-custom.css
   ```

2. **Update configuration variables**
   ```css
   .custom {
       /* Change these values to position your panel */
       --panel-width: 495px;
       --panel-margin-left-initial: -580px;
       --panel-margin-left-hover: -490px;
       --panel-bottom-initial: 90%;
       --panel-bottom-hover: 20%;  /* Position when revealed */
       --panel-hook: url(hook1.svg);
   }
   ```

3. **Change the class selector**
   - Replace `.preamble` with `.custom` throughout the file

4. **Import in 219-1367-scaled.css**
   ```css
   @import url("219-panel-custom.css");
   ```

5. **Add responsive scaling**
   In the `@media` queries in `219-1367-scaled.css`:
   ```css
   @media (max-width: 1366px) and (min-width: 1024px) {
       .custom {
           width: calc(495px * 0.75);
           margin-left: calc(-580px * 0.75);
       }
       .custom::before,
       .custom::after {
           width: calc(495px * 0.75);
       }
       .custom:hover {
           margin-left: calc(-490px * 0.75);
       }
   }
   ```

#### Method 2: Use the Template

Create a new panel from this template:

```css
/**
* [Panel Name] - [Description]
*/

.[panel-class] {
    /* Configuration */
    --panel-width: 495px;
    --panel-margin-left-initial: -580px;
    --panel-margin-left-hover: -490px;
    --panel-bottom-initial: 90%;
    --panel-bottom-hover: 10%;
    --panel-hook: url(hook1.svg);
    --panel-hook-offset: -40px;
    --panel-frame-top-offset: 655px;

    /* Positioning */
    position: absolute;
    bottom: var(--panel-bottom-initial);
    left: 50%;
    z-index: 5;
    margin: 0 0 0 var(--panel-margin-left-initial);
    padding: 0;
    width: var(--panel-width);

    /* Visual */
    background: url(layer-middle.svg) repeat-y center top;
    background-size: var(--panel-width) auto;
    color: #999;
    transform: rotate(-5deg) skew(-5deg) scale(0.8);
    transition: transform 1s ease-out,
                bottom 1s ease-out,
                margin 1s 1s ease-out;
}

/* Hook and frame */
.[panel-class]::before,
.[panel-class]::after {
    position: absolute;
    left: 0;
    z-index: -1;
    display: block;
    width: var(--panel-width);
    content: '';
}

.[panel-class]::before {
    top: -700px;
    height: 700px;
    background: var(--panel-hook) no-repeat center var(--panel-hook-offset),
                url(layer-frame.svg) no-repeat center var(--panel-frame-top-offset);
    background-size: auto auto, var(--panel-width) auto;
}

.[panel-class]::after {
    bottom: -45px;
    height: 45px;
    background: url(layer-frame.svg) no-repeat center bottom;
    background-size: var(--panel-width) auto;
}

/* Hover state */
.[panel-class]:hover {
    bottom: var(--panel-bottom-hover);
    margin: 0 0 0 var(--panel-margin-left-hover);
    color: #fff;
    transform: rotateY(0) scale(1);
}
```

### Configuration Guide

#### Key Variables

| Variable | Purpose | Example Values |
|----------|---------|----------------|
| `--panel-width` | Panel width | `450px`, `495px` |
| `--panel-margin-left-initial` | Horizontal offset retracted | `-580px` (left), `100px` (right) |
| `--panel-margin-left-hover` | Horizontal offset revealed | `-490px` (left), `50px` (right) |
| `--panel-bottom-initial` | Vertical start position | `90%` (hidden top), `50%` (center) |
| `--panel-bottom-hover` | Vertical revealed position | `10%`, `40%` |
| `--panel-hook` | Hook SVG graphic | `url(hook1.svg)`, `url(hook2.svg)`, `url(hook3.svg)` |

#### Positioning Tips

**Left-side panel:**
- Use `left: 50%` and negative `margin-left`
- Rotate negative: `rotate(-5deg) skew(-5deg)`

**Right-side panel:**
- Use `right: 50%` and negative `margin-right`
- Rotate positive: `rotate(5deg) skew(5deg)`

**Center panel:**
- Use `left: 50%` and centered `margin-left`
- No rotation: `scale(0.8)` only

#### Available Hooks

Three decorative hook SVGs:

1. **hook1.svg** - Used by preamble
2. **hook2.svg** - Used by summary
3. **hook3.svg** - Used by header and benefits

## Hidden Elements

These elements are hidden via `219-custom-hide.css`:

- Sidebar (.sidebar)
- Footer icons (footer)
- Explanation panel (.explanation)
- Participation panel (.participation)
- Requirements panel (.requirements)
- Design selection (.design-selection)
- Archives and resources (.design-archives, .zen-resources)

To show any of these, remove them from `219-custom-hide.css`.

## Responsive Breakpoints

The animation adapts at these key viewport sizes:

| Width | Behavior |
|-------|----------|
| 0-399px | No animation (can be extended in future) |
| 400-799px | Mobile layout (219-400.css) |
| 800-1023px | Animation at 55% scale |
| 1024-1366px | Animation at 75% scale |
| 1367-1599px | Animation at 100% scale (original design) |
| 1600px+ | Enhanced 3D transforms (219-1600.css) |

## Browser Compatibility

Supports all modern browsers:

- Chrome/Edge 79+
- Firefox 75+
- Safari 13.1+
- Opera 66+

Uses:
- CSS transforms (with vendor prefixes)
- CSS transitions
- CSS calc()
- CSS custom properties (in panel files)
- SVG graphics
- @media queries

## Performance

- **Pure CSS** - No JavaScript required
- **Hardware-accelerated** - Uses transform and opacity for animations
- **Lightweight SVGs** - Vector graphics scale perfectly
- **Optimized animations** - Uses transform properties for best performance

## Testing

Test at these key viewport widths:

- **800px** - Minimum width for animation
- **1024px** - Tablet landscape
- **1366px** - Original design target
- **1600px** - Large desktop
- **1920px** - Full HD

### Checklist

- ✅ All panels appear and animate
- ✅ Hover states work smoothly
- ✅ Text is readable at all sizes
- ✅ No horizontal scrolling
- ✅ SVG hooks maintain aspect ratio
- ✅ 3D transforms render correctly

## Troubleshooting

### Panel Not Appearing

- Check the CSS file is imported in `219-1367-scaled.css`
- Verify HTML element has correct class name
- Check z-index doesn't conflict with other panels
- Ensure panel isn't in `219-custom-hide.css`

### Panel Positioned Incorrectly

- Verify margin calculations match panel width
- Check `bottom` percentage values (0-100%)
- Ensure responsive scaling is applied in media queries
- Check if `left`/`right` positioning is correct

### Hover Not Working

- Confirm `:hover` selector matches base selector
- Verify transitions are defined
- Check transform values differ between normal and hover states
- Ensure z-index allows hover interaction

## Benefits of This System

1. **Responsive** - Works from 800px to ultra-wide displays
2. **Modular** - Each panel is independent and reusable
3. **Easy to Duplicate** - Copy a file, change variables
4. **Self-Contained** - Panels don't interfere with each other
5. **Configurable** - CSS variables make customization clear
6. **Maintainable** - Update one panel without affecting others
7. **Well-Documented** - Clear structure and examples

## Examples

### Create a Second Right-Side Panel

1. Copy `219-panel-summary.css` → `219-panel-features.css`
2. Change `.summary` → `.features` throughout
3. Adjust `--summary-bottom-hover` to `60%` (position below summary)
4. Import in `219-1367-scaled.css`
5. Add responsive scaling rules
6. Add HTML: `<div class="features">...</div>`

### Create a Center Bottom Panel

1. Copy `219-panel-header.css` → `219-panel-footer.css`
2. Change `top` positioning to `bottom`
3. Adjust hover position
4. Keep `left: 50%` and centered margin
5. Use `scale(0.8)` only (no rotation)

## Credits

- **Original Design**: Steffen Knoeller (http://www.steffen-knoeller.de/)
- **License**: Creative Commons BY-NC-SA
- **Responsive Refactor**: 2026-01-10
- **Modular System**: 2026-01-10

## License

Creative Commons Attribution-NonCommercial-ShareAlike 1.0
http://creativecommons.org/licenses/by-nc-sa/1.0/

## Future Enhancements

Potential improvements:

1. **Mobile animation** (400-799px) - Extend responsive system to phones
2. **Dark mode** - Add theme switching
3. **Reduced motion** - Add `@media (prefers-reduced-motion: reduce)` support
4. **More panels** - Add additional content windows
5. **Container queries** - Replace viewport units when browser support improves
6. **Accessibility** - Enhance keyboard navigation and screen reader support
