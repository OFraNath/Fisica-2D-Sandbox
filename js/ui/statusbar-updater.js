// ── Atualização da barra de status ────────────────────────────────────────────

/** Atualiza o contador de corpos na status bar. */
function updateStatus() {
  document.getElementById('st-bodies').textContent = bodyCount;
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
