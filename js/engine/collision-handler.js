// ── Handler de colisões ───────────────────────────────────────────────────────
// Disparado pelo Matter.js a cada novo par de colisão.
// Responsabilidades: tocar som, iniciar squash e (se habilitado) fraturar peças.

let lastSoundTime = 0;

Events.on(engine, 'collisionStart', evt => {
  const now = performance.now();

  evt.pairs.forEach(pair => {
    const { bodyA, bodyB, collision } = pair;
    const rel         = Vector.sub(bodyA.velocity, bodyB.velocity);
    const impactSpeed = (collision && collision.normal)
      ? Math.abs(Vector.dot(rel, collision.normal))
      : Vector.magnitude(rel);

    if (impactSpeed < 1.2) return;

    // Som (throttled a no mínimo 40 ms entre sons)
    if (now - lastSoundTime > 40) {
      playThud(Math.min(1, impactSpeed / 16));
      lastSoundTime = now;
    }

    // Squash nos dois corpos envolvidos
    [bodyA, bodyB].forEach(b => {
      if (!b.isStatic && impactSpeed > 3) triggerSquash(b, impactSpeed, now);
    });

    if (!fractureEnabled) return;

    // Fratura por impacto
    [bodyA, bodyB].forEach(b => {
      if (b.isStatic)                              return;
      if (impactSpeed < fractureThreshold)         return;
      if ((b.plugin.sizeFactor || 1) < FRACTURE_MIN_SIZE_FACTOR) return;

      const piece = PIECES.find(p => p.id === b.label);
      if (!piece || piece.w * piece.h < FRACTURE_MIN_AREA)       return;

      // Não fragmenta corpos conectados por joints
      const isConnected = Composite.allConstraints(engine.world).some(c =>
        c !== mConstraint.constraint && (c.bodyA === b || c.bodyB === b)
      );
      if (isConnected) return;

      fractureBody(b, piece);
    });
  });
});
