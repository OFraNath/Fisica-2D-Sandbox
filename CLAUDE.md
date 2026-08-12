# CLAUDE.md — Física 2D Sandbox

Guia para IAs que trabalham neste projeto. Leia antes de editar qualquer arquivo.

---

## O que é este projeto

Sandbox de física 2D no navegador. O usuário solta formas geométricas em uma tela,
elas colidem, quicam, quebram e interagem com gravidade, vento e ímã.
Motor físico: **Matter.js** (CDN, sem bundler). Sem frameworks de UI. Sem build step.
Tudo é vanilla HTML + CSS + JavaScript.

---

## Como rodar

Abra `index.html` diretamente no navegador (file:// funciona, sem servidor necessário).

---

## Estrutura de arquivos

```
fisica2d/
├── index.html                        # Ponto de entrada único; carrega CSS e JS na ordem certa
│
├── css/                              # Um arquivo por responsabilidade visual
│   ├── reset-and-variables.css       # Reset, @import de fontes, variáveis CSS (--accent, --bg…)
│   ├── layout-grid.css               # Grid principal do app (header / sidebar / canvas / statusbar)
│   ├── header.css                    # Barra superior com título e botões de ação
│   ├── panel-sidebar.css             # Painel lateral: botões de peça, ferramentas, sliders
│   ├── buttons.css                   # Estilo base de .btn e .tool-btn
│   ├── sliders-and-inputs.css        # Range inputs e checkboxes
│   ├── canvas-and-overlays.css       # #canvas-wrap, ghost cursor, retângulo de seleção
│   ├── statusbar.css                 # Rodapé com contadores
│   ├── tooltip.css                   # Tooltip flutuante dos botões de peça
│   ├── modal-help.css                # Modal de atalhos de teclado
│   └── animations.css                # @keyframes: flashBtn, slideIn
│
└── js/
    ├── config/
    │   ├── pieces-definitions.js     # Array PIECES: id, label, cor, dimensões, shape, SVG preview
    │   └── world-constants.js        # Constantes numéricas: MAX_BODIES, GLOW_*, FRACTURE_*, etc.
    │
    ├── utils/
    │   ├── math-helpers.js           # clamp()
    │   └── color-helpers.js          # lighten(), colorVariant()
    │
    ├── engine/
    │   ├── matter-setup.js           # Cria Engine, Render, Runner, MouseConstraint; expõe W, H
    │   ├── world-boundaries.js       # Paredes e chão invisíveis (wallBottom, wallTop, etc.)
    │   ├── physics-loop.js           # afterUpdate: vento, ímã, cap de velocidade, cleanup
    │   └── collision-handler.js      # collisionStart: som, squash, fratura por impacto
    │
    ├── camera/
    │   ├── camera-state.js           # Objeto `camera` { x, y, zoom }
    │   ├── camera-controls.js        # Zoom (scroll), pan (Alt+drag), reset, updateCameraBounds()
    │   └── coordinate-transform.js   # screenToWorld(), worldToScreen()
    │
    ├── bodies/
    │   ├── body-factory.js           # spawnFromDescriptor(), cacheLocalVerts(), spawnPiece()
    │   ├── body-descriptor.js        # toDescriptor(), deleteBodiesWithHistory()
    │   ├── body-fracture.js          # explodeBodyIntoPieces(), fractureBody()
    │   └── body-rain-burst.js        # rainBurst()
    │
    ├── tools/
    │   ├── ui-state.js               # Variáveis mutáveis globais: mode, selectedPiece, props…
    │   ├── history-undo-redo.js      # pushHistory(), undo(), redo()
    │   ├── mode-manager.js           # setMode('place'|'select'|'joint')
    │   ├── selection-tool.js         # Seleção por retângulo drag; updateSelStatus()
    │   ├── joint-tool.js             # handleJointClick(): conecta dois corpos com Constraint
    │   ├── lock-tool.js              # toggleLock(): isStatic true/false nos selecionados
    │   └── magnet-tool.js            # magnetKeyDown, mouseDown; força aplicada em physics-loop.js
    │
    ├── graphics/
    │   ├── render-backend-manager.js # Seleção/fallback de backends; drawByBackend(); boot
    │   ├── backend-cpu.js            # Pipeline Canvas 2D original (fallback universal)
    │   ├── backend-gpu.js            # Ativa/desativa WebGL2; gpuDrawFrame() (corpos + bloom)
    │   ├── backend-dom.js            # Corpos como divs (compositor GPU, sem glow)
    │   ├── backend-info.js           # Lê WEBGL_debug_renderer_info p/ tooltip do seletor
    │   └── webgl/
    │       ├── webgl-core.js         # Canvas/contexto WebGL2, shaders (body, blur, copy)
    │       ├── webgl-geometry.js     # Cache de meshes (fan + normais de outline) por corpo
    │       ├── webgl-draw.js         # Instâncias por frame; passes fill/outline
    │       └── webgl-bloom.js        # FBO meia-res, blur gaussiano 2-pass, composite aditivo
    │
    ├── ui/
    │   ├── panel-piece-buttons.js    # Injeta <button class="piece-btn"> a partir de PIECES
    │   ├── spawn-ghost-cursor.js     # updateGhost(), updateGhostPosition()
    │   ├── sliders-binding.js        # bindSlider(), bumpSize(); conecta todos os <input> do painel
    │   ├── header-buttons.js         # Pause, Clear, Explode, Undo, Redo, Rain
    │   ├── statusbar-updater.js      # updateStatus(), flashStatus()
    │   ├── tooltip-piece-buttons.js  # Tooltip ao hover nos botões de peça
    │   ├── modal-help.js             # toggleHelp(), closeHelp()
    │   └── potato-mode.js            # Botão PC Batata: desativa efeitos visuais pesados
    │
    ├── audio/
    │   └── collision-sound.js        # ensureAudio(), playThud()
    │
    ├── render/
    │   ├── glow-layer.js             # drawGlowLayer(): bloom otimizado em canvas auxiliar
    │   ├── squash-animation.js       # triggerSquash(), drawSquashAnimations()
    │   ├── selection-highlight.js    # drawSelectionHighlight(): contorno tracejado + ponto joint
    │   ├── floor-line.js             # drawFloorLine(): tracejado no chão
    │   └── render-loop.js            # afterRender: orquestra todas as funções de render acima
    │
    ├── keyboard-shortcuts.js         # Todos os atalhos de teclado em um único lugar
    ├── canvas-mouse-events.js        # mousedown / mousemove no canvas; despacha para ferramentas
    ├── fps-counter.js                # Atualiza #st-fps a cada segundo
    └── initial-spawn.js              # Solta 3 peças ao carregar a página
```

---

## Ordem de carregamento dos scripts

A ordem dos `<script>` no `index.html` é obrigatória porque não há módulos ES:

1. `config/` — constantes e definições (sem dependências)
2. `utils/` — funções puras
3. `engine/matter-setup.js` — cria as variáveis globais do Matter.js
4. `engine/world-boundaries.js` — depende do engine
5. `camera/` — depende do engine e das dimensões W, H
6. `bodies/` — depende do engine, camera e utils
7. `tools/` — depende de bodies e engine
8. `ui/` — depende de tools e bodies
9. `graphics/` — backends de render (GPU/DOM/CPU); depende de engine, camera, ui-state e constants
10. `audio/`
11. `render/` — depende de camera, bodies, tools e graphics
12. `engine/physics-loop.js` e `engine/collision-handler.js` — registram eventos, dependem de tudo
13. `keyboard-shortcuts.js`, `canvas-mouse-events.js`, `fps-counter.js`, `initial-spawn.js`

---

## Onde mexer para tarefas comuns

| Tarefa | Arquivo(s) |
|---|---|
| Adicionar uma peça nova | `js/config/pieces-definitions.js` |
| Mudar limites do mundo (MAX_BODIES, etc.) | `js/config/world-constants.js` |
| Ajustar parâmetros de glow | `world-constants.js` → constantes GLOW_* |
| Ajustar parâmetros de fratura | `world-constants.js` → constantes FRACTURE_* |
| Mudar cores / fontes / espaçamentos | `css/reset-and-variables.css` (variáveis CSS) |
| Adicionar atalho de teclado | `js/keyboard-shortcuts.js` |
| Adicionar botão no header | HTML em `index.html` + lógica em `js/ui/header-buttons.js` |
| Adicionar efeito visual novo | Criar `js/render/meu-efeito.js` e chamar em `render-loop.js` |
| Mudar comportamento de colisão | `js/engine/collision-handler.js` |
| Mudar força do vento / ímã | `js/engine/physics-loop.js` |
| Mudar como corpos são criados | `js/bodies/body-factory.js` |
| Mudar animação de squash | `js/render/squash-animation.js` |
| Mudar backend de render (GPU/DOM/CPU) | `js/graphics/render-backend-manager.js` |
| Ajustar contorno/bloom da GPU | `world-constants.js` → constantes GPU_* |

---

## Convenções do código

- **Sem módulos ES** (`import`/`export`): tudo é global, variáveis declaradas com `let`/`const` no escopo do script.
- **Nomes auto-explicativos**: funções e arquivos descrevem o que fazem sem precisar de comentários extras.
- **Um arquivo = uma responsabilidade**: se um arquivo começa a acumular funções não relacionadas, é hora de extrair.
- **Constantes numéricas em `world-constants.js`**: nunca deixe magic numbers espalhados pelo código.
- **Novos efeitos visuais** vão em `js/render/` e são chamados em `render-loop.js` — não misture lógica de render com lógica de física.
- **Comentários em português** (padrão do projeto).

---

## Variáveis globais relevantes

Declaradas em `js/tools/ui-state.js` e usadas em múltiplos módulos:

| Variável | Tipo | Significado |
|---|---|---|
| `selectedPiece` | Object (de PIECES) | Peça ativa no painel |
| `mode` | string | Modo atual: 'place' \| 'select' \| 'joint' |
| `props` | Object | Propriedades do próximo spawn (size, restitution, friction, density) |
| `selectedBodies` | Body[] | Corpos selecionados no momento |
| `jointPending` | Object\|null | Primeiro clique no modo joint (aguarda segundo) |
| `windForce` | number | Força de vento (aplicada em physics-loop.js) |
| `potatoMode` | boolean | Se true, desativa efeitos pesados |
| `fractureEnabled` | boolean | Permite fratura por impacto |
| `fractureThreshold` | number | Velocidade mínima de impacto para fraturar |
| `bodyCount` | number | Contador de corpos dinâmicos (para status bar) |
| `renderBackend` | string | Backend de render escolhido: 'auto' \| 'gpu' \| 'cpu' \| 'dom' (efetivo em `activeBackend`) |
| `simulationBackend` | string | Backend de simulação: 'cpu' (Matter.js); 'gpu' é roadmap |

Variáveis do Matter.js (declaradas em `engine/matter-setup.js`):
`engine`, `render`, `runner`, `mouse`, `mConstraint`, `W`, `H`
e todos os módulos desestruturados: `Engine`, `Bodies`, `Body`, `World`, etc.
