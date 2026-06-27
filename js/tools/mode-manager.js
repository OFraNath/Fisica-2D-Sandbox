// ── Gerenciador de modos de ferramenta ───────────────────────────────────────
// Controla a transição entre os modos "Soltar", "Selecionar" e "Conectar".

const modeLabels = { place: 'SOLTAR', select: 'SELECIONAR', joint: 'CONECTAR' };

/**
 * Ativa um modo de ferramenta, atualizando botões e estado.
 * @param {'place'|'select'|'joint'} m
 */
function setMode(m) {
  mode = m;
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
  document.getElementById('st-mode').textContent = 'MODO: ' + modeLabels[m];

  jointPending = null;
  if (m !== 'select') { selectedBodies = []; updateSelStatus(); }

  // No modo select/joint, desativa o drag de corpos com o mouse
  mConstraint.collisionFilter.mask = (m === 'select' || m === 'joint') ? 0x00000000 : 0xFFFFFFFF;
}

// Conecta botões de ferramenta do painel
document.querySelectorAll('.tool-btn').forEach(b => {
  if (b.id !== 'btn-potato') b.addEventListener('click', () => setMode(b.dataset.mode));
});
