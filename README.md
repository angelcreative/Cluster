# Cluster Gravity Graph

A high-performance, interactive data visualization built with **React 19**, **TypeScript**, **D3.js (v7)**, and **Vite**.  
It renders a force-directed graph with deterministic clustering, gravity-based physics, and smooth UI transitions designed for dense datasets.

**Build:** The app is bundled with Vite. Dependencies are installed via npm (`node_modules`); there is no browser ESM / importmap—clone, install, and run with the commands below.

---

## 🔴 Quick Integration Guide (TL;DR)

Use this section if you just want to **get it running correctly**.

### Minimal Working Example 

```tsx
import { useEffect, useState } from "react";
import ForceGraph from "./components/ForceGraph";
import { GraphNode, GraphLink } from "./types";

export function Example() {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const [data, setData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({
    nodes: [],
    links: [],
  });

  useEffect(() => {
    const onResize = () =>
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    // Replace with real data in production
    // setData(fetchYourData());
  }, []);

  return (
    <ForceGraph
      width={dimensions.width}
      height={dimensions.height}
      data={data}
      groupCount={8}
      showLabels
      onNodeClick={(node) => console.log(node)}
    />
  );
}
```

### Required vs Optional Props

| Prop | Required | Notes |
| :--- | :---: | :--- |
| `width` | ✅ | Must be > 0 |
| `height` | ✅ | Must be > 0 |
| `data` | ✅ | Nodes are mutated by D3 directly |
| `groupCount` | ✅ | Must match node group values |
| `onNodeClick` | ❌ | Optional interaction hook |
| `showLabels` | ❌ | Defaults to false |

### Controlled vs Uncontrolled Behavior

**Uncontrolled (default):** Drag & hover state handled internally by D3.

**Controlled:** Node selection is lifted to the parent via `onNodeClick`.

```tsx
const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

<ForceGraph
  {...props}
  onNodeClick={setSelectedNode}
/>;
```

### Layout & Sizing Requirements (Critical)

The parent container must have **explicit width and height**.

*   **Zero-sized containers** = blank screen
*   Component does not calculate its own size
*   SVG layout and positioning are fully D3-driven

✅ **Supported**:
*   Fullscreen layouts
*   Fixed-size panels
*   Responsive containers with explicit dimensions

❌ **Not supported**:
*   Auto-height containers
*   Flex children without defined size

### What This Component Does NOT Do

By design:
*   ❌ Fetch data
*   ❌ Normalize or validate topology
*   ❌ Persist state
*   ❌ Manage routing
*   ❌ Virtualize nodes (SVG-based)

---

## Features

*   **Force-Directed Physics**: Custom D3 simulation combining radial gravity, collision detection, and sector-based clustering to eliminate "donut-hole" artifacts.
*   **Dynamic Clustering**: Adjustable segmentation (2–20 groups) with automatic regeneration and layout recalculation.
*   **Interactive UI**:
    *   Drag-and-drop node manipulation
    *   Hover inspection
    *   FLIP-like modal transitions (node → modal)
*   **Responsive Design**: Canvas resizes via ResizeObserver-like patterns.
*   **Styling**: Utility-first CSS using Tailwind.

---

## Architecture Overview

Unidirectional data flow orchestrated by `App.tsx`.

1.  **Entry Point**: `index.tsx` mounts `App` into the DOM.
2.  **Data Generation**: `App` acts as the smart container generating mock graph data based on `groupCount` and `dimensions`.
3.  **Rendering**:
    *   `App` passes data to `ForceGraph`.
    *   `ForceGraph` owns the SVG and D3 simulation.
    *   D3 mutates node positions directly on every tick.
4.  **Interaction Loop**:
    *   User interaction handled inside `ForceGraph`.
    *   Click events propagate to `App`.
    *   React controls modal UI only.

---

## Directory Structure

```
/
├── index.html          # Entry HTML; loads app via Vite (/index.tsx)
├── index.tsx           # React mount
├── App.tsx
├── types.ts
├── constants.ts
├── package.json
├── package-lock.json
├── vite.config.ts
├── tsconfig.json
├── .gitignore           # node_modules, dist, etc. (not committed)
├── components/
│   └── ForceGraph.tsx
└── metadata.json
```

`node_modules` is not in the repo; run `npm install` after cloning.

---

## Installation & Running Locally

Prerequisites: **Node.js 18+**. The project uses **Vite**; dependencies live in `node_modules` (install with npm). No ESM CDN or importmap—everything is bundled.

1.  **Clone**:
    ```bash
    git clone https://github.com/angelcreative/Cluster.git
    cd Cluster
    ```

2.  **Install dependencies** (creates `node_modules`):
    ```bash
    npm install
    ```

