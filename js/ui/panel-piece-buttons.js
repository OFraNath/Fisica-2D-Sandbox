// ── Injeta botões de peça no painel lateral ───────────────────────────────────
// Lê PIECES e cria um <button class="piece-btn"> para cada item,
// inserindo-os logo após o primeiro .section-label do painel.

const panel        = document.getElementById('panel');
const sectionLabel = panel.querySelector('.section-label');

/**
 * Ajusta um slider do painel e o valor correspondente em props,
 * sincronizando a exibição formatada.
 * @param {string}   id       Id do <input type="range">
 * @param {string}   key      Chave no objeto `props`
 * @param {string}   display  Id do elemento que exibe o valor
 * @param {number}   value    Novo valor
 * @param {Function} fmt      Formatação do valor exibido
 */
function applyMaterialSlider(id, key, display, value, fmt) {
  const sl = document.getElementById(id);
  if (!sl) return;
  sl.value = value;
  props[key] = value;
  document.getElementById(display).textContent = fmt(value);
}

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

    // Sincroniza os sliders com o material padrão da peça selecionada
    if (p.rest !== undefined) applyMaterialSlider('sl-rest', 'restitution', 'val-rest', p.rest, v => v.toFixed(2));
    if (p.fric !== undefined) applyMaterialSlider('sl-fric', 'friction',    'val-fric', p.fric, v => v.toFixed(2));
    if (p.dens !== undefined) applyMaterialSlider('sl-dens', 'density',     'val-dens', p.dens, v => v.toFixed(3));
    if (p.drag !== undefined) applyMaterialSlider('sl-airdrag', 'frictionAir', 'val-airdrag', p.drag, v => v.toFixed(3));

    updateGhost();
  });

  panel.insertBefore(btn, sectionLabel.nextSibling);
});

document.getElementById('st-sel').textContent = PIECES[0].label;
