// ── Informação do backend gráfico real ────────────────────────────────────────
// Lê WEBGL_debug_renderer_info para exibir qual GPU/API o navegador usa
// (ex.: "ANGLE (NVIDIA RTX 3060, Direct3D11)") no tooltip do seletor.

let gpuInfoString = '';

/** @param {WebGL2RenderingContext} gl */
function readGpuInfo(gl) {
  try {
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    if (dbg) {
      const renderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
      const vendor   = gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL);
      if (renderer) {
        gpuInfoString = renderer + (vendor && vendor !== 'WebKit' ? ' · ' + vendor : '');
      }
    }
  } catch (e) { /* sem informação disponível */ }
  if (!gpuInfoString) gpuInfoString = 'WebGL2 (API genérica)';
}
