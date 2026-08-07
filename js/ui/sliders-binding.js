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
bindSlider('sl-airdrag', 'frictionAir', 'val-airdrag', v => v.toFixed(3));

document.getElementById('chk-colorvar').addEventListener('change', function () {
  props.colorVariation = this.checked;
});

// Propriedades do mundo (afetam corpos existentes em tempo real)
document.getElementById('sl-grav').addEventListener('input', function () {
  uniformGravity = parseFloat(this.value);
  if (!pointGravityEnabled) engine.gravity.y = uniformGravity;
  document.getElementById('val-grav').textContent = uniformGravity.toFixed(1);
});

document.getElementById('sl-wind').addEventListener('input', function () {
  windForce = parseFloat(this.value);
  document.getElementById('val-wind').textContent = windForce.toFixed(1);
});

document.getElementById('sl-precision').addEventListener('input', function () {
  const v = parseInt(this.value);
  engine.positionIterations = v;
  engine.velocityIterations = Math.max(1, v - 2);
  engine.constraintIterations = clamp(Math.round(v / 4), 2, 8);
  document.getElementById('val-precision').textContent = v;
});

// Gravidade pontual (buraco negro)
const chkPointGrav = document.getElementById('chk-pointgrav');
const slPointGrav  = document.getElementById('sl-pointgrav');

/**
 * Liga/desliga a gravidade pontual, zerando ou restaurando a uniforme.
 * @param {boolean} enabled
 */
function setPointGravity(enabled) {
  pointGravityEnabled = enabled;
  chkPointGrav.checked = enabled;
  engine.gravity.y = enabled ? 0 : uniformGravity;
  const slGrav = document.getElementById('sl-grav');
  slGrav.value = engine.gravity.y;
  document.getElementById('val-grav').textContent = engine.gravity.y.toFixed(1);
}

chkPointGrav.addEventListener('change', function () { setPointGravity(this.checked); });
slPointGrav.addEventListener('input', function () {
  gravityStrength = parseFloat(this.value);
  document.getElementById('val-pointgrav').textContent = parseFloat(this.value).toFixed(1);
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
