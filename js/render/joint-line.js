// ── Linhas de junção (joint) ───────────────────────────────────────────────────
// No backend CPU, o render nativo do Matter desenha as constraints junto com
// os corpos. No backend GPU esse render nativo fica parado (Render.stop), e o
// desenho de corpos via WebGL não sabe nada sobre constraints — então, sem
// isso, toda junção criada com a ferramenta "Conectar" fica invisível.
//
// Este overlay 2D REPLICA (não aproxima) a lógica que Matter.Constraint /
// Matter.Render usam internamente, para que o resultado visual seja idêntico
// ao backend CPU, pixel a pixel:
//   - Constraint.create decide o "tipo" de render com base nas propriedades:
//       length === 0        → 'pin'    (ponto de articulação, sem linha)
//       stiffness < 0.9      → 'spring' (zigue-zague, "imitação de mola")
//       caso contrário        → 'line'   (reta)
//   - Render.constraints desenha o zigue-zague com N segmentos entre
//     12 e 20 (clamp de length/5) e amplitude de 4px alternando de lado
//     a cada segmento (perpendicular ao segmento A→B).
//   - Além da linha, desenha "âncoras": pequenos círculos brancos nos
//     centros dos corpos conectados (quando render.anchors !== false).
//
// Usado só no branch GPU do render-backend-manager.

/**
 * Zigue-zague com a mesma fórmula do Matter.Render (Render.constraints):
 * coils = ceil(clamp(length / 5, 12, 20)), offset alternado ±4px na normal.
 * Como sa/sb já estão em espaço de tela (após worldToScreen, que multiplica
 * por camera.zoom), a amplitude de 4px também precisa escalar com o zoom —
 * é exatamente o que aconteceria no backend CPU, onde o Matter desenha em
 * bounds de mundo e o canvas inteiro é escalado pelo zoom da câmera.
 */
function drawSpringZigzag(ctx, sa, sb, worldLength) {
  const dx = sb.x - sa.x, dy = sb.y - sa.y;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = -dy / dist, ny = dx / dist; // normal unitária
  const coils = Math.ceil(Math.min(20, Math.max(12, worldLength / 5)));
  const amp = 4 * camera.zoom;

  for (let j = 1; j < coils; j++) {
    const offset = (j % 2 === 0) ? 1 : -1;
    const t = j / coils;
    ctx.lineTo(
      sa.x + dx * t + nx * offset * amp,
      sa.y + dy * t + ny * offset * amp
    );
  }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 */
function drawJointLines(ctx) {
  const constraints = Composite.allConstraints(engine.world);
  if (!constraints.length) return;

  ctx.save();
  for (let i = 0; i < constraints.length; i++) {
    const c = constraints[i];
    const r = c.render || {};
    if (r.visible === false) continue;

    const anchorA = c.bodyA ? Vector.add(c.bodyA.position, c.pointA) : c.pointA;
    const anchorB = c.bodyB ? Vector.add(c.bodyB.position, c.pointB) : c.pointB;
    if (!anchorA) continue;

    const sa = worldToScreen(anchorA.x, anchorA.y);

    ctx.lineWidth   = r.lineWidth   || 2;
    ctx.strokeStyle = r.strokeStyle || '#f0c040';

    // Mesma regra de tipagem do Constraint.create nativo.
    const isPin    = c.length === 0 && (!r.type || r.type === 'line');
    const type     = r.type || (isPin ? 'pin' : (c.stiffness < 0.9 ? 'spring' : 'line'));

    if (type === 'pin') {
      ctx.beginPath();
      ctx.arc(sa.x, sa.y, 3, 0, Math.PI * 2);
      ctx.stroke();
    } else if (anchorB) {
      const sb = worldToScreen(anchorB.x, anchorB.y);
      ctx.beginPath();
      ctx.moveTo(sa.x, sa.y);
      if (type === 'spring') {
        drawSpringZigzag(ctx, sa, sb, c.length);
      }
      ctx.lineTo(sb.x, sb.y);
      ctx.stroke();
    }

    // Âncoras: pequenos círculos preenchidos nos centros dos corpos
    // conectados — mesmo comportamento padrão do Matter (render.anchors).
    if (r.anchors !== false) {
      ctx.beginPath();
      if (c.bodyA) {
        const pa = worldToScreen(c.bodyA.position.x, c.bodyA.position.y);
        ctx.moveTo(pa.x + 3, pa.y);
        ctx.arc(pa.x, pa.y, 3, 0, Math.PI * 2);
      }
      if (c.bodyB) {
        const pb = worldToScreen(c.bodyB.position.x, c.bodyB.position.y);
        ctx.moveTo(pb.x + 3, pb.y);
        ctx.arc(pb.x, pb.y, 3, 0, Math.PI * 2);
      }
      ctx.fillStyle = '#fff';
      ctx.fill();
    }
  }
  ctx.restore();
}
