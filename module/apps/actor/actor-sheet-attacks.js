/**
 * Extension de fiche acteur : Actor sheet attacks.
 *
 * Responsabilités :
 * - ajouter à l’ActorSheetV2 les comportements propres à cette section ;
 * - lire ou mettre à jour uniquement les champs nécessaires à l’interface ;
 * - conserver les calculs de règles dans les modules `rules` ou `system`.
 *
 * Ce fichier doit rester un module UI spécialisé et ne pas devenir un service métier.
 */

import { normalizeDamageType, normalizeRange } from "../../system/nomenclature.js";
import { openAttackRollDialog } from "../dialogs/attack-roll-dialog.js";

function normalizeAttackFieldValue(field) {
  return field.value ?? "";
}

function createDefaultAttack() {
  return {
    id: foundry.utils.randomID(),
    name: game.i18n.localize("ETERN.ATTACKS.DEFAULT_NAME"),
    range: "melee",
    damage: "1d6",
    type: ""
  };
}

export function registerActorSheetAttacks(ActorSheetClass) {
  ActorSheetClass.prototype._onCreateAttack = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;

    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) return;

    const attacks = foundry.utils.deepClone(this.document.system?.attacks ?? []);
    attacks.push(createDefaultAttack());

    this._captureViewState(target);
    await this.document.update({ "system.attacks": attacks }, { render: false });
    this.render(false);
  };

  ActorSheetClass.prototype._onDeleteAttack = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;

    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) return;

    const index = Number(target.dataset.attackIndex);
    if (!Number.isInteger(index) || index < 0) return;

    const attacks = foundry.utils.deepClone(this.document.system?.attacks ?? []);
    if (index >= attacks.length) return;

    attacks.splice(index, 1);

    this._captureViewState(target);
    await this.document.update({ "system.attacks": attacks }, { render: false });
    this.render(false);
  };

  ActorSheetClass.prototype._onAttackFieldChange = async function(event) {
    const field = event.target;
    if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) return;
    if (!this.document.isOwner) return;

    const index = Number(field.dataset.attackIndex);
    const attackField = String(field.dataset.attackField ?? "");
    if (!Number.isInteger(index) || index < 0 || !attackField) return;

    const attacks = foundry.utils.deepClone(this.document.system?.attacks ?? []);
    const attack = attacks[index];
    if (!attack) return;

    const nextValue = normalizeAttackFieldValue(field);
    attack[attackField] = attackField === "range"
      ? normalizeRange(nextValue)
      : attackField === "type" || attackField === "damageType"
        ? normalizeDamageType(nextValue)
        : nextValue;

    this._captureViewState(field);
    await this.document.update({ "system.attacks": attacks }, { render: false });
    this._refreshLiveView();
  };

  ActorSheetClass.prototype._onAttackRollClick = async function(event) {
    event.preventDefault();
    const button = event.currentTarget;
    if (!(button instanceof HTMLElement)) return;

    const itemId = String(button.dataset.itemId ?? "");
    if (itemId) {
      const item = this.document.items.get(itemId);
      if (!item) return;
      const attack = {
        name: item.name,
        range: normalizeRange(item.system?.range ?? "melee"),
        damage: String(item.system?.damage ?? "1d6"),
        damageType: normalizeDamageType(item.system?.damageType ?? ""),
        precisionBase: String(item.system?.precisionBase ?? "PRC"),
        precisionBonus: Number(item.system?.precisionBonus ?? 0) || 0
      };
      await openAttackRollDialog(this.document, attack);
      return;
    }

    const index = Number(button.dataset.attackIndex);
    if (!Number.isInteger(index) || index < 0) return;
    const attack = this.document.system?.attacks?.[index];
    if (!attack) return;

    await openAttackRollDialog(this.document, attack);
  };

  ActorSheetClass.prototype._onEditWeaponAttack = async function(event) {
    event.preventDefault();
    const itemId = String(event.currentTarget?.dataset?.itemId ?? "");
    const item = this.document.items.get(itemId);
    if (!item) return;
    item.sheet?.render(true);
  };
};
