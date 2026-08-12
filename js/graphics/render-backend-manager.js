// ── Gerenciador de backends de render ─────────────────────────────────────────
// AUTO detecta WebGL2 → GPU; sem WebGL2 → CPU (pipeline original, nunca pior
// que o estado atual). A troca é feita em runtime, sem resetar o mundo e
// sem tocar na física, ferramentas ou UI.

let activeBackend = 'cpu'; // backend efetivo após resolver o AUTO

const BACKEND_LABELS = {
  gpu: 'GPU · WebGL2',
  cpu: 'CPU · Canvas 2D',
};

/** Converte a escolha do usuário no backend efetivo (com fallback). */
function resolveBackend() {
  if (renderBackend === 'auto') return gpuSupported() ? 'gpu' : 'cpu';
  if (renderBackend === 'gpu' && !gpuSupported()) return 'cpu';
  return renderBackend;
}

/**
 * Aplica o backend efetivo: liga/desliga o render nativo do Matter e
 * mostra/oculta a camada GPU.
 */
function applyRenderBackend(target) {
  if (target === 'cpu') {
    Render.stop(render);
    Render.run(render);
    if (gpuCanvas) gpuCanvas.style.display = 'none';
  } else if (target === 'gpu') {
    if (!activateGpuBackend()) {
      // WebGL2 indisponível/falhou nesta GPU: cai para CPU em vez de
      // deixar activeBackend='gpu' com um contexto nulo (tela quebrada).
      target = 'cpu';
      Render.stop(render);
      Render.run(render);
      if (gpuCanvas) gpuCanvas.style.display = 'none';
    }
  }
  activeBackend = target;
}

/**
 * Define o backend escolhido pelo usuário ('auto' | 'gpu' | 'cpu').
 * Em caso de indisponibilidade (ex.: sem WebGL2), cai automaticamente na CPU.
 */
function setRenderBackend(name) {
  renderBackend = name;
  const target = resolveBackend();
  applyRenderBackend(target);
  updateRenderStatus();
  if (flashStatus) flashStatus('Render: ' + BACKEND_LABELS[activeBackend]);
}

/**
 * Ponto de entrada do render-loop: recebe a fase ('cpu' = afterRender do
 * Matter, 'external' = afterUpdate) e despacha para o backend ativo.
 */
function drawByBackend(ctx, source) {
  if (activeBackend === 'cpu') {
    if (source === 'cpu') drawCpuFrame(ctx);
    return;
  }
  if (source === 'cpu') return;

  // Backend GPU: o canvas 2D fica por cima e recebe apenas overlays
  ctx.clearRect(0, 0, W, H);
  drawFloorLine(ctx);
  drawGravityPointMarker(ctx);

  gpuDrawFrame();

  drawSquashAnimations(ctx, getBodies());
  drawSelectionHighlight(ctx);
}

/** Sincroniza o seletor e o status bar com o backend ativo. */
function updateRenderStatus() {
  const el = document.getElementById('st-render');
  if (el) {
    el.textContent = BACKEND_LABELS[activeBackend];
    el.title = gpuInfoString;
  }
  const sel = document.getElementById('sel-render');
  if (sel) {
    sel.title = 'Backend real: ' + gpuInfoString;
    sel.value = (renderBackend === 'auto') ? 'auto' : activeBackend;
  }
  const selSim = document.getElementById('sel-sim');
  if (selSim) selSim.value = simulationBackend;
}

// ── Boot: detecta GPU, aplica AUTO e conecta a UI ─────────────────────────────
initWebGL();
applyRenderBackend(resolveBackend());

const selRender = document.getElementById('sel-render');
if (selRender) selRender.addEventListener('change', () => setRenderBackend(selRender.value));

const selSim = document.getElementById('sel-sim');
if (selSim) selSim.addEventListener('change', () => { selSim.value = simulationBackend; });

updateRenderStatus();