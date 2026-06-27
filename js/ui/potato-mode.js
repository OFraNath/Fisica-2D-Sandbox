// ── Modo PC Batata ────────────────────────────────────────────────────────────
// Desativa todos os efeitos visuais pesados (bloom, neon, squash)
// para maximizar a performance em hardware fraco.

const btnPotato = document.getElementById('btn-potato');
btnPotato.addEventListener('click', () => {
  potatoMode = !potatoMode;
  btnPotato.classList.toggle('active', potatoMode);
  btnPotato.textContent = potatoMode ? '🥔 PC Batata: ON' : '🥔 PC Batata: OFF';

  // Cancela squash em andamento e reativa visibilidade dos corpos
  Composite.allBodies(engine.world).forEach(b => {
    if (potatoMode) {
      b.render.visible     = true;
      b.plugin.squashUntil = null;
    }
  });

  updateGhost(); // atualiza aparência do ghost (sem glow no modo batata)
});
