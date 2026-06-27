// ── Estado global da interface e ferramentas ──────────────────────────────────
// Centraliza variáveis mutáveis compartilhadas entre múltiplos módulos.
// Leia daqui; escreva preferencialmente através das funções dos módulos.

let selectedPiece  = PIECES[0]; // peça atualmente selecionada no painel
let mode           = 'place';   // modo ativo: 'place' | 'select' | 'joint'
let paused         = false;
let ghostVisible   = false;
let bodyCount      = 0;
let selectedBodies = [];
let jointPending   = null;      // primeiro corpo clicado no modo Joint (aguarda segundo)
let lastWorldMouse = { x: 0, y: 0 };
let windForce      = 0;
let potatoMode     = false;     // desativa efeitos visuais pesados
let fractureEnabled   = true;
let fractureThreshold = 30;     // velocidade mínima de impacto para fraturar

// Propriedades do próximo corpo a ser spawnado (ligadas aos sliders do painel)
const props = {
  size:           1,
  restitution:    0.3,
  friction:       0.5,
  density:        0.01,
  colorVariation: false,
};
