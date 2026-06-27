// ── Botões do header ──────────────────────────────────────────────────────────

/** Dispara a animação de flash de confirmação em um botão. */
function flashBtn(btn) {
  btn.classList.remove('flash');
  requestAnimationFrame(() => btn.classList.add('flash'));
}

// ── Pausar / Retomar ──
const btnPause = document.getElementById('btn-pause');
btnPause.addEventListener('click', () => {
  paused = !paused;
  if (paused) { Runner.stop(runner); btnPause.textContent = '▶ RETOMAR'; }
  else        { Runner.run(runner, engine); btnPause.textContent = '⏸ PAUSAR'; }
});

// ── Limpar todos os corpos ──
const btnClear = document.getElementById('btn-clear');
btnClear.addEventListener('click', () => {
  flashBtn(btnClear);
  const bodies = Composite.allBodies(engine.world).filter(b => !b.isStatic);
  deleteBodiesWithHistory(bodies);

  const constraints = Composite.allConstraints(engine.world).filter(c => c !== mConstraint.constraint);
  World.remove(engine.world, constraints);

  jointPending   = null;
  selectedBodies = [];
  updateSelStatus();
});

// ── Explodir todos os corpos ──
const btnExplode = document.getElementById('btn-explode');
btnExplode.addEventListener('click', () => {
  flashBtn(btnExplode);
  const bodies = Composite.allBodies(engine.world).filter(b => !b.isStatic);
  if (!bodies.length) return;

  const destroyedBodies          = [];
  const createdShards            = [];
  const fragmentVelocitiesBefore = [];

  bodies.forEach(b => {
    if (b.plugin.isFragment) {
      fragmentVelocitiesBefore.push({ body: b, vx: b.velocity.x, vy: b.velocity.y });
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 12 + 10;
      Body.set(b, 'isSleeping', false);
      Body.setVelocity(b, { x: b.velocity.x + Math.cos(angle) * speed, y: b.velocity.y + Math.sin(angle) * speed - 4 });
    } else {
      const allConstraints       = Composite.allConstraints(engine.world);
      const connectedConstraints = allConstraints.filter(c => c !== mConstraint.constraint && (c.bodyA === b || c.bodyB === b));
      World.remove(engine.world, connectedConstraints);

      const result = explodeBodyIntoPieces(b, createdShards);
      if (result) destroyedBodies.push({ body: result.originalBody, desc: result.originalDesc, constraints: connectedConstraints });
    }
  });

  // Registra explosão no histórico (complexo: destrói N e cria M fragmentos)
  pushHistory(
    () => {
      World.remove(engine.world, createdShards);
      bodyCount = Math.max(0, bodyCount - createdShards.length);
      destroyedBodies.forEach(item => {
        World.add(engine.world, item.body);
        World.add(engine.world, item.constraints);
        Body.set(item.body, 'isSleeping', false);
        Body.setPosition(item.body, { x: item.desc.x, y: item.desc.y });
        Body.setVelocity(item.body, { x: item.desc.vx, y: item.desc.vy });
        Body.setAngle(item.body, item.desc.angle);
        bodyCount++;
      });
      fragmentVelocitiesBefore.forEach(item => {
        Body.set(item.body, 'isSleeping', false);
        Body.setVelocity(item.body, { x: item.vx, y: item.vy });
      });
      updateStatus();
    },
    () => {
      destroyedBodies.forEach(item => {
        World.remove(engine.world, item.body);
        World.remove(engine.world, item.constraints);
        bodyCount = Math.max(0, bodyCount - 1);
      });
      World.add(engine.world, createdShards);
      bodyCount += createdShards.length;
      updateStatus();
    }
  );

  updateStatus();
});

// ── Desfazer / Refazer ──
document.getElementById('btn-undo').addEventListener('click', undo);
document.getElementById('btn-redo').addEventListener('click', redo);

// ── Chuva de peças ──
document.getElementById('btn-rain').addEventListener('click', () => { ensureAudio(); rainBurst(); });
