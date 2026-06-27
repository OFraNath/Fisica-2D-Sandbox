// ── Contador de FPS ───────────────────────────────────────────────────────────
// Atualiza o elemento #st-fps uma vez por segundo com a contagem real de frames.

let _fpsLastTime   = performance.now();
let _fpsFrameCount = 0;

function _fpsLoop() {
  _fpsFrameCount++;
  const now = performance.now();
  if (now - _fpsLastTime >= 1000) {
    document.getElementById('st-fps').textContent = _fpsFrameCount;
    _fpsFrameCount = 0;
    _fpsLastTime   = now;
  }
  requestAnimationFrame(_fpsLoop);
}
_fpsLoop();
