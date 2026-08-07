// ── Arremesso (fling) ao soltar o arrasto ─────────────────────────────────────
// Enquanto um corpo é arrastado, amostra posição e tempo a cada passo de
// física. No fim do arrasto, converte a velocidade média do mouse em
// velocidade do corpo, permitindo "arremessar" as peças.

const throwSamples = [];

Events.on(engine, 'afterUpdate', () => {
  const b = mConstraint.body;
  if (!b) { throwSamples.length = 0; return; }
  throwSamples.push({ t: performance.now(), x: b.position.x, y: b.position.y });
  if (throwSamples.length > THROW_MAX_SAMPLES) throwSamples.shift();
});

Events.on(mConstraint, 'enddrag', evt => {
  const b = evt.body;
  if (!b || throwSamples.length < 2) { throwSamples.length = 0; return; }

  const first = throwSamples[0];
  const last  = throwSamples[throwSamples.length - 1];
  const dt    = Math.max(8, last.t - first.t);

  // Converte px/ms em px por passo de 16.666ms (unidade de body.velocity)
  const vx = clamp((last.x - first.x) / dt * (1000 / 60), -MAX_SPEED, MAX_SPEED);
  const vy = clamp((last.y - first.y) / dt * (1000 / 60), -MAX_SPEED, MAX_SPEED);

  Body.set(b, 'isSleeping', false);
  Body.setVelocity(b, { x: vx, y: vy });
  throwSamples.length = 0;
});
