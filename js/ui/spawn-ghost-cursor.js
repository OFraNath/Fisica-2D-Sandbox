// ── Ghost cursor: preview da peça sob o cursor ────────────────────────────────
// Div #spawn-ghost reposicionada a cada mousemove para mostrar onde a peça vai cair.

const ghost = document.getElementById('spawn-ghost');

/** Atualiza estilo do ghost para refletir a peça e modo atuais. */
function updateGhost() {
  const p = selectedPiece, s = props.size * camera.zoom;
  ghost.style.width        = (p.w * s) + 'px';
  ghost.style.height       = (p.h * s) + 'px';
  ghost.style.borderRadius = p.shape === 'circle' ? '50%' : '4px';

  if (potatoMode) {
    ghost.style.background = 'rgba(255,255,255,0.15)';
    ghost.style.border     = '2px dashed #888';
    ghost.style.boxShadow  = 'none';
  } else {
    ghost.style.background = p.color + '33';
    ghost.style.border     = `2px dashed ${p.color}`;
    ghost.style.boxShadow  = `0 0 35px ${p.color}, inset 0 0 12px ${p.color}`;
  }
}
updateGhost();

/** Move o ghost para a posição de tela (sx, sy). */
function updateGhostPosition(sx, sy) {
  const p  = selectedPiece, s = props.size * camera.zoom;
  const gw = p.w * s, gh = p.h * s;
  ghost.style.width   = gw + 'px';
  ghost.style.height  = gh + 'px';
  ghost.style.left    = (sx - gw / 2) + 'px';
  ghost.style.top     = (sy - gh / 2) + 'px';
  ghost.style.opacity = '.45';
  ghostVisible = true;
}

wrap.addEventListener('mouseleave', () => { ghost.style.opacity = '0'; ghostVisible = false; });
