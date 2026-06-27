// ── Controles de câmera: zoom, pan e reset ────────────────────────────────────

function clampCamera() {
  camera.x = clamp(camera.x, -CAMERA_PAN_LIMIT, CAMERA_PAN_LIMIT);
  camera.y = clamp(camera.y, -CAMERA_PAN_LIMIT, CAMERA_PAN_LIMIT);
}

/**
 * Sincroniza os bounds do renderer Matter.js, o scale/offset do mouse
 * e reposiciona as paredes invisíveis de acordo com a câmera atual.
 * Chamado em beforeUpdate para garantir consistência a cada frame.
 */
function updateCameraBounds() {
  render.bounds.min.x = camera.x;       render.bounds.min.y = camera.y;
  render.bounds.max.x = camera.x + W / camera.zoom;
  render.bounds.max.y = camera.y + H / camera.zoom;

  Mouse.setScale(mouse,  { x: 1 / camera.zoom, y: 1 / camera.zoom });
  Mouse.setOffset(mouse, { x: camera.x, y: camera.y });
  document.getElementById('st-zoom').textContent = Math.round(camera.zoom * 100) + '%';

  // Reposiciona as paredes para que acompanhem a viewport
  const vw = W / camera.zoom, vh = H / camera.zoom;
  const T  = 2000 / 2; // metade da espessura das paredes
  Body.setPosition(wallLeft,   { x: camera.x - T,        y: camera.y + vh / 2 });
  Body.setPosition(wallRight,  { x: camera.x + vw + T,   y: camera.y + vh / 2 });
  Body.setPosition(wallTop,    { x: camera.x + vw / 2,   y: camera.y - T });
  Body.setPosition(wallBottom, { x: camera.x + vw / 2,   y: camera.y + vh + T });

  // Acorda corpos adormecidos quando câmera se move (evita artefato de "flutuar no ar")
  if (camera.x !== _lastCamX || camera.y !== _lastCamY || camera.zoom !== _lastCamZoom) {
    _lastCamX = camera.x; _lastCamY = camera.y; _lastCamZoom = camera.zoom;
    Composite.allBodies(engine.world).forEach(b => {
      if (!b.isStatic && b.isSleeping) Body.set(b, 'isSleeping', false);
    });
  }
}
updateCameraBounds();

Events.on(engine, 'beforeUpdate', updateCameraBounds);

// ── Zoom com scroll ──
wrap.addEventListener('wheel', e => {
  e.preventDefault();
  const before = screenToWorld(e.offsetX, e.offsetY);
  camera.zoom  = clamp(camera.zoom * (e.deltaY < 0 ? 1.1 : 0.9), 0.5, 2.5);
  camera.x     = before.x - e.offsetX / camera.zoom;
  camera.y     = before.y - e.offsetY / camera.zoom;
  clampCamera(); updateCameraBounds();
}, { passive: false });

// ── Pan com Alt+arrastar ──
let _panning = false, _panStart = null;
render.canvas.addEventListener('mousedown', e => {
  if (!e.altKey) return;
  _panning  = true;
  _panStart = { sx: e.offsetX, sy: e.offsetY, cx: camera.x, cy: camera.y };
  e.preventDefault();
});
window.addEventListener('mousemove', e => {
  if (!_panning) return;
  const rect = render.canvas.getBoundingClientRect();
  const sx   = e.clientX - rect.left, sy = e.clientY - rect.top;
  camera.x   = _panStart.cx - (sx - _panStart.sx) / camera.zoom;
  camera.y   = _panStart.cy - (sy - _panStart.sy) / camera.zoom;
  clampCamera(); updateCameraBounds();
});
window.addEventListener('mouseup', () => { _panning = false; });

// ── Reset de câmera ──
function resetCamera() {
  camera.x = 0; camera.y = 0; camera.zoom = 1;
  clampCamera(); updateCameraBounds();
}

wrap.addEventListener('contextmenu', e => e.preventDefault());
