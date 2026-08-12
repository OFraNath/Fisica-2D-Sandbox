// ── Loop de física: atualizações por frame em cada corpo ─────────────────────
// Roda no evento 'afterUpdate' do Matter.js (sincronizado com o display).
// Responsabilidades: tuning do solver por carga, vento, ímã, gravidade pontual,
// cap de velocidade, expiração de squash, remoção de corpos fora da viewport
// e cache da lista de corpos p/ o render (evita criar arrays O(n) por frame).

let updateFrame = 0;
let lastTuneBins = { pos: -1, vel: -1, con: -1, sleep: -1 };

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

/** Faixa de tuning do solver para a carga atual (pos/vel/con/sleep). */
function solverTierFor(count) {
  let tier = SOLVER_TUNE[SOLVER_TUNE.length - 1];
  for (const t of SOLVER_TUNE) {
    if (count <= t.maxBodies) { tier = t; break; }
  }
  return tier;
}

/** sleepThreshold (frames até adormecer) para a carga atual. */
function sleepThresholdFor(count) {
  let threshold = SLEEP_THRESHOLD_TUNE[SLEEP_THRESHOLD_TUNE.length - 1].threshold;
  for (const t of SLEEP_THRESHOLD_TUNE) {
    if (count <= t.maxBodies) { threshold = t.threshold; break; }
  }
  return threshold;
}

/**
 * Ajusta iterações do solver conforme a carga de corpos, usando o slider de
 * precisão (userPrecision) como teto. Chamado por recountBodies() quando o
 * número de corpos muda — evitar chamadas O(n) por frame.
 */
function tuneSolverForLoad(count) {
  const tier = solverTierFor(count);
  if (lastTuneBins.pos === tier.pos && lastTuneBins.vel === tier.vel &&
      lastTuneBins.con === tier.con) return;

  // userPrecision é o teto (slider do painel); o tier reduz conforme a carga
  engine.positionIterations   = Math.min(userPrecision, tier.pos);
  engine.velocityIterations   = Math.max(1, Math.min(userPrecision - 2, tier.vel));
  engine.constraintIterations = Math.min(tier.con, clamp(Math.round(userPrecision / 4), 2, 8));
  lastTuneBins = { pos: tier.pos, vel: tier.vel, con: tier.con };
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

  lastBodies = Composite.allBodies(engine.world);
  const bodies = lastBodies;

  // Acorda apenas corpos que serão realmente afetados por forças externas
  // (ímã: área de influência; gravidade pontual: raio; vento: todos).
  if (windForce !== 0 || magnetActive || pointGravityEnabled) {
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      if (b.isStatic || !b.isSleeping) continue;
      if (windForce !== 0) { Body.set(b, 'isSleeping', false); continue; }
      if (magnetActive) {
        const dxm = lastWorldMouse.x - b.position.x;
        const dym = lastWorldMouse.y - b.position.y;
        if (dxm * dxm + dym * dym < 320 * 320) { Body.set(b, 'isSleeping', false); continue; }
      }
      if (gp) {
        const dxg = gp.x - b.position.x;
        const dyg = gp.y - b.position.y;
        if (dxg * dxg + dyg * dyg < GRAVITY_POINT_RADIUS * GRAVITY_POINT_RADIUS)
          Body.set(b, 'isSleeping', false);
      }
    }
  }

  let removed = 0;

  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i];
    if (b.isStatic) continue;

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
        continue;
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
  }

  if (removed) recountBodies();
});

// Aplica o tuning inicial (math com userPrecision 10 = comportamento padrão)
tuneSolverForLoad(0);