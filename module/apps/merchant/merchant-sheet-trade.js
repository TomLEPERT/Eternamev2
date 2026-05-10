/**
 * Extension de fiche marchand : Merchant sheet trade.
 *
 * Responsabilités :
 * - gérer une section ou un comportement de la fiche marchand ;
 * - préparer les données d’affichage liées au commerce ;
 * - déléguer les calculs de richesse et de transaction aux services dédiés.
 *
 * Ce fichier doit rester un module UI de marchand.
 */

import { openMerchantPriceDialog } from "../dialogs/merchant-dialogs.js";
import { addWealthValues, canAffordWealth, discountWealthByPercent, formatWealth, increaseWealthByPercent, normalizeWealth, subtractWealthValues } from "../../system/trade/wealth.js";
import { resolveDroppedItem } from "../../system/drag-drop.js";
import { resolveTradeActor, resolveTradeActorFromItem } from "../../system/trade/trade-actor-resolver.js";

const MERCHANT_ITEM_TYPES = ["weapon", "armor", "shield", "gear", "object", "tool", "material", "consumable", "bag"];

function getStockItem(sheet, itemId) {
  return sheet.document.items.get(String(itemId)) ?? null;
}

function getBuyerActor(sheet) {
  return resolveTradeActor({ actorId: sheet?._tradeActorId });
}

function createBuyerItemData(item, quantity = 1) {
  const data = foundry.utils.deepClone(item.toObject());
  delete data._id;
  data.system ??= {};
  data.system.quantity = Math.max(1, Math.floor(Number(quantity) || 1));
  data.system.location = "backpack";
  data.system.containerId = "";
  data.system.price = { pp: 0, rc: 0, po: 0, pa: 0, pc: 0 };
  return data;
}

async function decrementOrDeleteItem(item) {
  const quantity = Math.max(1, Math.floor(Number(item.system?.quantity ?? 1) || 1));
  if (quantity <= 1) return item.delete({ render: false });
  return item.update({ "system.quantity": quantity - 1 }, { render: false });
}

function buildPriceUpdate(price = {}) {
  const normalized = normalizeWealth(price);
  return Object.fromEntries(Object.entries(normalized).map(([key, value]) => [`system.price.${key}`, value]));
}

function getMerchantPermissionWarning(sheet) {
  if (!sheet.document.canUserModify(game.user, "update")) {
    return game.i18n.localize("ETERN.MERCHANT.ERROR_PERMISSION");
  }
  return null;
}

function getTradeWarning(sheet) {
  const permissionWarning = getMerchantPermissionWarning(sheet);
  if (permissionWarning) return permissionWarning;

  const buyerActor = getBuyerActor(sheet);
  if (!buyerActor?.isOwner) {
    return game.i18n.localize("ETERN.MERCHANT.ERROR_NO_CHARACTER");
  }
  return null;
}

function merchantAcceptsItem(merchant, item) {
  const trade = merchant.system?.trade ?? {};
  const typeAccepted = Boolean(trade?.acceptedTypes?.[String(item.type ?? "")] ?? true);
  const legality = String(item.system?.legality ?? "legal");
  const legalityAccepted = legality === "illegal"
    ? Boolean(trade?.acceptsIllegal ?? false)
    : Boolean(trade?.acceptsLegal ?? true);
  return typeAccepted && legalityAccepted;
}

