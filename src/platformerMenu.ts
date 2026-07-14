/**
 * Pixel Platformer Header Menu
 * Draws everything (track, grass island tiles, Blinky ghost, labels) on a single canvas.
 * Uses ResizeObserver to reliably get canvas width after layout is complete.
 * No imports from main.ts — communicates via custom window events.
 */

// ── Navigation (no circular imports) ────────────────────────────────────────
function navigateTo(route: string): void {
  window.dispatchEvent(new CustomEvent('platformer-navigate', { detail: { route } }));
}

// ── Menu item definitions ────────────────────────────────────────────────────
const ITEMS = [
  { route: '/about', label: 'ABOUT', color: '#ff4444', darkColor: '#880000', xPct: 0.2 },
  { route: '/portfolio', label: 'PORTFOLIO', color: '#ffb8de', darkColor: '#993366', xPct: 0.4 },
  { route: '/contact', label: 'CONTACT', color: '#ffcc44', darkColor: '#886600', xPct: 0.6 },
  { route: '/resume', label: 'CV', color: '#00ffee', darkColor: '#008877', xPct: 0.8 },
];

// ── Layout constants (canvas-space, in pixels) ───────────────────────────────
const CANVAS_H = 86;   // total canvas height
const TRACK_Y = 72;   // Y of the floor/track line (ghost bottom rests here)
const TILE_H = 8;    // height of one tile block
const TILE_GAP = 2;    // gap between tiles
const TILE_COUNT = 3;
const TILE_TOTAL = TILE_COUNT * TILE_H + (TILE_COUNT - 1) * TILE_GAP; // 28px
const COL_W = 40;   // column width
const UP_DIST = 22;   // how far tiles rise when in UP state
const GHOST_W = 20;
const GHOST_H = 20;
const WALK_SPEED = 1.5; // reduced speed for smoother movement
const JUMP_VEL = -8;
const GRAVITY = 0.42;

// ── Mutable state ────────────────────────────────────────────────────────────
let canvasW = 0;

let bX = 30;              // blinky center-X
let bY = TRACK_Y;         // blinky bottom-Y (on track)
let targetX = 30;         // target X position for smooth elastic lerp movement
let vY = 0;               // vertical velocity
let jumping = false;
let onCol = -1;           // index of column Blinky stands on (-1 = on floor)
let goLeft = false;
let goRight = false;
let faceLeft = false;
let aFrame = 0;
let aTick = 0;
let activeRoute = '';

interface ColState {
  xPx: number;         // center X in canvas coords
  isUp: boolean;
  targetY: number;     // target Y of tile stack top (for lerp)
  topY: number;        // current animated top Y position
  levTime: number;     // custom time offset for sinusoidal float wave
  floatOffset: number; // offset of floating levitation
}

const colStates: ColState[] = ITEMS.map((_, i) => {
  const targetY = TRACK_Y - TILE_TOTAL;
  return {
    xPx: 0,
    isUp: false,
    targetY,
    topY: targetY,
    levTime: i * 1.5,
    floatOffset: 0
  };
});

function calcColTargetY(c: ColState): number {
  return c.isUp ? TRACK_Y - TILE_TOTAL - UP_DIST : TRACK_Y - TILE_TOTAL;
}

// ── DOM refs (obtained in init) ──────────────────────────────────────────────
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let slider: HTMLInputElement;
let bubble: HTMLElement;
let bubbleText: HTMLElement;

// ── Resize: use ResizeObserver so we always get real layout width ─────────────
function syncSize(): void {
  const w = canvas.parentElement?.clientWidth ?? window.innerWidth;
  if (w === canvasW) return;
  canvasW = w;
  canvas.width = w;
  canvas.height = CANVAS_H;
  // Recalc column positions
  ITEMS.forEach((item, i) => {
    colStates[i].xPx = item.xPct * w;
    colStates[i].targetY = calcColTargetY(colStates[i]);
    if (colStates[i].topY === 0 || colStates[i].topY === TRACK_Y - TILE_TOTAL) {
      colStates[i].topY = colStates[i].targetY;
    }
  });
}

// ── Tile rise / fall cycles ───────────────────────────────────────────────────
function scheduleCycle(i: number): void {
  const ms = 1400 + Math.random() * 2600;
  setTimeout(() => {
    colStates[i].isUp = !colStates[i].isUp;
    colStates[i].targetY = calcColTargetY(colStates[i]);
    scheduleCycle(i);
  }, ms);
}

