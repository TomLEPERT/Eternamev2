/**
 * Extension de fiche acteur : Actor sheet inventory.
 *
 * Responsabilités :
 * - ajouter à l’ActorSheetV2 les comportements propres à cette section ;
 * - lire ou mettre à jour uniquement les champs nécessaires à l’interface ;
 * - conserver les calculs de règles dans les modules `rules` ou `system`.
 *
 * Ce fichier doit rester un module UI spécialisé et ne pas devenir un service métier.
 */

import { openInventoryItemDialog, openWealthConvertDialog } from "../dialogs/inventory-dialogs.js";
import { cloneDroppedItemToActor, resolveDroppedItem } from "../../system/drag-drop.js";

const INVENTORY_ALLOWED_TYPES = ["gear", "material", "consumable", "object", "tool", "armor", "shield", "weapon", "bag"];

function getItemById(actor, itemId) {
  if (!actor || !itemId) return null;
  return actor.items.get(String(itemId)) ?? null;
}

function localize(key, data = {}) {
  return game.i18n.format(key, data);
}

export function registerActorSheetInventory(ActorSheetClass) {
  ActorSheetClass.prototype._onInventoryDragStart = function(event) {
    const button = event.currentTarget;
    const itemId = String(button?.dataset?.itemId ?? "");
    const item = getItemById(this.document, itemId);
    if (!item) return;

    event.dataTransfer?.setData("text/plain", JSON.stringify({ type: "Item", uuid: item.uuid }));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = "copyMove";
  };

  ActorSheetClass.prototype._onInventoryCreate = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;

    const button = event.currentTarget;
    const location = String(button?.dataset?.location ?? "backpack");
    const payload = await openInventoryItemDialog({ actor: this.document, location });
    if (!payload) return;

    this._captureViewState(button instanceof HTMLElement ? button : null);
    await this.document.createEmbeddedDocuments("Item", [{
      name: payload.name,
      type: payload.type,
      system: {
        quantity: payload.system.quantity,
        weight: payload.system.weight,
        description: payload.system.description,
        legality: payload.system.legality,
        location: payload.location
      }
    }], { render: false });
    this.render(false);
  };

  ActorSheetClass.prototype._onInventoryEdit = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;

    const button = event.currentTarget;
    const itemId = String(button?.dataset?.itemId ?? "");
    const item = getItemById(this.document, itemId);
    if (!item) return;

    if (['weapon','armor','shield','material','consumable','object','tool','bag'].includes(item.type)) {
      item.sheet?.render(true);
      return;
    }

    const payload = await openInventoryItemDialog({
      actor: this.document,
      item,
      location: String(item.system?.location ?? "backpack")
    });
    if (!payload) return;

    this._captureViewState(button instanceof HTMLElement ? button : null);
    await item.update({
      name: payload.name,
      "system.quantity": payload.system.quantity,
      "system.weight": payload.system.weight,
      "system.description": payload.system.description,
      "system.legality": payload.system.legality,
      "system.location": payload.location
    }, { render: false });
    this.render(false);
  };

  ActorSheetClass.prototype._onInventoryAdjustQty = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;

    const button = event.currentTarget;
    const itemId = String(button?.dataset?.itemId ?? "");
    const delta = Number(button?.dataset?.delta ?? 0);
    const item = getItemById(this.document, itemId);
    if (!item || !Number.isFinite(delta) || !delta) return;

    const current = Math.max(1, Math.floor(Number(item.system?.quantity ?? 1) || 1));
    const next = Math.max(1, current + Math.trunc(delta));
    if (next === current) return;

    this._captureViewState(button instanceof HTMLElement ? button : null);
    await item.update({ "system.quantity": next }, { render: false });
    this.render(false);
  };

  ActorSheetClass.prototype._onInventoryMove = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;

    const button = event.currentTarget;
    const itemId = String(button?.dataset?.itemId ?? "");
    const item = getItemById(this.document, itemId);
    if (!item) return;

    const current = String(item.system?.location ?? "backpack");
    const next = current === "belt" ? "backpack" : "belt";

    this._captureViewState(button instanceof HTMLElement ? button : null);
    await item.update({ "system.location": next, "system.containerId": "" }, { render: false });
    this.render(false);
  };

  ActorSheetClass.prototype._onInventoryDelete = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;

    const button = event.currentTarget;
    const itemId = String(button?.dataset?.itemId ?? "");
    const item = getItemById(this.document, itemId);
    if (!item) return;

    this._captureViewState(button instanceof HTMLElement ? button : null);
    await item.delete({ render: false });
    this.render(false);
  };

  ActorSheetClass.prototype._onInventoryUse = async function(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.document.isOwner) return;

    const button = event.currentTarget;
    const itemId = String(button?.dataset?.itemId ?? "");
    const item = getItemById(this.document, itemId);
    if (!item || item.type !== "consumable") return;

    const current = Math.max(1, Math.floor(Number(item.system?.quantity ?? 1) || 1));
    this._captureViewState(button instanceof HTMLElement ? button : null);

    if (current <= 1) {
      await item.delete({ render: false });
    } else {
      await item.update({ "system.quantity": current - 1 }, { render: false });
    }

    this.render(false);
    ui.notifications.info(localize("ETERN.STATS.BELT_CONSUMABLES.USED", { name: item.name }));
  };

  ActorSheetClass.prototype._onInventoryDropDragover = function(event) {
    event.preventDefault();
  };

  ActorSheetClass.prototype._onInventoryDrop = async function(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    if (!this.document.isOwner) return;

    const target = event.currentTarget;
    const location = String(target?.dataset?.location ?? "backpack");
    const itemDoc = await resolveDroppedItem(event);
    if (!itemDoc) return;

    this._captureViewState(target instanceof HTMLElement ? target : null);
    const created = await cloneDroppedItemToActor(this.document, itemDoc, {
      allowedTypes: INVENTORY_ALLOWED_TYPES,
      transform: (itemData) => {
        itemData.system ??= {};
        itemData.system.quantity = Math.max(1, Math.floor(Number(itemData.system.quantity ?? 1) || 1));
        itemData.system.weight = Number(itemData.system.weight ?? 1) || 1;
        itemData.system.description = String(itemData.system.description ?? "");
        itemData.system.location = location;
        itemData.system.containerId = "";
        return itemData;
      }
    });

    if (!created) return;
    this.render(false);
  };

  ActorSheetClass.prototype._onWealthConvert = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;

    const button = event.currentTarget;
    const wealth = foundry.utils.deepClone(this.document.system?.wealth ?? {});
    const conversion = await openWealthConvertDialog(wealth);
    if (!conversion) return;

    const nextWealth = foundry.utils.deepClone(wealth);
    nextWealth[conversion.from] = Math.max(0, Math.floor(Number(nextWealth[conversion.from] ?? 0) || 0) - conversion.amount);
    nextWealth[conversion.to] = Math.max(0, Math.floor(Number(nextWealth[conversion.to] ?? 0) || 0) + conversion.receiveAmount);

    this._captureViewState(button instanceof HTMLElement ? button : null);
    await this.document.update({ "system.wealth": nextWealth }, { render: false });
    this.render(false);

    ui.notifications.info(localize("ETERN.INVENTORY.WEALTH.CONVERT_RESULT", {
      fromAmount: conversion.amount,
      fromLabel: game.i18n.localize(`ETERN.INVENTORY.CURRENCY.${String(conversion.from).toUpperCase()}`),
      toAmount: conversion.receiveAmount,
      toLabel: game.i18n.localize(`ETERN.INVENTORY.CURRENCY.${String(conversion.to).toUpperCase()}`)
    }));
  };
}
