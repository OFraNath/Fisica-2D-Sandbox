// ── UI específica de mobile: toggle, drawer de propriedades e toolbar ────────
// Não duplica os controles existentes (peças, modos, sliders) — o painel
// #panel de sempre vira um drawer deslizante (ver css/mobile.css). Aqui só
// entram comandos que no desktop só tinham equivalente em tecla/botão de
// mouse sem análogo direto em toque puro: Apagar, Ímã, Gravidade zero,
// Recentralizar câmera, Desfazer/Refazer/Ajuda (atalho rápido) — mais o
// Modo Cursor (ver PLANO-CURSOR-MOBILE.md), único elemento realmente
// flutuante, porque precisa estar acessível com o drawer fechado durante a
// interação direta com o canvas.
//
// MOBILE_TOOLBAR_COMMANDS é a lista central: uma feature nova que precise
// de acesso rápido em mobile só precisa de uma entrada aqui — é o esboço da
// "camada de comando" descrita no plano, mantido simples e local a este
// arquivo por ora (não introduz um registry genérico só para isso).
//
// Diretriz do projeto (PLANO-CURSOR-MOBILE.md §3.3): evitar novos botões no
// header, priorizar a barra lateral (#panel) — por isso o toggle
// Mobile/Desktop vive na sidebar, não no header.

let sidebarOpen = false;

function buildMobileToggleButton() {
  if (document.getElementById('btn-mobile-toggle')) return;
  const btn = document.createElement('button');
  btn.id = 'btn-mobile-toggle';
  btn.className = 'tool-btn';
  btn.style.width = '100%';
  btn.style.textAlign = 'center';
  btn.style.marginTop = '4px';
  btn.title = 'Alternar layout Mobile / Desktop';
  btn.textContent = mobileMode ? '🖥 DESKTOP' : '📱 MOBILE';
  btn.classList.toggle('active', mobileMode);
  btn.addEventListener('click', () => {
    setMobileMode(!mobileMode, true);
    btn.textContent = mobileMode ? '🖥 DESKTOP' : '📱 MOBILE';
    btn.classList.toggle('active', mobileMode);
  });
  // Logo abaixo do botão "PC Batata", reaproveitando o mesmo estilo visual
  // (.tool-btn + .active) — consistente com os outros toggles da sidebar.
  const btnPotatoEl = document.getElementById('btn-potato');
  if (btnPotatoEl && btnPotatoEl.parentNode) {
    btnPotatoEl.insertAdjacentElement('afterend', btn);
  } else {
    document.getElementById('panel').appendChild(btn);
  }
}

function buildDrawerHandle() {
  if (document.getElementById('btn-drawer-toggle')) return;
  const handle = document.createElement('button');
  handle.id = 'btn-drawer-toggle';
  handle.type = 'button';
  handle.addEventListener('click', () => {
    sidebarOpen = !sidebarOpen;
    updateMobileDrawerState();
  });
  document.getElementById('app').appendChild(handle);
}

function updateMobileDrawerState() {
  const panel  = document.getElementById('panel');
  const handle = document.getElementById('btn-drawer-toggle');
  if (!panel || !handle) return;
  panel.classList.toggle('drawer-open', mobileMode && sidebarOpen);
  handle.style.display = mobileMode ? 'flex' : 'none';
  handle.textContent = sidebarOpen ? '✕ FECHAR' : '⚙ PEÇAS E PROPRIEDADES';
}

// Fecha o drawer automaticamente ao escolher uma peça ou trocar de modo,
// para o usuário já ver o canvas sem precisar de um segundo toque — mas só
// em mobile, sem afetar o desktop.
function closeDrawerIfMobile() {
  if (mobileMode && sidebarOpen) { sidebarOpen = false; updateMobileDrawerState(); }
}

// ═══════════════════════════════════════════════════════════════════════
// Modo Cursor: botão flutuante + trava das ferramentas de precisão alta
// ═══════════════════════════════════════════════════════════════════════
// Único controle realmente flutuante (fora da sidebar) — precisa ficar
// acessível com o drawer fechado, pois é usado durante a interação direta
// com o canvas (ver PLANO-CURSOR-MOBILE.md §3.3).

function buildCursorModeButton() {
  if (document.getElementById('btn-cursor-mode')) return;
  const btn = document.createElement('button');
  btn.id = 'btn-cursor-mode';
  btn.type = 'button';
  btn.title = 'Modo Cursor: precisão para arrastar, selecionar, conectar e travar';
  btn.innerHTML = '🖱';
  btn.addEventListener('click', () => setCursorMode(!cursorMode));
  document.getElementById('canvas-wrap').appendChild(btn);
}

// Ferramentas de precisão alta (Selecionar, Conectar, Travar) — Prioridade 3
// do plano: em mobile, só ficam utilizáveis com o Modo Cursor ligado; fora
// disso mostram uma dica na primeira tentativa em vez de trocar de modo.
// No desktop este bloqueio nunca se aplica (checagem de mobileMode abaixo).
const PRECISION_TOOL_SELECTOR = '.tool-btn[data-mode="select"], .tool-btn[data-mode="joint"], #btn-lock';
let _precisionHintShown = false;

