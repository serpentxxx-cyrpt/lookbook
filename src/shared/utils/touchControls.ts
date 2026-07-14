// src/shared/utils/touchControls.ts
// Adds mobile touch gestures: swipe left/right to move, swipe up to jump.
// Works with the existing keyboard‑target system (menu / pacman).

export function enableTouchControls(): void {
  let startX = 0;
  let startY = 0;
  const minDist = 30; // minimum px movement to be considered a swipe

  function handleStart(e: TouchEvent): void {
    const popup = document.getElementById('instructions-popup');
    // If popup is visible, ignore touches
    if (popup && popup.style.display !== 'none' && popup.style.visibility !== 'hidden') {
      return;
    }
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
  }


  function handleEnd(e: TouchEvent): void {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;

    const target = (window as any).keyboardControlTarget || 'menu';
    // Only act when in pacman or menu mode – same logic as key events.
    if (target !== 'pacman' && target !== 'menu') return;

    // Horizontal swipe -> move left/right
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minDist) {
      if (deltaX > 0) {
        // swipe right
        const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
        document.dispatchEvent(event);
      } else {
        // swipe left
        const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
        document.dispatchEvent(event);
      }
    }

    // Up swipe (vertical) -> jump
    if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY < -minDist) {
      // dispatch the same logic used by the jump button / up arrow
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      document.dispatchEvent(event);
    }
  }

  document.addEventListener('touchstart', handleStart, { passive: true });
  document.addEventListener('touchend', handleEnd);
}
