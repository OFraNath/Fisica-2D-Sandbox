// ── Paredes e chão invisíveis do mundo ───────────────────────────────────────
// Corpos estáticos enormes reposicionados a cada frame de câmera para que
// as bordas sempre acompanhem a viewport atual (ver camera-controls.js).

const wallBottom = Bodies.rectangle(0, 0, 100000, 2000, { isStatic: true, label: 'floor' });
const wallTop    = Bodies.rectangle(0, 0, 100000, 2000, { isStatic: true, label: 'wall' });
const wallLeft   = Bodies.rectangle(0, 0, 2000, 100000, { isStatic: true, label: 'wall' });
const wallRight  = Bodies.rectangle(0, 0, 2000, 100000, { isStatic: true, label: 'wall' });

[wallBottom, wallTop, wallLeft, wallRight].forEach(w => {
  w.render.fillStyle   = 'transparent';
  w.render.strokeStyle = 'transparent';
});

World.add(engine.world, [wallBottom, wallTop, wallLeft, wallRight]);
