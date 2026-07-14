import { CellType, WallType, DotType } from './shared/state/grid/types';
import type { Cell } from './shared/state/grid/types';

export function generateMaze(
  cols: number,
  rows: number,
  config: any
): Cell[] {
  const cells: Cell[] = Array.from({ length: cols * rows }, () => ({
    type: CellType.empty,
    dot: DotType.dot,
    taken: false,
  }));

  const getIdx = (x: number, y: number) => y * cols + x;

  // 1. Build Outer Perimeter Border Walls
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const idx = getIdx(x, y);

      if (x === 0) {
        // Left screen edge
        if (y === 9) {
          // Warp tunnel left exit opening
          cells[idx] = { type: CellType.empty, dot: DotType.never, taken: false };
        } else {
          cells[idx] = {
            type: CellType.wall,
            wallType: (y === 0) ? WallType.cornerTopLeft : (y === rows - 1) ? WallType.cornerBottomLeft : WallType.vertical,
            thickness: config.wallThickness,
            color: config.wallColor,
          };
        }
      } else if (x === cols - 1) {
        // Right screen edge
        if (y === 9) {
          // Warp tunnel right exit opening
          cells[idx] = { type: CellType.empty, dot: DotType.never, taken: false };
        } else {
          cells[idx] = {
            type: CellType.wall,
            wallType: (y === 0) ? WallType.cornerTopRight : (y === rows - 1) ? WallType.cornerBottomRight : WallType.vertical,
            thickness: config.wallThickness,
            color: config.wallColor,
          };
        }
      } else if (y === 0) {
        // Top border wall
        cells[idx] = {
          type: CellType.wall,
          wallType: WallType.horizontal,
          thickness: config.wallThickness,
          color: config.wallColor,
        };
      } else if (y === rows - 1) {
        // Bottom border wall
        cells[idx] = {
          type: CellType.wall,
          wallType: WallType.horizontal,
          thickness: config.wallThickness,
          color: config.wallColor,
        };
      }
    }
  }

  // 2. Build Central Ghost House (rows 8-12, centered horizontally)
  const midX = Math.floor(cols / 2);
  const houseYStart = 8;
  const houseYEnd = 12;
  const houseXStart = midX - 4;
  const houseXEnd = midX + 3;

  for (let y = houseYStart; y <= houseYEnd; y++) {
    for (let x = houseXStart; x <= houseXEnd; x++) {
      const idx = getIdx(x, y);

      if (y === houseYStart) {
        // Top edge of house with gate in the middle
        if (x === midX - 1 || x === midX) {
          cells[idx] = { type: CellType.empty, dot: DotType.never, taken: false };
        } else {
          cells[idx] = {
            type: CellType.wall,
            wallType: (x === houseXStart) ? WallType.cornerTopLeft : (x === houseXEnd) ? WallType.cornerTopRight : WallType.horizontal,
            thickness: config.wallThickness,
            color: 0xff55ff,
          };
        }
      } else if (y === houseYEnd) {
        // Bottom edge of house
        cells[idx] = {
          type: CellType.wall,
          wallType: (x === houseXStart) ? WallType.cornerBottomLeft : (x === houseXEnd) ? WallType.cornerBottomRight : WallType.horizontal,
          thickness: config.wallThickness,
          color: 0xff55ff,
        };
      } else if (x === houseXStart || x === houseXEnd) {
        // Side edges
        cells[idx] = {
          type: CellType.wall,
          wallType: WallType.vertical,
          thickness: config.wallThickness,
          color: 0xff55ff,
        };
      } else {
        // Inside ghost house (navigable but no dots)
        cells[idx] = { type: CellType.empty, dot: DotType.never, taken: false };
      }
    }
  }

  // Helper to safely set a rectangular wall island in the cells grid
  const addSymmetricIsland = (x1: number, x2: number, y1: number, y2: number) => {
    // Sequence of vibrant arcade neon colors (numeric hex values)
    const colors = [0xff4444, 0x00ffde, 0xffcc44, 0x00ff88, 0xd888ff, 0xffff55];
    const color = colors[(y1 + x1) % colors.length];

    const drawIsland = (lx1: number, lx2: number) => {
      for (let y = y1; y <= y2; y++) {
        for (let x = lx1; x <= lx2; x++) {
          const idx = getIdx(x, y);
          if (y === y1) {
            cells[idx] = {
              type: CellType.wall,
              wallType: (x === lx1) ? WallType.cornerTopLeft : (x === lx2) ? WallType.cornerTopRight : WallType.horizontal,
              thickness: config.wallThickness,
              color: color,
            };
          } else if (y === y2) {
            cells[idx] = {
              type: CellType.wall,
              wallType: (x === lx1) ? WallType.cornerBottomLeft : (x === lx2) ? WallType.cornerBottomRight : WallType.horizontal,
              thickness: config.wallThickness,
              color: color,
            };
          } else if (x === lx1 || x === lx2) {
            cells[idx] = {
              type: CellType.wall,
              wallType: WallType.vertical,
              thickness: config.wallThickness,
              color: color,
            };
          } else {
            cells[idx] = { type: CellType.empty, dot: DotType.never, taken: false };
          }
        }
      }
    };

    // Left side island
    drawIsland(x1, x2);
    // Symmetric right side island
    const rx1 = cols - 1 - x2;
    const rx2 = cols - 1 - x1;
    drawIsland(rx1, rx2);
  };

  // 3. Build Symmetric Rectangular Wall Islands in bands (avoiding corridors and ghost house)
  // Left half playable boundaries: x from 2 to midX - 6
  const leftEnd = midX - 6;

  // Horizontal bands for islands:
  // Band 1: rows 2-4
  // Band 2: rows 6-7
  // Band 3: rows 14-16
  // Band 4: rows 18-20
  // Band 5: rows 22-23

  for (let startX = 2; startX <= leftEnd; startX += 6) {
    const endX = Math.min(startX + 3, leftEnd);
    if (endX - startX >= 1) {
      addSymmetricIsland(startX, endX, 2, 4);
      addSymmetricIsland(startX, endX, 6, 7);
      addSymmetricIsland(startX, endX, 14, 16);
      addSymmetricIsland(startX, endX, 18, 20);
      addSymmetricIsland(startX, endX, 22, 23);
    }
  }

  // 4. Clean up any dots inside the warp tunnel row (row 9)
  for (let x = 0; x < cols; x++) {
    if (x < 2 || x >= cols - 2) {
      const idx = getIdx(x, 9);
      if (cells[idx].type === CellType.empty) {
        (cells[idx] as any).dot = DotType.never;
      }
    }
  }

  // 5. Add 4 Power Pellets near the four corners
  const pelletPositions = [
    { x: 2, y: 3 },
    { x: cols - 3, y: 3 },
    { x: 2, y: 22 },
    { x: cols - 3, y: 22 },
  ];
  for (const pos of pelletPositions) {
    const idx = getIdx(pos.x, pos.y);
    if (cells[idx].type === CellType.empty) {
      (cells[idx] as any).dot = DotType.power;
    }
  }

  return cells;
}
