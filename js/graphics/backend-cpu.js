// ── Backend CPU: pipeline Canvas 2D original ──────────────────────────────────
// Reproduz exatamente o desenho do render-loop original, com o render nativo
// do Matter rodando. É o comportamento padrão em qualquer máquina e o
// fallback automático quando WebGL2 não está disponível.

/**
 * @param {CanvasRenderingContext2D} ctx
 */
function drawCpuFrame(ctx) {
  const bodies = getBodies(); // cache atualizado em physics-loop.js

  drawFloorLine(ctx);
  drawGravityPointMarker(ctx);

  // No modo batata, apenas destaque de seleção e joint (sem efeitos pesados)
  if (potatoMode) {
    drawSelectionHighlight(ctx);
    return;
  }

  drawGlowLayer(ctx, bodies);
  drawSquashAnimations(ctx, bodies);
  drawSelectionHighlight(ctx);
}
