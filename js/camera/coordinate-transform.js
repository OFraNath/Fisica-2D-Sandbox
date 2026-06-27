// ── Conversão entre coordenadas de tela e de mundo ───────────────────────────

/** Converte posição de tela (px) em coordenadas do mundo físico. */
function screenToWorld(sx, sy) {
  return { x: camera.x + sx / camera.zoom, y: camera.y + sy / camera.zoom };
}

/** Converte coordenadas do mundo físico em posição de tela (px). */
function worldToScreen(wx, wy) {
  return { x: (wx - camera.x) * camera.zoom, y: (wy - camera.y) * camera.zoom };
}
