// ── Injeta botões de peça no painel lateral ───────────────────────────────────
// Lê PIECES e cria um <button class="piece-btn"> para cada item,
// inserindo-os logo após o primeiro .section-label do painel.

const panel        = document.getElementById('panel');
const sectionLabel = panel.querySelector('.section-label');

PIECES.forEach((p, i) => {
  const btn       = document.createElement('button');
  btn.className   = 'piece-btn' + (i === 0 ? ' selected' : '');
  btn.dataset.id  = p.id;
  btn.innerHTML   = `
    <div class="piece-preview">
      <svg viewBox="${p.vb}" xmlns="http://www.w3.org/2000/svg">${p.svgPath}</svg>
    </div>
    <span>${p.label}</span>
  `;
  btn.style.borderLeftColor = p.color;
  btn.style.borderLeftWidth = '3px';

  btn.addEventListener('click', () => {
    document.querySelectorAll('.piece-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedPiece = p;
    document.getElementById('st-sel').textContent = p.label;
    updateGhost();
  });

  panel.insertBefore(btn, sectionLabel.nextSibling);
});

document.getElementById('st-sel').textContent = PIECES[0].label;
