// ── Sistema de histórico: desfazer / refazer ──────────────────────────────────
// Pilha simples de pares (undoFn, redoFn). Cada ação registra como se desfaz
// e como se refaz, sem serializar todo o estado do mundo.

const history   = [];
const redoStack = [];

/**
 * Registra uma ação no histórico.
 * @param {Function} undoFn  Função que desfaz a ação
 * @param {Function} redoFn  Função que refaz a ação
 */
function pushHistory(undoFn, redoFn) {
  history.push({ undo: undoFn, redo: redoFn });
  if (history.length > HISTORY_LIMIT) history.shift();
  redoStack.length = 0; // qualquer nova ação limpa o redo
}

function undo() {
  const action = history.pop();
  if (!action) return;
  action.undo();
  redoStack.push(action);
}

function redo() {
  const action = redoStack.pop();
  if (!action) return;
  action.redo();
  history.push(action);
}
