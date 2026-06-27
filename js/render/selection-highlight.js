// ── Destaque de seleção ───────────────────────────────────────────────────────
// Desenha contorno tracejado dourado ao redor dos corpos selecionados
// e um ponto no primeiro clique do modo Joint.

/**
 * @param {CanvasRenderingContext2D} ctx
 */
function drawSelectionHighlight(ctx) {
  if (!selectedBodies.length && !jointPending) return;

  ctx.save();
  ctx.strokeStyle = '#f0c040';
  ctx.lineWidth   = 2;
  ctx.setLineDash([4, 3]);

  selectedBodies.forEach(b => {
    const min = worldToScreen(b.bounds.min.x, b.bounds.min.y);
    const max = worldToScreen(b.bounds.max.x, b.bounds.max.y);
    ctx.strokeRect(min.x - 3, min.y - 3, (max.x - min.x) + 6, (max.y - min.y) + 6);
  });

  ctx.restore();

  if (jointPending) {
    const sp = worldToScreen(jointPending.point.x, jointPending.point.y);
    ctx.save();
    ctx.fillStyle = '#f0c040';
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
