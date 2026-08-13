// ── Entrada por toque ──────────────────────────────────────────────────────
// Dois modos, alternados pelo botão flutuante 🖱 (ver buildCursorModeButton()
// em js/mobile/mobile-ui.js) — ver PLANO-CURSOR-MOBILE.md:
//
//   Modo Cursor OFF (padrão): 1 dedo = soltar peça (tap), sem exigir precisão.
//   2 dedos = pinça/pan de câmera, como sempre.
//
//   Modo Cursor ON: 1 dedo passa a mover um "cursor virtual" deslocado
//   CURSOR_MODE_OFFSET_Y px acima do dedo (mesma ideia do cursor de texto em
//   teclados mobile). Esse cursor virtual dispara mousedown/mousemove/mouseup
//   sintéticos em render.canvas na sua própria posição — não na posição do
//   dedo — e o Matter.js (mConstraint) processa isso exatamente como um
//   clique de mouse de desktop: arrastar/arremessar peça individual, seleção
//   por retângulo e Joint (2 cliques) ganham precisão "de graça", sem
//   reescrever nenhuma dessas ferramentas.
//
//   Desktop                          → Mobile, Cursor OFF   → Mobile, Cursor ON
//   Clique (soltar/selecionar/joint) → Toque (tap)           → Cursor virtual (tap/drag)
//   Shift+Clique (apagar corpo)      → Toque longo           → Toque longo no cursor virtual
//   Scroll (zoom)                    → Pinça com 2 dedos     → (inalterado)
//   Alt+Arrastar (pan de câmera)     → Arrastar com 2 dedos  → (inalterado)
//   M + Clique (ímã atrai/repele)    → Botão "Ímã" cíclico + toque mantido no canvas (nos dois modos)

function canvasPointFromTouch(t) {
  const rect = render.canvas.getBoundingClientRect();
  return { x: t.clientX - rect.left, y: t.clientY - rect.top };
}

// mobileMagnetMode é alternado pelo botão "Ímã" da toolbar mobile
// ('off' | 'attract' | 'repel'); enquanto != 'off', tocar no canvas ativa
// o mesmo caminho de física que M+clique usa no desktop (physics-loop.js
// lê magnetKeyDown + mouseDown.left/right a cada frame). Funciona igual
// nos dois modos (Cursor ON/OFF) — é uma força de campo, não exige mira fina.
let mobileMagnetMode = 'off';

const LONG_PRESS_MS             = 480;
const LONG_PRESS_MOVE_TOLERANCE = 10; // px — acima disso, cancela o long-press (virou drag)

// ═══════════════════════════════════════════════════════════════════════
// Modo Cursor: cursor virtual + eventos sintéticos de mouse
// ═══════════════════════════════════════════════════════════════════════

let cursorMode = false; // alternado por setCursorMode(), ver mobile-ui.js

let _cursorTouchActive = false;
let _cFingerStart      = null; // ponto (canvas px) do dedo no touchstart — só p/ tolerância
let _cVirtualPoint     = null; // ponto (canvas px) do cursor virtual atual
let _cPressTimer       = null;
let _cPressFired       = false;

function cancelCursorLongPress() {
  if (_cPressTimer) { clearTimeout(_cPressTimer); _cPressTimer = null; }
}

function virtualPointFromFinger(p) {
  return { x: p.x, y: Math.max(0, p.y - CURSOR_MODE_OFFSET_Y) };
}

// Elementos do cursor virtual: uma mira sobre o canvas + uma haste fina até
// o ponto real do dedo, deixando visualmente clara a relação dedo → cursor.
// Vivem fora do <canvas> (não pesam o render loop) — ver CSS em mobile.css.
const cursorDotEl = document.createElement('div');
cursorDotEl.id = 'mobile-cursor-dot';
const cursorStemEl = document.createElement('div');
cursorStemEl.id = 'mobile-cursor-stem';
document.getElementById('canvas-wrap').appendChild(cursorStemEl);
document.getElementById('canvas-wrap').appendChild(cursorDotEl);

function showCursorVisuals(fingerP, virtualP) {
  cursorDotEl.style.display = 'block';
  cursorDotEl.style.transform = `translate(${virtualP.x}px, ${virtualP.y}px)`;

  const dx = fingerP.x - virtualP.x, dy = fingerP.y - virtualP.y;
  const len   = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  cursorStemEl.style.display   = 'block';
  cursorStemEl.style.width     = len + 'px';
  cursorStemEl.style.transform = `translate(${virtualP.x}px, ${virtualP.y}px) rotate(${angle}deg)`;
}

function hideCursorVisuals() {
  cursorDotEl.style.display  = 'none';
  cursorStemEl.style.display = 'none';
  cursorDotEl.classList.remove('grabbed');
}

// Ao "agarrar" um corpo (mConstraint), a mira muda de aparência para confirmar
// que pegou algo — só importa visualmente durante um toque no Modo Cursor.
Events.on(mConstraint, 'startdrag', () => { if (_cursorTouchActive) cursorDotEl.classList.add('grabbed'); });
Events.on(mConstraint, 'enddrag',   () => cursorDotEl.classList.remove('grabbed'));

