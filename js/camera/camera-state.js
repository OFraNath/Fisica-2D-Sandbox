// ── Estado da câmera ──────────────────────────────────────────────────────────
// Objeto central lido por todos os sistemas que precisam saber posição / zoom.

const camera = { x: 0, y: 0, zoom: 1 };

// Cache para detectar mudanças e acordar corpos adormecidos após pan/zoom
let _lastCamX = null, _lastCamY = null, _lastCamZoom = null;
