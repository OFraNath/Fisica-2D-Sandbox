// ── Inicialização do Matter.js (engine + renderer + runner) ──────────────────
// Desestrutura os módulos usados no projeto para que o restante do código
// possa referenciar diretamente Engine, Bodies, etc., sem o prefixo Matter.

const {
  Engine, Render, Runner, Bodies, Body,
  World, Events, Mouse, MouseConstraint,
  Composite, Vector, Constraint, Query
} = Matter;

const wrap = document.getElementById('canvas-wrap');
// W/H eram `const` (lidos uma única vez no load) — agora são `let` porque
// js/mobile/viewport-resize.js precisa recalculá-los em resize/orientationchange
// (ver CLAUDE.md / PLANO-MOBILE.md, Fase 0: base de resize).
let W = wrap.clientWidth;
let H = wrap.clientHeight;

// Engine com parâmetros de iteração padrão (ajustável via slider de precisão)
const engine = Engine.create({
  gravity: { y: 1 },
  positionIterations: 10,
  velocityIterations: 8,
  enableSleeping: true,
});

// Renderer transparente (os efeitos visuais são desenhados manualmente em render-loop.js)
const render = Render.create({
  element: wrap,
  engine,
  options: {
    width: W,
    height: H,
    wireframes: false,
    background: 'transparent',
    pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
    hasBounds: true,
  },
});
render.bounds.min.x = 0; render.bounds.min.y = 0;
render.bounds.max.x = W; render.bounds.max.y = H;

// Mouse constraint para arrastar corpos com o cursor
const mouse = Mouse.create(render.canvas);
const mConstraint = MouseConstraint.create(engine, {
  mouse,
  constraint: { stiffness: 0.5, render: { visible: false } },
});
World.add(engine.world, mConstraint);
render.mouse = mouse;

Render.run(render);
const runner = Runner.create({ isFixed: true, delta: 1000 / 60 });
Runner.run(runner, engine);

// Passo fixo sincronizado com a taxa de atualização do display (60–120Hz).
// Com isFixed, a física anda 1 passo por frame de tela, eliminando o jitter
// em monitores de 120/144Hz. A calibração amostra o rAF por 1 segundo.
(function calibrateRefreshRate() {
  let frames = 0;
  const start = performance.now();
  function sample() {
    frames++;
    if (performance.now() - start < 1000) { requestAnimationFrame(sample); return; }
    const hz = Math.min(120, Math.max(60, Math.round(frames * 1000 / (performance.now() - start))));
    runner.delta = 1000 / hz;
  }
  requestAnimationFrame(sample);
})();
