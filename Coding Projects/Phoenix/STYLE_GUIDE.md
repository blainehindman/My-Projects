# STYLE_GUIDE.md

## Design Philosophy

Phoenix embraces Apple's design philosophy of simplicity, clarity, and depth. Our interface prioritizes content with clean layouts, generous white space, and subtle depth through layering. Every element serves a purpose, creating an intuitive and delightful user experience that feels both familiar and refined.

**Core Principles:**
- **Clarity**: Text is legible, icons are precise, functionality is obvious
- **Deference**: The interface helps users understand and interact with content
- **Depth**: Visual layers and realistic motion provide hierarchy and meaning

---

## 🎨 Color Palette

### System Colors
| Name          | Hex       | Use                                    |
|---------------|-----------|----------------------------------------|
| System Blue   | #007AFF   | Primary actions, links, selection      |
| System Green  | #34C759   | Success states, confirmations          |
| System Orange | #FF9500   | Warnings, notifications                |
| System Red    | #FF3B30   | Destructive actions, errors            |
| System Purple | #AF52DE   | Creative actions, highlights           |

### Neutral Palette
| Name          | Hex       | Use                                    |
|---------------|-----------|----------------------------------------|
| Black         | #000000   | Primary text, high emphasis content   |
| Gray-900      | #1C1C1E   | Secondary text, medium emphasis        |
| Gray-800      | #2C2C2E   | Tertiary text, low emphasis           |
| Gray-600      | #48484A   | Quaternary text, placeholder           |
| Gray-500      | #8E8E93   | Separator lines, disabled text         |
| Gray-400      | #AEAEB2   | Subtle separators                      |
| Gray-300      | #C7C7CC   | Input borders, light separators        |
| Gray-200      | #D1D1D6   | Background fills                       |
| Gray-100      | #F2F2F7   | Secondary backgrounds                  |
| White         | #FFFFFF   | Primary backgrounds, surfaces          |

---

## 🔠 Typography

### Font Family
- Primary: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif`
- UI Text: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif`
- Monospace: `"SF Mono", Menlo, Monaco, Consolas, monospace`

### Type Scale (SF Pro Display)
- **Large Title**: 34px (2.125rem) - Weight: 400 - Line Height: 1.12 - Tracking: 0.37px
- **Title 1**: 28px (1.75rem) - Weight: 400 - Line Height: 1.14 - Tracking: 0.36px
- **Title 2**: 22px (1.375rem) - Weight: 400 - Line Height: 1.18 - Tracking: 0.35px
- **Title 3**: 20px (1.25rem) - Weight: 400 - Line Height: 1.2 - Tracking: 0.38px
- **Headline**: 17px (1.0625rem) - Weight: 600 - Line Height: 1.29 - Tracking: -0.41px
- **Body**: 17px (1.0625rem) - Weight: 400 - Line Height: 1.29 - Tracking: -0.41px
- **Callout**: 16px (1rem) - Weight: 400 - Line Height: 1.31 - Tracking: -0.32px
- **Subheadline**: 15px (0.9375rem) - Weight: 400 - Line Height: 1.33 - Tracking: -0.24px
- **Footnote**: 13px (0.8125rem) - Weight: 400 - Line Height: 1.38 - Tracking: -0.08px
- **Caption 1**: 12px (0.75rem) - Weight: 400 - Line Height: 1.33 - Tracking: 0px
- **Caption 2**: 11px (0.6875rem) - Weight: 400 - Line Height: 1.36 - Tracking: 0.07px

### Dynamic Type Weights
- **Regular**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

---

## 🧩 Component Specifications