// ── Real physics height-based collision ───────────────────────────────────────
function clampX(nx: number): number {
  const half = GHOST_W / 2;
  const ghostBottom = bY;
  const ghostTop = bY - GHOST_H;

  for (let i = 0; i < colStates.length; i++) {
    if (onCol === i) continue;
    const c = colStates[i];
    const colTop = c.topY + c.floatOffset;

    // The ghost is blocked horizontally only if it overlaps vertically with the column
    if (ghostBottom > colTop && ghostTop < TRACK_Y) {
      const cx = c.xPx, hw = COL_W / 2;
      if (nx + half > cx - hw && nx - half < cx + hw) {
        return bX < cx ? cx - hw - half - 1 : cx + hw + half + 1;
      }
    }
  }
  return Math.max(half + 2, Math.min(canvasW - half - 2, nx));
}

// ── Jump ──────────────────────────────────────────────────────────────────────
function doJump(): void {
  if (!jumping) {
    vY = JUMP_VEL;
    jumping = true;
  }
}

// ── Draw Blinky (pixel-art red ghost) ────────────────────────────────────────
function drawBlinky(cx: number, by: number, left: boolean, frame: number): void {
  const x = Math.round(cx - GHOST_W / 2);
  const y = Math.round(by - GHOST_H);

  // Body (rounded top, rect bottom)
  ctx.fillStyle = '#ff0000';
  ctx.beginPath();
  ctx.arc(x + GHOST_W / 2, y + GHOST_W / 2 - 1, GHOST_W / 2, Math.PI, 0);
  ctx.rect(x, y + GHOST_H / 2 - 1, GHOST_W, GHOST_H / 2 + 1);
  ctx.fill();

  // Wavy skirt (alternating frame)
  const sy = y + GHOST_H - 3;
  ctx.fillStyle = '#000';
  if (frame === 0) {
    ctx.fillRect(x + 3, sy, 4, 4);
    ctx.fillRect(x + 13, sy, 4, 4);
  } else {
    ctx.fillRect(x + 8, sy, 4, 4);
  }

  // Eyes
  const ex1 = left ? x + 3 : x + 5;
  const ex2 = left ? x + 12 : x + 14;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(ex1 + 1, y + 7, 3, 4, 0, 0, Math.PI * 2);
  ctx.ellipse(ex2 + 1, y + 7, 3, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  const px = left ? -1 : 1;
  ctx.fillStyle = '#2121de';
  ctx.fillRect(ex1 + px, y + 6, 2, 3);
  ctx.fillRect(ex2 + px, y + 6, 2, 3);
}

// ── Draw Grass Island Tiles ──────────────────────────────────────────────────
function drawGrassTile(tx: number, ty: number, isTop: boolean): void {
  if (isTop) {
    // Grass top: green surface
    ctx.fillStyle = '#38c238'; // vibrant grass green
    ctx.fillRect(tx, ty, COL_W, TILE_H);
    // Grass details (blades)
    ctx.fillStyle = '#6ef06e'; // light grass green
    for (let gx = tx + 2; gx < tx + COL_W; gx += 6) {
      ctx.fillRect(gx, ty, 2, 2);
      ctx.fillRect(gx + 1, ty + 1, 1, 2);
    }
    // Bottom shadow of grass
    ctx.fillStyle = '#228c22'; // dark green
    ctx.fillRect(tx, ty + TILE_H - 2, COL_W, 2);
  } else {
    // Dirt body
    ctx.fillStyle = '#855723'; // brown dirt
    ctx.fillRect(tx, ty, COL_W, TILE_H);
    // Speckles of stones/roots
    ctx.fillStyle = '#5c3a17'; // dark brown
    ctx.fillRect(tx + 4, ty + 2, 2, 2);
    ctx.fillRect(tx + 16, ty + 4, 3, 2);
    ctx.fillRect(tx + 28, ty + 2, 2, 2);
    // Bottom shadow of dirt
    ctx.fillStyle = '#472d12'; // darker brown shadow
    ctx.fillRect(tx, ty + TILE_H - 1, COL_W, 1);
  }
}

// ── Main animation loop ───────────────────────────────────────────────────────
function loop(): void {
  if (canvasW === 0) { requestAnimationFrame(loop); return; }

  // 1) Horizontal smooth lerp movement
  if (goLeft) { targetX = Math.max(GHOST_W / 2 + 2, targetX - WALK_SPEED); }
  if (goRight) { targetX = Math.min(canvasW - GHOST_W / 2 - 2, targetX + WALK_SPEED); }

  // Sync slider to current bX when not actively dragging it
  if (document.activeElement !== slider && canvasW > 0) {
    slider.value = String(Math.round(((bX - GHOST_W / 2 - 2) / (canvasW - GHOST_W - 4)) * 1000));
  }

  // Smoothly slide ghost X towards target X with a dampened factor
  if (Math.abs(bX - targetX) > 0.1) {
    const step = (targetX - bX) * 0.12;
    const limitedStep = Math.max(-WALK_SPEED, Math.min(WALK_SPEED, step));
    bX = clampX(bX + limitedStep);
    faceLeft = targetX < bX;
    if (++aTick > 7) { aFrame = 1 - aFrame; aTick = 0; }
  }

  // Update tile heights (smooth rise/fall levitation animations)
  for (let i = 0; i < colStates.length; i++) {
    const c = colStates[i];
    c.topY += (c.targetY - c.topY) * 0.08;
    c.levTime += 0.05;
    c.floatOffset = Math.sin(c.levTime) * 2.5; // levitate wave
  }

  // 2) Vertical physics
  if (jumping || bY < TRACK_Y) {
    vY += GRAVITY;
    bY += vY;

    // Land on column tops (only when falling down: vY > 0)
    if (vY > 0) {
      for (let i = 0; i < colStates.length; i++) {
        const c = colStates[i];
        const hw = COL_W / 2;
        if (bX < c.xPx - hw || bX > c.xPx + hw) continue;
        const cTop = c.topY + c.floatOffset;                  // top Y of tile stack
        if (bY >= cTop && bY - vY <= cTop) {
          bY = cTop; vY = 0; jumping = false; onCol = i; break;
        }
      }
    }

    // Land on floor
    if (bY >= TRACK_Y) {
      bY = TRACK_Y; vY = 0; jumping = false; onCol = -1;
    }
  }

  // 3) Ride column elevator
  if (onCol !== -1) {
    const c = colStates[onCol];
    const hw = COL_W / 2;
    if (bX < c.xPx - hw || bX > c.xPx + hw) {
      // Walked off edge — start falling
      onCol = -1; jumping = true;
    } else {
      bY = c.topY + c.floatOffset;   // snap to animated column surface
    }
  }

  // 5) Clear canvas
  ctx.clearRect(0, 0, canvasW, CANVAS_H);

  // 6) Draw glowing double-line track with Pacman Dots
  ctx.save();
  ctx.strokeStyle = '#2121de';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#2121de';
  ctx.shadowBlur = 4;

  // Top track line
  ctx.beginPath();
  ctx.moveTo(0, TRACK_Y + 1);
  ctx.lineTo(canvasW, TRACK_Y + 1);
  ctx.stroke();

  // Bottom track line
  ctx.beginPath();
  ctx.moveTo(0, TRACK_Y + 5);
  ctx.lineTo(canvasW, TRACK_Y + 5);
  ctx.stroke();

  // Draw glowing Pacman food dots along the track
  ctx.lineWidth = 1;
  ctx.shadowBlur = 2;
  for (let x = 16; x < canvasW; x += 24) {
    // Avoid drawing dots where columns stand
    let overlap = false;
    for (const c of colStates) {
      if (x > c.xPx - COL_W / 2 - 4 && x < c.xPx + COL_W / 2 + 4) {
        overlap = true;
        break;
      }
    }
    if (!overlap) {
      ctx.fillStyle = '#ffff00';
      ctx.shadowColor = '#ffff00';
      ctx.beginPath();
      ctx.arc(x, TRACK_Y + 3, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // 7) Draw grass island columns + floating labels
  ctx.save();
  ctx.font = '7px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  for (let i = 0; i < colStates.length; i++) {
    const c = colStates[i];
    const item = ITEMS[i];
    const tx = c.xPx - COL_W / 2;
    const renderY = c.topY + c.floatOffset;

    // Draw 3 stacked grass island tiles
    for (let t = 0; t < TILE_COUNT; t++) {
      const ty = renderY + t * (TILE_H + TILE_GAP);
      drawGrassTile(tx, ty, t === 0);
    }

    // Label floating above the top of the island (rises/falls synchronously)
    ctx.fillStyle = item.color;
    ctx.shadowColor = item.color;
    ctx.shadowBlur = 4;
    ctx.fillText(item.label, c.xPx, renderY - 12);
    ctx.shadowBlur = 0;
  }
  ctx.restore();

  // 8) Draw Blinky ghost ON TOP of everything
  drawBlinky(bX, bY, faceLeft, aFrame);

  // 9) Always-visible bubble tracker: follows ghost and displays closest category option
  let closestIdx = 0;
  let minDist = Infinity;
  for (let i = 0; i < colStates.length; i++) {
    const dist = Math.abs(bX - colStates[i].xPx);
    if (dist < minDist) {
      minDist = dist;
      closestIdx = i;
    }
  }

  const item = ITEMS[closestIdx];
  activeRoute = item.route;
  bubbleText.textContent = item.label;
  (bubbleText as HTMLElement).style.color = item.color;

  const rect = canvas.getBoundingClientRect();
  const bbl = bubble as HTMLElement;
  bbl.style.display = 'flex';
  const bw = bbl.offsetWidth || 90;
  const bh = bbl.offsetHeight || 48;
  bbl.style.left = `${Math.max(8, Math.min(window.innerWidth - bw - 8, rect.left + bX - bw / 2))}px`;
  bbl.style.top = `${Math.max(8, rect.top + (bY - GHOST_H) - bh - 8)}px`;

  requestAnimationFrame(loop);
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
function init(): void {
  canvas = document.getElementById('entity-canvas') as HTMLCanvasElement;
  slider = document.getElementById('menu-slider') as HTMLInputElement;
  bubble = document.getElementById('pixel-bubble') as HTMLElement;
  bubbleText = document.getElementById('bubble-text') as HTMLElement;

  const leftBtn = document.getElementById('move-left-btn') as HTMLButtonElement;
  const rightBtn = document.getElementById('move-right-btn') as HTMLButtonElement;
  const jumpBtn = document.getElementById('jump-btn') as HTMLButtonElement;
  const openBtn = document.getElementById('bubble-open-btn') as HTMLButtonElement;

  if (!canvas || !slider || !bubble || !bubbleText || !leftBtn || !rightBtn || !jumpBtn) {
    console.warn('[platformerMenu] Could not find required DOM elements');
    return;
  }

  ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  if (!ctx) { console.warn('[platformerMenu] Could not get 2d context'); return; }

  // ── Canvas sizing via ResizeObserver ──────────────────────────────
  const ro = new ResizeObserver(() => syncSize());
  ro.observe(canvas.parentElement ?? document.body);
  syncSize(); // attempt immediate (may be 0 until layout pass)

  // ── Input: keyboard ───────────────────────────────────────────────
  window.addEventListener('keydown', e => {
    if (document.activeElement?.closest('#canvas-app')) return; // don't steal game keys
    if (e.key === 'ArrowLeft') { goLeft = true; faceLeft = true; e.preventDefault(); }
    if (e.key === 'ArrowRight') { goRight = true; faceLeft = false; e.preventDefault(); }
    if (e.key === 'ArrowUp') { doJump(); e.preventDefault(); }
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') goLeft = false;
    if (e.key === 'ArrowRight') goRight = false;
  });

  // ── Input: buttons ────────────────────────────────────────────────
  function press(btn: HTMLElement, start: () => void, end: () => void): void {
    btn.addEventListener('mousedown', e => { e.preventDefault(); start(); });
    btn.addEventListener('mouseup', e => { e.preventDefault(); end(); });
    btn.addEventListener('mouseleave', () => end());
    btn.addEventListener('touchstart', e => { e.preventDefault(); start(); }, { passive: false });
    btn.addEventListener('touchend', e => { e.preventDefault(); end(); }, { passive: false });
    btn.addEventListener('touchcancel', () => end());
  }
  press(leftBtn, () => { goLeft = true; faceLeft = true; }, () => { goLeft = false; });
  press(rightBtn, () => { goRight = true; faceLeft = false; }, () => { goRight = false; });
  press(jumpBtn, () => doJump(), () => { });

  // ── Input: slider ─────────────────────────────────────────────────
  slider.addEventListener('input', () => {
    const pct = parseInt(slider.value) / 1000;
    const rawTargetX = GHOST_W / 2 + 2 + pct * (canvasW - GHOST_W - 4);
    targetX = clampX(rawTargetX);
    slider.value = String(Math.round(((targetX - GHOST_W / 2 - 2) / (canvasW - GHOST_W - 4)) * 1000));
  });

  // ── Bubble open ───────────────────────────────────────────────────
  openBtn.addEventListener('click', () => {
    if (activeRoute) navigateTo(activeRoute);
  });

  // ── Tile cycles (stagger starts) ──────────────────────────────────
  ITEMS.forEach((_, i) => {
    setTimeout(() => scheduleCycle(i), i * 800 + Math.random() * 800);
  });

  // ── Start loop ────────────────────────────────────────────────────
  bX = 30;
  targetX = 30;
  bY = TRACK_Y;
  requestAnimationFrame(loop);
}

// Astro scripts run after DOM is ready — call directly
init();
