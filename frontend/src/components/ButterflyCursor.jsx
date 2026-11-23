import React, { useEffect, useRef, useState } from 'react';

/**
 * ButterflyCursor
 * 
 * High-performance, production-grade custom butterfly cursor overlay implemented
 * using vanilla JavaScript and HTML5 Canvas 2D.
 * 
 * Specifications:
 * - Wingspan: 40px
 * - Flap frequency: 9Hz using sine oscillation
 * - Follow interpolation: 0.07
 * - Wander amplitude: 14px
 * - Gradient: #FF8FD0 to #5B9BF6 at 90 degrees
 * - Body banks naturally based on horizontal pointer velocity
 * - Articulated wings rotating/scaling around attachment points
 * - Interactive hover reaction for: a, button, input (via closest())
 * - Single requestAnimationFrame loop
 * - Capped devicePixelRatio at 2
 * - Responsive canvas resize
 * - Preserves native system cursor (never cursor:none or cursor:url())
 * - Overlay: position:fixed, pointer-events:none, aria-hidden="true"
 * - Respects prefers-reduced-motion
 * - Activates only when (hover:hover) and (pointer:fine) match
 * - Responsive to live media query changes
 * - Full cleanup of event listeners and animation frames
 */
export default function ButterflyCursor() {
  const canvasRef = useRef(null);
  const [isSupported, setIsSupported] = useState(false);

  // Capability & Motion Media Queries
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hoverMql = window.matchMedia('(hover: hover)');
    const pointerMql = window.matchMedia('(pointer: fine)');
    const motionMql = window.matchMedia('(prefers-reduced-motion: reduce)');

    const evaluateSupport = () => {
      const active = hoverMql.matches && pointerMql.matches && !motionMql.matches;
      setIsSupported(active);
    };

    evaluateSupport();

    hoverMql.addEventListener('change', evaluateSupport);
    pointerMql.addEventListener('change', evaluateSupport);
    motionMql.addEventListener('change', evaluateSupport);

    return () => {
      hoverMql.removeEventListener('change', evaluateSupport);
      pointerMql.removeEventListener('change', evaluateSupport);
      motionMql.removeEventListener('change', evaluateSupport);
    };
  }, []);

  // Main Canvas Animation Loop
  useEffect(() => {
    if (!isSupported) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = null;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Coordinate & Kinematics State
    const pointer = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      active: false,
      visible: false
    };

    const prevPointer = {
      x: pointer.x,
      y: pointer.y,
      time: performance.now()
    };

    // Smoothed horizontal velocity for banking
    let smoothedVx = 0;
    let currentBank = 0; // In radians
    let currentHeading = 0; // In radians

    // Butterfly position
    let butterflyX = pointer.x;
    let butterflyY = pointer.y;
    let opacity = 0; // Fade in smoothly when pointer enters

    // Hover detection state
    let isHovering = false;

    // Dust particles trail (subtle, ethereal, max 20)
    const sparkles = [];

    // Resize handler with DPR capping at 2
    const handleResize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Pointer move handler
    const handlePointerMove = (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.visible = true;

      if (!pointer.active) {
        pointer.active = true;
        butterflyX = e.clientX;
        butterflyY = e.clientY;
        prevPointer.x = e.clientX;
        prevPointer.y = e.clientY;
        prevPointer.time = performance.now();
      }

      // Calculate instantaneous horizontal velocity
      const now = performance.now();
      const dt = Math.max(0.005, (now - prevPointer.time) / 1000);
      const instVx = (pointer.x - prevPointer.x) / dt;
      smoothedVx += (instVx - smoothedVx) * 0.18;
      prevPointer.x = pointer.x;
      prevPointer.y = pointer.y;
      prevPointer.time = now;

      // Element hover inspection via closest()
      try {
        const targetEl = document.elementFromPoint(e.clientX, e.clientY);
        const match = targetEl ? Boolean(targetEl.closest('a, button, input, [role="button"], select, textarea')) : false;
        isHovering = match;
      } catch (err) {
        isHovering = false;
      }
    };

    const handlePointerLeave = () => {
      pointer.visible = false;
      isHovering = false;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', handlePointerLeave, { passive: true });

    // Wing Drawing Function
    // Draws one wing starting at the attachment hinge (0, 0)
    const drawSingleWing = (wingCtx, wingGrad, isHovered, glowColor) => {
      wingCtx.save();

      // Soft luminescence glow on hover
      if (isHovered) {
        wingCtx.shadowBlur = 10;
        wingCtx.shadowColor = glowColor;
      } else {
        wingCtx.shadowBlur = 4;
        wingCtx.shadowColor = 'rgba(91, 155, 246, 0.35)';
      }

      // --- FOREWING (Large upper wing: reaches tip at X=18.5) ---
      wingCtx.beginPath();
      wingCtx.moveTo(0, 0); // Attachment point at thorax
      // Top leading edge curving out to tip at (18.5, -13)
      wingCtx.bezierCurveTo(4, -8, 10, -14, 18.5, -13);
      // Outer curved margin to (16, -2)
      wingCtx.bezierCurveTo(19, -8, 18, -4, 16, -2);
      // Trailing margin returning to attachment base
      wingCtx.bezierCurveTo(11, -1, 5, -0.5, 0, 0);
      wingCtx.fillStyle = wingGrad;
      wingCtx.fill();

      // Wing vein highlights (translucent white)
      wingCtx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      wingCtx.lineWidth = 0.6;
      wingCtx.beginPath();
      wingCtx.moveTo(0, 0);
      wingCtx.quadraticCurveTo(8, -7, 18.5, -13);
      wingCtx.moveTo(0, 0);
      wingCtx.quadraticCurveTo(9, -4, 16, -2);
      wingCtx.stroke();

      // Crisp subtle edge definition
      wingCtx.strokeStyle = 'rgba(30, 41, 59, 0.35)';
      wingCtx.lineWidth = 0.5;
      wingCtx.stroke();

      // --- HINDWING (Smaller lower wing: outer point at X=13) ---
      wingCtx.beginPath();
      wingCtx.moveTo(0, 0.5); // Attachment hinge
      // Outer margin curve to (13, 7.5)
      wingCtx.bezierCurveTo(5, 1, 12, 3, 13, 7.5);
      // Scalloped lower curve to (4.5, 10.5)
      wingCtx.bezierCurveTo(12, 11, 8, 12, 4.5, 10.5);
      // Inner margin curve returning to abdomen
      wingCtx.bezierCurveTo(2, 7, 1, 5, 0, 3);
      wingCtx.closePath();
      wingCtx.fillStyle = wingGrad;
      wingCtx.fill();

      // Hindwing vein detail
      wingCtx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      wingCtx.lineWidth = 0.5;
      wingCtx.beginPath();
      wingCtx.moveTo(0, 0.5);
      wingCtx.quadraticCurveTo(6, 4, 13, 7.5);
      wingCtx.moveTo(0, 0.5);
      wingCtx.quadraticCurveTo(3, 6, 4.5, 10.5);
      wingCtx.stroke();

      wingCtx.strokeStyle = 'rgba(30, 41, 59, 0.3)';
      wingCtx.lineWidth = 0.5;
      wingCtx.stroke();

      wingCtx.restore();
    };

    // Body & Antennae Drawing Function
    const drawBody = (bodyCtx) => {
      bodyCtx.save();

      // Abdomen & Thorax (slender dark navy/slate body)
      bodyCtx.fillStyle = '#1e293b';
      bodyCtx.beginPath();
      bodyCtx.ellipse(0, 0, 1.5, 6.5, 0, 0, Math.PI * 2);
      bodyCtx.fill();

      // Head
      bodyCtx.fillStyle = '#0f172a';
      bodyCtx.beginPath();
      bodyCtx.arc(0, -7.5, 1.8, 0, Math.PI * 2);
      bodyCtx.fill();

      // Antennae
      bodyCtx.strokeStyle = '#475569';
      bodyCtx.lineWidth = 0.7;
      bodyCtx.beginPath();
      bodyCtx.moveTo(-0.5, -8.5);
      bodyCtx.quadraticCurveTo(-2, -12, -4.5, -13.5);
      bodyCtx.moveTo(0.5, -8.5);
      bodyCtx.quadraticCurveTo(2, -12, 4.5, -13.5);
      bodyCtx.stroke();

      // Antenna Tips (matching gradient pink)
      bodyCtx.fillStyle = '#FF8FD0';
      bodyCtx.beginPath();
      bodyCtx.arc(-4.5, -13.5, 0.7, 0, Math.PI * 2);
      bodyCtx.arc(4.5, -13.5, 0.7, 0, Math.PI * 2);
      bodyCtx.fill();

      bodyCtx.restore();
    };

    let prevTime = performance.now();

    // Main Single Animation Loop
    const animate = (timestamp) => {
      const dt = Math.max(0.001, Math.min(0.1, (timestamp - prevTime) / 1000));
      prevTime = timestamp;

      // Fade in/out based on visibility
      if (pointer.visible && pointer.active) {
        opacity += (1 - opacity) * 0.1;
      } else {
        opacity += (0 - opacity) * 0.1;
      }

      // 1. WANDER OSCILLATION: Wander amplitude 14px
      // Harmonics produce an organic, lifelike fluttering drift around the pointer
      const wanderTime = timestamp * 0.0022;
      const wanderAmp = isHovering ? 5 : 14; // Tighten slightly during button interaction
      const wanderX = (Math.sin(wanderTime * 1.1) * 0.7 + Math.cos(wanderTime * 1.9) * 0.3) * wanderAmp;
      const wanderY = (Math.cos(wanderTime * 0.9) * 0.7 + Math.sin(wanderTime * 2.3) * 0.3) * wanderAmp;

      const targetX = pointer.x + wanderX;
      const targetY = pointer.y + wanderY;

      // 2. FOLLOW INTERPOLATION: Exact 0.07 factor
      const prevX = butterflyX;
      const prevY = butterflyY;
      butterflyX += (targetX - butterflyX) * 0.07;
      butterflyY += (targetY - butterflyY) * 0.07;

      // 3. HORIZONTAL VELOCITY & BODY BANKING
      // Calculate body banking angle (-0.55 to +0.55 rad) based on horizontal movement
      const moveVx = (butterflyX - prevX) / dt;
      smoothedVx += (moveVx - smoothedVx) * 0.12;
      const targetBank = Math.max(-0.55, Math.min(0.55, smoothedVx * 0.0012));
      currentBank += (targetBank - currentBank) * 0.14;

      // Flight Heading Direction
      const moveDx = butterflyX - prevX;
      const moveDy = butterflyY - prevY;
      const flightSpeed = Math.hypot(moveDx, moveDy);
      if (flightSpeed > 0.4) {
        const targetHeading = Math.atan2(moveDy, moveDx) + Math.PI / 2;
        let diff = targetHeading - currentHeading;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        currentHeading += diff * 0.1;
      }

      // 4. SINE FLAP ANIMATION: Flap frequency 9Hz
      // On hover over clickable targets, excitement increases frequency to 13Hz
      const flapFreq = isHovering ? 13 : 9;
      const flapPhase = (timestamp / 1000) * (2 * Math.PI * flapFreq);
      
      // Articulated 3D projection scale around wing attachment hinge
      // Cosine factor compresses wingspan from 1.0 down to ~0.22 at upright stroke
      const wingSpanFactor = 0.22 + 0.78 * Math.abs(Math.cos(flapPhase));
      const wingPitch = Math.sin(flapPhase) * 0.12;

      // 5. EMIT SPARKLE DUST ON HOVER OR FLIGHT
      if (opacity > 0.3 && (isHovering || flightSpeed > 2)) {
        if (Math.random() < (isHovering ? 0.35 : 0.15) && sparkles.length < 24) {
          sparkles.push({
            x: butterflyX + (Math.random() - 0.5) * 8,
            y: butterflyY + (Math.random() - 0.5) * 8,
            vx: (Math.random() - 0.5) * 0.8,
            vy: Math.random() * 0.5 + 0.2,
            life: 1.0,
            decay: Math.random() * 0.03 + 0.02,
            size: Math.random() * 1.5 + 0.8,
            color: Math.random() > 0.5 ? '#FF8FD0' : '#5B9BF6'
          });
        }
      }

      // --- RENDER CANVAS ---
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // Render & update sparkles
      for (let i = sparkles.length - 1; i >= 0; i--) {
        const p = sparkles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;

        if (p.life <= 0) {
          sparkles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life * opacity * 0.8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Render Butterfly if visible
      if (opacity > 0.01) {
        ctx.globalAlpha = opacity;
        ctx.save();
        ctx.translate(butterflyX, butterflyY);

        // Body banks naturally based on horizontal velocity + heading
        ctx.rotate(currentHeading + currentBank);

        // Subtle scale pulse on hover interaction
        const hoverScale = isHovering ? 1.08 : 1.0;
        ctx.scale(hoverScale, hoverScale);

        // 90-degree gradient from #FF8FD0 to #5B9BF6 across wingspan (-20 to +20)
        const wingGrad = ctx.createLinearGradient(0, -10, 18.5, 5);
        wingGrad.addColorStop(0, '#FF8FD0');
        wingGrad.addColorStop(1, '#5B9BF6');

        // RIGHT WING: Articulated around attachment point at (+1.5, -1.5)
        ctx.save();
        ctx.translate(1.5, -1.5);
        ctx.scale(wingSpanFactor, 1);
        ctx.rotate(wingPitch);
        drawSingleWing(ctx, wingGrad, isHovering, '#FF8FD0');
        ctx.restore();

        // LEFT WING: Articulated around attachment point at (-1.5, -1.5)
        ctx.save();
        ctx.translate(-1.5, -1.5);
        ctx.scale(-wingSpanFactor, 1); // Mirrored across attachment hinge
        ctx.rotate(-wingPitch);
        drawSingleWing(ctx, wingGrad, isHovering, '#5B9BF6');
        ctx.restore();

        // BODY & ANTENNAE
        drawBody(ctx);

        ctx.restore();
      }

      ctx.restore();

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    // Event & RAF Cleanup
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      document.documentElement.removeEventListener('pointerleave', handlePointerLeave);
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  }, [isSupported]);

  if (!isSupported) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999
      }}
    />
  );
}
