// ── Serialização de corpos em descriptors ────────────────────────────────────
// Um "descriptor" é um objeto plano (sem referências internas do Matter.js)
// que representa o estado de um corpo e pode ser usado para recriá-lo.

/**
 * Converte um corpo Matter.js em um descriptor serializável.
 * @param {Matter.Body} b
 * @returns {Object}
 */
function toDescriptor(b) {
  return {
    pieceId:     b.label,
    x:           b.position.x,
    y:           b.position.y,
    angle:       b.angle,
    vx:          b.velocity.x,
    vy:          b.velocity.y,
    size:        b.plugin.sizeFactor || 1,
    restitution: b.plugin.baseRestitution !== undefined ? b.plugin.baseRestitution : b.restitution,
    friction:    b.friction,
    density:     b.density,
    frictionAir: b.frictionAir,
    color:       b.plugin.color,
    isFragment:  b.plugin.isFragment,
  };
}

/**
 * Remove corpos do mundo com suporte a desfazer/refazer.
 * Também remove e restaura as constraints conectadas a eles.
 * @param {Matter.Body[]} bodies
 */
function deleteBodiesWithHistory(bodies) {
  if (!bodies.length) return;
  const allConstraints       = Composite.allConstraints(engine.world);
  const connectedConstraints = allConstraints.filter(c =>
    c !== mConstraint.constraint && (bodies.includes(c.bodyA) || bodies.includes(c.bodyB))
  );

  World.remove(engine.world, bodies);
  World.remove(engine.world, connectedConstraints);
  bodyCount = Math.max(0, bodyCount - bodies.length);
  updateStatus();

  pushHistory(
    () => {
      World.add(engine.world, bodies);
      World.add(engine.world, connectedConstraints);
      bodyCount += bodies.length; updateStatus();
    },
    () => {
      World.remove(engine.world, bodies);
      World.remove(engine.world, connectedConstraints);
      bodyCount = Math.max(0, bodyCount - bodies.length); updateStatus();
    }
  );
}
