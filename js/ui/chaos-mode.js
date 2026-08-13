// ── Reação em Cadeia (fratura múltipla por contato simultâneo) ───────────────
// Por padrão, um corpo fratura no máximo 1x por evento de colisão, mesmo que
// esteja tocando vários vizinhos ao mesmo tempo (ver o guard fracturedIds em
// collision-handler.js). Com este toggle ligado, esse guard é ignorado: cada
// contato simultâneo dispara sua própria fratura — em aglomerados densos
// (ex.: dentro de um buraco negro), isso cria uma cascata de fragmentos bem
// mais agressiva que o normal.

const btnChaos = document.getElementById('btn-chaos');
btnChaos.addEventListener('click', () => {
  chaosFractureEnabled = !chaosFractureEnabled;
  btnChaos.classList.toggle('active', chaosFractureEnabled);
  btnChaos.textContent = chaosFractureEnabled ? '⛓️ Reação em Cadeia: ON' : '⛓️ Reação em Cadeia: OFF';
  flashStatus(chaosFractureEnabled ? 'REAÇÃO EM CADEIA: ON' : 'Reação em Cadeia: OFF');
});
