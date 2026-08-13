// ── Linhas de junção (joint) ───────────────────────────────────────────────────
// No backend CPU, o render nativo do Matter desenha as constraints junto com
// os corpos. No backend GPU esse render nativo fica parado (Render.stop), e o
// desenho de corpos via WebGL não sabe nada sobre constraints — então, sem
// isso, toda junção criada com a ferramenta "Conectar" fica invisível.
// Este overlay 2D reproduz o desenho de linha que o Matter faria, usado só
// no branch GPU do render-backend-manager.

/**
 * @param {CanvasRenderingContext2D} ctx
 */
function drawJointLines(ctx) {
  const constraints = Composite.allConstraints(engine.world);
  if (!constraints.length) return;

  ctx.save();
  for (let i = 0; i < constraints.length; i++) {
    const c = constraints[i];
    if (c.render && c.render.visible === false) continue;

    const pointA = c.bodyA ? Vector.add(c.bodyA.position, c.pointA) : c.pointA;
    const pointB = c.bodyB ? Vector.add(c.bodyB.position, c.pointB) : c.pointB;
    if (!pointA || !pointB) continue;

    const sa = worldToScreen(pointA.x, pointA.y);
    const sb = worldToScreen(pointB.x, pointB.y);

    ctx.beginPath();
    ctx.moveTo(sa.x, sa.y);
    ctx.lineTo(sb.x, sb.y);
    ctx.lineWidth   = (c.render && c.render.lineWidth) || 2;
    ctx.strokeStyle = (c.render && c.render.strokeStyle) || '#f0c040';
    ctx.stroke();
  }
  ctx.restore();
}
