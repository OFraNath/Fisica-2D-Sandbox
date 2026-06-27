// ── Ferramenta de seleção por retângulo ───────────────────────────────────────
// Permite selecionar múltiplos corpos arrastando o mouse no modo "select".

const selRectEl = document.getElementById('select-rect');
let isSelecting = false;
let selStart    = null;

/** Atualiza a posição e dimensões do retângulo visual de seleção. */
function updateSelRect(sx, sy) {
  const x = Math.min(sx, selStart.x), y = Math.min(sy, selStart.y);
  const w = Math.abs(sx - selStart.x), h = Math.abs(sy - selStart.y);
  selRectEl.style.left   = x + 'px';
  selRectEl.style.top    = y + 'px';
  selRectEl.style.width  = w + 'px';
  selRectEl.style.height = h + 'px';
}

/** Atualiza o contador de selecionados na status bar. */
function updateSelStatus() {
  document.getElementById('st-sel-count').textContent = selectedBodies.length;
}

// Início do drag (mousedown no canvas, tratado em canvas-mouse-events.js)
// Fim do drag: aplica Query.region para coletar corpos
window.addEventListener('mouseup', e => {
  if (!isSelecting) return;
  isSelecting = false;
  selRectEl.style.display = 'none';

  const rect = render.canvas.getBoundingClientRect();
  const ex   = e.clientX - rect.left, ey = e.clientY - rect.top;
  const p1   = screenToWorld(Math.min(selStart.x, ex), Math.min(selStart.y, ey));
  const p2   = screenToWorld(Math.max(selStart.x, ex), Math.max(selStart.y, ey));
  const all  = Composite.allBodies(engine.world).filter(b => b.label !== 'floor' && b.label !== 'wall');
  selectedBodies = Query.region(all, { min: p1, max: p2 });
  updateSelStatus();
});
