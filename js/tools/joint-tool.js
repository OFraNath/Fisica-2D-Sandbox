// ── Ferramenta de junção (joint) ──────────────────────────────────────────────
// Dois cliques criam uma constraint entre dois corpos. O primeiro clique
// armazena o ponto pendente; o segundo fecha a ligação.

/**
 * Processa um clique no modo "joint".
 * @param {{ x: number, y: number }} wp  Coordenadas do mundo no ponto clicado
 */
function handleJointClick(wp) {
  const bodies = Composite.allBodies(engine.world)
    .filter(b => b.label !== 'floor' && b.label !== 'wall');
  const hit = Query.point(bodies, wp);
  if (!hit.length) { jointPending = null; return; }

  const body = hit[0];
  if (!jointPending) {
    jointPending = { body, point: wp };
    return;
  }
  if (jointPending.body === body) { jointPending = null; return; } // clique no mesmo corpo cancela

  const constraint = Constraint.create({
    bodyA:  jointPending.body,
    pointA: Vector.sub(jointPending.point, jointPending.body.position),
    bodyB:  body,
    pointB: Vector.sub(wp, body.position),
    stiffness: 0.06,
    damping:   0.05,
    render: { strokeStyle: '#f0c040', lineWidth: 2 },
  });
  World.add(engine.world, constraint);
  jointPending = null;
}
