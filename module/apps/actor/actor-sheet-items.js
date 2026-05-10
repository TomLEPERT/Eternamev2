/**
 * Extension de fiche acteur : Actor sheet items.
 *
 * Responsabilités :
 * - ajouter à l’ActorSheetV2 les comportements propres à cette section ;
 * - lire ou mettre à jour uniquement les champs nécessaires à l’interface ;
 * - conserver les calculs de règles dans les modules `rules` ou `system`.
 *
 * Ce fichier doit rester un module UI spécialisé et ne pas devenir un service métier.
 */

import { createDefaultPresetItemData } from "../../system/items/item-factory.js";

function normalizeOwnedItemFieldValue(field) {
  if (field instanceof HTMLInputElement && field.type === "number") {
    const value = field.value === "" ? 0 : Number(field.value);
    return Number.isFinite(value) ? value : 0;
  }

  return field.value ?? "";
}

export function registerActorSheetItems(ActorSheetClass) {
  ActorSheetClass.prototype._updateOwnedItem = async function(itemId, changes, activeElement = null) {
    const item = this.document.items.get(itemId);
    if (!item || !this.document.isOwner) return;

    this._captureViewState(activeElement);
    await item.update(changes, { render: false });
    this.render(false);
  };

  ActorSheetClass.prototype._onCreateDefenseItem = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;

    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) return;

    const type = target.dataset.itemType;
    if (!type || !["armor", "shield"].includes(type)) return;

    const itemData = createDefaultPresetItemData(type);
    if (!itemData) return;

    this._captureViewState(target);

    await this.document.createEmbeddedDocuments("Item", [itemData], { render: false });

    this.render(false);
  };

  ActorSheetClass.prototype._onOwnedItemToggle = async function(event) {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;

    const itemId = input.dataset.itemId;
    if (!itemId) return;

    await this._updateOwnedItem(
      itemId,
      { "system.equipped": input.checked },
      input
    );
  };

  ActorSheetClass.prototype._onOwnedItemFieldChange = async function(event) {
    const field = event.target;
    if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement)) return;

    const itemId = field.dataset.itemId;
    const itemPath = field.dataset.itemPath;
    if (!itemId || !itemPath) return;

    const value = normalizeOwnedItemFieldValue(field);

    await this._updateOwnedItem(itemId, { [itemPath]: value }, field);
  };

  ActorSheetClass.prototype._onOwnedItemToggleEquipButton = async function(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const itemId = String(button?.dataset?.itemId ?? "");
    const item = this.document.items.get(itemId);
    if (!item) return;
    await this._updateOwnedItem(itemId, { "system.equipped": !Boolean(item.system?.equipped) }, button);
  };

  ActorSheetClass.prototype._onDeleteOwnedItem = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;

    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) return;

    const itemId = target.dataset.itemId;
    if (!itemId) return;

    this._captureViewState(target);
    await this.document.deleteEmbeddedDocuments("Item", [itemId], { render: false });
    this.render(false);
  };
}
