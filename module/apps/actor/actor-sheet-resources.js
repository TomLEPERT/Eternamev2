/**
 * Extension de fiche acteur : Actor sheet resources.
 *
 * Responsabilités :
 * - ajouter à l’ActorSheetV2 les comportements propres à cette section ;
 * - lire ou mettre à jour uniquement les champs nécessaires à l’interface ;
 * - conserver les calculs de règles dans les modules `rules` ou `system`.
 *
 * Ce fichier doit rester un module UI spécialisé et ne pas devenir un service métier.
 */

import { deriveAccustomanceState, deriveHpState } from "../../rules/derived/resources.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function setAdjustButtonsDisabled(root, action, minDisabled, maxDisabled) {
  const minusButton = root.querySelector(`[data-action="${action}"][data-delta="-1"]`);
  const plusButton = root.querySelector(`[data-action="${action}"][data-delta="1"]`);

  if (minusButton) minusButton.disabled = Boolean(minDisabled);
  if (plusButton) plusButton.disabled = Boolean(maxDisabled);
}

export function registerActorSheetResources(ActorSheetClass) {
  ActorSheetClass.prototype._syncHpTrack = function(root, hpState) {
    if (!root) return;

    const current = hpState?.current ?? 0;
    const max = hpState?.max ?? 0;
    const severeWounds = hpState?.severeWounds ?? 0;

    this._setText(root, '[data-derived="hp-current"]', current);
    this._setText(root, '[data-derived="hp-max"]', max);
    this._setText(root, '[data-derived="hp-severe-wounds"]', severeWounds);

    setAdjustButtonsDisabled(
      root,
      "hp-adjust-severe",
      severeWounds <= 0,
      severeWounds >= 4
    );

    for (const box of root.querySelectorAll('.hp-track-box[data-index]')) {
      const index = Number(box.dataset.index);
      const slot = hpState?.slots?.[index];
      if (!slot) continue;

      box.classList.toggle("active", Boolean(slot.checked));
      box.classList.toggle("is-disabled", Boolean(slot.disabled));
      box.classList.toggle("is-wound-disabled", Boolean(slot.disabledByWound));
      box.classList.toggle("is-max-disabled", Boolean(slot.disabledByMax) && !slot.disabledByWound);
      box.disabled = Boolean(slot.disabled);
      box.setAttribute("aria-pressed", slot.checked ? "true" : "false");
    }
  };

  ActorSheetClass.prototype._syncAccustomanceTrack = function(root, state) {
    if (!root || !state) return;

    this._setText(root, '[data-derived="accustomance-unlocked"]', state.unlocked);

    setAdjustButtonsDisabled(
      root,
      "accustomance-adjust-disabled",
      state.unlocked <= 1,
      state.unlocked >= 12
    );

    for (const box of root.querySelectorAll('.accustomance-track-box[data-index]')) {
      const index = Number(box.dataset.index);
      const slot = state.slots?.[index];
      if (!slot) continue;

      box.classList.toggle("active", Boolean(slot.checked));
      box.classList.toggle("is-disabled", Boolean(slot.disabled));
      box.disabled = Boolean(slot.disabled);
      box.setAttribute("aria-pressed", slot.checked ? "true" : "false");
    }
  };

  ActorSheetClass.prototype._onHpBoxClick = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;

    const button = event.currentTarget;
    if (!(button instanceof HTMLElement)) return;

    const index = Number(button.dataset.index);
    if (!Number.isFinite(index)) return;

    const hpState = deriveHpState(
      this.document.system?.attributes ?? {},
      this.document.system?.resources?.hp
    );
    const slot = hpState?.slots?.[index];
    if (!slot || slot.disabled) return;

    const boxes = Array.isArray(this.document.system?.resources?.hp?.boxes)
      ? [...this.document.system.resources.hp.boxes]
      : [...hpState.boxes];

    boxes[index] = !Boolean(boxes[index]);

    await this._updateDocument({
      "system.resources.hp.boxes": boxes
    }, button);
  };

  ActorSheetClass.prototype._onHpAdjustSevereWounds = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;

    const button = event.currentTarget;
    if (!(button instanceof HTMLElement)) return;

    const delta = Number(button.dataset.delta ?? 0);
    if (!Number.isFinite(delta) || delta === 0) return;

    const current = Number(this.document.system?.resources?.hp?.severeWounds ?? 0);
    const next = clamp(current + delta, 0, 4);
    if (next === current) return;

    await this._updateDocument({
      "system.resources.hp.severeWounds": next
    }, button);
  };

  ActorSheetClass.prototype._onAccustomanceBoxClick = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;

    const button = event.currentTarget;
    if (!(button instanceof HTMLElement)) return;

    const index = Number(button.dataset.index);
    if (!Number.isFinite(index)) return;

    const state = deriveAccustomanceState(
      this.document.system?.accustomance,
      this.document.system?.accustomanceDisabled
    );
    const slot = state?.slots?.[index];
    if (!slot || slot.disabled) return;

    const boxes = Array.isArray(this.document.system?.accustomance?.boxes)
      ? [...this.document.system.accustomance.boxes]
      : [...state.boxes];

    boxes[index] = !Boolean(boxes[index]);

    await this._updateDocument({
      "system.accustomance.boxes": boxes
    }, button);
  };

  ActorSheetClass.prototype._onAccustomanceAdjustDisabled = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;

    const button = event.currentTarget;
    if (!(button instanceof HTMLElement)) return;

    const delta = Number(button.dataset.delta ?? 0);
    if (!Number.isFinite(delta) || delta === 0) return;

    const size = 12;
    const currentDisabled = Number(this.document.system?.accustomanceDisabled ?? (size - 1));
    const currentUnlocked = Math.max(1, size - currentDisabled);
    const nextUnlocked = clamp(currentUnlocked + delta, 1, size);
    const nextDisabled = size - nextUnlocked;

    if (nextDisabled === currentDisabled) return;

    await this._updateDocument({
      "system.accustomanceDisabled": nextDisabled
    }, button);
  };
}