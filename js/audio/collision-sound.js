// ── Som procedural de colisão ─────────────────────────────────────────────────
// Gera um "thud" sintético via Web Audio API. O áudio é inicializado
// somente após interação do usuário para respeitar a política dos navegadores.

let audioCtx = null;

/** Inicializa o AudioContext na primeira interação do usuário. */
function ensureAudio() {
  if (audioCtx) return;
  try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
}

/**
 * Toca um impacto grave de curta duração.
 * @param {number} vol  Volume normalizado 0–1
 */
function playThud(vol) {
  if (!audioCtx) return;
  const t   = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(90 + Math.random() * 40, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
  gain.gain.setValueAtTime(vol * 0.5, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

  osc.connect(gain).connect(audioCtx.destination);
  osc.start(t); osc.stop(t + 0.16);
}
