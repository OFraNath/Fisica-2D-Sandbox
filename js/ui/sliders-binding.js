// ── Ligação dos sliders do painel aos dados ───────────────────────────────────
// Cada slider atualiza um campo de `props` ou diretamente o engine/world.

/**
 * Registra o listener de um slider para sincronizar com props e exibir o valor.
 * @param {string}   id       Id do <input type="range">
 * @param {string}   key      Chave no objeto `props`
 * @param {string}   display  Id do elemento que exibe o valor formatado
 * @param {Function} fmt      Função de formatação do valor
 */
function bindSlider(id, key, display, fmt) {
  const sl  = document.getElementById(id);
  const val = document.getElementById(display);
  sl.addEventListener('input', () => {
    props[key] = parseFloat(sl.value);
    val.textContent = fmt(props[key]);
    updateGhost();
  });
}

// Propriedades do corpo (afetam o próximo spawn)
bindSlider('sl-size', 'size',        'val-size', v => v.toFixed(1) + '×');
bindSlider('sl-rest', 'restitution', 'val-rest', v => v.toFixed(2));
bindSlider('sl-fric', 'friction',    'val-fric', v => v.toFixed(2));
bindSlider('sl-dens', 'density',     'val-dens', v => v.toFixed(3));

document.getElementById('chk-colorvar').addEventListener('change', function () {
  props.colorVariation = this.checked;
});

// Propriedades do mundo (afetam corpos existentes em tempo real)
document.getElementById('sl-grav').addEventListener('input', function () {
  engine.gravity.y = parseFloat(this.value);
  document.getElementById('val-grav').textContent = parseFloat(this.value).toFixed(1);
});

document.getElementById('sl-wind').addEventListener('input', function () {
  windForce = parseFloat(this.value);
  document.getElementById('val-wind').textContent = windForce.toFixed(1);
});

document.getElementById('sl-precision').addEventListener('input', function () {
  const v = parseInt(this.value);
  engine.positionIterations = v;
  engine.velocityIterations = Math.max(1, v - 2);
  document.getElementById('val-precision').textContent = v;
});

// Fratura
document.getElementById('chk-fracture').addEventListener('change', function () {
  fractureEnabled = this.checked;
});
document.getElementById('sl-toughness').addEventListener('input', function () {
  const t = parseInt(this.value);
  fractureThreshold = 10 + t * 4;
  document.getElementById('val-toughness').textContent = t;
});

/** Ajusta o slider de tamanho via teclas + / - (atalho de teclado). */
function bumpSize(delta) {
  const sl = document.getElementById('sl-size');
  const v  = clamp(parseFloat(sl.value) + delta, parseFloat(sl.min), parseFloat(sl.max));
  sl.value = v;
  props.size = v;
  document.getElementById('val-size').textContent = v.toFixed(1) + '×';
  updateGhost();
}
