// ── Modal de ajuda / atalhos ──────────────────────────────────────────────────

const helpModal = document.getElementById('help-modal');

function toggleHelp() { helpModal.classList.toggle('show'); }
function closeHelp()  { helpModal.classList.remove('show'); }

document.getElementById('btn-help').addEventListener('click', toggleHelp);
document.getElementById('btn-help-close').addEventListener('click', closeHelp);
helpModal.addEventListener('click', e => { if (e.target === helpModal) closeHelp(); });
