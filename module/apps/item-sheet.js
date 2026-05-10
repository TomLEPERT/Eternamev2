/**
 * Fiche item principale du système Etername.
 *
 * Responsabilités :
 * - composer les modules de fiche item spécialisés ;
 * - déclarer la classe ItemSheetV2 utilisée par Foundry ;
 * - garder la logique détaillée dans les extensions de `module/apps/item`.
 *
 * Ce fichier doit rester un point d’assemblage léger.
 */

import { buildItemSheetContext } from "./item/item-sheet-controller.js";
import { bindItemSheetRender } from "./item/item-sheet-render.js";
import {
  captureSheetViewState,
  cloneViewState,
  getApplicationRootElement,
  getSheetScrollContainer,
  getSheetScrollContainers,
  getSheetScrollElement,
  restoreSheetViewState,
  scheduleSheetScrollRestore
} from "./shared/view-state.js";

const ITEM_VIEW_STATE_OPTIONS = {
  defaultTab: 'general',
  fallbackSelector: '.eternamev2-item-sheet',
  selectors: [':root', '.application', '.window-content', '.eternamev2-item-sheet', '[data-scrollable="true"]', '.sheet-body', '.tab.active'],
  extraScrollableSelector: '[data-scrollable="true"], .scrollable, .window-content, .eternamev2-item-sheet, .sheet-body, .tab'
};

const { HandlebarsApplicationMixin } = foundry.applications.api;
const Base = HandlebarsApplicationMixin(foundry.applications.sheets.ItemSheetV2);

export class EternameItemSheet extends Base {
  static DEFAULT_OPTIONS = {
    ...super.DEFAULT_OPTIONS,
    classes: ["eternamev2", "sheet", "item"],
    position: { width: 840, height: 820 },
    window: { resizable: true },
    form: {
      handler: EternameItemSheet.#onSubmit,
      submitOnChange: false,
      closeOnSubmit: false
    }
  };

  static PARTS = {
    ...super.PARTS,
    body: {
      template: "systems/eternamev2/templates/item/item-sheet-shell.hbs"
    }
  };

  constructor(options = {}) {
    super(options);
    this._activeTab = null;
    this._pendingFieldSaves = new Map();
    this._restoreView = null;
    this._parentActorViewStates = new Map();
  }

  get item() {
    return this.document;
  }

  get title() {
    const type = String(this.document?.type ?? 'item');
    const labelKey = `ETERN.ITEM.TYPES.${type.toUpperCase()}`;
    const localizedType = game.i18n.localize(labelKey);
    const fallback = game.i18n.localize('ETERN.ITEM.DEFAULT_ITEM_NAME');
    const typeLabel = localizedType && localizedType !== labelKey ? localizedType : fallback;
    return `${typeLabel}: ${this.document?.name ?? ''}`;
  }

  async _prepareBaseContext(options) {
    const context = await super._prepareContext(options);
    return {
      ...context,
      editable: this.isEditable,
      owner: this.document.isOwner,
      item: this.document,
      document: this.document,
      system: this.document.system,
      config: CONFIG.ETERN ?? {}
    };
  }

  async _prepareContext(options) {
    return buildItemSheetContext(this, options);
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const root = this._getRootElement();
    if (!root) return;
    this._restoreViewState(root);
    this._syncWindowTitle(root);
    bindItemSheetRender.call(this, root, context, options);
  }

  _getRootElement() {
    return getApplicationRootElement(this);
  }

  _getScrollElement(root, selector) {
    return getSheetScrollElement(this, root, selector, ITEM_VIEW_STATE_OPTIONS);
  }

  _getScrollContainers(root = null) {
    return getSheetScrollContainers(this, root, ITEM_VIEW_STATE_OPTIONS);
  }

  _getScrollContainer(root = null) {
    return getSheetScrollContainer(this, root, ITEM_VIEW_STATE_OPTIONS);
  }

  _activateTab(root, tabId) {
    if (!root) return;
    this._activeTab = String(tabId || 'general');

    for (const item of root.querySelectorAll('.sheet-tabs .item')) {
      item.classList.toggle('active', item.dataset.tab === this._activeTab);
    }

    for (const panel of root.querySelectorAll('.tab')) {
      const active = panel.dataset.tab === this._activeTab;
      panel.classList.toggle('active', active);
      panel.hidden = !active;
    }
  }

  _captureViewState(activeElement = null) {
    this._restoreView = captureSheetViewState(this, activeElement, ITEM_VIEW_STATE_OPTIONS);
  }

  _restoreViewState(root) {
    restoreSheetViewState(this, root, ITEM_VIEW_STATE_OPTIONS);
  }


  _getParentActorSheets() {
    const actor = this.document?.parent;
    if (!actor) return [];

    const applicationInstances = globalThis.foundry?.applications?.instances;
    const v2Instances = applicationInstances instanceof Map
      ? Array.from(applicationInstances.values())
      : Array.isArray(applicationInstances)
        ? applicationInstances
        : [];

    const candidates = [
      ...Object.values(actor.apps ?? {}),
      ...Object.values(globalThis.ui?.windows ?? {}),
      ...v2Instances
    ].filter((app) => app?.document === actor);

    const seen = new Set();
    return candidates.filter((app) => {
      if (!app || seen.has(app)) return false;
      seen.add(app);
      return typeof app.render === 'function';
    });
  }

  _cloneViewState(state) {
    return cloneViewState(state);
  }

  _captureParentActorViewState() {
    this._parentActorViewStates = new Map();

    for (const sheet of this._getParentActorSheets()) {
      if (typeof sheet._captureViewState !== 'function') continue;
      sheet._captureViewState();
      this._parentActorViewStates.set(sheet, this._cloneViewState(sheet._restoreView));
    }
  }

  _renderParentActorSheets() {
    for (const sheet of this._getParentActorSheets()) {
      const savedState = this._parentActorViewStates?.get(sheet);
      if (savedState && typeof sheet._restoreView !== 'undefined') {
        sheet._restoreView = this._cloneViewState(savedState);
      } else if (typeof sheet._captureViewState === 'function') {
        sheet._captureViewState();
      }

      sheet.render(false);
    }

    this._parentActorViewStates?.clear?.();
  }

  _syncWindowTitle(root = null) {
    const base = root ?? this._getRootElement();
    const titleElement = base?.closest?.('.application')?.querySelector?.('.window-title');
    if (titleElement) titleElement.textContent = this.title;
  }

  _scheduleCurrentViewRestore() {
    const state = this._cloneViewState(this._restoreView);
    if (!state) return;

    scheduleSheetScrollRestore(this, state, null, ITEM_VIEW_STATE_OPTIONS, [0, 50]);
  }

  async _updateItemDocument(changes, activeElement = null, { renderSheet = false, renderParentActor = true } = {}) {
    this._captureViewState(activeElement);
    if (renderParentActor) this._captureParentActorViewState();
    await this.document.update(changes, { render: false });
    if (renderParentActor) this._renderParentActorSheets();
    if (renderSheet) await this.render(false);
    else this._scheduleCurrentViewRestore();
  }

  static async #onSubmit(event, form, formData) {
    if (typeof this._updateItemDocument === 'function') {
      await this._updateItemDocument(formData.object, event?.submitter ?? null, { renderSheet: false });
      return;
    }

    await this.document.update(formData.object);
  }
}
