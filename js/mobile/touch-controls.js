// ── Entrada por toque ──────────────────────────────────────────────────────
// Matter.js já trata arrastar/arremessar corpos via touch nativamente
// (Mouse.create escuta touchstart/move/end internamente e mConstraint usa
// isso), então isso já funciona sem nada aqui. Este arquivo cobre tudo que,
// no desktop, só existia como mousedown cru, wheel ou tecla:
//
//   Desktop                          → Mobile (aqui)
//   Clique (soltar/selecionar/joint) → Toque (tap)
//   Shift+Clique (apagar corpo)      → Toque longo (long-press)
//   Scroll (zoom)                    → Pinça com 2 dedos
//   Alt+Arrastar (pan de câmera)     → Arrastar com 2 dedos
//   M + Clique (ímã atrai/repele)    → Botão "Ímã" cíclico na toolbar mobile
//                                       (ver js/mobile/mobile-ui.js) + toque
//                                       mantido no canvas

function canvasPointFromTouch(t) {
  const rect = render.canvas.getBoundingClientRect();
  return { x: t.clientX - rect.left, y: t.clientY - rect.top };
}

// mobileMagnetMode é alternado pelo botão "Ímã" da toolbar mobile
// ('off' | 'attract' | 'repel'); enquanto != 'off', tocar no canvas ativa
// o mesmo caminho de física que M+clique usa no desktop (physics-loop.js
// lê magnetKeyDown + mouseDown.left/right a cada frame).
let mobileMagnetMode = 'off';

// ── Toque longo: equivalente de Shift+clique (apaga o corpo sob o dedo) ──
const LONG_PRESS_MS             = 480;
const LONG_PRESS_MOVE_TOLERANCE = 10; // px — acima disso, cancela o long-press (virou drag)

let _pressTimer  = null;
let _pressStart  = null; // ponto (canvas px) do touchstart
let _pressFired  = false;
let _pinchPrev   = null; // { dist, mid } do frame anterior de um gesto de 2 dedos

function cancelLongPress() {
  if (_pressTimer) { clearTimeout(_pressTimer); _pressTimer = null; }
}

function touchesDistance(t0, t1) {
  return Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
}
function touchesMidpoint(t0, t1) {
  const rect = render.canvas.getBoundingClientRect();
  return { x: (t0.clientX + t1.clientX) / 2 - rect.left, y: (t0.clientY + t1.clientY) / 2 - rect.top };
}

function startPinchPan(e) {
  cancelLongPress();
  _pressStart = null;
  isSelecting = false;
  selRectEl.style.display = 'none';
  const [t0, t1] = e.touches;
  _pinchPrev = { dist: touchesDistance(t0, t1), mid: touchesMidpoint(t0, t1) };
}

function updatePinchPan(e) {
  if (!_pinchPrev || e.touches.length !== 2) return;
  const [t0, t1] = e.touches;
  const dist = touchesDistance(t0, t1);
  const mid  = touchesMidpoint(t0, t1);

  // Zoom "no dedo": mantém o ponto médio do gesto fixo no mundo.
  const zoomFactor = dist / _pinchPrev.dist;
  const before = screenToWorld(mid.x, mid.y);
  camera.zoom = clamp(camera.zoom * zoomFactor, 0.5, 2.5);
  const after = screenToWorld(mid.x, mid.y);
  camera.x += before.x - after.x;
  camera.y += before.y - after.y;

  // Pan pelo deslocamento do ponto médio entre este frame e o anterior.
  const dx = mid.x - _pinchPrev.mid.x, dy = mid.y - _pinchPrev.mid.y;
  camera.x -= dx / camera.zoom;
  camera.y -= dy / camera.zoom;

  clampCamera();
  updateCameraBounds();
  _pinchPrev = { dist, mid };
}

