/**
 * Pure TypeScript Squarified Treemap Layout Engine.
 * Converts hierarchical file structures into 2D street blocks with area conservation.
 */

export interface TreemapNode {
  path: string;
  name: string;
  weight: number; // Lines of code or byte size
  children?: TreemapNode[];
}

export interface BuildingRect {
  path: string;
  name: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  weight: number;
}

export interface LayoutBounds {
  x: number;
  z: number;
  width: number;
  depth: number;
}

/**
 * Calculates worst aspect ratio for a row of areas along a given edge length.
 */
function worstAspectRatio(row: number[], edgeLength: number): number {
  if (row.length === 0 || edgeLength === 0) return Infinity;
  const s = row.reduce((a, b) => a + b, 0);
  const minVal = Math.min(...row);
  const maxVal = Math.max(...row);
  const side = s / edgeLength;
  if (side === 0) return Infinity;
  return Math.max(
    (edgeLength * edgeLength * maxVal) / (s * s),
    (s * s) / (edgeLength * edgeLength * minVal)
  );
}

/**
 * Solves squarified treemap layout for a flat list of weighted nodes within bounds.
 */
export function squarify(
  nodes: { path: string; name: string; weight: number }[],
  bounds: LayoutBounds,
  margin: number = 0.5
): BuildingRect[] {
  if (nodes.length === 0) return [];

  // Filter non-positive weights and sort descending
  const validNodes = nodes
    .filter((n) => n.weight > 0)
    .sort((a, b) => b.weight - a.weight);

  if (validNodes.length === 0) return [];

  const totalWeight = validNodes.reduce((sum, n) => sum + n.weight, 0);
  const totalArea = bounds.width * bounds.depth;
  if (totalArea <= 0) return [];

  // Scale weights to area
  const items = validNodes.map((n) => ({
    ...n,
    area: (n.weight / totalWeight) * totalArea,
  }));

  const results: BuildingRect[] = [];
  let currentBounds = { ...bounds };
  let remaining = [...items];

  while (remaining.length > 0) {
    const isHorizontal = currentBounds.width >= currentBounds.depth;
    const edgeLength = isHorizontal ? currentBounds.depth : currentBounds.width;

    let row = [remaining[0]];
    let rowAreas = [remaining[0].area];

    for (let i = 1; i < remaining.length; i++) {
      const nextCandidate = remaining[i];
      const testRow = [...rowAreas, nextCandidate.area];
      if (worstAspectRatio(testRow, edgeLength) <= worstAspectRatio(rowAreas, edgeLength)) {
        row.push(nextCandidate);
        rowAreas.push(nextCandidate.area);
      } else {
        break;
      }
    }

    // Lay out the current row
    const rowAreaSum = rowAreas.reduce((a, b) => a + b, 0);
    const rowThickness = rowAreaSum / edgeLength;

    let offset = 0;
    for (const item of row) {
      const itemSpan = item.area / rowThickness;
      let bx = 0, bz = 0, bw = 0, bd = 0;

      if (isHorizontal) {
        bx = currentBounds.x;
        bz = currentBounds.z + offset;
        bw = Math.max(0.1, rowThickness - margin);
        bd = Math.max(0.1, itemSpan - margin);
      } else {
        bx = currentBounds.x + offset;
        bz = currentBounds.z;
        bw = Math.max(0.1, itemSpan - margin);
        bd = Math.max(0.1, rowThickness - margin);
      }

      results.push({
        path: item.path,
        name: item.name,
        x: bx,
        z: bz,
        width: bw,
        depth: bd,
        weight: item.weight,
      });

      offset += itemSpan;
    }

    // Update remaining bounds and remaining items
    remaining = remaining.slice(row.length);
    if (isHorizontal) {
      currentBounds.x += rowThickness;
      currentBounds.width -= rowThickness;
    } else {
      currentBounds.z += rowThickness;
      currentBounds.depth -= rowThickness;
    }
  }

  return results;
}
