// ── Spawn inicial de demonstração ─────────────────────────────────────────────
// Solta 3 peças ao abrir a página para que o sandbox não apareça vazio.
// O delay de 300 ms garante que o engine já está rodando antes do spawn.

setTimeout(() => {
  spawnPiece(W * 0.3, H * 0.1);
  spawnPiece(W * 0.5, H * 0.05);
  spawnPiece(W * 0.7, H * 0.1);
}, 300);