render.canvas.addEventListener('touchstart', e => {
  if (e.touches.length === 2) { startPinchPan(e); return; }
  if (e.touches.length !== 1) return;

  ensureAudio();
  const p  = canvasPointFromTouch(e.touches[0]);
  const wp = screenToWorld(p.x, p.y);
  lastWorldMouse = wp;
  _pressStart = p;
  _pressFired = false;

  if (mobileMagnetMode !== 'off') {
    magnetKeyDown   = true;
    mouseDown.left  = mobileMagnetMode === 'attract';
    mouseDown.right = mobileMagnetMode === 'repel';
  }

  cancelLongPress();
  _pressTimer = setTimeout(() => {
    _pressFired = true;
    const bodies = Composite.allBodies(engine.world).filter(b => b.label !== 'floor' && b.label !== 'wall');
    const hit = Query.point(bodies, wp);
    if (hit.length) {
      deleteBodiesWithHistory([hit[0]]);
      if (navigator.vibrate) navigator.vibrate(15);
    }
  }, LONG_PRESS_MS);

  if (mode === 'select') {
    isSelecting = true;
    selStart = { x: p.x, y: p.y };
    selRectEl.style.display = 'block';
    updateSelRect(p.x, p.y);
  }
}, { passive: true });

render.canvas.addEventListener('touchmove', e => {
  if (e.touches.length === 2) { updatePinchPan(e); return; }
  if (e.touches.length !== 1) return;

  const p = canvasPointFromTouch(e.touches[0]);
  lastWorldMouse = screenToWorld(p.x, p.y);
  if (mode === 'place') updateGhostPosition(p.x, p.y);
  if (isSelecting) updateSelRect(p.x, p.y);

  if (_pressStart) {
    const d = Math.hypot(p.x - _pressStart.x, p.y - _pressStart.y);
    if (d > LONG_PRESS_MOVE_TOLERANCE) cancelLongPress();
  }
}, { passive: true });

function endTouchGesture(e) {
  cancelLongPress();
  magnetKeyDown = false;
  mouseDown.left = false; mouseDown.right = false;

  if (e.touches.length >= 2) { startPinchPan(e); return; } // ainda restam 2+ dedos
  if (e.touches.length === 1) { _pinchPrev = null; return; } // saiu de pinch p/ 1 dedo: não reinterpreta como tap

  _pinchPrev = null;

  const t = e.changedTouches[0];
  if (!t) { _pressStart = null; return; }
  const p = canvasPointFromTouch(t);

  if (isSelecting) {
    isSelecting = false;
    selRectEl.style.display = 'none';
    const p1 = screenToWorld(Math.min(selStart.x, p.x), Math.min(selStart.y, p.y));
    const p2 = screenToWorld(Math.max(selStart.x, p.x), Math.max(selStart.y, p.y));
    const all = Composite.allBodies(engine.world).filter(b => b.label !== 'floor' && b.label !== 'wall');
    selectedBodies = Query.region(all, { min: p1, max: p2 });
    updateSelStatus();
    _pressStart = null;
    return;
  }

  if (_pressFired || !_pressStart) { _pressStart = null; return; }

  // Toque simples (tap, sem arrasto significativo): equivalente ao mousedown
  // de canvas-mouse-events.js para os modos 'place' e 'joint'.
  const moved = Math.hypot(p.x - _pressStart.x, p.y - _pressStart.y);
  if (moved <= LONG_PRESS_MOVE_TOLERANCE) {
    const wp = screenToWorld(p.x, p.y);
    if (mode === 'place') {
      const bodies = Composite.allBodies(engine.world).filter(b => !b.isStatic);
      const hit = Query.point(bodies, wp).length > 0;
      if (!hit) spawnPiece(wp.x, wp.y);
    } else if (mode === 'joint') {
      handleJointClick(wp);
    }
  }
  _pressStart = null;
}

render.canvas.addEventListener('touchend', endTouchGesture, { passive: true });
render.canvas.addEventListener('touchcancel', e => {
  cancelLongPress();
  magnetKeyDown = false; mouseDown.left = false; mouseDown.right = false;
  isSelecting = false; selRectEl.style.display = 'none';
  _pinchPrev = null; _pressStart = null;
}, { passive: true });
