// ── Loop de física: atualizações por frame em cada corpo ─────────────────────
// Roda no evento 'afterUpdate' do Matter.js (~60×/s).
// Responsabilidades: vento, ímã, cap de velocidade, expiração de squash,
// e remoção de corpos que caíram muito abaixo da viewport.

let updateFrame = 0;

Events.on(engine, 'afterUpdate', () => {
  updateFrame++;
  const bodies      = Composite.allBodies(engine.world).filter(b => !b.isStatic);
  const now         = performance.now();
  const magnetActive = magnetKeyDown && (mouseDown.left || mouseDown.right);
  const magnetSign   = mouseDown.right ? -1 : 1;
  let removed = 0;

  bodies.forEach(b => {
    // ── Remoção de corpos que saíram muito para baixo da viewport ──
    if (updateFrame % 6 === 0 && b.position.y > camera.y + (H / camera.zoom) + 300) {
      const connectedConstraints = Composite.allConstraints(engine.world)
        .filter(c => c.bodyA === b || c.bodyB === b);
      World.remove(engine.world, connectedConstraints);
      World.remove(engine.world, b);
      removed++;
      return;
    }

    // ── Força de vento ──
    if (windForce !== 0)
      Body.applyForce(b, b.position, { x: windForce * 0.0006 * b.mass, y: 0 });

    // ── Força do ímã ──
    if (magnetActive) {
      const dx   = lastWorldMouse.x - b.position.x;
      const dy   = lastWorldMouse.y - b.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      if (dist < 320) {
        const f = magnetSign * 0.00500 * b.mass / dist;
        Body.applyForce(b, b.position, { x: dx * f, y: dy * f });
      }
    }

    // ── Cap de velocidade máxima ──
    const speed = Vector.magnitude(b.velocity);
    if (speed > MAX_SPEED) {
      const k = MAX_SPEED / speed;
      Body.setVelocity(b, { x: b.velocity.x * k, y: b.velocity.y * k });
    }

    // ── Expiração da animação de squash ──
    if (b.plugin.squashUntil && now > b.plugin.squashUntil) {
      b.render.visible     = true;
      b.plugin.squashUntil = null;
    }
  });

  if (removed) { bodyCount = Math.max(0, bodyCount - removed); updateStatus(); }
});
