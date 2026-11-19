# chrono-git

> 3D Git repository time-machine and codebase metropolis visualizer built with TypeScript, Three.js, and squarified treemaps.

![chrono-git Showcase](assets/demo.gif)

[![CI](https://github.com/omchandra0907-jpg/chrono-git/actions/workflows/ci.yml/badge.svg)](https://github.com/omchandra0907-jpg/chrono-git/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

> **🌐 Live Interactive Web Demo:** [https://omchandra0907-jpg.github.io/chrono-git/](https://omchandra0907-jpg.github.io/chrono-git/)

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-3D_Git_City_Visualizer-00E5FF?style=for-the-badge&labelColor=0d1117)](https://omchandra0907-jpg.github.io/chrono-git/)

---

## Architecture & Data Structures

- **Squarified Treemap City Layout**: Converts hierarchical directory trees into 2D ground coordinates using a pure TypeScript squarified treemap engine (Bruls, Huizing, van Wijk). Ensures non-overlapping bounding boxes, optimal near-unity aspect ratios, and strict area conservation.
- **60 FPS GPU Instanced Rendering**: Renders all repository files within a single `THREE.InstancedMesh` rather than allocating separate Mesh draw-calls. Building height dynamically interpolates from `Math.log2(linesOfCode + 1)`.
- **Curated Neon Language Palette**:
  - `TypeScript / TSX`: Neon Cyan (`#00e5ff`)
  - `JavaScript / JSX`: Electric Yellow (`#ffd600`)
  - `C / C++`: Cobalt Blue (`#2979ff`)
  - `Python`: Emerald Green (`#00e676`)
  - `Rust`: Vivid Orange (`#ff6d00`)
  - `Markdown / Docs`: Lavender Purple (`#b388ff`)
  - `JSON / Config`: Hot Pink (`#ff4081`)
- **Decoupled Data Ingestion**:
  - **Local CLI**: `npx chrono-git parse ./repo` executes `git log --numstat --reverse` and emits compact `repo-history.json`.
  - **In-Browser GitHub API Client**: Fetches public repositories directly without backend server dependencies.
- **Glassmorphic HUD Timeline**: Scrub smoothly across commits, pause, play at 1x/2x/4x speeds, and click buildings to inspect file paths and line counts.

---

## Quickstart

### Installation
```bash
git clone https://github.com/omchandra0907-jpg/chrono-git.git
cd chrono-git
npm install
```

### Launch 3D Metropolis Visualizer
```bash
npm run dev
```
Navigate to `http://localhost:3000` to interact with the 3D timeline.

### Zero-Setup Showcase
```bash
./samples/run_demo.sh
```

### Parse a Local Repository
```bash
# Parses local git history into a compact JSON snapshot
npx tsx src/cli.ts parse ../alchem-c samples/alchem-history.json
```

---

## Testing & Quality Guardrails

```bash
# Run squarified treemap & parser unit tests
npm run test

# Typecheck and production bundle build
npm run build
```

---

## License

Distributed under the MIT License. Developed with care by [omchandra0907-jpg](https://github.com/omchandra0907-jpg).

<!-- commit step: feat: implement squarified treemap layout algorithm (Bruls et al.) -->

<!-- commit step: perf: optimize aspect ratio minimization for rectangular blocks -->

<!-- commit step: feat: add directory hierarchy boundary grouping and street margins -->

<!-- commit step: feat: setup Three.js scene, perspective camera, and directional lights -->

<!-- commit step: feat: implement GPU instancing with THREE.InstancedMesh -->

<!-- commit step: feat: map file lines of code to building height with Math.log2 -->

<!-- commit step: style: curate neon color palette for programming languages -->

<!-- commit step: feat: implement commit touch emissive pulse and decay shader effect -->

<!-- commit step: feat: add smooth orbit controls and camera damping -->

<!-- commit step: feat: implement click-to-focus camera inspection rig -->

<!-- commit step: samples: bundle realistic offline repository history sample -->

<!-- commit step: style: add responsive layout styling for mobile and desktop screens -->

<!-- commit step: perf: optimize InstancedMesh memory reallocation on large histories -->

<!-- commit step: docs: write 3D architecture guide and GPU instancing overview -->
