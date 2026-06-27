// ── Camada de glow otimizada ──────────────────────────────────────────────────
// Em vez de aplicar shadowBlur por corpo (custo O(n)), desenha os contornos
// de todos os corpos em um canvas auxiliar de resolução reduzida, com blend
// 'lighter', e aplica UM único blur sobre a camada inteira (custo O(1)).
// Resultado: corpos próximos fundem seus halos naturalmente sem cálculo extra.

const glowSupported = (() => {
  try { return typeof document.createElement('canvas').getContext('2d').filter === 'string'; }
  catch (e) { return false; }
})();

const glowCanvas = document.createElement('canvas');
const glowCtx    = glowCanvas.getContext('2d');

function resizeGlowCanvas() {
  glowCanvas.width  = Math.max(1, Math.round(W * GLOW_SCALE));
  glowCanvas.height = Math.max(1, Math.round(H * GLOW_SCALE));
}
resizeGlowCanvas();

/**
 * Renderiza a camada de glow sobre o contexto principal.
 * Deve ser chamado dentro do evento 'afterRender' do Matter.js.
 * @param {CanvasRenderingContext2D} ctx  Contexto do canvas principal
 * @param {Matter.Body[]}            bodies  Lista de todos os corpos
 */
function drawGlowLayer(ctx, bodies) {
  if (potatoMode) return;

  if (glowSupported) {
    glowCtx.clearRect(0, 0, glowCanvas.width, glowCanvas.height);
    glowCtx.save();
    glowCtx.scale(GLOW_SCALE, GLOW_SCALE);
    glowCtx.globalCompositeOperation = 'lighter';
    glowCtx.lineWidth = 4;

    let anyGlow = false;
    bodies.forEach(b => {
      if (b.isStatic || b.label === 'floor' || b.label === 'wall' || b.plugin.squashUntil) return;
      const min = worldToScreen(b.bounds.min.x, b.bounds.min.y);
      const max = worldToScreen(b.bounds.max.x, b.bounds.max.y);
      if (max.x < -GLOW_CULL_MARGIN || min.x > W + GLOW_CULL_MARGIN ||
          max.y < -GLOW_CULL_MARGIN || min.y > H + GLOW_CULL_MARGIN) return;

      const color = b.plugin.color || '#f0c040';
      glowCtx.strokeStyle = color;
      glowCtx.beginPath();
      b.vertices.forEach((v, i) => {
        const sp = worldToScreen(v.x, v.y);
        if (i === 0) glowCtx.moveTo(sp.x, sp.y); else glowCtx.lineTo(sp.x, sp.y);
      });
      glowCtx.closePath();
      glowCtx.stroke();
      anyGlow = true;
    });
    glowCtx.restore();

    if (anyGlow) {
      ctx.save();
      ctx.filter = `blur(${GLOW_BLUR_PX}px)`;
      ctx.drawImage(glowCanvas, 0, 0, glowCanvas.width, glowCanvas.height, 0, 0, W, H);
      ctx.filter = 'none';
      ctx.restore();
    }
  } else {
    // Fallback para navegadores sem suporte a ctx.filter (um shadowBlur por corpo)
    ctx.save();
    bodies.forEach(b => {
      if (b.isStatic || b.label === 'floor' || b.label === 'wall' || b.plugin.squashUntil) return;
      const color = b.plugin.color || '#f0c040';
      ctx.save();
      ctx.shadowBlur    = 22;
      ctx.shadowColor   = color;
      ctx.strokeStyle   = color;
      ctx.lineWidth     = 2;
      ctx.beginPath();
      b.vertices.forEach((v, i) => {
        const sp = worldToScreen(v.x, v.y);
        if (i === 0) ctx.moveTo(sp.x, sp.y); else ctx.lineTo(sp.x, sp.y);
      });
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
  }
}
