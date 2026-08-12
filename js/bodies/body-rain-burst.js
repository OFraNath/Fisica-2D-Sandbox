// ── Chuva de peças aleatórias ─────────────────────────────────────────────────
// Lança peças em cascata a partir do topo da viewport atual.
// @param {number} [quantity] Quantidade (padrão 15; >100 = stress test)

function rainBurst(quantity) {
  const count = quantity || 15;
  if (count > 100) flashStatus('STRESS TEST: ' + count + ' PEÇAS');
  const vw = W / camera.zoom;
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const piece = PIECES[Math.floor(Math.random() * PIECES.length)];
      const x     = camera.x + 20 + Math.random() * (vw - 40);
      const y     = camera.y - 120 - Math.random() * 100;
      spawnFromDescriptor({
        pieceId:     piece.id, x, y,
        vx:          windForce * 2 + (Math.random() * 4 - 2),
        vy:          Math.random() * 4 + 8,
        size:        0.4 + Math.random() * 0.6,
        restitution: props.restitution,
        friction:    props.friction,
        density:     props.density,
      }, false);
    }, i * 60);
  }
}
