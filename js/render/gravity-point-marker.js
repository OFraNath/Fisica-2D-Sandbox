// ── Marcador da gravidade pontual (buraco negro) ─────────────────────────────
// Desenha um anel pulsante no centro da viewport enquanto a gravidade pontual
// está ativa, indicando o ponto de atração dos corpos.

function drawGravityPointMarker(ctx) {
  if (!pointGravityEnabled) return;

  const sp    = worldToScreen(camera.x + W / 2 / camera.zoom, camera.y + H / 2 / camera.zoom);
  const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 300);

  ctx.save();
  ctx.globalAlpha = 0.35 + 0.3 * pulse;
  ctx.strokeStyle = '#7b5ea7';
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.arc(sp.x, sp.y, 26 + 8 * pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.8;
  ctx.fillStyle   = '#7b5ea7';
  ctx.beginPath();
  ctx.arc(sp.x, sp.y, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