/** Dispara um evento de mouse sintético em render.canvas na posição (canvas px) dada. */
function dispatchSyntheticMouse(type, canvasP) {
  const rect = render.canvas.getBoundingClientRect();
  const evt = new MouseEvent(type, {
    clientX: rect.left + canvasP.x,
    clientY: rect.top + canvasP.y,
    bubbles: true,
    cancelable: true,
    view: window,
    button: 0,
    buttons: type === 'mouseup' ? 0 : 1,
  });
  render.canvas.dispatchEvent(evt);
}

/** Liga/desliga o Modo Cursor (botão flutuante, ver mobile-ui.js). */
function setCursorMode(on) {
  cursorMode = on;
  if (!on && _cursorTouchActive) endCursorGesture({ touches: [] });
  if (typeof onCursorModeChanged === 'function') onCursorModeChanged();
}

function endCursorGesture(e) {
  if (!_cursorTouchActive) return;
  if (e.touches && e.touches.length > 0) return; // ainda restam dedos: não finaliza

  cancelCursorLongPress();
  magnetKeyDown  = false;
  mouseDown.left = false; mouseDown.right = false;

  if (_cVirtualPoint) dispatchSyntheticMouse('mouseup', _cVirtualPoint);

  _cursorTouchActive = false;
  _cFingerStart      = null;
  _cVirtualPoint      = null;
  hideCursorVisuals();
}

const wrapEl = document.getElementById('canvas-wrap');

// Interceptação em fase de captura no elemento PAI do canvas: isso garante
// que rodamos ANTES dos listeners de touchstart/touchmove/touchend já
// existentes em render.canvas (fase de captura sempre precede a fase alvo/
// bolha em um ancestral), então stopPropagation() aqui impede de forma
// confiável que o "modo gestual" abaixo e o Matter.Mouse nativo processem
// o mesmo toque em paralelo — risco identificado no plano (seção 5).
wrapEl.addEventListener('touchstart', e => {
  if (!cursorMode) return;

  if (e.touches.length >= 2) {
    if (_cursorTouchActive) endCursorGesture({ touches: [] });
    return; // 2+ dedos: não intercepta, cai no pinch/pan padrão abaixo
  }
  if (e.touches.length !== 1) return;

  e.preventDefault();
  e.stopPropagation();
  ensureAudio();

  const fingerP  = canvasPointFromTouch(e.touches[0]);
  const virtualP = virtualPointFromFinger(fingerP);
  _cursorTouchActive = true;
  _cFingerStart       = fingerP;
  _cVirtualPoint       = virtualP;
  showCursorVisuals(fingerP, virtualP);

  lastWorldMouse = screenToWorld(virtualP.x, virtualP.y);
  if (mode === 'place') updateGhostPosition(virtualP.x, virtualP.y);

  if (mobileMagnetMode !== 'off') {
    magnetKeyDown   = true;
    mouseDown.left  = mobileMagnetMode === 'attract';
    mouseDown.right = mobileMagnetMode === 'repel';
  }

  cancelCursorLongPress();
  _cPressFired = false;
  _cPressTimer = setTimeout(() => {
    _cPressFired = true;
    const wp     = screenToWorld(_cVirtualPoint.x, _cVirtualPoint.y);
    const bodies = Composite.allBodies(engine.world).filter(b => b.label !== 'floor' && b.label !== 'wall');
    const hit    = Query.point(bodies, wp);
    if (hit.length) {
      deleteBodiesWithHistory([hit[0]]);
      if (navigator.vibrate) navigator.vibrate(15);
    }
  }, LONG_PRESS_MS);

  dispatchSyntheticMouse('mousedown', virtualP);
}, { passive: false, capture: true });

wrapEl.addEventListener('touchmove', e => {
  if (!cursorMode || !_cursorTouchActive) return;
  if (e.touches.length !== 1) return;

  e.preventDefault();
  e.stopPropagation();

  const fingerP  = canvasPointFromTouch(e.touches[0]);
  const virtualP = virtualPointFromFinger(fingerP);
  _cVirtualPoint = virtualP;
  showCursorVisuals(fingerP, virtualP);

  lastWorldMouse = screenToWorld(virtualP.x, virtualP.y);
  if (mode === 'place') updateGhostPosition(virtualP.x, virtualP.y);

  const d = Math.hypot(fingerP.x - _cFingerStart.x, fingerP.y - _cFingerStart.y);
  if (d > LONG_PRESS_MOVE_TOLERANCE) cancelCursorLongPress();

  dispatchSyntheticMouse('mousemove', virtualP);
}, { passive: false, capture: true });

wrapEl.addEventListener('touchend', e => {
  if (!cursorMode || !_cursorTouchActive) return;
  e.preventDefault();
  e.stopPropagation();
  endCursorGesture(e);
}, { passive: false, capture: true });

wrapEl.addEventListener('touchcancel', e => {
  if (!cursorMode || !_cursorTouchActive) return;
  e.preventDefault();
  e.stopPropagation();
  endCursorGesture({ touches: [] });
}, { passive: false, capture: true });

// ═══════════════════════════════════════════════════════════════════════
// Modo Gestual (Cursor OFF): tap simples, long-press, pinça/pan de câmera.
// Inalterado em relação ao comportamento original — só deixa de rodar
// quando o Modo Cursor está ligado, porque os listeners de captura acima
// chamam stopPropagation() antes que estes de render.canvas recebam o toque.
// ═══════════════════════════════════════════════════════════════════════

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
  cancelCursorLongPress();
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
