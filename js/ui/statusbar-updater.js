// ── Atualização da barra de status ────────────────────────────────────────────

/** Fonte única de verdade do contador: conta os corpos dinâmicos do mundo. */
function countDynamicBodies() {
  return Composite.allBodies(engine.world).filter(b => !b.isStatic).length;
}

/**
 * Recalcula bodyCount a partir do mundo real e sincroniza a status bar.
 * Sempre que corpos são adicionados/removidos/travados, chame esta função
 * em vez de mexer manualmente no contador (evita drift).
 */
function recountBodies() {
  bodyCount = countDynamicBodies();
  updateStatus();
  if (typeof tuneSolverForLoad === 'function') tuneSolverForLoad(bodyCount);
}

/** Atualiza o contador de corpos na status bar, com o limite à frente. */
function updateStatus() {
  document.getElementById('st-bodies').textContent = bodyCount + '/' + MAX_BODIES;
}

/**
 * Exibe uma mensagem temporária no campo de modo da status bar,
 * voltando ao texto anterior após 1,2 s.
 * @param {string} msg
 */
function flashStatus(msg) {
  const el   = document.getElementById('st-mode');
  const prev = el.textContent;
  el.textContent = msg;
  setTimeout(() => { el.textContent = prev; }, 1200);
}
