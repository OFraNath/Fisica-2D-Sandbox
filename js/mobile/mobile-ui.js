// ── UI específica de mobile: toggle, drawer de propriedades e toolbar ────────
// Não duplica os controles existentes (peças, modos, sliders) — o painel
// #panel de sempre vira um drawer deslizante (ver css/mobile.css). Aqui só
// entram comandos que no desktop só tinham equivalente em tecla/botão de
// mouse sem análogo direto em toque puro: Apagar, Travar, Ímã, Gravidade
// zero, Recentralizar câmera, Desfazer/Refazer/Ajuda (atalho rápido).
//
// MOBILE_TOOLBAR_COMMANDS é a lista central: uma feature nova que precise
// de acesso rápido em mobile só precisa de uma entrada aqui — é o esboço da
// "camada de comando" descrita no plano, mantido simples e local a este
// arquivo por ora (não introduz um registry genérico só para isso).

let sidebarOpen = false;

function buildMobileToggleButton() {
  if (document.getElementById('btn-mobile-toggle')) return;
  const btn = document.createElement('button');
  btn.id = 'btn-mobile-toggle';
  btn.className = 'btn';
  btn.title = 'Alternar layout Mobile / Desktop';
  btn.textContent = mobileMode ? '🖥 DESKTOP' : '📱 MOBILE';
  btn.addEventListener('click', () => {
    setMobileMode(!mobileMode, true);
    btn.textContent = mobileMode ? '🖥 DESKTOP' : '📱 MOBILE';
  });
  const headerBtns = document.querySelector('#header .btn-header');
  if (headerBtns) headerBtns.appendChild(btn);
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

const MOBILE_TOOLBAR_COMMANDS = [
  {
    id: 'delete', icon: '🗑️', label: 'Apagar',
    run: () => {
      if (selectedBodies.length) {
        deleteBodiesWithHistory(selectedBodies);
        selectedBodies = [];
        updateSelStatus();
      } else {
        const bodies = Composite.allBodies(engine.world).filter(b => !b.isStatic);
        if (bodies.length) deleteBodiesWithHistory([bodies[bodies.length - 1]]);
      }
    },
  },
  { id: 'lock', icon: '🔒', label: 'Travar', run: () => toggleLock() },
  {
    id: 'magnet', icon: '🧲', label: 'Ímã: OFF',
    // Tratado à parte no listener abaixo (é cíclico, não uma ação única).
    run: null,
  },
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
  { id: 'recenter', icon: '🎯', label: 'Centro', run: () => resetCamera() },
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
rebuildMobileToolbar();
updateMobileDrawerState();
