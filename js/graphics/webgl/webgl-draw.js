// ── Desenho WebGL: um drawElements por corpo (buffers compartilhados) ─────────
// A geometria (vértices locais + índices de todos os corpos) vive em buffers
// compartilhados; cada corpo é desenhado com drawElements no seu próprio range
// de índices, com pos/ângulo/alpha/cor passados como atributos correntes
// (vertexAttrib*). Correto mesmo com corpos de tamanhos diferentes — um draw
// instanciado sem offset por instância desenharia o buffer inteiro em cada
// posição (blocos grandes "carimbados" em cima dos pequenos).

let gpuBodyVAO     = null;
let gpuVertBuffer  = null;
let gpuIndexBuffer = null;

/** Cria o VAO de corpos e os buffers fixos. Chamado uma vez no init. */
function initGpuDraw(gl) {
  gpuBodyVAO = gl.createVertexArray();
  gpuVertBuffer  = gl.createBuffer();
  gpuIndexBuffer = gl.createBuffer();

  gl.bindVertexArray(gpuBodyVAO);

  gl.bindBuffer(gl.ARRAY_BUFFER, gpuVertBuffer);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 16, 0);

  // Atributos 1 (pos/ângulo/alpha) e 2 (cor) ficam desabilitados: os valores
  // são definidos por corpo via vertexAttrib* antes de cada drawElements.
  gl.disableVertexAttribArray(1);
  gl.disableVertexAttribArray(2);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gpuIndexBuffer);
  gl.bindVertexArray(null);
}

/** Faz upload da geometria (apenas quando o cache foi reconstruído). */
function uploadGpuGeometry(gl) {
  if (!gpuGeomNeedsUpload) return;
  gl.bindBuffer(gl.ARRAY_BUFFER, gpuVertBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, gpuGeomVertData, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gpuIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, gpuGeomIndexData, gl.STATIC_DRAW);
  gpuGeomNeedsUpload = false;
}

/**
 * Alpha do preenchimento por corpo: adormecido = 50% (paridade com o
 * renderer 2D do Matter, que aplica globalAlpha 0.5 em corpos isSleeping).
 * É isso que dá o "estado de repouso" — bloco parado fica translúcido.
 */
function bodyFillAlpha(b) {
  return (b.isSleeping) ? GPU_FILL_ALPHA * GPU_SLEEP_ALPHA : GPU_FILL_ALPHA;
}

/** Alpha do outline por corpo: adormecido = 50%, ativo = cheio. */
function bodyOutlineAlpha(b) {
  return (b.isSleeping) ? GPU_SLEEP_ALPHA : 1;
}

/**
 * Desenha um drawElements por corpo desenhável com os atributos atuais.
 * `alphaOf` pode ser um número (todos os corpos) ou uma função (ex.: glow
 * proporcional à velocidade, opacity de sono). Corpos fora da área alvo são
 * descartados (culling) e squash (render.visible === false) fica por conta
 * do overlay 2D.
 */
function drawBodyRanges(gl, bodies, alphaOf, view, zoom) {
  // Cull em espaço de mundo: retângulo da câmera + margem (outline/halo)
  const m = GLOW_CULL_MARGIN / zoom;
  const cullMinX = camera.x - m, cullMinY = camera.y - m;
  const cullMaxX = camera.x + view.x / zoom + m, cullMaxY = camera.y + view.y / zoom + m;

  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i];
    if (!isDrawableBody(b)) continue;
    const range = gpuGeomBodyRanges[i];
    if (!range || range.count === 0) continue;
    if (b.render.visible === false) continue;

    if (b.bounds.max.x < cullMinX || b.bounds.min.x > cullMaxX ||
        b.bounds.max.y < cullMinY || b.bounds.min.y > cullMaxY) continue;

    const a = (typeof alphaOf === 'function') ? alphaOf(b) : alphaOf;
    if (a <= 0.02) continue;

    const rgb = gpuColorCache.get(b.id) || [0.94, 0.75, 0.25];

    gl.vertexAttrib4f(1, b.position.x, b.position.y, b.angle, a);
    gl.vertexAttrib3f(2, rgb[0], rgb[1], rgb[2]);
    gl.drawElements(gl.TRIANGLES, range.count, gl.UNSIGNED_INT, range.offset * 4);
  }
}

/**
 * Desenha todos os corpos (fill + outline/glow).
 * @param {WebGL2RenderingContext} gl
 * @param {Matter.Body[]}          bodies
 * @param {{x:number,y:number}}    view   Área alvo em px (tela cheia ou FBO)
 * @param {number}                 zoom   Zoom efetivo da área alvo
 * @param {number}                 outlineWorld Espessura do outline em px de mundo
 * @param {boolean}                withFill     true = desenha o preenchimento
 * @param {Function|null}          outlineFn    Alpha por corpo no traço
 *                                              (ex.: glow ∝ velocidade; null = por sono)
 */
function drawBodiesPasses(gl, bodies, view, zoom, outlineWorld, withFill, outlineFn) {
  ensureGpuGeometry(bodies);
  uploadGpuGeometry(gl);

  const prog = gpuPrograms.body;
  gl.useProgram(prog);
  gl.uniform2f(prog.locs.uView, view.x, view.y);
  gl.uniform2f(prog.locs.uCam, camera.x, camera.y);
  gl.uniform1f(prog.locs.uZoom, zoom);
  gl.bindVertexArray(gpuBodyVAO);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // cores premultiplicadas

  // Outline PRIMEIRO, sob o fill — como o renderer 2D do Matter (que faz
  // stroke() e depois fill()): o preenchimento cobre a metade interna do
  // traço, deixando uma borda sutil de ~1px e eliminando a sobreposição de
  // bordas grossas entre corpos vizinhos (no contato, o fill cobre o traço).
  gl.uniform1i(prog.locs.uMode, 1);
  gl.uniform1f(prog.locs.uOutline, outlineWorld);
  drawBodyRanges(gl, bodies, outlineFn || bodyOutlineAlpha, view, zoom);

  if (withFill) {
    gl.uniform1i(prog.locs.uMode, 0);
    drawBodyRanges(gl, bodies, bodyFillAlpha, view, zoom);
  }
}
