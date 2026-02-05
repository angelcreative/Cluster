# Cluster Gravity Graph

A high-performance, interactive data visualization utilizing **React 19**, **TypeScript**, and **D3.js (v7)** to render a force-directed graph with complex clustering logic, gravity physics, and fluid UI animations.

## Features

- **Force-Directed Physics**: Custom D3 force simulation combining radial gravity, collision detection, and sector-based clustering to eliminate "donut hole" artifacts.
- **Dynamic Clustering**: Real-time adjustable segmentation (2–20 groups) with automatic data regeneration and layout recalculation.
- **Interactive UI**:
  - Drag-and-drop node manipulation.
  - Hover states for node inspection.
  - FLIP-like animations for modal transitions (node-to-modal expansion).
- **Responsive Design**: Auto-resizing canvas based on window dimensions using `ResizeObserver` patterns.
- **Styling**: Utility-first CSS using Tailwind.

## Architecture Overview

The application follows a **Unidirectional Data Flow** pattern, orchestrated by the root `App` component.

1.  **Entry Point**: `index.tsx` mounts the `App` component into the DOM root.
2.  **Data Generation**: The `App` component acts as the "Smart Container." It generates mock social graph data (Nodes and Links) based on the current `groupCount` and `dimensions`.
3.  **Rendering**:
    - `App` passes the raw graph data to `ForceGraph` (Presentation Component).
    - `ForceGraph` initializes a D3 simulation engine, taking control of the DOM within an `<svg>` element.
    - The simulation updates node positions (`x`, `y`) on every "tick", modifying the SVG attributes directly for performance.
4.  **Interaction Loop**:
    - User interacts (Drag/Click) inside `ForceGraph`.
    - Events are bubbled up or handled via refs.
    - Clicking a node triggers state updates in `App`, which renders the React-based Modal overlay.

## Directory Structure

```
/
├── index.html              # HTML entry point (imports Tailwind & ES Modules)
├── index.tsx               # React Root
├── App.tsx                 # Main Container & State Manager
├── types.ts                # Shared TypeScript Interfaces
├── constants.ts            # Configuration (Colors, Labels, Limits)
├── components/
│   └── ForceGraph.tsx      # D3 Integration Component
└── metadata.json           # Project metadata
```

## Installation & Running Locally

Prerequisites: Node.js 18+ and npm/yarn/pnpm.

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd gravity-graph
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Start Development Server**:
    ```bash
    npm run dev
    ```

4.  **Build for Production**:
    ```bash
    npm run build
    ```

## Environment Variables

This project currently relies on hardcoded constants and generated mock data. It does not utilize `.env` files for configuration. API Keys (e.g., for Gemini) are not currently implemented in the runtime code.

## Core Concepts

### Data Model (`types.ts`)

The graph relies on two primary interfaces extending D3's simulation types:

```typescript
// Extends d3.SimulationNodeDatum
interface GraphNode {
  id: string;
  group: number;      // Determines color and cluster position
  radius: number;     // Visual size and collision radius
  x?: number;         // Managed by D3
  y?: number;         // Managed by D3
  name: string;       // User profile data
  bio: string;        // User profile data
  avatarUrl: string;  // Visual asset
}

// Extends d3.SimulationLinkDatum
interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  value: number; // 1 = Strong (Intra-group), 0.5 = Weak (Inter-group)
}
```

### Physics & Simulation Strategy

The `ForceGraph` component implements a specific "Star" gravity layout to organize nodes:

1.  **`forceManyBody`**: Negative strength (-3) provides slight repulsion to prevent overlap.
2.  **`forceCollide`**: Prevents nodes from physically clipping into each other based on radius.
3.  **`forceRadial`**: **Critical**. A strength of `0.15` pulling towards radius `0` (center). This crushes the "donut hole" often found in radial layouts.
4.  **`forceX` / `forceY`**: Sector-based positioning. Each group is assigned a "foci" (point in space). Nodes are pulled towards their group's foci to create distinct color wedges.

## Components

### `App`

The root orchestrator.

*   **Responsibility**: Data fetching/generation, Layout state, Modal visibility.
*   **State**:
    *   `data`: Holds the current topology.
    *   `groupCount`: Controls the number of clusters (slider input).
    *   `selectedNode`: Controls the active modal content.
*   **Performance**: Uses `requestAnimationFrame` for modal opening to ensure DOM readiness for transitions.

### `ForceGraph`

A React wrapper around a D3 simulation.

