/**
 * Utilitaire partagé d’application : View state.
 *
 * Responsabilités :
 * - factoriser un comportement UI réutilisable entre plusieurs fiches ;
 * - rester indépendant d’un type d’acteur ou d’item précis ;
 * - limiter les dépendances aux APIs ApplicationV2 et au DOM.
 *
 * Ce fichier ne doit pas contenir de règles de jeu.
 */

export function getApplicationRootElement(app) {
  const element = app?.element;
  if (!element) return null;
  if (element instanceof HTMLElement) return element;
  return element?.[0] instanceof HTMLElement ? element[0] : null;
}

export function getSheetScrollElement(app, root, selector, options = {}) {
  if (!root || !selector) return null;

  if (selector === ':root') return root instanceof HTMLElement ? root : null;

  if (selector === '.application') {
    return root.matches?.('.application')
      ? root
      : root.closest?.('.application') ?? root.querySelector?.('.application') ?? null;
  }

  if (selector === '.window-content') {
    return root.matches?.('.window-content')
      ? root
      : root.querySelector?.('.window-content') ?? root.closest?.('.window-content') ?? null;
  }

  if (selector === '.tab.active') {
    const activeTab = app?._activeTab ?? options.defaultTab ?? '';
    return root.querySelector?.(`.tab[data-tab="${CSS.escape(activeTab)}"]`) ?? root.querySelector?.('.tab.active') ?? null;
  }

  return root.matches?.(selector) ? root : root.querySelector?.(selector) ?? null;
}

export function getSheetScrollContainers(app, root = null, options = {}) {
  const base = root ?? app?._getRootElement?.() ?? getApplicationRootElement(app);
  if (!base) return [];

  const selectors = options.selectors ?? [':root', '.application', '.window-content', '.tab.active'];
  const containers = [];
  const seen = new Set();

  for (const selector of selectors) {
    const element = getSheetScrollElement(app, base, selector, options);
    if (!(element instanceof HTMLElement) || seen.has(element)) continue;
    seen.add(element);
    containers.push({ selector, element });
  }

  const extraSelector = options.extraScrollableSelector ?? '[data-scrollable="true"], .scrollable, .window-content, .tab';
  const scrollableCandidates = base.querySelectorAll?.(extraSelector) ?? [];
  for (const element of scrollableCandidates) {
    if (!(element instanceof HTMLElement) || seen.has(element)) continue;
    const isScrollable = element.scrollHeight > element.clientHeight + 1 || element.scrollTop > 0 || element.scrollLeft > 0;
    if (!isScrollable) continue;
    seen.add(element);
    containers.push({ selector: null, element });
  }

  return containers;
}

export function getSheetScrollContainer(app, root = null, options = {}) {
  const containers = getSheetScrollContainers(app, root, options);
  const fallbackSelector = options.fallbackSelector ?? null;
  return containers.find(({ element }) => element.scrollTop > 0)?.element
    ?? containers.find(({ element }) => element.scrollHeight > element.clientHeight + 1)?.element
    ?? containers.find(({ selector }) => selector === fallbackSelector)?.element
    ?? null;
}

export function captureSheetViewState(app, activeElement = null, options = {}) {
  const root = app?._getRootElement?.() ?? getApplicationRootElement(app);
  const container = getSheetScrollContainer(app, root, options);
  const scrollPositions = getSheetScrollContainers(app, root, options).map(({ selector, element }) => ({
    selector,
    top: element.scrollTop ?? 0,
    left: element.scrollLeft ?? 0
  }));
  const focused =
    activeElement ??
    root?.querySelector?.('input[name]:focus, textarea[name]:focus, select[name]:focus') ??
    null;

  return {
    scrollTop: container?.scrollTop ?? 0,
    scrollPositions,
    activeTab: app?._activeTab ?? options.defaultTab ?? null,
    focusName: focused?.getAttribute?.('name') ?? null,
    selectionStart: typeof focused?.selectionStart === 'number' ? focused.selectionStart : null,
    selectionEnd: typeof focused?.selectionEnd === 'number' ? focused.selectionEnd : null
  };
}

export function restoreSheetViewState(app, root, options = {}) {
  const state = app?._restoreView;
  if (!state || !root) return;

  if (state.activeTab && typeof app._activateTab === 'function') app._activateTab(root, state.activeTab);
  scheduleSheetScrollRestore(app, state, root, options, [0, 50, 150]);
  restoreFocus(root, state);
  app._restoreView = null;
}

export function scheduleSheetScrollRestore(app, state, root = null, options = {}, delays = [0, 50]) {
  if (!state) return;

  const restoreScroll = () => {
    const base = root ?? app?._getRootElement?.() ?? getApplicationRootElement(app);
    if (!base) return;

    const scrollPositions = normalizeScrollPositions(state.scrollPositions);
    for (const position of scrollPositions) {
      const element = position.selector
        ? getSheetScrollElement(app, base, position.selector, options)
        : null;
      if (!(element instanceof HTMLElement)) continue;

      element.scrollTop = Number(position?.top ?? 0);
      element.scrollLeft = Number(position?.left ?? 0);
    }

    const container = getSheetScrollContainer(app, base, options);
    if (container && !scrollPositions.length) container.scrollTop = state.scrollTop ?? 0;
  };

  restoreScroll();
  requestAnimationFrame(restoreScroll);
  for (const delay of delays) setTimeout(restoreScroll, delay);
}

export function cloneViewState(state) {
  return state ? foundry.utils.deepClone(state) : null;
}

function normalizeScrollPositions(scrollPositions) {
  return Array.isArray(scrollPositions)
    ? scrollPositions
    : Object.entries(scrollPositions ?? {}).map(([selector, position]) => ({
        selector,
        top: position?.top ?? 0,
        left: position?.left ?? 0
      }));
}

function restoreFocus(root, state) {
  if (!state.focusName) return;
  const selector = `[name="${CSS.escape(state.focusName)}"]`;
  const field = root.querySelector(selector);
  if (!field) return;

  field.focus({ preventScroll: true });
  if (
    typeof field.setSelectionRange === 'function' &&
    state.selectionStart !== null &&
    state.selectionEnd !== null
  ) {
    field.setSelectionRange(state.selectionStart, state.selectionEnd);
  }
}
