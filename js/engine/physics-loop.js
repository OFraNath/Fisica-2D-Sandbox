// ── Loop de física: atualizações por frame em cada corpo ─────────────────────
// Roda no evento 'afterUpdate' do Matter.js (sincronizado com o display).
// Responsabilidades: vento, ímã, gravidade pontual, cap de velocidade,
// expiração de squash, remoção de corpos fora da viewport e cache da lista
// de corpos para o render (evita criar arrays O(n) por frame).

let updateFrame = 0;

/**
 * Cache da lista completa de corpos do mundo, atualizado ao fim de cada
 * afterUpdate. O render reutiliza essa lista em vez de chamar
 * Composite.allBodies() novamente.
 */
let lastBodies = [];
function getBodies() { return lastBodies; }

/** Remove um corpo e suas constraints conectadas do mundo. */
function removeBodyAndConstraints(b) {
  const connectedConstraints = Composite.allConstraints(engine.world)
    .filter(c => c.bodyA === b || c.bodyB === b);
  World.remove(engine.world, connectedConstraints);
  World.remove(engine.world, b);
}

Events.on(engine, 'afterUpdate', () => {
  updateFrame++;
  const now = performance.now();
  const magnetActive = magnetKeyDown && (mouseDown.left || mouseDown.right);
  const magnetSign   = mouseDown.right ? -1 : 1;

  // Gravidade pontual: ponto de atração = centro da viewport atual
  const gp = pointGravityEnabled
    ? { x: camera.x + W / 2 / camera.zoom, y: camera.y + H / 2 / camera.zoom }
    : null;

  const bodies = Composite.allBodies(engine.world).filter(b => !b.isStatic);

  // Corpos adormecidos ignoram forças no Matter.js; desperta-os quando
  // alguma força externa (vento, ímã ou buraco negro) está ativa.
  if (windForce !== 0 || magnetActive || pointGravityEnabled) {
    for (let i = 0; i < bodies.length; i++) {
      if (bodies[i].isSleeping) Body.set(bodies[i], 'isSleeping', false);
    }
  }

  let removed = 0;

  bodies.forEach(b => {
    // ── Remoção de corpos que saíram da viewport (qualquer direção) ──
    if (updateFrame % 6 === 0) {
      const vw = W / camera.zoom, vh = H / camera.zoom;
      const outside = b.position.y > camera.y + vh + OFFSCREEN_MARGIN
                   || b.position.y < camera.y - vh - OFFSCREEN_MARGIN
                   || b.position.x > camera.x + vw + OFFSCREEN_MARGIN
                   || b.position.x < camera.x - vw - OFFSCREEN_MARGIN;
      if (outside) {
        removeBodyAndConstraints(b);
        removed++;
        return;
      }
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

    // ── Gravidade pontual (atração radial em direção ao centro da câmera) ──
    if (gp) {
      const dx   = gp.x - b.position.x;
      const dy   = gp.y - b.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      if (dist < GRAVITY_POINT_RADIUS) {
        const f = GRAVITY_POINT_STRENGTH * gravityStrength * b.mass
                / (dist * dist + GRAVITY_POINT_SOFTEN);
        Body.applyForce(b, b.position, { x: dx * f, y: dy * f });
      }
    }

    // ── Cap de velocidade: global e por dimensão (anti-tunelamento) ──
    // Peças finas (viga, coluna) são limitadas por espessura para não
    // atravessarem paredes entre dois passos de física.
    const w = b.bounds.max.x - b.bounds.min.x;
    const h = b.bounds.max.y - b.bounds.min.y;
    const minDim = w < h ? w : h;
    const cap = Math.min(MAX_SPEED, Math.max(MIN_SPEED_CAP, minDim * SPEED_SIZE_FACTOR));
    const speed = Vector.magnitude(b.velocity);
    if (speed > cap) {
      const k = cap / speed;
      Body.setVelocity(b, { x: b.velocity.x * k, y: b.velocity.y * k });
    }

    // ── Expiração da animação de squash ──
    if (b.plugin.squashUntil && now > b.plugin.squashUntil) {
      b.render.visible     = true;
      b.plugin.squashUntil = null;
    }
  });

  lastBodies = Composite.allBodies(engine.world);

  if (removed) { bodyCount = Math.max(0, bodyCount - removed); updateStatus(); }
});