*   **Location**: `components/ForceGraph.tsx`
*   **Responsibility**: Rendering the SVG, managing the D3 physics loop, handling drag events.

**Props Interface:**

| Prop | Type | Description |
| :--- | :--- | :--- |
| `width` | `number` | Canvas width (px) |
| `height` | `number` | Canvas height (px) |
| `data` | `{ nodes: GraphNode[], links: GraphLink[] }` | The graph topology |
| `onNodeClick` | `(node: GraphNode) => void` | Callback when a node is clicked |
| `showLabels` | `boolean` | Toggles visibility of group text overlays |
| `groupCount` | `number` | Used to calculate sector angles for labels |

**Internal Behavior:**
*   **`useEffect` (Simulation)**: Re-initializes the simulation when `data` or `dimensions` change. It uses `d3.forceSimulation` to mutate `node` objects directly.
*   **`useEffect` (Labels)**: Manages label DOM elements separately to allow toggling `showLabels` without restarting the expensive physics simulation.
*   **`tick` Event**: Updates DOM attributes (`cx`, `cy`, `x1`, `y1`) on every frame.
*   **Label Positioning**: Labels are calculated dynamically based on the centroid of all nodes in a specific group. If a cluster is too close to the center (`dist < 60`), the label is forced outwards to the periphery to maintain readability.

## Types & Constants

### `constants.ts`

*   **`COLORS`**: Array of hex codes used for node fills.
*   **`GROUP_LABELS`**: Array of strings mapped to groups (e.g., "Fashion Influence", "Tech Trends").
*   **`NODE_COUNT`**: Fixed at `450` for generation.
*   **`DEFAULT_GROUP_COUNT`**: Defaults to `8`.

## Extending the App

### Adding Real Data
To replace mock data with an API:
1.  Modify `App.tsx`: Remove the `useEffect` that generates random data.
2.  Add an async fetch call to populate `setData`.
3.  Ensure the API response maps correctly to the `GraphNode` interface in `types.ts`.

### Modifying Physics
To change the graph behavior (e.g., to make it explosive rather than implosive):
1.  Open `components/ForceGraph.tsx`.
2.  Modify the `.force('charge', ...)` strength to be more negative (e.g., `-30`).
3.  Remove or reduce `.force('radial', ...)`.

## Performance Considerations

*   **SVG Rendering**: The graph uses SVG `<circle>` and `<line>` elements. This is performant for < 1000 nodes. For > 2000 nodes, consider migrating `ForceGraph` to use HTML5 `<canvas>`.
*   **Re-rendering**: The `ForceGraph` component uses `useRef` for the SVG element to prevent React from managing the internal nodes, letting D3 handle the high-frequency updates directly.
*   **Data Regeneration**: Changing the "Segments" slider destroys and recreates the entire graph. This is computationally expensive (O(N^2) for some D3 initialization steps) and causes a visual reset.

## Accessibility Notes

*   **Current State**: Partial.
    *   The "Show Labels" button uses an icon and text.
    *   The Modal overlay supports click-to-dismiss via backdrop.
*   **Areas for Improvement**:
    *   **Keyboard Navigation**: Nodes in the SVG are not currently focusable via `Tab`.
    *   **Focus Management**: Closing the modal does not return focus to the trigger node.
    *   **ARIA**: SVG nodes lack `aria-label` or `role="button"`.

## Troubleshooting

| Issue | Possible Cause | Solution |
| :--- | :--- | :--- |
| **Graph is a blank white screen** | `data` is null or `width`/`height` are 0. | Check `App.tsx` resize listener and data generation logic. |
| **Nodes fly off screen** | Forces are unbalanced. | Reduce `charge` strength or increase `radial` strength in `ForceGraph.tsx`. |
| **Labels overlap nodes** | Centroid calculation is failing. | Check `groupCount` matches actual data groups. See logic in `ForceGraph.tsx` tick function. |
| **"Donut hole" appears in center** | `d3.forceRadial` is missing or weak. | Ensure `.force('radial', d3.forceRadial(0, ...))` is present. |

## Contributing

1.  **Conventions**:
    *   **Files**: PascalCase for React Components (`ForceGraph.tsx`), camelCase for logic.
    *   **Hooks**: All `useEffect` dependencies must be exhaustive.
    *   **Types**: strict TS mode. No `any`.

2.  **Adding Components**:
    *   Create in `components/`.
    *   Define Props interface immediately above the component.
    *   Export as `default`.
