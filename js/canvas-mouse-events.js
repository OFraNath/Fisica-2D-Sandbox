// ── Eventos de mouse no canvas ────────────────────────────────────────────────
// Despacha para o sistema correto dependendo do modo ativo e dos modificadores.

render.canvas.addEventListener('mousedown', e => {
  if (e.altKey) return; // Alt+drag é pan da câmera (camera-controls.js)
  ensureAudio();
  if (e.button !== 0 && e.button !== 2) return;

  const wp = screenToWorld(e.offsetX, e.offsetY);

  // Shift+clique: apaga o corpo sob o cursor (qualquer modo)
  if (e.shiftKey && e.button === 0) {
    const bodies = Composite.allBodies(engine.world)
      .filter(b => b.label !== 'floor' && b.label !== 'wall');
    const hit = Query.point(bodies, wp);
    if (hit.length) deleteBodiesWithHistory([hit[0]]);
    return;
  }

  if (e.button !== 0) return;

  if (mode === 'select') {
    isSelecting = true;
    selStart    = { x: e.offsetX, y: e.offsetY };
    selRectEl.style.display = 'block';
    updateSelRect(e.offsetX, e.offsetY);
    return;
  }

  if (mode === 'joint') { handleJointClick(wp); return; }

  // Modo place: spawna apenas se não clicou em cima de outro corpo
  const bodies = Composite.allBodies(engine.world).filter(b => !b.isStatic);
  const hit    = Query.point(bodies, wp).length > 0;
  if (!hit) spawnPiece(wp.x, wp.y);
});

render.canvas.addEventListener('mousemove', e => {
  lastWorldMouse = screenToWorld(e.offsetX, e.offsetY);
  if (mode === 'place') updateGhostPosition(e.offsetX, e.offsetY);
  if (isSelecting)      updateSelRect(e.offsetX, e.offsetY);
});
