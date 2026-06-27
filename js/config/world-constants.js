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
