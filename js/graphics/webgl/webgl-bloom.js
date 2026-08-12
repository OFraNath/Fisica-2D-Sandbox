// ── Bloom GPU: FBO meia-resolução, blur gaussiano 2-pass, composite ───────────
// Substitui o blur de canvas 2D (software) por um pipeline 100% de shaders:
// outlines aditivos no FBO → blur H/V → composite aditivo na tela.
// Visual equivalente ao glow original (GLOW_SCALE / GLOW_BLUR_PX).

let bloomFBO = null;
let bloomTexA = null;  // textura ping
let bloomTexB = null;  // textura pong
let bloomQuadVAO = null;
let bloomQuadVBO = null;
let bloomBW = 0;
let bloomBH = 0;

// Pesos gaussianos (1D) com sigma derivado do blur original
let gpuBlurWeights = null;

/** Calcula os pesos normalizados para GPU_BLUR_TAPS taps. */
function computeBlurWeights() {
  const radius = (GPU_BLUR_TAPS - 1) / 2;
  // Sigma em px do FBO meia-res, equivalente ao blur(13px) do canvas 2D
  // (mais largo que o padrão anterior — halo suave, não um contorno brilhante)
  const sigma  = (GLOW_BLUR_PX * GLOW_SCALE) / 1.6;
  const w = new Float32Array(GPU_BLUR_TAPS);
  let sum = 0;
  for (let i = -radius; i <= radius; i++) {
    const v = Math.exp(-(i * i) / (2 * sigma * sigma));
    w[i + radius] = v;
    sum += v;
  }
  for (let i = 0; i < GPU_BLUR_TAPS; i++) w[i] /= sum;
  return w;
}

/**
 * Intensidade do glow de um corpo: ∝ velocidade, com piso em repouso.
 * Blocos parados ficam calmos (como no 2D); impacto e queda acendem o halo.
 */
function bodyGlowAlpha(b) {
  if (b.isStatic || b.plugin.squashUntil) return 0;
  const t = Math.min(1, (b.speed || 0) / GPU_GLOW_SPEED_FULL);
  return GPU_GLOW_AT_REST + (1 - GPU_GLOW_AT_REST) * t * t;
}

/** Cria o FBO, as texturas ping-pong e o quad de tela cheia. */
function initGpuBloom(gl) {
  bloomFBO = gl.createFramebuffer();
  bloomTexA = gl.createTexture();
  bloomTexB = gl.createTexture();
  gpuBlurWeights = computeBlurWeights();

  [bloomTexA, bloomTexB].forEach(tex => {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  });

  bloomQuadVAO = gl.createVertexArray();
  bloomQuadVBO = gl.createBuffer();
  gl.bindVertexArray(bloomQuadVAO);
  gl.bindBuffer(gl.ARRAY_BUFFER, bloomQuadVBO);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,  1, -1,  1,  1,
    -1, -1,  1,  1, -1,  1,
  ]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
  gl.bindVertexArray(null);
}

/** (Re)aloca as texturas do bloom quando o tamanho da tela muda. */
function ensureBloomTextures(gl) {
  const bw = Math.max(1, Math.round(W * GLOW_SCALE));
  const bh = Math.max(1, Math.round(H * GLOW_SCALE));
  if (bw === bloomBW && bh === bloomBH) return;
  [bloomTexA, bloomTexB].forEach(tex => {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, bw, bh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  });
  bloomBW = bw;
  bloomBH = bh;
}

/**
 * Renderiza o glow: outlines aditivos → blur H → blur V → composite na tela.
 * @param {WebGL2RenderingContext} gl
 * @param {Matter.Body[]}          bodies
 */
function renderBloom(gl, bodies) {
  if (potatoMode) return;
  ensureBloomTextures(gl);
  if (!bloomBW || !bloomBH) return;

  // Pass 1: outlines aditivos na textura A (meia-resolução), intensidade ∝ velocidade
  gl.bindFramebuffer(gl.FRAMEBUFFER, bloomFBO);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, bloomTexA, 0);
  gl.viewport(0, 0, bloomBW, bloomBH);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  drawBodiesPasses(gl, bodies,
    { x: bloomBW, y: bloomBH },
    camera.zoom * GLOW_SCALE,
    GPU_GLOW_STROKE_PX / camera.zoom,
    false,
    bodyGlowAlpha); // traço com alpha por corpo → repouso calmo, movimento brilhante

  // Pass 2: blur horizontal (A → B)
  gl.useProgram(gpuPrograms.blur);
  gl.uniform1i(gpuPrograms.blur.locs.uDir, 0);
  gl.uniform2f(gpuPrograms.blur.locs.uTexel, 1 / bloomBW, 1 / bloomBH);
  gl.uniform1fv(gpuPrograms.blur.locs.uWeights, gpuBlurWeights);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, bloomTexA);
  gl.uniform1i(gpuPrograms.blur.locs.uTex, 0);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, bloomTexB, 0);
  gl.disable(gl.BLEND);
  gl.bindVertexArray(bloomQuadVAO);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // Pass 3: blur vertical (B → A)
  gl.uniform1i(gpuPrograms.blur.locs.uDir, 1);
  gl.bindTexture(gl.TEXTURE_2D, bloomTexB);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, bloomTexA, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // Pass 4: composite aditivo na tela (tela cheia)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, gpuCanvas.width, gpuCanvas.height);
  gl.useProgram(gpuPrograms.copy);
  gl.bindTexture(gl.TEXTURE_2D, bloomTexA);
  gl.uniform1i(gpuPrograms.copy.locs.uTex, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}
