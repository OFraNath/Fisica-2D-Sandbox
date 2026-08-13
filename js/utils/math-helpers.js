// ── Utilitários matemáticos genéricos ────────────────────────────────────────

/** Limita `v` entre `a` e `b`. */
function clamp(v, a, b) { return Math.max(a, Math.min(v, b)); }

/**
 * Intensidade do glow de um corpo: ∝ velocidade, com piso em repouso.
 * Fonte única de verdade usada pelos DOIS backends (CPU em glow-layer.js e
 * GPU em webgl-bloom.js) — assim o comportamento (repouso calmo, impacto
 * brilhante) é garantidamente idêntico; só a técnica de desenho difere
 * (canvas 2D com blur de software vs. shader de bloom).
 */
function bodyGlowAlpha(b) {
  if (b.isStatic || b.plugin.squashUntil) return 0;
  const t = Math.min(1, (b.speed || 0) / GPU_GLOW_SPEED_FULL);
  return GPU_GLOW_AT_REST + (1 - GPU_GLOW_AT_REST) * t * t;
}
