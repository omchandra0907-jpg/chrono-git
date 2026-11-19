#!/usr/bin/env bash
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "=== chrono-git 3D Time-Machine Showcase ==="
echo "[1] Running test suite (treemap area conservation & git parser)..."
npm run test

echo "[2] Launching local Vite server for 3D City Visualization..."
echo "Open http://localhost:3000 in your browser to explore the 3D codebase!"
npx vite --port 3000 --open
