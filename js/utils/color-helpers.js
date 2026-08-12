// ── Utilitários de cor ────────────────────────────────────────────────────────

/**
 * Clareia ou escurece uma cor hex pelo valor `amt` (positivo = mais claro).
 * @param {string} hex  Cor no formato '#rrggbb'
 * @param {number} amt  Quantidade a somar em cada canal (-255 … 255)
 * @returns {string}    Nova cor hex
 */
function lighten(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = clamp(r + amt, 0, 255);
  g = clamp(g + amt, 0, 255);
  b = clamp(b + amt, 0, 255);
  return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
}

/**
 * Gera uma variante aleatória de uma cor base (±40 em cada canal).
 * @param {string} hex  Cor base no formato '#rrggbb'
 * @returns {string}    Variante hex
 */
function colorVariant(hex) { return lighten(hex, Math.random() * 80 - 40); }

/**
 * Converte uma cor hex em canais RGB (0–255).
 * Usado pelo backend GPU para montar cores sem parse por frame.
 * @param {string} hex  Cor no formato '#rrggbb'
 * @returns {number[]}  [r, g, b]
 */
function hexToRgb(hex) {
  const n = parseInt((hex || '').slice(1), 16);
  if (!isFinite(n)) return [240, 192, 64];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
