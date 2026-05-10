/**
 * Extension de fiche acteur : Actor sheet view.
 *
 * Responsabilités :
 * - ajouter à l’ActorSheetV2 les comportements propres à cette section ;
 * - lire ou mettre à jour uniquement les champs nécessaires à l’interface ;
 * - conserver les calculs de règles dans les modules `rules` ou `system`.
 *
 * Ce fichier doit rester un module UI spécialisé et ne pas devenir un service métier.
 */

import { clampResourceValue } from "../../rules/derived/resources.js";
import {
  captureSheetViewState,
  getApplicationRootElement,
  getSheetScrollContainer,
  getSheetScrollContainers,
  getSheetScrollElement,
  restoreSheetViewState
} from "../shared/view-state.js";

const ACTOR_VIEW_STATE_OPTIONS = {
  defaultTab: "identity",
  fallbackSelector: ".tab-content",
  selectors: [":root", ".application", ".window-content", ".etername-sheet", ".tab-content", ".tab.active"],
  extraScrollableSelector: '[data-scrollable="true"], .scrollable, .window-content, .etername-sheet, .tab-content, .tab'
};

export function registerActorSheetView(ActorSheetClass) {
  ActorSheetClass.prototype._refreshLiveView = function() {
    const root = this._getRootElement();
    const system = this.document.system;
    if (!root || !system) return;

    const derived = system.derived ?? {};
    const attributes = derived.attributes ?? {};

    const hpState = derived.hp ?? {};
    const accustomanceState = derived.accustomance ?? {};
    const destinyBase = Number(derived.destinyBase ?? 0);
    const fatigueMax = Number(derived.fatigueMax ?? 0);
    const initiative = Number(derived.initiative ?? 0);
    const exploration = Number(derived.exploration ?? 0);
    const defense = derived.defense ?? {};
    const armorTraining = derived.armorTraining ?? {};
    const movement = derived.movement ?? {};
    const magic = derived.magic ?? [];
    const attacks = derived.attacks ?? {};
    const saves = derived.saves ?? {};
    const progressTracks = derived.progressTracks ?? [];
    const renown = derived.renown ?? {};

    this._refreshAttributeIndexes(root, attributes);
    this._refreshResourceSummary(root, {
      hpState,
      accustomanceState,
      destinyBase,
      fatigueMax
    });
    this._refreshCombatSummary(root, {
      initiative,
      exploration,
      defense,
      armorTraining
    });

    this._refreshMovement(root, movement);
    this._refreshMagic(root, magic);
    this._refreshAttackSummary(root, attacks);
    this._refreshSaves(root, saves);
    this._refreshProgressTracks(root, progressTracks);
    this._refreshInventorySummary(root, { renown });
    this._refreshStatePanels();

    this._setFieldValue(
      root,
      'input[name="system.resources.destiny.value"]',
      clampResourceValue(system.resources?.destiny?.value, destinyBase, destinyBase)
    );
    this._setFieldValue(
      root,
      'input[name="system.resources.fatigue.value"]',
      clampResourceValue(system.resources?.fatigue?.value, fatigueMax, 0)
    );
    this._setFieldValue(
      root,
      'input[name="system.defense.bonus"]',
      defense.bonus ?? 0
    );
  };

  ActorSheetClass.prototype._refreshAttributeIndexes = function(root, attributes) {
    for (const [key, attr] of Object.entries(attributes ?? {})) {
      this._setText(root, `[data-attr-index-value="${CSS.escape(key)}"]`, attr?.index ?? 0);
      this._setText(root, `[data-attr-final-value="${CSS.escape(key)}"]`, attr?.total ?? attr?.value ?? 0);
      const valueInput = root.querySelector(`input[name="system.attributes.${CSS.escape(key)}.value"]`);
      if (valueInput instanceof HTMLInputElement && document.activeElement !== valueInput) {
        valueInput.value = String(attr?.value ?? 0);
      }
      this._syncAttributeTicks?.(key, this.document.system?.attributes?.[key]?.ticks ?? 0);
    }
  };

  ActorSheetClass.prototype._refreshResourceSummary = function(root, data) {
    this._syncHpTrack(root, data.hpState);
    this._syncAccustomanceTrack(root, data.accustomanceState);
    this._setText(root, '[data-derived="destiny-base"]', data.destinyBase);
    this._setText(root, '[data-derived="fatigue-max"]', data.fatigueMax);
  };

  ActorSheetClass.prototype._refreshCombatSummary = function(root, data) {
    this._setText(root, '[data-derived="initiative"]', data.initiative);
    this._setText(root, '[data-derived="exploration"]', data.exploration);
    this._setText(root, '[data-derived="defense-total"]', data.defense.total ?? 0);
    this._setText(root, '[data-derived="defense-base"]', data.defense.base ?? 0);

    this._setText(
      root,
      '[data-derived="armor-training-status"]',
      data.armorTraining.trained
        ? game.i18n.localize("ETERN.STATS.ARMOR_TRAINING_OK")
        : game.i18n.localize("ETERN.STATS.ARMOR_TRAINING_MISSING")
    );

    this._setText(
      root,
      '[data-derived="armor-training-penalty"]',
      data.armorTraining.agilityDisadvantage
        ? game.i18n.localize("ETERN.STATS.ARMOR_TRAINING_PENALTY_DISADV")
        : data.armorTraining.speedPenalty > 0
          ? game.i18n.format("ETERN.STATS.ARMOR_TRAINING_PENALTY_SPEED", {
              value: data.armorTraining.speedPenalty
            })
          : game.i18n.localize("ETERN.STATS.ARMOR_TRAINING_PENALTY_NONE")
    );
  };

  ActorSheetClass.prototype._getRootElement = function() {
    return getApplicationRootElement(this);
  };

  ActorSheetClass.prototype._getScrollElement = function(root, selector) {
    return getSheetScrollElement(this, root, selector, ACTOR_VIEW_STATE_OPTIONS);
  };

  ActorSheetClass.prototype._getScrollContainers = function(root = null) {
    return getSheetScrollContainers(this, root, ACTOR_VIEW_STATE_OPTIONS);
  };

  ActorSheetClass.prototype._getScrollContainer = function(root = null) {
    return getSheetScrollContainer(this, root, ACTOR_VIEW_STATE_OPTIONS);
  };

  ActorSheetClass.prototype._captureViewState = function(activeElement = null) {
    this._restoreView = captureSheetViewState(this, activeElement, ACTOR_VIEW_STATE_OPTIONS);
  };

  ActorSheetClass.prototype._restoreViewState = function(root) {
    restoreSheetViewState(this, root, ACTOR_VIEW_STATE_OPTIONS);
  };

  ActorSheetClass.prototype._activateTab = function(root, tabId) {
    if (!root) return;

    this._activeTab = tabId || "identity";

    for (const item of root.querySelectorAll(".sheet-tabs .item")) {
      item.classList.toggle("active", item.dataset.tab === this._activeTab);
    }

    for (const panel of root.querySelectorAll(".tab")) {
      panel.classList.toggle("active", panel.dataset.tab === this._activeTab);
    }
  };

  ActorSheetClass.prototype._bindTabs = function(root) {
    if (!root) return;

    const items = root.querySelectorAll(".sheet-tabs .item[data-tab]");
    for (const item of items) {
      if (item.dataset.boundTab) continue;
      item.dataset.boundTab = "1";
      item.addEventListener("click", (event) => {
        event.preventDefault();
        this._activateTab(root, item.dataset.tab);
      });
    }

    this._activateTab(root, this._activeTab || "identity");
  };


  ActorSheetClass.prototype._refreshInventorySummary = function(root, { renown = {} } = {}) {
    if (!root) return;

    const system = this.document?.system ?? {};
    const positive = Math.max(0, Math.floor(Number(system.renown?.positive ?? 0) || 0));
    const negative = Math.max(0, Math.floor(Number(system.renown?.negative ?? 0) || 0));
    const scope = Math.max(0, Math.floor(Number(renown.scope ?? positive + negative) || 0));

    this._setFieldValue(root, '[data-derived="renown-scope"]', scope);
  };

  ActorSheetClass.prototype._refreshAttackSummary = function(root, attacks = {}) {
    if (!root) return;

    this._setText(root, '[data-derived="attack-prc"]', attacks.prc ?? 0);
    this._setText(root, '[data-derived="attack-prd"]', attacks.prd ?? 0);
    this._setText(root, '[data-derived="attack-prm"]', attacks.prm ?? 0);
  };

  ActorSheetClass.prototype._refreshSaves = function(root, saves = {}) {
    if (!root) return;

    for (const [key, save] of Object.entries(saves)) {
      const total = Number(save?.total ?? 0);
      const boxes = root.querySelectorAll(`.save-track-box[data-save-key="${CSS.escape(key)}"]`);

      boxes.forEach((box) => {
        const index = Number(box.dataset.boxIndex);
        const active = Number.isInteger(index) && index < total;
        const checked = Boolean(save?.slots?.[index]?.checked);

        box.classList.toggle('active', checked);
        box.classList.toggle('is-disabled', !active);
        box.disabled = !active;
        box.setAttribute('aria-pressed', checked ? 'true' : 'false');
      });
    }
  };

  ActorSheetClass.prototype._refreshMovement = function(root, movement = {}) {
    if (!root) return;

    this._setText(root, '[data-derived="movement-walk"]', movement.base ?? 0);
    this._setText(root, '[data-derived="movement-size-base"]', movement.baseWalk ?? 0);
    this._setText(root, '[data-derived="movement-armor-penalty"]', movement.armorPenalty ?? 0);

    const manualModes = (movement.modes ?? []).filter((entry) => !entry.auto);
    const rows = root.querySelectorAll(".movement-mode-row");

    rows.forEach((row, index) => {
      const mode = manualModes[index];
      if (!mode) return;

      const nameInput = row.querySelector('[data-mode-field="name"]');
      if (nameInput && document.activeElement !== nameInput) {
        nameInput.value = mode.name ?? "";
      }

      const valueInput = row.querySelector('[data-mode-field="value"]');
      if (valueInput && document.activeElement !== valueInput) {
        valueInput.value = String(mode.value ?? 0);
      }
    });
  };

  ActorSheetClass.prototype._refreshMagic = function(root, magic = []) {
    if (!root) return;

    const rows = root.querySelectorAll(".magic-pool-row");

    rows.forEach((row, index) => {
      const entry = magic[index];
      if (!entry) return;

      const input = row.querySelector('[data-magic-field="current"]');
      if (input && document.activeElement !== input) {
        input.value = String(entry.current ?? 0);
      }

      const maxEl = row.querySelector(".magic-derived-max");
      if (maxEl && Number.isFinite(entry.max)) {
        maxEl.textContent = String(entry.max);
      }

      const recEl = row.querySelector(".magic-recovery-line strong");
      if (recEl) {
        recEl.textContent = String(entry.recoveryPerAction ?? 0);
      }
    });
  };
}