// ── Animação de squash/deformação por impacto ─────────────────────────────────
// Corpos atingidos com força suficiente ficam invisíveis para o renderer padrão
// do Matter.js e são redesenhados aqui com transformação de escala não uniforme.

/**
 * Inicia o squash em um corpo atingido.
 * @param {Matter.Body} b
 * @param {number}      impactSpeed  Velocidade de impacto (para intensidade)
 * @param {number}      now          Timestamp atual (performance.now())
 */
function triggerSquash(b, impactSpeed, now) {
  if (potatoMode) return;
  b.render.visible      = false;
  b.plugin.squashAmt    = clamp(impactSpeed / 14, 0, 1.5);
  b.plugin.squashStart  = now;
  b.plugin.squashUntil  = now + 450;
}

/**
 * Desenha os corpos em animação de squash usando transformações manuais de canvas.
 * Deve ser chamado dentro do evento 'afterRender'.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Matter.Body[]}            bodies
 */
function drawSquashAnimations(ctx, bodies) {
  const now = performance.now();
  ctx.save();

  bodies.forEach(b => {
    if (!b.plugin.squashUntil || !b.plugin.localVerts) return;

    const duration        = 450;
    const progress        = clamp((now - b.plugin.squashStart) / duration, 0, 1);
    const lightFade       = 1 - progress;
    const lightGlowEase   = Math.pow(1 - progress, 2);
    const deformationEase = Math.pow(1 - progress, 3);

    const amt = b.plugin.squashAmt * deformationEase;
    const sqX = 1 - 0.18 * amt;
    const sqY = 1 + 0.25 * amt;
    const sp  = worldToScreen(b.position.x, b.position.y);

    ctx.save();
    ctx.translate(sp.x, sp.y);
    ctx.rotate(b.angle);
    ctx.scale(sqX * camera.zoom, sqY * camera.zoom);

    ctx.beginPath();
    b.plugin.localVerts.forEach((v, i) => {
      if (i === 0) ctx.moveTo(v.x, v.y); else ctx.lineTo(v.x, v.y);
    });
    ctx.closePath();

    const color    = b.plugin.color || '#f0c040';
    const alphaInt = Math.floor((0.8 + 0.2 * progress) * 255);
    const alphaHex = alphaInt.toString(16).padStart(2, '0');

    ctx.shadowBlur         = 77 * lightGlowEase;
    ctx.shadowColor        = color;
    ctx.fillStyle          = color + alphaHex;
    const defaultLineWidth = b.render.lineWidth !== undefined ? b.render.lineWidth : 0;
    const targetLineWidth  = 2 / camera.zoom;
    ctx.lineWidth          = defaultLineWidth + (targetLineWidth - defaultLineWidth) * (1 - progress);
    ctx.strokeStyle        = b.render.strokeStyle || color;

    ctx.fill();
    ctx.stroke();

    if (lightFade > 0) {
      ctx.save();
      ctx.globalAlpha = lightFade * 0.35;
      ctx.fillStyle   = '#ffffff';
      ctx.shadowBlur  = 0;
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  });

  ctx.restore();
}
