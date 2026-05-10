/**
 * Extension de fiche marchand : Merchant sheet context.
 *
 * Responsabilités :
 * - gérer une section ou un comportement de la fiche marchand ;
 * - préparer les données d’affichage liées au commerce ;
 * - déléguer les calculs de richesse et de transaction aux services dédiés.
 *
 * Ce fichier doit rester un module UI de marchand.
 */

import { CURRENCY_ORDER, discountWealthByPercent, formatWealth, normalizeWealth } from "../../system/trade/wealth.js";

const MERCHANT_ITEM_TYPES = ["weapon", "armor", "shield", "gear", "object", "tool", "material", "consumable", "bag"];

function buildAcceptedTypeChoices(trade = {}) {
  const acceptedTypes = trade?.acceptedTypes ?? {};
  return MERCHANT_ITEM_TYPES.map((type) => ({
    type,
    checked: Boolean(acceptedTypes?.[type] ?? true),
    label: game.i18n.localize(`ETERN.ITEM.TYPES.${type.toUpperCase()}`)
  }));
}

function resolveTradeActor() {
  if (game.user?.character?.type === "character") return game.user.character;
  const controlled = canvas?.tokens?.controlled?.find((token) => token.actor?.type === "character")?.actor;
  return controlled ?? null;
}

export function prepareMerchantSheetContext(context, options = {}) {
  const tradeActor = resolveTradeActor();
  const discountPercent = Math.max(0, Math.min(100, Number(this._sessionDiscountPercent ?? 0) || 0));
  const trade = this.document.system?.trade ?? {};
  const wealth = normalizeWealth(this.document.system?.wealth ?? {});
  const stock = this.document.items.contents
    .filter((item) => MERCHANT_ITEM_TYPES.includes(String(item.type ?? "")))
    .filter((item) => String(item.system?.location ?? 'stock') === 'stock')
    .sort((left, right) => String(left.name ?? "").localeCompare(String(right.name ?? ""), game.i18n.lang, { sensitivity: "base" }))
    .map((item) => {
      const basePrice = normalizeWealth(item.system?.price ?? {});
      const discountedPrice = discountWealthByPercent(basePrice, discountPercent);
      return {
        id: item.id,
        name: item.name,
        img: item.img,
        type: item.type,
        typeLabel: game.i18n.localize(`ETERN.ITEM.TYPES.${String(item.type).toUpperCase()}`),
        quantity: Math.max(1, Math.floor(Number(item.system?.quantity ?? 1) || 1)),
        legality: String(item.system?.legality ?? "legal"),
        legalityLabel: game.i18n.localize(`ETERN.ITEM.LEGALITY.${String(item.system?.legality ?? 'legal').toUpperCase()}`),
        description: String(item.system?.description ?? ""),
        basePriceLabel: formatWealth(basePrice),
        discountedPriceLabel: formatWealth(discountedPrice),
        hasDiscount: discountPercent > 0
      };
    });

  context.system = this.document.system;
  context.isGM = game.user.isGM;
  context.isOwner = this.document.isOwner;
  context.stock = stock;
  context.tradeActor = tradeActor;
  context.tradeActorName = tradeActor?.name ?? "";
  context.canTrade = Boolean(tradeActor?.isOwner);
  context.merchantCanUpdate = this.document.canUserModify(game.user, "update");
  context.discountPercent = discountPercent;
  context.wealth = {
    stock: wealth,
    stockLabel: formatWealth(wealth),
    currencies: CURRENCY_ORDER.map((key) => ({
      key,
      label: game.i18n.localize(`ETERN.INVENTORY.CURRENCY.${key.toUpperCase()}`),
      value: wealth[key] ?? 0
    }))
  };
  context.acceptedTypeChoices = buildAcceptedTypeChoices(trade);
  context.acceptsLegal = Boolean(trade?.acceptsLegal ?? true);
  context.acceptsIllegal = Boolean(trade?.acceptsIllegal ?? false);
  context.hasIllegalTrading = context.acceptsIllegal;
  return context;
}
