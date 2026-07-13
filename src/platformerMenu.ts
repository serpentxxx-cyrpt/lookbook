/**
 * Pixel Platformer Header Menu
 * Draws everything (track, brick tiles, Blinky ghost, labels) on a single canvas.
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
const TILE_H = 8;    // height of one brick tile
const TILE_GAP = 2;    // gap between tiles
const TILE_COUNT = 3;
const TILE_TOTAL = TILE_COUNT * TILE_H + (TILE_COUNT - 1) * TILE_GAP; // 28px
const COL_W = 40;   // column width
const UP_DIST = 22;   // how far tiles rise when in UP state
const GHOST_W = 20;
const GHOST_H = 20;
const WALK_SPEED = 2.5;
const JUMP_VEL = -8;
const GRAVITY = 0.42;
const PROX_DIST = 32;   // bubble trigger distance (px)

// ── Mutable state ────────────────────────────────────────────────────────────
let canvasW = 0;

let bX = 30;              // blinky center-X
let bY = TRACK_Y;         // blinky bottom-Y (on track)
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
  xPx: number;   // center X in canvas coords
  isUp: boolean;
  topY: number;   // top Y of tile stack (cached, updated on each cycle)
}

const colStates: ColState[] = ITEMS.map(() => ({ xPx: 0, isUp: false, topY: 0 }));

function calcColTopY(c: ColState): number {
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
    colStates[i].topY = calcColTopY(colStates[i]);
  });
}

// ── Tile rise / fall cycles ───────────────────────────────────────────────────
function scheduleCycle(i: number): void {
  const ms = 1400 + Math.random() * 2600;
  setTimeout(() => {
    colStates[i].isUp = !colStates[i].isUp;
    colStates[i].topY = calcColTopY(colStates[i]);
    scheduleCycle(i);
  }, ms);
}

// ── Horizontal collision (blocks entity when tile is down) ────────────────────
function clampX(nx: number): number {
  const half = GHOST_W / 2;
  for (let i = 0; i < colStates.length; i++) {
    if (onCol === i) continue;
    const c = colStates[i];
    if (c.isUp) continue;
    const cx = c.xPx, hw = COL_W / 2;
    if (nx + half > cx - hw && nx - half < cx + hw) {
      return bX < cx ? cx - hw - half - 1 : cx + hw + half + 1;
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

// ── Draw one brick tile ───────────────────────────────────────────────────────
function drawTile(tx: number, ty: number, color: string, darkColor: string): void {
  // Base color
  ctx.fillStyle = color;
  ctx.fillRect(tx, ty, COL_W, TILE_H);
  // Bottom shadow
  ctx.fillStyle = darkColor;
  ctx.fillRect(tx, ty + TILE_H - 2, COL_W, 2);
  // Vertical mortar divider (offset per row using ty)
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  const offset = Math.round(ty / TILE_H) % 2 === 0 ? 0 : COL_W / 2;
  ctx.fillRect(tx + COL_W / 2 + offset - (offset > 0 ? COL_W / 2 : 0), ty, 1, TILE_H - 2);
  // Horizontal mortar (bottom)
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(tx, ty + TILE_H - 1, COL_W, 1);
}

// ── Main animation loop ───────────────────────────────────────────────────────
function loop(): void {
  if (canvasW === 0) { requestAnimationFrame(loop); return; }

  // 1) Horizontal movement
  if (goLeft) { bX = clampX(bX - WALK_SPEED); faceLeft = true; }
  if (goRight) { bX = clampX(bX + WALK_SPEED); faceLeft = false; }

  // Sync slider when keyboard/button drives movement
  if ((goLeft || goRight) && canvasW > 0) {
    slider.value = String(Math.round(((bX - GHOST_W / 2 - 2) / (canvasW - GHOST_W - 4)) * 1000));
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
        const cTop = c.topY;                  // top Y of tile stack
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

  // 3) Ride column elevator (tiles move up/down while Blinky stands on them)
  if (onCol !== -1) {
    const c = colStates[onCol];
    const hw = COL_W / 2;
    if (bX < c.xPx - hw || bX > c.xPx + hw) {
      // Walked off edge — start falling
      onCol = -1; jumping = true;
    } else {
      bY = c.topY;   // snap to column surface as it animates
    }
  }

  // 4) Animate walk frames
  if (goLeft || goRight || jumping) {
    if (++aTick > 7) { aFrame = 1 - aFrame; aTick = 0; }
  }

  // 5) Clear canvas
  ctx.clearRect(0, 0, canvasW, CANVAS_H);

  // 6) Draw glowing double-line track
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

  // Add small vertical dashes (railroad ties)
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(33, 33, 222, 0.6)';
  ctx.shadowBlur = 0;
  for (let x = 0; x < canvasW; x += 12) {
    ctx.beginPath();
    ctx.moveTo(x, TRACK_Y + 1);
    ctx.lineTo(x, TRACK_Y + 5);
    ctx.stroke();
  }
  ctx.restore();

  // 7) Draw brick tile columns + labels
  ctx.save();
  ctx.font = '7px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  for (let i = 0; i < colStates.length; i++) {
    const c = colStates[i];
    const item = ITEMS[i];
    const tx = c.xPx - COL_W / 2;

    // Draw 3 stacked tiles
    for (let t = 0; t < TILE_COUNT; t++) {
      const ty = c.topY + t * (TILE_H + TILE_GAP);
      drawTile(tx, ty, item.color, item.darkColor);
    }

    // Label below tile stack (at track level)
    ctx.fillStyle = item.color;
    ctx.shadowColor = item.color;
    ctx.shadowBlur = 4;
    ctx.fillText(item.label, c.xPx, TRACK_Y + 6);
    ctx.shadowBlur = 0;
  }
  ctx.restore();

  // 8) Draw Blinky ghost ON TOP of everything
  drawBlinky(bX, bY, faceLeft, aFrame);

  // 9) Bubble proximity check
  let nearIdx = -1;
  for (let i = 0; i < colStates.length; i++) {
    if (Math.abs(bX - colStates[i].xPx) < PROX_DIST || onCol === i) {
      nearIdx = i; break;
    }
  }

  if (nearIdx !== -1) {
    const item = ITEMS[nearIdx];
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
  } else {
    (bubble as HTMLElement).style.display = 'none';
    activeRoute = '';
  }

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
    bX = clampX(GHOST_W / 2 + 2 + pct * (canvasW - GHOST_W - 4));
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
  bY = TRACK_Y;
  requestAnimationFrame(loop);
}

// Astro scripts run after DOM is ready — call directly
init();
