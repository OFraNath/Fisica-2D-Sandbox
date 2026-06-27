// ── Definição de peças disponíveis para spawn ─────────────────────────────────
// Cada peça descreve: id único, label PT-BR, cor hex padrão, dimensões base
// em pixels, forma (rect | circle) e SVG inline para o preview no painel.
// Para adicionar uma peça nova, basta empurrar um objeto nesse mesmo formato.

const PIECES = [
  {
    id: 'cube', label: 'Cubo', color: '#f0c040', w: 50, h: 50, shape: 'rect',
    svgPath: `<rect x="4" y="4" width="24" height="24" rx="2" fill="none" stroke="#f0c040" stroke-width="2"/>`,
    vb: '0 0 32 32'
  },
  {
    id: 'wide', label: 'Prancha', color: '#e05a2b', w: 100, h: 30, shape: 'rect',
    svgPath: `<rect x="2" y="8" width="28" height="16" rx="2" fill="none" stroke="#e05a2b" stroke-width="2"/>`,
    vb: '0 0 32 32'
  },
  {
    id: 'tall', label: 'Coluna', color: '#4ab8e8', w: 30, h: 100, shape: 'rect',
    svgPath: `<rect x="10" y="2" width="12" height="28" rx="2" fill="none" stroke="#4ab8e8" stroke-width="2"/>`,
    vb: '0 0 32 32'
  },
  {
    id: 'small', label: 'Tijolo', color: '#c87941', w: 60, h: 25, shape: 'rect',
    svgPath: `<rect x="3" y="10" width="26" height="12" rx="2" fill="none" stroke="#c87941" stroke-width="2"/>`,
    vb: '0 0 32 32'
  },
  {
    id: 'ball', label: 'Bola', color: '#a0e060', w: 40, h: 40, shape: 'circle',
    svgPath: `<circle cx="16" cy="16" r="12" fill="none" stroke="#a0e060" stroke-width="2"/>`,
    vb: '0 0 32 32'
  },
  {
    id: 'bigball', label: 'Bola Grande', color: '#7b5ea7', w: 70, h: 70, shape: 'circle',
    svgPath: `<circle cx="16" cy="16" r="13" fill="none" stroke="#7b5ea7" stroke-width="2.5"/>`,
    vb: '0 0 32 32'
  },
  {
    id: 'plank', label: 'Viga', color: '#60c8b0', w: 160, h: 20, shape: 'rect',
    svgPath: `<rect x="1" y="11" width="30" height="10" rx="1" fill="none" stroke="#60c8b0" stroke-width="2"/>`,
    vb: '0 0 32 32'
  },
];
