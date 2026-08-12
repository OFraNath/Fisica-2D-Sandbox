// ── Backend GPU: corpos + bloom via WebGL2 ────────────────────────────────────
// Para o render nativo do Matter (o custo O(n) de paths por frame) e desenha
// todos os corpos com 2 draw calls instanciados + glow em shader.
// Os overlays 2D (squash, seleção, chão) continuam no canvas 2D por cima.

let gpuBackendActive = false;

/** Ativa o backend GPU. Retorna false se WebGL2 não está disponível. */
function activateGpuBackend() {
  if (!initWebGL()) return false;
  if (gpuBodyVAO === null) initGpuDraw(gpuGl);
  if (!bloomFBO) initGpuBloom(gpuGl);
  gpuCanvas.style.display = 'block';
  gpuBackendActive = true;
  Render.stop(render);
  return true;
}

/** Desativa o backend GPU e oculta o canvas. */
function deactivateGpuBackend() {
  gpuBackendActive = false;
  if (gpuCanvas) gpuCanvas.style.display = 'none';
}

/**
 * Desenha corpos + glow no canvas WebGL. Chamado no 'afterUpdate'
 * (o render nativo está parado).
 */
function gpuDrawFrame() {
  const gl = gpuGl;
  const bodies = getBodies();
  const ratio = GPU_PIXEL_RATIO;

  gl.viewport(0, 0, gpuCanvas.width, gpuCanvas.height);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // View em px físicos: o NDC mapeia o framebuffer inteiro (nitidez do 2D)
  drawBodiesPasses(gl, bodies,
    { x: W * ratio, y: H * ratio },
    camera.zoom * ratio,
    GPU_OUTLINE_PX * ratio / camera.zoom,
    true);
  renderBloom(gl, bodies);
}
