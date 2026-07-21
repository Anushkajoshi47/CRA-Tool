# Styling guide

The client is migrating from scattered inline styles to a small, sustainable
system. New and refactored components follow this pattern.

## The three layers

1. **Design tokens** — CSS custom properties in [`src/styles/index.css`](src/styles/index.css).
   The single source of truth for color, spacing, type, weight, and radii.
   - Spacing: `var(--space-1 … --space-16)` (4px base scale)
   - Type: `var(--text-2xs … --text-3xl)`
   - Weight: `var(--weight-normal … --weight-extrabold)`
   - Color: `var(--text)`, `var(--text-2)`, `var(--text-3)`, `var(--accent)`,
     `var(--card)`, `var(--border)`, semantic `--red/--amber/--success/--warning`
   - **Never hardcode** a px size or hex color a token already covers.

2. **Layout primitives** — [`src/components/primitives/layout.tsx`](src/components/primitives/layout.tsx).
   Replace hand-rolled `display:flex; gap; align` with:
   - `<Stack gap={4}>` — vertical flow
   - `<Row gap={2} align="center" justify="between">` — horizontal cluster (wraps by default)
   - `<Grid min="240px" gap={3}>` / `<Grid cols={4}>` — responsive grid
   - `gap` takes a spacing-scale step (`2` → `var(--space-2)`), not raw px.

3. **Component styles** — a scoped `Component.module.css` next to each component.
   Class names are local (no global collisions). Reference tokens inside.

## Dynamic (runtime) values

When a color/size depends on data (e.g. a status color), pass it as a CSS
variable inline and consume it in the module — don't inline the whole rule:

```tsx
<div className={s.entry} style={{ ['--c' as any]: meta.color }}>
```
```css
.node { border: 2px solid var(--c); background: color-mix(in srgb, var(--c) 14%, transparent); }
```

## Reference implementation

[`vm/components/Timeline.tsx`](src/vm/components/Timeline.tsx) +
[`Timeline.module.css`](src/vm/components/Timeline.module.css) show the full
pattern. Copy its structure when converting other screens.

## What stays global

The shared component classes already in `index.css` (`.btn`, `.card`, `.input`,
`.pill`, `.data-table`, `.section-label`, badges) remain — they're used
everywhere. Compose them; don't duplicate them into modules.

## Migration status

Converting screen-by-screen so the app is never half-broken.
Done: VM Timeline, VM Dashboard, VM Ticket Queue, VM Ticket Detail, VM Settings,
CRA Dashboard (chrome), CRA Products (incl. table body), CRA Settings, Compliance
RequirementRow (JS hover state replaced with pure CSS :hover). SVG graphics
(rings, status icons, journey stepper, icons) keep inline drawing attrs.
All PAGES converted: dashboards, queues, ticket detail, settings, compliance,
products, auth (Login/Signup share Auth.module.css), and both forms
(NewTicketForm + ProductForm share FormPage.module.css). Fixed a light-theme
bug in ProductForm's <select> (was hardcoded dark).

Still inline (COMPONENTS, not pages): the nav (Sidebar/Header/ModuleSwitcher),
marketing pages (Home/AppHub), and VM workflow components (DecisionCard,
FlowStepper, ClockWidget, CvssCalculator, AdvisoryForm, ReportForm,
LifecycleJourney, AdvisoryList).

`zoom` retirement is BLOCKED until those remain — removing zoom:1.1 shrinks all
raw-px (unconverted) elements 10% while token-based screens can be compensated,
so it must wait until the components above are tokenised too.
