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
  const piece = PIECE_BY_ID.get(b.label);
  if (!piece) return null;

  const pos          = { ...b.position };
  const vel          = { ...b.velocity };
  const sizeFactor   = b.plugin.sizeFactor || 1;
  const originalDesc = toDescriptor(b);
  const parentMat    = {
    restitution: b.plugin.baseRestitution !== undefined ? b.plugin.baseRestitution : b.restitution,
    friction: b.friction, density: b.density, frictionAir: b.frictionAir,
  };
  // Separação radial proporcional à peça para não nascerem sobrepostas
  const spread = Math.max(14, sizeFactor * 0.25 * Math.max(piece.w, piece.h));

  World.remove(engine.world, b);

  const localShards = [];
  for (let i = 0; i < FRACTURE_FRAGMENTS; i++) {
    const angle         = (Math.PI * 2 / FRACTURE_FRAGMENTS) * i + Math.random() * 0.4;
    const forceMagnitude = Math.random() * 7 + 6;

    const shard = spawnFromDescriptor({
      pieceId:     b.label,
      x:           pos.x + Math.cos(angle) * spread,
      y:           pos.y + Math.sin(angle) * spread,
      vx:          vel.x * 0.4 + Math.cos(angle) * forceMagnitude,
      vy:          vel.y * 0.4 + Math.sin(angle) * forceMagnitude - 2,
      size:        sizeFactor * 0.35,
      restitution: parentMat.restitution,
      friction:    parentMat.friction,
      density:     parentMat.density,
      frictionAir: parentMat.frictionAir,
      color:       b.plugin.color || piece.color,
      isFragment:  true,
    }, false);

    if (shard) {
      // Herda rotação e ganha giro aleatório (efeito de "estilhaço")
      Body.setAngularVelocity(shard, b.angularVelocity + (Math.random() - 0.5) * 0.3);
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
  const spread = Math.max(10, (b.plugin.sizeFactor || 1) * 0.25 * Math.max(piece.w, piece.h) * 0.7);
  const parentMat = {
    restitution: b.plugin.baseRestitution !== undefined ? b.plugin.baseRestitution : b.restitution,
    friction: b.friction, density: b.density, frictionAir: b.frictionAir,
  };
  World.remove(engine.world, b);

  for (let i = 0; i < FRACTURE_FRAGMENTS_IMPACT; i++) {
    const ang = (Math.PI * 2 / FRACTURE_FRAGMENTS_IMPACT) * i + Math.random();
    const shard = spawnFromDescriptor({
      pieceId:     piece.id,
      x:           pos.x + Math.cos(ang) * spread,
      y:           pos.y + Math.sin(ang) * spread,
      vx:          vel.x * 0.5 + Math.cos(ang) * 3,
      vy:          vel.y * 0.5 + Math.sin(ang) * 3,
      size:        (b.plugin.sizeFactor || 1) * 0.55,
      restitution: parentMat.restitution,
      friction:    parentMat.friction,
      density:     parentMat.density,
      frictionAir: parentMat.frictionAir,
      color:       b.plugin.color || piece.color,
      isFragment:  true,
    }, false);
    if (shard) Body.setAngularVelocity(shard, b.angularVelocity + (Math.random() - 0.5) * 0.25);
  }
  recountBodies();
}
