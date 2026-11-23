/**
 * Butterfly Cursor Effect
 * Vanilla JS + Canvas + CSS (Zero Dependencies)
 *
 * Parameters:
 * - Wingspan: 16px
 * - Flap speed: 3.5Hz (sine-driven)
 * - Follow lerp: 0.07
 * - Wander radius: 6px (slow organic offset)
 * - Colour: Gradient #FF8FD0 -> #5B9BF6 @ 90deg
 *
 * Accessibility:
 * - Never hides native cursor (no cursor: none, native pointer keeps all states)
 * - Additive overlay: position: fixed, pointer-events: none, aria-hidden="true"
 * - Respects prefers-reduced-motion: reduce (teardown / unmounted)
 * - Respects (hover: hover) and (pointer: fine) (disabled on touch/coarse)
 * - Sized to devicePixelRatio (capped at 2)
 * - Single rAF loop with full teardown cleanup
 */

export function createButterflyCursor(options = {}) {
  const config = {
    wingspan: options.wingspan ?? 16, // px
    flapSpeed: options.flapSpeed ?? 3.5, // Hz
    follow: options.follow ?? 0.07, // lerp factor
    wander: options.wander ?? 6, // px
    colorStart: options.colorStart ?? '#FF8FD0',
    colorEnd: options.colorEnd ?? '#5B9BF6',
    container: options.container ?? document.body,
    isFixed: options.isFixed ?? true,
    ...options
  };

  // Accessibility queries
  const hoverFineQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  let canvas = null;
  let ctx = null;
  let rafId = null;
  let resizeObserver = null;

  // Coordinate tracking
  let pointerX = -100;
  let pointerY = -100;
  let currentX = -100;
  let currentY = -100;
  let prevX = -100;
  let prevY = -100;

  // Heading & banking
  let heading = 0; // current flight direction in radians
  let bankAngle = 0; // roll into turns
  let hasPointerMoved = false;
  let isOverInteractive = false;

  // Time tracking
  let lastTimestamp = performance.now();

  function shouldActivate() {
    return hoverFineQuery.matches && !reducedMotionQuery.matches;
  }

  function createCanvas() {
    canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.className = 'butterfly-cursor-overlay';

    Object.assign(canvas.style, {
      position: config.isFixed ? 'fixed' : 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: '999999',
      display: 'block'
    });

    config.container.appendChild(canvas);
    ctx = canvas.getContext('2d');
    updateCanvasSize();
  }

  function updateCanvasSize() {
    if (!canvas || !ctx) return;
    const rect = config.isFixed
      ? { width: window.innerWidth, height: window.innerHeight }
      : config.container.getBoundingClientRect();

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const displayWidth = Math.max(1, Math.floor(rect.width));
    const displayHeight = Math.max(1, Math.floor(rect.height));

    canvas.width = Math.floor(displayWidth * dpr);
    canvas.height = Math.floor(displayHeight * dpr);
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    ctx.scale(dpr, dpr);
  }

  function onPointerMove(e) {
    if (config.isFixed) {
      pointerX = e.clientX;
      pointerY = e.clientY;
    } else {
      const rect = config.container.getBoundingClientRect();
      pointerX = e.clientX - rect.left;
      pointerY = e.clientY - rect.top;
    }

    if (!hasPointerMoved) {
      currentX = pointerX;
      currentY = pointerY;
      prevX = pointerX;
      prevY = pointerY;
      hasPointerMoved = true;
    }

    // Check if element under pointer is interactive (a, button, input)
    try {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      isOverInteractive = !!(el && el.closest('a, button, input, [role="button"], textarea, select'));
    } catch {
      isOverInteractive = false;
    }
  }

  function drawButterfly(x, y, headingAngle, bank, flapPhase) {
    if (!ctx) return;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(headingAngle);

    // Flap factor driven by sine at specified flap speed
    // Value oscillates between ~0.15 (wings raised) and 1.0 (wings flat)
    const rawFlap = Math.sin(flapPhase);
    const flapSpread = 0.2 + 0.8 * Math.abs(rawFlap);
    const flapDir = rawFlap >= 0 ? 1 : -1;

    // Wingspan scaling: Total wingspan is 16px when fully spread (8px on each side)
    const halfSpan = config.wingspan / 2; // 8px
    const wingLen = 10; // forewing length forward/outward
    const hindLen = 6.5; // hindwing length backward/outward

    // Linear gradient @ 90deg (horizontal across left-right wing axis)
    // Left wing: #FF8FD0 -> Center -> Right wing: #5B9BF6
    const grad = ctx.createLinearGradient(-halfSpan, 0, halfSpan, 0);
    grad.addColorStop(0, config.colorStart);
    grad.addColorStop(1, config.colorEnd);

    // Subtle bank roll: asymmetric scaling to bank into turns
    const bankLeft = 1 + bank * 0.35;
    const bankRight = 1 - bank * 0.35;

    // --- LEFT WINGS ---
    ctx.save();
    ctx.scale(-flapSpread * bankLeft, 1);
    ctx.fillStyle = grad;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 0.5;

    // Left Forewing
    ctx.beginPath();
    ctx.moveTo(0, -1);
    ctx.bezierCurveTo(-halfSpan * 0.45, -wingLen * 0.9, -halfSpan * 1.05, -wingLen * 0.55, -halfSpan, -1);
    ctx.bezierCurveTo(-halfSpan * 0.95, 2, -halfSpan * 0.35, 1, 0, 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Left Hindwing
    ctx.beginPath();
    ctx.moveTo(0, 0.5);
    ctx.bezierCurveTo(-halfSpan * 0.75, 1.5, -halfSpan * 0.85, hindLen * 0.8, -halfSpan * 0.4, hindLen);
    ctx.bezierCurveTo(-halfSpan * 0.15, hindLen * 0.95, -0.5, hindLen * 0.5, 0, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // --- RIGHT WINGS ---
    ctx.save();
    ctx.scale(flapSpread * bankRight, 1);
    ctx.fillStyle = grad;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 0.5;

    // Right Forewing
    ctx.beginPath();
    ctx.moveTo(0, -1);
    ctx.bezierCurveTo(halfSpan * 0.45, -wingLen * 0.9, halfSpan * 1.05, -wingLen * 0.55, halfSpan, -1);
    ctx.bezierCurveTo(halfSpan * 0.95, 2, halfSpan * 0.35, 1, 0, 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right Hindwing
    ctx.beginPath();
    ctx.moveTo(0, 0.5);
    ctx.bezierCurveTo(halfSpan * 0.75, 1.5, halfSpan * 0.85, hindLen * 0.8, halfSpan * 0.4, hindLen);
    ctx.bezierCurveTo(halfSpan * 0.15, hindLen * 0.95, 0.5, hindLen * 0.5, 0, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // --- SLENDER BODY & HEAD ---
    ctx.fillStyle = '#22222b';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 0.4;

    // Thorax & Abdomen
    ctx.beginPath();
    ctx.ellipse(0, 1, 1.1, 4.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Head
    ctx.beginPath();
    ctx.arc(0, -3.2, 1.0, 0, Math.PI * 2);
    ctx.fill();

    // Antennae
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.moveTo(-0.4, -3.5);
    ctx.quadraticCurveTo(-2, -5.5, -3, -6.5);
    ctx.moveTo(0.4, -3.5);
    ctx.quadraticCurveTo(2, -5.5, 3, -6.5);
    ctx.stroke();

    // Wing hinge sheen / center glow highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.arc(0, -0.5, 0.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function loop(timestamp) {
    if (!ctx || !canvas) return;

    const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
    lastTimestamp = timestamp;

    const t = timestamp / 1000;

    // Clear frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (hasPointerMoved) {
      // 1. Slow organic wander offset (6px radius) using incommensurate frequencies
      // Keeps the butterfly from ever sitting perfectly stationary on the pointer
      const wanderX = (Math.sin(t * 1.3) * 0.65 + Math.cos(t * 2.1) * 0.35) * config.wander;
      const wanderY = (Math.cos(t * 1.1) * 0.65 + Math.sin(t * 1.9) * 0.35) * config.wander;

      // When hovering an interactive element, excited fluttering / slightly closer tracking
      const targetFollow = isOverInteractive ? Math.min(config.follow * 1.35, 0.15) : config.follow;
      const currentFlapSpeed = isOverInteractive ? config.flapSpeed * 1.3 : config.flapSpeed;

      const targetX = pointerX + wanderX;
      const targetY = pointerY + wanderY;

      // 2. Follow lerp (0.07)
      currentX += (targetX - currentX) * targetFollow;
      currentY += (targetY - currentY) * targetFollow;

      // 3. Velocity and Heading Calculation
      const vx = currentX - prevX;
      const vy = currentY - prevY;
      const speed = Math.hypot(vx, vy);

      if (speed > 0.15) {
        // Point in direction of motion (atan2(vy, vx) + PI/2 puts head forward)
        const targetHeading = Math.atan2(vy, vx) + Math.PI / 2;

        // Smooth shortest-path angle interpolation
        let diff = targetHeading - heading;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;

        heading += diff * 0.14;

        // 4. Banking into turns: rate of turn banks the body
        const targetBank = Math.max(-0.7, Math.min(0.7, diff * 3.0));
        bankAngle += (targetBank - bankAngle) * 0.12;
      } else {
        // Subtle ambient breathing/yaw drift when stationary
        heading += Math.sin(t * 2.2) * 0.012;
        bankAngle *= 0.92;
      }

      prevX = currentX;
      prevY = currentY;

      // 5. Sine-driven wing flap
      const flapPhase = t * 2 * Math.PI * currentFlapSpeed;

      // Render the butterfly
      drawButterfly(currentX, currentY, heading, bankAngle, flapPhase);
    }

    rafId = requestAnimationFrame(loop);
  }

  function start() {
    if (!shouldActivate()) {
      teardown();
      return;
    }

    if (!canvas) {
      createCanvas();
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('resize', updateCanvasSize, { passive: true });

    if (window.ResizeObserver && !config.isFixed) {
      resizeObserver = new ResizeObserver(() => updateCanvasSize());
      resizeObserver.observe(config.container);
    }

    hoverFineQuery.addEventListener('change', onMediaChange);
    reducedMotionQuery.addEventListener('change', onMediaChange);

    lastTimestamp = performance.now();
    if (!rafId) {
      rafId = requestAnimationFrame(loop);
    }
  }

  function onMediaChange() {
    if (shouldActivate()) {
      start();
    } else {
      teardown();
    }
  }

  function teardown() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('resize', updateCanvasSize);

    hoverFineQuery.removeEventListener('change', onMediaChange);
    reducedMotionQuery.removeEventListener('change', onMediaChange);

    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }

    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
    canvas = null;
    ctx = null;
  }

  // Initialize
  if (shouldActivate()) {
    start();
  } else {
    // Listen for future capability changes (e.g. user toggles reduced motion or docks device)
    hoverFineQuery.addEventListener('change', onMediaChange);
    reducedMotionQuery.addEventListener('change', onMediaChange);
  }

  return {
    destroy: teardown,
    updateCanvasSize,
    isSupported: shouldActivate
  };
}

// Auto-instantiate if loaded directly with data-auto-init
if (typeof document !== 'undefined') {
  if (document.currentScript && document.currentScript.hasAttribute('data-auto-init')) {
    window.butterflyCursorInstance = createButterflyCursor();
  }
}
