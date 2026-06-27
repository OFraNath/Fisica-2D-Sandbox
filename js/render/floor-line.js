// ── Linha de chão visual ──────────────────────────────────────────────────────
// Traço tracejado na base da viewport para indicar onde fica o chão invisível.

/**
 * @param {CanvasRenderingContext2D} ctx
 */
function drawFloorLine(ctx) {
  ctx.save();
  ctx.strokeStyle = '#f0c04044';
  ctx.lineWidth   = 1;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(0, H - 1);
  ctx.lineTo(W, H - 1);
  ctx.stroke();
  ctx.restore();
}
