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

    // Som (throttled a no mínimo 40 ms entre sons); o tom acompanha o tamanho
    const sizeA = Math.min(
      bodyA.bounds.max.x - bodyA.bounds.min.x,
      bodyA.bounds.max.y - bodyA.bounds.min.y
    );
    const sizeB = Math.min(
      bodyB.bounds.max.x - bodyB.bounds.min.x,
      bodyB.bounds.max.y - bodyB.bounds.min.y
    );
    const freqScale = clamp((sizeA + sizeB) / 100, 0.5, 2);
    if (now - lastSoundTime > 40) {
      playThud(Math.min(1, impactSpeed / 16), freqScale);
      lastSoundTime = now;
    }

    // Squash nos dois corpos envolvidos
    [bodyA, bodyB].forEach(b => {
      if (!b.isStatic && impactSpeed > 3) triggerSquash(b, impactSpeed, now);
    });

    // Restituição dependente do impacto: impactos fortes quicam menos
    [bodyA, bodyB].forEach(b => {
      if (b.isStatic || b.plugin.baseRestitution === undefined) return;
      b.restitution = b.plugin.baseRestitution
        * clamp(1 - impactSpeed / (RESTITUTION_SPEED_REF * 2), 0.5, 1);
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
