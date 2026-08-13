// ── Ferramenta de travar / destravar corpos ───────────────────────────────────
// Trava (isStatic = true) ou destrava os corpos selecionados.
// Corpos travados ficam com borda branca para indicar o estado.

function toggleLock() {
  if (!selectedBodies.length) { flashStatus('NENHUM CORPO SELECIONADO'); return; }
  selectedBodies.forEach(b => {
    if (!b.isStatic) {
      b.plugin.unlockedRender = { ...b.render };
      Body.setStatic(b, true);
      b.render.strokeStyle = '#ffffff';
      b.render.lineWidth   = 3;
    } else {
      Body.setStatic(b, false);
      if (b.plugin.unlockedRender) Object.assign(b.render, b.plugin.unlockedRender);
    }
  });
  // Travar/destravar muda o estado isStatic → recalcula a contagem de dinâmicos
  recountBodies();
  if (typeof drawByBackend === 'function') drawByBackend(render.context, 'external');
}

// Botão do painel (equivalente ao atalho L) — em mobile, fica bloqueado até
// o Modo Cursor ser ligado (ver js/mobile/mobile-ui.js, PRECISION_TOOL_SELECTOR).
const btnLock = document.getElementById('btn-lock');
if (btnLock) btnLock.addEventListener('click', () => toggleLock());