export function registerMerchantSheetTrade(MerchantSheetClass) {
  MerchantSheetClass.prototype._onMerchantBuy = async function(event) {
    event.preventDefault();
    const warning = getTradeWarning(this);
    if (warning) return ui.notifications.warn(warning);

    const button = event.currentTarget;
    const item = getStockItem(this, button?.dataset?.itemId);
    const buyerActor = getBuyerActor(this);
    if (!item || !buyerActor) return;

    const price = discountWealthByPercent(item.system?.price ?? {}, this._sessionDiscountPercent ?? 0);
    const buyerWealth = normalizeWealth(buyerActor.system?.wealth ?? {});
    const nextBuyerWealth = subtractWealthValues(buyerWealth, price);
    if (!nextBuyerWealth) {
      return ui.notifications.warn(game.i18n.localize("ETERN.MERCHANT.ERROR_NOT_ENOUGH_MONEY"));
    }

    const nextMerchantWealth = addWealthValues(this.document.system?.wealth ?? {}, price);
    const buyerItemData = createBuyerItemData(item, 1);

    // Achat : le personnage paie exactement les monnaies du prix, et le marchand les reçoit.
    // Aucune conversion automatique n’est faite pendant la transaction.
    await buyerActor.update({ "system.wealth": nextBuyerWealth }, { render: false });
    await buyerActor.createEmbeddedDocuments("Item", [buyerItemData], { render: false });
    await this.document.update({ "system.wealth": nextMerchantWealth }, { render: false });
    await decrementOrDeleteItem(item);

    ui.notifications.info(game.i18n.format("ETERN.MERCHANT.INFO_PURCHASED", {
      item: item.name,
      price: formatWealth(price),
      actor: buyerActor.name
    }));
    this.render(false);
  };

  MerchantSheetClass.prototype._onMerchantTradeActorChange = function(event) {
    event.preventDefault();
    this._tradeActorId = String(event.currentTarget?.value ?? "");
    this.render(false);
  };

  MerchantSheetClass.prototype._onMerchantSetDiscount = async function(event) {
    event.preventDefault();
    const root = this._getRootElement?.() ?? this.element;
    const input = root?.querySelector('[data-merchant-discount-input]');
    this._sessionDiscountPercent = Math.max(0, Math.min(100, Math.floor(Number(input?.value ?? 0) || 0)));
    this.render(false);
  };

  MerchantSheetClass.prototype._onMerchantResetDiscount = async function(event) {
    event.preventDefault();
    this._sessionDiscountPercent = 0;
    this.render(false);
  };

  MerchantSheetClass.prototype._onMerchantStockEditPrice = async function(event) {
    event.preventDefault();
    if (!this.document.canUserModify(game.user, "update")) return;
    const button = event.currentTarget;
    const item = getStockItem(this, button?.dataset?.itemId);
    if (!item) return;

    const price = await openMerchantPriceDialog({
      title: game.i18n.localize("ETERN.MERCHANT.DIALOG.PRICE_TITLE"),
      itemName: item.name,
      price: item.system?.price ?? {}
    });
    if (!price) return;

    await item.update(buildPriceUpdate(price), { render: false });
    this.render(false);
  };

  MerchantSheetClass.prototype._onMerchantStockDelete = async function(event) {
    event.preventDefault();
    if (!this.document.canUserModify(game.user, "update")) return;
    const button = event.currentTarget;
    const item = getStockItem(this, button?.dataset?.itemId);
    if (!item) return;
    await item.delete({ render: false });
    this.render(false);
  };

  MerchantSheetClass.prototype._onMerchantStockAdjustQty = async function(event) {
    event.preventDefault();
    if (!this.document.canUserModify(game.user, "update")) return;
    const button = event.currentTarget;
    const item = getStockItem(this, button?.dataset?.itemId);
    const delta = Number(button?.dataset?.delta ?? 0);
    if (!item || !Number.isFinite(delta) || !delta) return;
    const current = Math.max(1, Math.floor(Number(item.system?.quantity ?? 1) || 1));
    const next = Math.max(1, current + Math.trunc(delta));
    await item.update({ "system.quantity": next }, { render: false });
    this.render(false);
  };

  MerchantSheetClass.prototype._onMerchantStockDropDragover = function(event) {
    event.preventDefault();
  };

  MerchantSheetClass.prototype._onMerchantStockDrop = async function(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.document.canUserModify(game.user, "update")) return;

    const itemDoc = await resolveDroppedItem(event);
    if (!itemDoc || !MERCHANT_ITEM_TYPES.includes(String(itemDoc.type ?? ""))) return;

    const price = await openMerchantPriceDialog({
      title: game.i18n.localize("ETERN.MERCHANT.DIALOG.PRICE_TITLE"),
      itemName: itemDoc.name,
      price: itemDoc.system?.price ?? {}
    });
    if (!price) return;

    const itemData = foundry.utils.deepClone(itemDoc.toObject());
    delete itemData._id;
    itemData.system ??= {};
    itemData.system.location = "stock";
    itemData.system.containerId = "";
    itemData.system.price = normalizeWealth(price);
    await this.document.createEmbeddedDocuments("Item", [itemData], { render: false });
    this.render(false);
  };

  MerchantSheetClass.prototype._onMerchantSellDrop = async function(event) {
    event.preventDefault();
    event.stopPropagation();
    const permissionWarning = getMerchantPermissionWarning(this);
    if (permissionWarning) return ui.notifications.warn(permissionWarning);

    const itemDoc = await resolveDroppedItem(event);
    const itemOwnerActor = resolveTradeActorFromItem(itemDoc);
    const buyerActor = itemOwnerActor ?? getBuyerActor(this);
    if (!itemDoc) return;
    if (!buyerActor?.isOwner) {
      return ui.notifications.warn(game.i18n.localize("ETERN.MERCHANT.ERROR_NO_CHARACTER"));
    }
    if (itemDoc.parent?.id !== buyerActor.id) {
      return ui.notifications.warn(game.i18n.localize("ETERN.MERCHANT.ERROR_SELL_SOURCE"));
    }
    if (!MERCHANT_ITEM_TYPES.includes(String(itemDoc.type ?? ""))) {
      return ui.notifications.warn(game.i18n.localize("ETERN.MERCHANT.ERROR_UNSUPPORTED_ITEM"));
    }
    if (!merchantAcceptsItem(this.document, itemDoc)) {
      return ui.notifications.warn(game.i18n.localize("ETERN.MERCHANT.ERROR_ITEM_NOT_ACCEPTED"));
    }

    const price = await openMerchantPriceDialog({
      title: game.i18n.localize("ETERN.MERCHANT.DIALOG.SELL_TITLE"),
      itemName: itemDoc.name,
      price: itemDoc.system?.price ?? {}
    });
    if (!price) return;

    const merchantWealth = normalizeWealth(this.document.system?.wealth ?? {});
    if (!canAffordWealth(merchantWealth, price)) {
      return ui.notifications.warn(game.i18n.localize("ETERN.MERCHANT.ERROR_MERCHANT_NOT_ENOUGH_MONEY"));
    }

    const nextMerchantWealth = subtractWealthValues(merchantWealth, price);
    if (!nextMerchantWealth) {
      return ui.notifications.warn(game.i18n.localize("ETERN.MERCHANT.ERROR_MERCHANT_NOT_ENOUGH_MONEY"));
    }

    const buyerWealth = normalizeWealth(buyerActor.system?.wealth ?? {});
    const nextBuyerWealth = addWealthValues(buyerWealth, price);
    const resalePrice = increaseWealthByPercent(price, 100);
    const merchantItemData = createBuyerItemData(itemDoc, 1);
    merchantItemData.system.location = "stock";
    merchantItemData.system.price = normalizeWealth(resalePrice);

    // Vente : le marchand paie exactement les monnaies du prix, et le personnage les reçoit.
    // Aucune conversion automatique n’est faite pendant la transaction.
    await buyerActor.update({ "system.wealth": nextBuyerWealth }, { render: false });
    await this.document.createEmbeddedDocuments("Item", [merchantItemData], { render: false });
    await this.document.update({ "system.wealth": nextMerchantWealth }, { render: false });
    await decrementOrDeleteItem(itemDoc);

    ui.notifications.info(game.i18n.format("ETERN.MERCHANT.INFO_SOLD", {
      item: itemDoc.name,
      price: formatWealth(price),
      actor: buyerActor.name
    }));
    this.render(false);
  };
}
