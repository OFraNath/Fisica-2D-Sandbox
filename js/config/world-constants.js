// ── Constantes globais do mundo físico ───────────────────────────────────────
// Ajuste aqui sem precisar vasculhar o resto do código.

const MAX_BODIES      = 1000;   // limite de corpos dinâmicos simultâneos
const MAX_SPEED       = 128;    // velocidade máxima de qualquer corpo (px/frame)
const HISTORY_LIMIT   = 50;     // número máximo de passos no histórico de desfazer

// Câmera
const CAMERA_PAN_LIMIT = 50000; // limite de deslocamento em cada eixo

// Glow
const GLOW_SCALE       = 0.5;   // resolução da camada de glow (0.5 = metade da tela)
const GLOW_BLUR_PX     = 13;    // raio de blur único equivalente ao shadowBlur(22)
const GLOW_CULL_MARGIN = 80;    // margem extra para não cortar halos na borda da view

// Fratura
const FRACTURE_FRAGMENTS        = 6;    // fragmentos gerados por explosão manual
const FRACTURE_FRAGMENTS_IMPACT = 3;    // fragmentos gerados por impacto
const FRACTURE_MIN_SIZE_FACTOR  = 0.4;  // abaixo disso a peça não fragmenta mais
const FRACTURE_MIN_AREA         = 1400; // peças menores que isso não fragmentam (w*h)

// Limpeza e anti-tunelamento
const OFFSCREEN_MARGIN   = 300;  // margem além da viewport p/ remover corpos perdidos
const MIN_SPEED_CAP      = 30;   // piso do cap de velocidade por corpo (px/step)
const SPEED_SIZE_FACTOR  = 3;    // cap = menor dimensão × fator (evita atravessar paredes)

// Materiais
const DEFAULT_AIR_DRAG = 0.01;   // arrasto do ar quando nenhum valor é definido

// Restituição dependente do impacto
const RESTITUTION_SPEED_REF = 40; // velocidade de impacto que reduz o quique a 50%

// Gravidade pontual (buraco negro)
const GRAVITY_POINT_STRENGTH = 80;    // G da força radial: G·m/(r² + soften)
const GRAVITY_POINT_SOFTEN   = 4000;  // evita singularidade de força no centro
const GRAVITY_POINT_RADIUS   = 700;   // raio de influência (px de mundo)

// Arremesso (fling)
const THROW_MAX_SAMPLES = 8;  // amostras posição/tempo guardadas durante o drag
