// ── Geometria WebGL: cache de meshes por corpo ────────────────────────────────
// Converte os vértices locais (plugin.localVerts) em buffers de triângulo-fan
// com normais exteriores por vértice (para o outline). O rebuild acontece
// apenas quando a lista de corpos muda (spawn/remoção), nunca por frame.

let gpuGeomVertData  = null; // Float32Array: [x, y, nx, ny] por vértice
let gpuGeomIndexData = null; // Uint32Array: fan por corpo (base, i, i+1)
let gpuGeomIndexCount = 0;
let gpuGeomIds        = [];  // ids na ordem do build (para detectar mudanças)
let gpuGeomBodyRanges = [];  // por corpo: { offset, count } no índice buffer (0 p/ não desenháveis)
let gpuGeomNeedsUpload = false;
const gpuColorCache   = new Map(); // body.id -> [r, g, b]

/** Corpos que nunca são desenhados (paredes e chão invisíveis). */
function isDrawableBody(b) {
  return b.label !== 'floor' && b.label !== 'wall';
}

/**
 * Normais exteriores por vértice: média das normais das duas arestas
 * adjacentes, orientadas para longe do centro local (origem).
 */
function vertexOuterNormals(verts) {
  const n = verts.length;
  const normals = [];
  for (let i = 0; i < n; i++) {
    const v0 = verts[(i + n - 1) % n];
    const v1 = verts[i];
    const v2 = verts[(i + 1) % n];
    let nx = 0, ny = 0;
    const edges = [[v0, v1], [v1, v2]];
    for (const [p, q] of edges) {
      const dx = q.x - p.x, dy = q.y - p.y;
      const len = Math.hypot(dx, dy) || 1;
      const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
      let px = -dy / len, py = dx / len;
      if (px * mx + py * my < 0) { px = -px; py = -py; }
      nx += px; ny += py;
    }
    const l = Math.hypot(nx, ny) || 1;
    normals.push({ x: nx / l, y: ny / l });
  }
  return normals;
}

/** Reconstrói os buffers de geometria para a lista atual de corpos. */
function rebuildGpuGeometry(bodies) {
  const rawVerts = [];
  const rawInds  = [];
  let base = 0;
  gpuGeomBodyRanges = [];

  for (const b of bodies) {
    if (!isDrawableBody(b)) {
      gpuGeomBodyRanges.push({ offset: 0, count: 0 });
      continue;
    }

    const lv = b.plugin.localVerts;
    const norms = vertexOuterNormals(lv);
    const range = { offset: rawInds.length, count: 0 };

    for (let i = 0; i < lv.length; i++) {
      rawVerts.push(lv[i].x, lv[i].y, norms[i].x, norms[i].y);
    }
    for (let i = 1; i < lv.length - 1; i++) {
      rawInds.push(base, base + i, base + i + 1);
    }
    range.count = (lv.length - 2) * 3;
    base += lv.length;
    gpuGeomBodyRanges.push(range);

    const rgb = hexToRgb(b.plugin.color);
    gpuColorCache.set(b.id, [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255]);
  }

  gpuGeomVertData  = Float32Array.from(rawVerts);
  gpuGeomIndexData = Uint32Array.from(rawInds);
  gpuGeomIndexCount = rawInds.length;
  gpuGeomIds        = bodies.map(b => b.id);
  gpuGeomNeedsUpload = true;
}

/** Garante que a geometria corresponde à lista atual (O(n) por frame). */
function ensureGpuGeometry(bodies) {
  if (gpuGeomIds.length !== bodies.length) { rebuildGpuGeometry(bodies); return; }
  for (let i = 0; i < bodies.length; i++) {
    if (bodies[i].id !== gpuGeomIds[i]) { rebuildGpuGeometry(bodies); return; }
  }
}
