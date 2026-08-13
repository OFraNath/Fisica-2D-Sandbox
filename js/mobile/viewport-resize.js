// ── Redimensionamento reativo do viewport ─────────────────────────────────────
// Substitui o cálculo estático de W/H feito uma única vez em matter-setup.js.
// Reage a resize, orientationchange e visualViewport (barra de endereço do
// navegador mobile, teclado virtual) e propaga o novo tamanho para: canvas
// do Matter, canvas de glow, canvas GPU e bounds da câmera.
//
// As paredes do mundo (world-boundaries.js) NÃO precisam ser tocadas aqui:
// camera-controls.js já reposiciona wallLeft/Right/Top/Bottom a cada
// 'beforeUpdate' com base em W/H atuais, então basta W/H mudarem.

function applyViewportSize(newW, newH) {
  newW = Math.max(1, Math.round(newW));
  newH = Math.max(1, Math.round(newH));
  if (newW === W && newH === H) return;

  W = newW; H = newH;

  render.options.width  = W;
  render.options.height = H;

  const pixelRatio = render.options.pixelRatio || 1;
  render.canvas.width  = Math.round(W * pixelRatio);
  render.canvas.height = Math.round(H * pixelRatio);
  render.canvas.style.width  = W + 'px';
  render.canvas.style.height = H + 'px';
  render.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  if (typeof resizeGlowCanvas === 'function') resizeGlowCanvas();
  if (typeof resizeGpuCanvas  === 'function') resizeGpuCanvas();
  if (typeof updateCameraBounds === 'function') updateCameraBounds();
}

function resizeViewportToWrap() {
  applyViewportSize(wrap.clientWidth, wrap.clientHeight);
}

let _resizeRaf = null;
function scheduleViewportResize() {
  if (_resizeRaf) cancelAnimationFrame(_resizeRaf);
  _resizeRaf = requestAnimationFrame(() => { _resizeRaf = null; resizeViewportToWrap(); });
}

window.addEventListener('resize', scheduleViewportResize);
window.addEventListener('orientationchange', () => setTimeout(resizeViewportToWrap, 60));
if (window.visualViewport) {
  // Cobre teclado virtual abrindo/fechando e a barra de endereço do
  // navegador aparecendo/sumindo durante o scroll em iOS/Android.
  window.visualViewport.addEventListener('resize', scheduleViewportResize);
}

/**
 * Ponto de extensão único: qualquer mudança estrutural de layout (troca de
 * modo mobile/desktop, abrir/fechar drawer, orientação) deve terminar
 * chamando isto — ele recalcula o canvas e avisa a UI mobile para se
 * reconstruir, então features futuras de layout não precisam duplicar essa
 * lógica de resize.
 */
function onMobileModeChanged() {
  scheduleViewportResize();
  if (typeof rebuildMobileToolbar === 'function') rebuildMobileToolbar();
  if (typeof updateMobileDrawerState === 'function') updateMobileDrawerState();
  if (typeof updateCursorModeButton === 'function') updateCursorModeButton();
  if (typeof updatePrecisionToolLocks === 'function') updatePrecisionToolLocks();
}

// Resize inicial: garante consistência caso o CSS de layout mobile já tenha
// mudado o tamanho do wrap entre a criação do Matter.js e este script.
resizeViewportToWrap();
