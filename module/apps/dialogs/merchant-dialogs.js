/**
 * Dialogue ApplicationV2 : Merchant dialogs.
 *
 * Responsabilités :
 * - construire et piloter une fenêtre d’interaction ponctuelle ;
 * - transformer les choix utilisateur en données exploitables par les services ;
 * - garder la validation métier dans les modules système dédiés.
 *
 * Ce fichier doit rester limité au cycle de vie et aux événements du dialogue.
 */

import { CURRENCY_ORDER, normalizeWealth } from "../../system/trade/wealth.js";

const { renderTemplate } = foundry.applications.handlebars;

function buildCurrencyRows(price = {}) {
  const normalized = normalizeWealth(price);
  return CURRENCY_ORDER.map((key) => ({
    key,
    label: game.i18n.localize(`ETERN.INVENTORY.CURRENCY.${key.toUpperCase()}`),
    value: normalized[key] ?? 0
  }));
}

function getDialogRoot(...candidates) {
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (candidate instanceof HTMLFormElement) return candidate;
    if (candidate instanceof HTMLElement) return candidate;
    const element = candidate?.element;
    if (element instanceof HTMLElement) return element;
    if (element?.[0] instanceof HTMLElement) return element[0];
    if (typeof element?.querySelector === "function") return element;
  }
  return null;
}

function readPriceForm(event, button, dialog) {
  const buttonElement = button instanceof HTMLElement ? button : event?.currentTarget instanceof HTMLElement ? event.currentTarget : null;
  const root = getDialogRoot(buttonElement?.form, buttonElement?.closest?.("form.merchant-price-dialog"), dialog, event?.target, event?.currentTarget);
  const form = root instanceof HTMLFormElement ? root : root?.querySelector?.("form.merchant-price-dialog");
  if (!(form instanceof HTMLFormElement)) return normalizeWealth({});

  const price = {};
  for (const key of CURRENCY_ORDER) {
    const input = form.querySelector(`[name="price.${key}"]`);
    price[key] = Math.max(0, Math.floor(Number(input?.value ?? 0) || 0));
  }

  return normalizeWealth(price);
}

export async function openMerchantPriceDialog({ title, itemName, price = {} } = {}) {
  const content = await renderTemplate("systems/eternamev2/templates/dialogs/merchant-price-dialog.hbs", {
    itemName: String(itemName ?? ""),
    priceRows: buildCurrencyRows(price)
  });

  const result = await foundry.applications.api.DialogV2.wait({
    window: { title: title || game.i18n.localize("ETERN.MERCHANT.DIALOG.PRICE_TITLE") },
    content,
    classes: ["eternamev2", "merchant-price-dialog-app"],
    buttons: [
      {
        action: "save",
        label: game.i18n.localize("ETERN.MERCHANT.DIALOG.SAVE_PRICE"),
        default: true,
        callback: (event, button, dialog) => readPriceForm(event, button, dialog)
      },
      { action: "cancel", label: game.i18n.localize("ETERN.INVENTORY.DIALOG.CANCEL") }
    ]
  });

  if (!result || result === "cancel") return null;
  return normalizeWealth(result);
}
