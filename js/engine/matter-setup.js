// ── Inicialização do Matter.js (engine + renderer + runner) ──────────────────
// Desestrutura os módulos usados no projeto para que o restante do código
// possa referenciar diretamente Engine, Bodies, etc., sem o prefixo Matter.

const {
  Engine, Render, Runner, Bodies, Body,
  World, Events, Mouse, MouseConstraint,
  Composite, Vector, Constraint, Query
} = Matter;

const wrap = document.getElementById('canvas-wrap');
const W = wrap.clientWidth;
const H = wrap.clientHeight;

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
  constraint: { stiffness: 0.2, render: { visible: false } },
});
World.add(engine.world, mConstraint);
render.mouse = mouse;

Render.run(render);
const runner = Runner.create({ isFixed: true, delta: 1000 / 60 });
Runner.run(runner, engine);
