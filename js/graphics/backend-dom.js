// ── Backend FRONT/DOM: corpos como divs (compositor GPU) ──────────────────────
// Cada corpo vira uma <div> dentro de #dom-body-layer. O wrapper escala/pan
// via transform (compositor, sem layout) e cada div usa apenas translate/rotate
// — o navegador compõe tudo na GPU. Sem glow (como o modo batata).
// Corpos em squash ficam ocultos: o overlay 2D desenha a deformação por cima.

let domLayer = null;
const domBodies = new Map(); // body.id -> div

/** Cria a camada DOM atrás do canvas 2D (primeiro filho do wrap). */
function ensureDomLayer() {
  if (domLayer) return;
  domLayer = document.createElement('div');
  domLayer.id = 'dom-body-layer';
  wrap.insertBefore(domLayer, wrap.firstChild);
}

/** Cria a div de um corpo (aparência = fill 'cc' + stroke 2px do 2D). */
function domCreateDiv(b) {
  const div = document.createElement('div');
  div.className = 'dom-body';
  const color = b.plugin.color || '#f0c040';
  div.style.background = color + 'cc';
  div.style.border = '1px solid ' + color;
  div.style.borderRadius = (b.label === 'ball' || b.label === 'bigball') ? '50%' : '6px';
  div.style.width  = (b.bounds.max.x - b.bounds.min.x) + 'px';
  div.style.height = (b.bounds.max.y - b.bounds.min.y) + 'px';
  domLayer.appendChild(div);
  return div;
}

/** Atualiza todas as divs para a pose atual dos corpos. */
function domDrawFrame() {
  const bodies = getBodies();

  domLayer.style.transform =
    `scale(${camera.zoom}) translate(${-camera.x}px, ${-camera.y}px)`;

  const seen = new Set();
  for (const b of bodies) {
    if (!isDrawableBody(b)) continue;
    seen.add(b.id);

    let div = domBodies.get(b.id);
    if (!div) {
      div = domCreateDiv(b);
      domBodies.set(b.id, div);
    }

    if (b.render.visible === false) {
      div.style.display = 'none'; // squash → overlay 2D desenha
      continue;
    }

    div.style.display = 'block';
    // Estado de sono: adormecido = translúcido (paridade com o renderer 2D)
    div.style.opacity = (b.isSleeping) ? String(GPU_SLEEP_ALPHA) : '1';
    div.style.transform =
      `translate(${b.position.x}px, ${b.position.y}px) translate(-50%, -50%) rotate(${b.angle}rad)`;
  }

  // Remove divs de corpos que saíram do mundo
  for (const [id, div] of domBodies) {
    if (!seen.has(id)) { div.remove(); domBodies.delete(id); }
  }
}