### Buttons
- **Primary (Filled)**:
  - Background: System Blue (#007AFF)
  - Text: White
  - Border radius: 8px
  - Height: 44px (iOS) / 32px (compact)
  - Padding: 0 20px
  - Font: SF Pro Text 17px Medium
  - Shadow: 0 1px 3px rgba(0, 0, 0, 0.15)
  
- **Secondary (Tinted)**:
  - Background: rgba(0, 122, 255, 0.1)
  - Text: System Blue
  - Border: none
  - Same dimensions as primary
  
- **Tertiary (Plain)**:
  - Background: transparent
  - Text: System Blue
  - Border: none
  - Padding: 8px 16px
  - No shadow

### Text Fields
- Height: 44px
- Border: 1px solid Gray-300 (#C7C7CC)
- Border radius: 10px
- Padding: 12px 16px
- Background: White
- Focus: Border becomes System Blue, shadow: 0 0 0 4px rgba(0, 122, 255, 0.1)
- Font: SF Pro Text 17px
- Placeholder: Gray-600 (#48484A)

### Cards
- Background: White
- Border radius: 12px
- Border: 0.5px solid Gray-400 (#AEAEB2)
- Padding: 20px
- Shadow: 0 1px 3px rgba(0, 0, 0, 0.06)
- Hover shadow: 0 4px 16px rgba(0, 0, 0, 0.1)

### Navigation
- **Top Bar**:
  - Height: 44px
  - Background: rgba(255, 255, 255, 0.8) with backdrop-blur
  - Border: 0.5px solid Gray-400
  - Title: SF Pro Display 17px Semibold

- **Sidebar**:
  - Width: 320px
  - Background: Gray-100 (#F2F2F7)
  - Item height: 44px
  - Item padding: 12px 20px
  - Active: System Blue background with white text
  - Border radius: 10px (for active items)
  - Section headers: SF Pro Text 13px Medium, Gray-800

### Lists
- Row height: 44px minimum
- Padding: 12px 20px
- Separator: 0.5px solid Gray-400
- Background: White
- Hover: Gray-100 background

---

## 📐 Spacing System

### Apple's 8pt Grid System
- **2px** - Hairline borders
- **4px** (0.5 unit) - Fine adjustments
- **8px** (1 unit) - Minimum touch target padding
- **12px** (1.5 units) - Text field padding
- **16px** (2 units) - Standard margin between elements
- **20px** (2.5 units) - Card padding
- **24px** (3 units) - Section spacing
- **32px** (4 units) - Large section breaks
- **44px** (5.5 units) - Standard touch target height
- **64px** (8 units) - Major layout spacing

### Layout Spacing
- Content margins: 20px (mobile), 32px (tablet), 64px (desktop)
- Card spacing: 16px between cards
- Section breaks: 32px
- Navigation item spacing: 4px vertical
- Form group spacing: 24px

---

## 📱 Responsive Breakpoints

- **iPhone**: 375px - 414px
- **iPad**: 768px - 1024px  
- **Desktop**: 1024px+
- **Large Desktop**: 1440px+

### Layout Behavior
- **Mobile**: Single column, full-width elements, 20px margins
- **Tablet**: Two-column where appropriate, 32px margins
- **Desktop**: Multi-column layouts, maximum content width 1200px
- **Large**: Centered content with generous side margins

---

## ⚡ Interactive States

### Hover States
- Buttons: Slight opacity reduction (0.8) or subtle color shift
- Cards: Enhanced shadow and slight scale (1.02)
- List items: Light gray background
- Links: No underline, slight opacity change

### Active States
- Buttons: Scale down slightly (0.96)
- Touch feedback: Brief highlight
- Selection: System Blue background

### Focus States
- Blue outline: 2px solid System Blue
- Glow: 0 0 0 4px rgba(0, 122, 255, 0.1)
- Border radius matches element

### Disabled States
- Opacity: 0.3
- No interaction states
- Grayed out appearance

---

## 🌊 Motion & Animation

### Timing Functions
- **Ease**: Default for most animations
- **Ease-in-out**: For attention-grabbing animations
- **Ease-out**: For appearing elements
- **Linear**: For continuous animations

### Duration
- **Micro**: 100ms - Button press feedback
- **Short**: 200ms - Hover states, simple transitions
- **Medium**: 300ms - Panel slides, content changes
- **Long**: 500ms - Complex state changes

### Transforms
- Subtle scale changes (0.96 - 1.02)
- Gentle vertical movement (2-4px)
- Smooth opacity transitions
- Respectful of reduced motion preferences

---

## 🎯 Accessibility Standards

### Contrast Requirements
- **Text**: Minimum 4.5:1 ratio for normal text
- **Large Text**: Minimum 3:1 ratio for 18px+ or 14px+ bold
- **UI Elements**: Minimum 3:1 ratio for interactive elements

### Touch Targets
- **Minimum**: 44px × 44px for all interactive elements
- **Recommended**: 48px × 48px for primary actions
- **Spacing**: 8px minimum between adjacent targets

### Focus Management
- Visible focus indicators for all interactive elements
- Logical tab order
- Focus trapped in modals and overlays
- Skip links for keyboard navigation

### Dynamic Type Support
- Respect user's preferred text size settings
- Scale layouts appropriately with text size changes
- Maintain readability at all sizes