3.  **Run the dev server** (default: http://localhost:3000):
    ```bash
    npm run dev
    ```

4.  **Build for production** (output in `dist/`):
    ```bash
    npm run build
    ```

5.  **Preview production build** (optional):
    ```bash
    npm run preview
    ```

---

## Environment Variables

No environment variables are required. All configuration is handled via `constants.ts`.

---

## Core Concepts

### Data Model (`types.ts`)

```typescript
interface GraphNode {
  id: string;
  group: number;
  radius: number;
  x?: number; // Owned by D3
  y?: number; // Owned by D3
  name: string;
  bio: string;
  avatarUrl: string;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  value: number;
}
```
*   `x` / `y` are owned by D3.
*   Nodes are **mutated directly** for performance.

### Physics Strategy

*   `forceManyBody`: Mild repulsion (`-3`).
*   `forceCollide`: Radius-based collision preventing overlap.
*   `forceRadial`: Pulls nodes toward center (kills the "donut-hole" effect).
*   `forceX` / `forceY`: Sector-based cluster gravity.

---

## Components

### `App`
*   **Role**: Orchestrator
*   Owns graph topology.
*   Controls cluster count.
*   Manages modal state.

### `ForceGraph`
*   **Location**: `components/ForceGraph.tsx`
*   **Responsibilities**:
    *   Initialize D3 simulation.
    *   Render SVG nodes and links.
    *   Handle drag and click events.
*   **Performance Notes**:
    *   React never re-renders nodes (D3 handles DOM updates).
    *   D3 is the single source of truth for layout.

---

## Constants

Located in `constants.ts`:
*   `COLORS`: 20-color palette (Shade 400).
*   `GROUP_LABELS`: Human-readable cluster names.
*   `NODE_COUNT`: Fixed to 450.
*   `DEFAULT_GROUP_COUNT`: 8.

---

## Extending the App

### Replacing Mock Data
1.  Remove data generation logic from `App.tsx`.
2.  Fetch real data.
3.  Map API response to `GraphNode` / `GraphLink`.

### Modifying Physics
To make the graph more explosive:
```javascript
.force("charge", d3.forceManyBody().strength(-30))
```

To soften gravity:
```javascript
.force("radial", null)
```

---

## Performance Considerations

*   **SVG** is performant up to ~1000 nodes.
*   **> 2000 nodes**: Consider migrating to `<canvas>`.
*   Regenerating clusters destroys and recreates the simulation (expensive operation).

---

## Accessibility Notes

**Current limitations**:
*   SVG nodes are not keyboard-focusable.
*   No ARIA roles on nodes.
*   Focus is not restored after modal close.

---

## Troubleshooting

| Issue | Possible Cause | Fix |
| :--- | :--- | :--- |
| **Blank screen** | `width` / `height` = 0 | Check parent layout and resize listeners. |
| **Nodes explode** | Unbalanced forces | Reduce `charge` strength. |
| **Labels overlap** | Group mismatch | Ensure `groupCount` prop syncs with data. |
| **Donut hole** | Missing radial force | Restore `.force("radial", ...)` in code. |

---

## Contributing

1.  **Files**: PascalCase for components.
2.  **Hooks**: Exhaustive dependency arrays required.
3.  **Types**: Strict TS, no `any`.
4.  **Keep D3 logic isolated** from React rendering.
5.  **Avoid re-instantiating simulations** unless topology changes.
6.  **Document new props** in this README under **Components**.

### Adding a Component
*   Create in `components/`.
*   Define `Props` interface.
*   Export `default` component.

---

## Design & Implementation Principles

These are **non-negotiable rules** followed by this codebase:

*   **D3 owns layout, React owns UI**.
*   **Node positions are mutable by design**.
*   **Performance > React purity**.
*   **Explicit dimensions over auto-layout**.
*   **One simulation per graph instance**.

Violating these rules will almost always result in:
*   Jank / Low FPS.
*   Memory leaks.
*   Broken drag behavior.
*   Unpredictable layouts.

---

## FAQ (Read Before Asking)

### Is this ESM / importmap?
No. This repo uses **Vite** as the build tool. React, React-DOM, and D3 are installed via npm and bundled by Vite. There is no browser importmap or ESM CDN; run `npm install` and `npm run dev` (or `npm run build`) after cloning.

### Why are nodes mutated directly?
Because D3’s force simulation is iterative and performance-sensitive.
Immutability would introduce unnecessary allocations and Garbage Collection pressure.

### Why SVG and not Canvas?
SVG provides:
*   Easier hit-testing.
*   Native text rendering.
*   Faster iteration for <1000 nodes.

Canvas is recommended only when scale demands it (>2000 nodes).

### Can this be server-side rendered?
No. The component depends on:
*   `window`
*   `ResizeObserver`-style logic
*   Imperative DOM access

Use client-only rendering (`'use client'` in Next.js).

### Can this be turned into a reusable library?
Yes, but requires:
*   Extracting mock data generation.
*   Externalizing constants.
*   Adding a public index export.
*   Versioning the props API.

---

## Known Limitations

*   No keyboard accessibility for nodes.
*   No zoom / pan (intentional for this demo).
*   No incremental graph updates (full regeneration only).
*   SVG performance ceiling around ~1000 nodes.

---

## Roadmap (Optional)

If this evolves further, logical next steps:

*   Canvas renderer for large datasets.
*   Zoom / pan with constraints.
*   Controlled selection API.
*   Accessibility layer.
*   Snapshot-based layout persistence.

---

## Ownership

This component is intended to be:
*   **Integrated**, not forked.
*   **Extended**, not rewritten.
*   **Understood**, not treated as a black box.

If you change core physics or lifecycle behavior, document it.
