// ── Tooltip que aparece ao passar o mouse nos botões de peça ──────────────────
// Exibe o atalho de teclado (1–7) e o nome da peça.

const tooltip = document.getElementById('tooltip');

document.querySelectorAll('.piece-btn').forEach((btn, i) => {
  btn.addEventListener('mouseenter', () => {
    tooltip.textContent = `Tecla ${i + 1} • ${PIECES[i].label}`;
    tooltip.classList.add('show');
  });
  btn.addEventListener('mousemove', e => {
    tooltip.style.left = (e.clientX + 14) + 'px';
    tooltip.style.top  = (e.clientY - 28) + 'px';
  });
  btn.addEventListener('mouseleave', () => tooltip.classList.remove('show'));
});
