// ── Fábrica de corpos Matter.js ───────────────────────────────────────────────
// Recebe um "descriptor" (objeto plano serializável) e cria o corpo físico,
// adicionando-o ao mundo. Também expõe helpers de cache de vértices locais.

/**
 * Cria e adiciona um corpo ao mundo a partir de um descriptor plano.
 * @param {Object}  d       Descriptor do corpo (ver body-descriptor.js)
 * @param {boolean} record  Se true, registra a ação no histórico de desfazer
 * @returns {Matter.Body|null}
 */
function spawnFromDescriptor(d, record) {
  const dynCount = Composite.allBodies(engine.world).filter(b => !b.isStatic).length;
  if (dynCount >= MAX_BODIES) { flashStatus('LIMITE DE CORPOS ATINGIDO'); return null; }

  const piece = PIECE_BY_ID.get(d.pieceId);
  if (!piece) return null;

  const size  = d.size || 1;
  const bw    = piece.w * size / 2;
  const bh    = piece.h * size / 2;
  const color = d.color || (props.colorVariation ? colorVariant(piece.color) : piece.color);

  // Valores vêm do descriptor, com fallback para os sliders do painel.
  const rest = d.restitution !== undefined ? d.restitution : props.restitution;
  const fric = d.friction    !== undefined ? d.friction    : props.friction;
  const dens = d.density     !== undefined ? d.density     : props.density;
  const drag = d.frictionAir !== undefined ? d.frictionAir
            : (props.frictionAir !== undefined ? props.frictionAir : DEFAULT_AIR_DRAG);

  const opts = {
    restitution: rest, friction: fric, density: dens, frictionAir: drag,
    label: piece.id, angle: d.angle || 0,
    sleepThreshold: sleepThresholdFor(dynCount),
    render: { fillStyle: color + 'cc', strokeStyle: color, lineWidth: 2 },
  };

  let body;
  if (piece.shape === 'circle') {
    body = Bodies.circle(d.x, d.y, bw, opts);
  } else {
    const width   = bw * 2, height = bh * 2;
    const minDim  = Math.min(width, height);
    const chamfer = minDim > 6 ? { chamfer: { radius: Math.min(3, minDim * 0.25) } } : {};
    body = Bodies.rectangle(d.x, d.y, width, height, { ...opts, ...chamfer });
  }

  if (d.vx !== undefined || d.vy !== undefined)
    Body.setVelocity(body, { x: d.vx || 0, y: d.vy || 0 });

  body.plugin.sizeFactor  = size;
  body.plugin.color       = color;
  body.plugin.isFragment  = !!d.isFragment;
  // Guarda a restituição original para a variação por velocidade de impacto
  // (o campo body.restitution é ajustado a cada colisão em collision-handler.js).
  body.plugin.baseRestitution = rest;
  cacheLocalVerts(body);

  World.add(engine.world, body);
  recountBodies();
  if (record) recordSpawn(body, d);
  return body;
}

/**
 * Armazena os vértices em coordenadas locais (relativas ao centro do corpo).
 * Usado pelo efeito de squash/deformação no render.
 */
function cacheLocalVerts(body) {
  const cosA = Math.cos(-body.angle), sinA = Math.sin(-body.angle);
  body.plugin.localVerts = body.vertices.map(v => {
    const dx = v.x - body.position.x, dy = v.y - body.position.y;
    return { x: dx * cosA - dy * sinA, y: dx * sinA + dy * cosA };
  });
}

/**
 * Registra o spawn no histórico para que possa ser desfeito.
 * A referência `ref.body` é mantida para que o redo crie o mesmo objeto.
 */
function recordSpawn(body, descriptor) {
  const ref = { body };
  pushHistory(
    () => { if (ref.body) { World.remove(engine.world, ref.body); recountBodies(); } },
    () => { ref.body = spawnFromDescriptor(descriptor, false); }
  );
}

/**
 * Spawna a peça selecionada na posição do mundo com as props atuais do painel.
 */
function spawnPiece(x, y) {
  const p    = selectedPiece;
  const desc = {
    pieceId: p.id, x, y,
    size: props.size, restitution: props.restitution,
    friction: props.friction, density: props.density,
  };
  const body = spawnFromDescriptor(desc, true);
  if (body) {
    ghost.style.opacity = '.8';
    setTimeout(() => { ghost.style.opacity = ghostVisible ? '.45' : '0'; }, 80);
  }
}
