// ── Loop de render: delega o desenho ao backend ativo ─────────────────────────
// Backend CPU: desenha no 'afterRender' do Matter (pipeline Canvas 2D
// original, em js/graphics/backend-cpu.js). Backends GPU/DOM: o render
// nativo é parado e o desenho acontece no 'afterUpdate' do engine.
// O draw é agendado em microtask para rodar depois de todos os listeners do
// evento (o physics-loop atualiza o cache de corpos no mesmo 'afterUpdate').

Events.on(render, 'afterRender', () => drawByBackend(render.context, 'cpu'));

Events.on(engine, 'afterUpdate', () => {
  queueMicrotask(() => drawByBackend(render.context, 'external'));
});