// ── Estado global da interface e ferramentas ──────────────────────────────────
// Centraliza variáveis mutáveis compartilhadas entre múltiplos módulos.
// Leia daqui; escreva preferencialmente através das funções dos módulos.

let selectedPiece  = PIECES[0]; // peça atualmente selecionada no painel
let mode           = 'place';   // modo ativo: 'place' | 'select' | 'joint'
let paused         = false;
let ghostVisible   = false;
let bodyCount      = 0;
let userPrecision  = 10;    // teto do solver ajustável no slider de precisão
let selectedBodies = [];
let jointPending   = null;      // primeiro corpo clicado no modo Joint (aguarda segundo)
let lastWorldMouse = { x: 0, y: 0 };
let windForce      = 0;
let potatoMode     = false;     // desativa efeitos visuais pesados
let fractureEnabled   = true;
let fractureThreshold = 30;     // velocidade mínima de impacto para fraturar

// Modo Caos: reintroduz de propósito o "bug" de fratura duplicada por par
// de colisão simultâneo (ver collision-handler.js). Sem isso, um corpo
// nunca fratura mais de uma vez por evento — com isso, cada contato
// simultâneo conta como uma fratura extra, multiplicando fragmentos em
// aglomerados densos (ex.: dentro de um buraco negro).
let chaosFractureEnabled = false;

// Gravidade pontual (buraco negro)
let pointGravityEnabled = false; // se true, atrai corpos para o centro da viewport
let gravityStrength     = 1;     // multiplicador de força (slider do painel)
let uniformGravity      = 1;     // gravidade uniforme do usuário (restaurada ao desligar o ponto)

// Motor gráfico (ver js/graphics/render-backend-manager.js)
let renderBackend     = 'auto';  // 'auto' | 'gpu' | 'cpu'
let simulationBackend = 'cpu';   // 'cpu' (Matter.js) | 'gpu' (WebGPU — roadmap)

// Propriedades do próximo corpo a ser spawnado (ligadas aos sliders do painel)
const props = {
  size:           1,
  restitution:    0.3,
  friction:       0.5,
  density:        0.01,
  frictionAir:    0.01,
  colorVariation: false,
};
