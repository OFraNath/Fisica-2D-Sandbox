// ── Loop de render: composição de todas as camadas visuais ────────────────────
// Escuta o evento 'afterRender' do Matter.js e chama cada sub-sistema de render
// na ordem correta. Para adicionar um novo efeito visual, crie a função no
// arquivo correspondente em js/render/ e chame-a aqui.

Events.on(render, 'afterRender', () => {
  const ctx    = render.context;
  const bodies = Composite.allBodies(engine.world);

  drawFloorLine(ctx);

  // No modo batata, apenas destaque de seleção e joint (sem efeitos pesados)
  if (potatoMode) {
    drawSelectionHighlight(ctx);
    return;
  }

  drawGlowLayer(ctx, bodies);
  drawSquashAnimations(ctx, bodies);
  drawSelectionHighlight(ctx);
});
