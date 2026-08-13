// ── Detecção de dispositivo móvel e alternância de layout ────────────────────
// Decide se a UI inicia em "modo mobile" (layout touch) combinando
// capacidade de toque + tamanho de tela. O usuário pode forçar manualmente
// via botão no header (js/mobile/mobile-ui.js), e a escolha fica salva.
//
// Carregado logo após utils/ e ANTES de engine/matter-setup.js de propósito:
// a classe 'mobile-mode' no <body> precisa existir antes do Matter.js medir
// wrap.clientWidth/clientHeight, senão o mundo nasce com o tamanho errado.

const MOBILE_BREAKPOINT_PX = 860; // abaixo disso a sidebar de 200px não cabe

function detectTouchCapable() {
  return ('ontouchstart' in window) ||
         (navigator.maxTouchPoints > 0) ||
         (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
}

function detectSmallScreen() {
  const shortSide = Math.min(window.innerWidth, window.innerHeight);
  return shortSide < MOBILE_BREAKPOINT_PX;
}

function autoDetectMobile() {
  return detectTouchCapable() && detectSmallScreen();
}

let inputMode  = detectTouchCapable() ? 'touch' : 'mouse';
let mobileMode = false;
let _mobileModeForced = null; // null = automático; true/false = forçado pelo usuário

try {
  const saved = localStorage.getItem('fisica2d.mobileMode');
  if (saved === 'true')  _mobileModeForced = true;
  if (saved === 'false') _mobileModeForced = false;
} catch (e) { /* localStorage indisponível (ex.: navegação privada) — ignora */ }

function applyMobileModeClass() {
  document.body.classList.toggle('mobile-mode', mobileMode);
  document.body.classList.toggle('touch-input', inputMode === 'touch');
}

/**
 * Liga/desliga o layout mobile.
 * @param {boolean} enabled
 * @param {boolean} persist  Se true, grava a escolha como preferência manual.
 */
function setMobileMode(enabled, persist) {
  mobileMode = enabled;
  if (persist) {
    _mobileModeForced = enabled;
    try { localStorage.setItem('fisica2d.mobileMode', String(enabled)); } catch (e) {}
  }
  applyMobileModeClass();
  // onMobileModeChanged é definido em js/mobile/viewport-resize.js (recalcula
  // o canvas) e encadeia a reconstrução da toolbar/drawer em mobile-ui.js.
  if (typeof onMobileModeChanged === 'function') onMobileModeChanged();
}

/** Reavalia a autodetecção (chamado em resize/orientationchange) quando não há escolha manual. */
function refreshMobileMode() {
  if (_mobileModeForced !== null) return;
  const desired = autoDetectMobile();
  if (desired !== mobileMode) setMobileMode(desired, false);
}

mobileMode = (_mobileModeForced !== null) ? _mobileModeForced : autoDetectMobile();
applyMobileModeClass();

window.addEventListener('resize', refreshMobileMode);
window.addEventListener('orientationchange', () => setTimeout(refreshMobileMode, 60));
