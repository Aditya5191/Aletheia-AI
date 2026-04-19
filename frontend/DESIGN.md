# Design System Specification: Forensic Clarity (AletheaAI)

## 1. Overview & Creative North Star
**The Creative North Star: "The Clinical Observer"**

This design system is built to facilitate the high-stakes environment of AI bias auditing. We are moving away from the cluttered, "noisy" aesthetics of traditional SaaS dashboards. Instead, we embrace a "Clinical Observer" persona: a visual language that is hyper-precise, quiet, and authoritative. 

The system breaks the "template" look through **intentional asymmetry** and **tonal depth**. By utilizing extreme whitespace and high-contrast typography scales (Syne Bold against DM Sans), we create a sense of forensic focus. This isn't just a dashboard; it is a high-resolution medical scan of an algorithm's soul.

---

## 2. Colors & Surface Logic

### The "No-Line" Rule
To achieve a premium, editorial feel, **this design system prohibits 1px solid borders for sectioning.** Boundaries must be defined solely through background color shifts or subtle tonal transitions. For example, a `surface-container-low` section sitting on a `background` provides all the structural definition required.

### Surface Hierarchy & Nesting
We treat the UI as a series of physical layers—like stacked sheets of architectural glass. Depth is achieved by nesting surface-container tiers (Lowest to Highest).
*   **Background (`#121316`):** The canvas.
*   **Surface Container Lowest (`#0d0e11`):** Used for "sunken" utility areas like sidebars or footer docks.
*   **Surface Container (`#1f1f23`):** The standard work surface for primary content.
*   **Surface Container Highest (`#343538`):** Reserved for active elements, modals, or focused "inspected" data points.

### The Glass & Gradient Rule
To move beyond a "flat" feel, use **Glassmorphism** for floating elements (e.g., tooltips or hovering audit cards) by applying `surface_variant` with a 60% opacity and a 12px backdrop-blur. 
*   **Signature Textures:** For primary CTAs, use a subtle linear gradient from `primary` (#50dcc0) to `primary_container` (#14b89e) at a 135-degree angle. This adds "visual soul" and professional polish.

---

## 3. Typography
The typographic system is a dialogue between **geometric impact** and **functional precision**.

*   **Display & Headlines (Syne Bold):** Used for high-level data points and section titles. Syne’s wide, geometric stance provides an "unshakeable" and authoritative feel.
*   **Body & UI (DM Sans):** The workhorse. DM Sans provides high legibility for clinical reports and audit findings without distracting the eye.
*   **Data & Logs (JetBrains Mono):** Every piece of AI-generated agent output or raw bias data must use JetBrains Mono. This signals "forensic raw data" to the user, distinguishing it from the "interpreted" UI text.

**Scale Philosophy:** Use extreme contrast. A `display-lg` headline should often sit next to a `body-sm` caption to create a "Swiss-style" editorial layout that feels custom-designed.

---

## 4. Elevation & Depth

### The Layering Principle
Depth is achieved by "stacking" the surface-container tiers. Place a `surface-container-highest` card on a `surface` section to create a soft, natural lift.

### Ambient Shadows
Shadows are rarely used. When a floating effect is mandatory (e.g., a modal), use an **Ambient Shadow**:
*   **Blur:** 32px to 64px.
*   **Opacity:** 4%–8%.
*   **Color:** Use the `primary_fixed_dim` color tinted with black, rather than pure grey, to mimic the clinical teal glow of the interface.

### The "Ghost Border" Fallback
If a border is required for accessibility, use a **Ghost Border**: the `outline_variant` token at 15% opacity. Never use 100% opaque lines.

---

## 5. Components

### Audit Buttons
*   **Primary:** Gradient fill (`primary` to `primary_container`), `on_primary` text. No border. 4px (`md`) radius.
*   **Secondary:** Ghost style. Transparent background with a `ghost border` and `primary` text.
*   **Tertiary:** Text-only with a Phosphor "Thin" icon.

### Forensic Data Chips
*   **Audit Status:** Use `surface_container_high` as the base.
*   **Success/Clinical Teal:** Use a subtle 10% opacity `primary` fill with a `primary` text label.
*   **Warning/Amber:** 10% `secondary` fill with `secondary` text.

### Clinical Input Fields
*   **State:** Default fields use `surface_container_lowest` with no border. On focus, the background shifts to `surface_container_highest` with a 1px `primary` glow on the bottom edge only.
*   **Typography:** Labels must be `label-sm` in `on_surface_variant`.

### The "Audit Log" Card
*   **Style:** No borders. Use vertical white space (32px or 48px) to separate items.
*   **Monospace Integration:** Raw agent strings are wrapped in a `surface_container_low` block with JetBrains Mono text to simulate a terminal within a medical scan.

### Phosphor Icons
*   **Usage:** Use **Thin** (1px) for decorative elements and **Regular** for interactive buttons. This maintains the "precise/geometric" vibe.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical layouts (e.g., a wide left column for data and a narrow right column for forensic metadata).
*   **Do** lean into `surface_container` stacking to define sections.
*   **Do** use `primary` (Teal) sparingly. It should feel like a "ping" on a radar, not a brand color wash.

### Don't
*   **Don't** use standard 1px borders to separate content.
*   **Don't** use heavy drop shadows or 3D effects.
*   **Don't** use Syne for body text; it is strictly a "headline" font for personality and authority.
*   **Don't** clutter the interface. If a piece of data isn't forensic evidence, hide it in a "Details" drawer.