function updatePrecisionToolLocks() {
  const locked = mobileMode && !cursorMode;
  document.querySelectorAll(PRECISION_TOOL_SELECTOR).forEach(b => {
    b.classList.toggle('precision-locked', locked);
  });
}

function updateCursorModeButton() {
  const btn = document.getElementById('btn-cursor-mode');
  if (!btn) return;
  btn.style.display = mobileMode ? 'flex' : 'none';
  btn.classList.toggle('active', cursorMode);
}

/** Chamado por setCursorMode() em touch-controls.js. */
function onCursorModeChanged() {
  updateCursorModeButton();
  updatePrecisionToolLocks();
}

// Intercepta em fase de captura (roda antes dos listeners de clique já
// registrados por mode-manager.js e lock-tool.js, não importa a ordem de
// carregamento) para bloquear Selecionar/Conectar/Travar em mobile enquanto
// o Modo Cursor estiver desligado, mostrando uma dica na primeira vez.
document.addEventListener('click', e => {
  if (!mobileMode || cursorMode) return;
  const target = e.target.closest(PRECISION_TOOL_SELECTOR);
  if (!target) return;
  e.preventDefault();
  e.stopImmediatePropagation();
  flashStatus(_precisionHintShown ? 'LIGUE O MODO CURSOR 🖱' : 'LIGUE O MODO CURSOR PARA USAR ESSA FERRAMENTA');
  _precisionHintShown = true;
}, true);

const MOBILE_TOOLBAR_COMMANDS = [
  // Prioridade 1 — vistosas/passivas, sem exigir Modo Cursor (PLANO-CURSOR-MOBILE.md §3.1)
  { id: 'rain',    icon: '🌧️', label: 'Chuva',    run: () => document.getElementById('btn-rain').click() },
  { id: 'explode', icon: '💥', label: 'Explodir', run: () => document.getElementById('btn-explode').click() },
  {
    id: 'gravity0', icon: '🪐', label: 'Grav. 0',
    run: () => {
      if (pointGravityEnabled) setPointGravity(false);
      const nextY = engine.gravity.y === 0 ? (uniformGravity || 1) : 0;
      engine.gravity.y = nextY;
      const sl = document.getElementById('sl-grav');
      sl.value = nextY;
      document.getElementById('val-grav').textContent = nextY.toFixed(1);
    },
  },
  {
    id: 'magnet', icon: '🧲', label: 'Ímã: OFF',
    // Tratado à parte no listener abaixo (é cíclico, não uma ação única).
    run: null,
  },
  { id: 'recenter', icon: '🎯', label: 'Centro', run: () => resetCamera() },
  // Prioridade 2/utilitários — não exigem mira fina (agem sobre seleção ou histórico)
  {
    id: 'delete', icon: '🗑️', label: 'Apagar',
    run: () => {
      if (selectedBodies.length) {
        deleteBodiesWithHistory(selectedBodies);
        selectedBodies = [];
        updateSelStatus();
      } else {
        const bodies = Composite.allBodies(engine.world)
          .filter(b => b.label !== 'floor' && b.label !== 'wall');
        if (bodies.length) deleteBodiesWithHistory([bodies[bodies.length - 1]]);
      }
    },
  },
  { id: 'undo', icon: '↶', label: 'Desfazer', run: () => undo() },
  { id: 'redo', icon: '↷', label: 'Refazer', run: () => redo() },
  { id: 'help', icon: '❓', label: 'Ajuda', run: () => toggleHelp() },
];

function rebuildMobileToolbar() {
  let bar = document.getElementById('mobile-toolbar');

  if (!mobileMode) { if (bar) bar.style.display = 'none'; return; }

  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'mobile-toolbar';
    document.getElementById('app').appendChild(bar);

    MOBILE_TOOLBAR_COMMANDS.forEach(cmd => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mobile-tool-btn';
      b.id = 'mtb-' + cmd.id;
      b.innerHTML = `<span class="mtb-icon">${cmd.icon}</span><span class="mtb-label">${cmd.label}</span>`;

      if (cmd.id === 'magnet') {
        b.addEventListener('click', () => {
          mobileMagnetMode = mobileMagnetMode === 'off'      ? 'attract'
                            : mobileMagnetMode === 'attract'  ? 'repel'
                            : 'off';
          const labels = { off: 'Ímã: OFF', attract: 'Ímã: ATRAI', repel: 'Ímã: REPELE' };
          b.querySelector('.mtb-label').textContent = labels[mobileMagnetMode];
          b.classList.toggle('active', mobileMagnetMode !== 'off');
        });
      } else {
        b.addEventListener('click', cmd.run);
      }
      bar.appendChild(b);
    });
  }
  bar.style.display = 'flex';
}

// Fecha o drawer ao selecionar peça/modo em mobile (sem alterar o comportamento desktop).
document.addEventListener('click', e => {
  if (!mobileMode) return;
  if (e.target.closest('.piece-btn') || e.target.closest('.tool-row .tool-btn')) {
    closeDrawerIfMobile();
  }
});

buildMobileToggleButton();
buildDrawerHandle();
buildCursorModeButton();
rebuildMobileToolbar();
updateMobileDrawerState();
updateCursorModeButton();
updatePrecisionToolLocks();
