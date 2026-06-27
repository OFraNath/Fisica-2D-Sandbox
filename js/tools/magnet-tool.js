// ── Ferramenta de ímã ─────────────────────────────────────────────────────────
// Segure M + botão esquerdo para atrair corpos próximos ao cursor.
// Botão direito (com M pressionado) repele.
// A força é aplicada no physics-loop.js a cada frame.

let magnetKeyDown = false;
const mouseDown   = { left: false, right: false };

window.addEventListener('keydown', e => { if (e.key === 'm' || e.key === 'M') magnetKeyDown = true; });
window.addEventListener('keyup',   e => { if (e.key === 'm' || e.key === 'M') magnetKeyDown = false; });

render.canvas.addEventListener('mousedown', e => {
  if (e.button === 0) mouseDown.left  = true;
  if (e.button === 2) mouseDown.right = true;
});
window.addEventListener('mouseup', e => {
  if (e.button === 0) mouseDown.left  = false;
  if (e.button === 2) mouseDown.right = false;
});

// Detecção de drag para não spawnar peça ao soltar o drag de Matter.js
let draggingBody = false;
Events.on(mConstraint, 'startdrag', () => { draggingBody = true; });
Events.on(mConstraint, 'enddrag',   () => { setTimeout(() => { draggingBody = false; }, 50); });
