// ── Definição de peças disponíveis para spawn ─────────────────────────────────
// Cada peça descreve: id único, label PT-BR, cor hex padrão, dimensões base
// em pixels, forma (rect | circle), SVG inline para o preview no painel e o
// material padrão (rest/fric/dens/drag). Ao selecionar uma peça no painel,
// os sliders de propriedade são sincronizados com o material dela.
// Para adicionar uma peça nova, basta empurrar um objeto nesse mesmo formato.

const PIECES = [
  {
    id: 'cube', label: 'Cubo', color: '#f0c040', w: 50, h: 50, shape: 'rect',
    rest: 0.3, fric: 0.5, dens: 0.01, drag: 0.012,
    svgPath: `<rect x="4" y="4" width="24" height="24" rx="2" fill="none" stroke="#f0c040" stroke-width="2"/>`,
    vb: '0 0 32 32'
  },
  {
    id: 'wide', label: 'Prancha', color: '#e05a2b', w: 100, h: 30, shape: 'rect',
    rest: 0.25, fric: 0.6, dens: 0.008, drag: 0.015,
    svgPath: `<rect x="2" y="8" width="28" height="16" rx="2" fill="none" stroke="#e05a2b" stroke-width="2"/>`,
    vb: '0 0 32 32'
  },
  {
    id: 'tall', label: 'Coluna', color: '#4ab8e8', w: 30, h: 100, shape: 'rect',
    rest: 0.25, fric: 0.6, dens: 0.008, drag: 0.015,
    svgPath: `<rect x="10" y="2" width="12" height="28" rx="2" fill="none" stroke="#4ab8e8" stroke-width="2"/>`,
    vb: '0 0 32 32'
  },
  {
    id: 'small', label: 'Tijolo', color: '#c87941', w: 60, h: 25, shape: 'rect',
    rest: 0.2, fric: 0.7, dens: 0.02, drag: 0.02,
    svgPath: `<rect x="3" y="10" width="26" height="12" rx="2" fill="none" stroke="#c87941" stroke-width="2"/>`,
    vb: '0 0 32 32'
  },
  {
    id: 'ball', label: 'Bola', color: '#a0e060', w: 40, h: 40, shape: 'circle',
    rest: 0.8, fric: 0.15, dens: 0.006, drag: 0.004,
    svgPath: `<circle cx="16" cy="16" r="12" fill="none" stroke="#a0e060" stroke-width="2"/>`,
    vb: '0 0 32 32'
  },
  {
    id: 'bigball', label: 'Bola Grande', color: '#7b5ea7', w: 70, h: 70, shape: 'circle',
    rest: 0.7, fric: 0.15, dens: 0.006, drag: 0.006,
    svgPath: `<circle cx="16" cy="16" r="13" fill="none" stroke="#7b5ea7" stroke-width="2.5"/>`,
    vb: '0 0 32 32'
  },
  {
    id: 'plank', label: 'Viga', color: '#60c8b0', w: 160, h: 20, shape: 'rect',
    rest: 0.15, fric: 0.7, dens: 0.004, drag: 0.02,
    svgPath: `<rect x="1" y="11" width="30" height="10" rx="1" fill="none" stroke="#60c8b0" stroke-width="2"/>`,
    vb: '0 0 32 32'
  },
];
