---
name: AgenticFlow
description: Advanced algorithmic fairness auditing framework
colors:
  primary: "#FF691A"
  secondary: "#183F60"
  dark: "#08192C"
  black: "#000000"
  text: "#FFFFFF"
  text-muted: "#B8C2CC"
typography:
  display:
    fontFamily: "var(--font-plus-jakarta), ui-sans-serif, system-ui, sans-serif"
    fontWeight: 700
  body:
    fontFamily: "var(--font-plus-jakarta), ui-sans-serif, system-ui, sans-serif"
    fontWeight: 400
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  gutter: "20px"
---

# Design System: AgenticFlow

## 1. Overview

**Creative North Star: "The Intelligent Auditor"**

AgenticFlow is designed to be highly functional but deeply approachable. It balances the extreme density of machine learning algorithms with a bright, welcoming user experience. We prioritize clarity over complexity, ensuring that technical data feels legible and tactile. We explicitly reject the overly dark, terminal-style "hacker" aesthetic that alienates non-technical compliance officers.

**Key Characteristics:**
- **Clarity over Complexity:** Deep technical data should be easy to digest.
- **Accessible & Friendly:** Bright accents against structured dark modes.
- **Tactile:** Interactive elements should feel physically satisfying.

## 2. Colors

A structured dark theme anchored by a vibrant, alert-driven orange for action.

### Primary
- **Signal Orange** (#FF691A): Used for primary calls to action, active states, and drawing attention to critical alerts or metrics.

### Secondary
- **Structured Blue** (#183F60): Provides depth and separation for background containers, cards, and structured layouts without resorting to pure black.

### Neutral
- **Deep Core** (#08192C): The standard application background, providing high contrast for text.
- **Text Muted** (#B8C2CC): Used for secondary labels, eyebrows, and low-priority data.

## 3. Typography

**Display Font:** Plus Jakarta Sans
**Body Font:** Plus Jakarta Sans

**Character:** Modern, highly legible, and deeply geometric, providing a clean technical feel without being sterile.

### Hierarchy
- **Display**: Used for major marketing heroes and critical dashboard metrics.
- **Headline**: Used for page titles and section headers.
- **Title**: Used for card titles and component headers.
- **Body**: Used for all standard text and paragraphs.
- **Label**: Used for tiny, tracked-out metadata and small buttons.

## 4. Elevation

The system relies on a hybrid approach of tonal layering and tactile shadows. Depth is primarily established by shifting background colors (Deep Core vs Structured Blue), while interactive elements (like cards and buttons) gain physical shadows when hovered or dragged.

### Shadow Vocabulary
- **Card Hover**: A tight, bright shadow to make the card "pop" off the canvas when hovered.
- **Drag State**: Deeper, wider shadows for nodes currently being moved on the Flow Canvas.

## 5. Components

Tactile and Confident. Interactive elements should feel like they have physical weight.

### Buttons
- **Shape**: Fully rounded pills for primary actions, slight rounded corners for secondary actions.
- **Primary**: Filled with Signal Orange. Text is inverted.
- **Interaction**: Must visibly scale down (`active:scale-95`) when pressed to provide tactile feedback.

### Cards & Nodes
- **Shape**: Rounded borders with a solid structural background.
- **Interaction**: Fast, snappy hover transitions (e.g., `150ms ease-out`) that elevate the card using transforms and shadows, rather than slow, lazy fades.

## 6. Do's and Don'ts

### Do
- **Do use Signal Orange sparingly.** Let its rarity be the point, using it only for the most critical actions.
- **Do provide active states.** Ensure buttons and filters physically respond to clicks.
- **Do stagger animations.** When revealing data or nodes, stagger them to create a sense of life.

### Don't
- **Don't use identical, repetitive card grids without rhythm.** Vary spacing and sizes.
- **Don't use pure gray for text.** Always use our tinted `Text Muted` (#B8C2CC).
- **Don't use `transition-all` on hover states.** Specifically target `transform`, `box-shadow`, or `background-color` to prevent browser layout thrashing.
