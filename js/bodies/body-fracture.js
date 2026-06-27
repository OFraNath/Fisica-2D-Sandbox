// ── Fratura de corpos: explosão manual e impacto ─────────────────────────────

/**
 * Destrói um corpo em fragmentos, lançados radialmente.
 * Usado pelo botão Explodir e pode ser registrado no histórico.
 *
 * @param {Matter.Body}   b                 Corpo a ser destruído
 * @param {Matter.Body[]} spawnedShardsArray Array externo para coletar os fragmentos criados
 * @returns {{ originalBody, originalDesc, shards }|null}
 */
function explodeBodyIntoPieces(b, spawnedShardsArray) {
  const piece = PIECES.find(p => p.id === b.label);
  if (!piece) return null;

  const pos          = { ...b.position };
  const vel          = { ...b.velocity };
  const sizeFactor   = b.plugin.sizeFactor || 1;
  const originalDesc = toDescriptor(b);

  World.remove(engine.world, b);
  bodyCount = Math.max(0, bodyCount - 1);

  const localShards = [];
  for (let i = 0; i < FRACTURE_FRAGMENTS; i++) {
    const angle         = (Math.PI * 2 / FRACTURE_FRAGMENTS) * i + Math.random() * 0.4;
    const forceMagnitude = Math.random() * 7 + 6;

    const shard = spawnFromDescriptor({
      pieceId:     b.label,
      x:           pos.x + Math.cos(angle) * 12,
      y:           pos.y + Math.sin(angle) * 12,
      vx:          vel.x * 0.4 + Math.cos(angle) * forceMagnitude,
      vy:          vel.y * 0.4 + Math.sin(angle) * forceMagnitude - 2,
      size:        sizeFactor * 0.35,
      restitution: b.restitution, friction: b.friction, density: b.density,
      color:       b.plugin.color || piece.color,
      isFragment:  true,
    }, false);

    if (shard) {
      localShards.push(shard);
      if (spawnedShardsArray) spawnedShardsArray.push(shard);
    }
  }
  return { originalBody: b, originalDesc, shards: localShards };
}

/**
 * Fragmenta um corpo em pedaços menores por impacto físico.
 * Não registra no histórico (ocorre de forma automática durante a simulação).
 *
 * @param {Matter.Body}  b     Corpo atingido
 * @param {Object}       piece Definição da peça correspondente
 */
function fractureBody(b, piece) {
  const pos  = { ...b.position };
  const vel  = { ...b.velocity };
  World.remove(engine.world, b);
  bodyCount = Math.max(0, bodyCount - 1);

  for (let i = 0; i < FRACTURE_FRAGMENTS_IMPACT; i++) {
    const ang = (Math.PI * 2 / FRACTURE_FRAGMENTS_IMPACT) * i + Math.random();
    spawnFromDescriptor({
      pieceId:     piece.id,
      x:           pos.x + Math.cos(ang) * 10,
      y:           pos.y + Math.sin(ang) * 10,
      vx:          vel.x * 0.5 + Math.cos(ang) * 3,
      vy:          vel.y * 0.5 + Math.sin(ang) * 3,
      size:        (b.plugin.sizeFactor || 1) * 0.55,
      restitution: b.restitution, friction: b.friction, density: b.density,
      color:       b.plugin.color || piece.color,
      isFragment:  true,
    }, false);
  }
  updateStatus();
}
