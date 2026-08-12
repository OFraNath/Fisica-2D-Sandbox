// ── Atalhos de teclado globais ────────────────────────────────────────────────
// Mapeamento completo de teclas para ações do sandbox.
// Não registra atalhos quando o foco está em um <input> (exceto Escape).

document.addEventListener('keydown', e => {
  if (document.activeElement?.tagName === 'INPUT' && e.key !== 'Escape') return;

  // Pausar / Retomar
  if (e.key === ' ')                          { e.preventDefault(); btnPause.click(); return; }

  // Desfazer / Refazer
  if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
    e.preventDefault(); e.shiftKey ? redo() : undo(); return;
  }
  if (e.ctrlKey && (e.key === 'y' || e.key === 'Y')) { e.preventDefault(); redo(); return; }

  // Apagar seleção ou último corpo
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (selectedBodies.length) {
      deleteBodiesWithHistory(selectedBodies);
      selectedBodies = [];
      updateSelStatus();
    } else {
      const bodies = Composite.allBodies(engine.world).filter(b => !b.isStatic);
      if (bodies.length) deleteBodiesWithHistory([bodies[bodies.length - 1]]);
    }
    return;
  }

  // Selecionar peça por número (1–7)
  const idx = parseInt(e.key) - 1;
  if (!isNaN(idx) && idx >= 0 && idx < PIECES.length) {
    document.querySelectorAll('.piece-btn')[idx]?.click(); return;
  }

  // Modos e ações individuais
  if (e.key === 'g' || e.key === 'G') {
    if (pointGravityEnabled) setPointGravity(false);
    const nextY = engine.gravity.y === 0 ? (uniformGravity || 1) : 0;
    engine.gravity.y = nextY;
    const sl = document.getElementById('sl-grav');
    sl.value = engine.gravity.y;
    document.getElementById('val-grav').textContent = engine.gravity.y.toFixed(1);
    return;
  }
  if (e.key === 'b' || e.key === 'B') { setPointGravity(!pointGravityEnabled); return; }
  if (e.key === 'p' || e.key === 'P') { setMode('place');  return; }
  if (e.key === 's' || e.key === 'S') { setMode('select'); return; }
  if (e.key === 'j' || e.key === 'J') { setMode('joint');  return; }
  if (e.key === 'l' || e.key === 'L') { toggleLock();      return; }
  if (e.key === 'e' || e.key === 'E') { btnExplode.click();return; }
  if (e.key === 'c' || e.key === 'C') { btnClear.click();  return; }
  if (e.key === 'x' || e.key === 'X') { ensureAudio(); rainBurst(e.shiftKey ? 200 : undefined); return; }
  if (e.key === 'r' || e.key === 'R') { resetCamera();     return; }
  if (e.key === '+' || e.key === '=') { bumpSize(0.1);     return; }
  if (e.key === '-' || e.key === '_') { bumpSize(-0.1);    return; }
  if (e.key === 'h' || e.key === 'H' || e.key === '?') { toggleHelp(); return; }

  if (e.key === 'Escape') {
    closeHelp();
    jointPending   = null;
    selectedBodies = [];
    updateSelStatus();
  }
});
