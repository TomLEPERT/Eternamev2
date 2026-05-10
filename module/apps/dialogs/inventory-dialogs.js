/**
 * Dialogue ApplicationV2 : Inventory dialogs.
 *
 * Responsabilités :
 * - construire et piloter une fenêtre d’interaction ponctuelle ;
 * - transformer les choix utilisateur en données exploitables par les services ;
 * - garder la validation métier dans les modules système dédiés.
 *
 * Ce fichier doit rester limité au cycle de vie et aux événements du dialogue.
 */

const INVENTORY_WEIGHT_OPTIONS = [
  { value: 0.3, labelKey: "ETERN.INVENTORY.WEIGHT.SMALL" },
  { value: 1, labelKey: "ETERN.INVENTORY.WEIGHT.STANDARD" },
  { value: 2, labelKey: "ETERN.INVENTORY.WEIGHT.BULKY" }
];

const CURRENCY_VALUES = {
  pc: 1,
  pa: 10,
  po: 1000,
  rc: 100000,
  pp: 1000000
};


function getDefaultNameForType(type) {
  const typeKeyMap = {
    consumable: 'ETERN.ITEM.DEFAULT_CONSUMABLE_NAME',
    material: 'ETERN.ITEM.DEFAULT_MATERIAL_NAME',
    bag: 'ETERN.ITEM.DEFAULT_BAG_NAME'
  };

  return game.i18n.localize(typeKeyMap[type] ?? 'ETERN.INVENTORY.DEFAULT_ITEM_NAME');
}

function buildWeightOptions(selected = 1) {
  return INVENTORY_WEIGHT_OPTIONS.map((option) => ({
    value: option.value,
    label: game.i18n.localize(option.labelKey),
    selected: Number(option.value) === Number(selected)
  }));
}

export function getInventoryWeightLabel(value) {
  const num = Number(value ?? 0);
  if (Math.abs(num - 0.3) < 0.001) return "0.3";
  if (Math.abs(num - 1) < 0.001) return "1";
  if (Math.abs(num - 2) < 0.001) return "2";
  return `${num || 0}`;
}

function parseInventoryForm(form) {
  const data = new FormDataExtended(form).object;
  const type = ["gear", "material", "consumable", "object", "tool", "bag"].includes(String(data.type)) ? String(data.type) : "gear";
  const name = String(data.name ?? "").trim() || getDefaultNameForType(type);
  const quantityRaw = Number(data.quantity ?? 1);
  const quantity = Number.isFinite(quantityRaw) ? Math.max(1, Math.floor(quantityRaw)) : 1;
  const weight = Number(data.weight ?? 1);
  const description = String(data.description ?? "");
  const location = ["backpack", "belt"].includes(String(data.location)) ? String(data.location) : "backpack";
  const legality = ["legal", "illegal"].includes(String(data.legality)) ? String(data.legality) : "legal";

  return {
    name,
    type,
    location,
    system: {
      quantity,
      weight,
      legality,
      description
    }
  };
}

export async function openInventoryItemDialog({ actor, item = null, location = "backpack" } = {}) {
  const title = item ? game.i18n.localize("ETERN.INVENTORY.DIALOG.EDIT_TITLE") : game.i18n.localize("ETERN.INVENTORY.DIALOG.CREATE_TITLE");
  const genericTypeChoices = ["gear", "material", "consumable", "bag", "object", "tool"].map((value) => ({
    value,
    label: game.i18n.localize(`ETERN.ITEM.TYPES.${value.toUpperCase()}`),
    selected: value === String(item?.type ?? "gear")
  }));

  const content = await renderTemplate("systems/eternamev2/templates/dialogs/inventory-item-dialog.hbs", {
    item: {
      name: item?.name ?? "",
      type: String(item?.type ?? "gear"),
      quantity: Number(item?.system?.quantity ?? 1),
      description: String(item?.system?.description ?? ""),
      legality: String(item?.system?.legality ?? "legal"),
      location: String(item?.system?.location ?? location)
    },
    typeChoices: genericTypeChoices,
    legalityChoices: [
      { value: 'legal', label: game.i18n.localize('ETERN.ITEM.LEGALITY.LEGAL'), selected: String(item?.system?.legality ?? 'legal') === 'legal' },
      { value: 'illegal', label: game.i18n.localize('ETERN.ITEM.LEGALITY.ILLEGAL'), selected: String(item?.system?.legality ?? 'legal') === 'illegal' }
    ],
    canChangeType: !item,
    weightOptions: buildWeightOptions(Number(item?.system?.weight ?? 1)),
    isBelt: String(item?.system?.location ?? location) === "belt",
    isBackpack: String(item?.system?.location ?? location) !== "belt"
  });

  const result = await foundry.applications.api.DialogV2.wait({
    window: { title },
    content,
    classes: ["eternamev2", "inventory-item-dialog-app"],
    buttons: [
      {
        action: "save",
        label: item ? game.i18n.localize("ETERN.INVENTORY.DIALOG.SAVE") : game.i18n.localize("ETERN.INVENTORY.DIALOG.CREATE"),
        default: true,
        callback: (_event, button, dialog) => {
          const form = button?.form ?? dialog.element?.querySelector("form");
          return parseInventoryForm(form);
        }
      },
      { action: "cancel", label: game.i18n.localize("ETERN.INVENTORY.DIALOG.CANCEL") }
    ]
  });

  if (!result || result === "cancel") return null;
  return result;
}

function buildCurrencyChoices(selected) {
  const labels = {
    pp: game.i18n.localize("ETERN.INVENTORY.CURRENCY.PP"),
    rc: game.i18n.localize("ETERN.INVENTORY.CURRENCY.RC"),
    po: game.i18n.localize("ETERN.INVENTORY.CURRENCY.PO"),
    pa: game.i18n.localize("ETERN.INVENTORY.CURRENCY.PA"),
    pc: game.i18n.localize("ETERN.INVENTORY.CURRENCY.PC")
  };

  return Object.entries(labels).map(([value, label]) => ({ value, label, selected: value === selected }));
}

export async function openWealthConvertDialog(wealth = {}) {
  const content = await renderTemplate("systems/eternamev2/templates/dialogs/wealth-convert-dialog.hbs", {
    giveChoices: buildCurrencyChoices("po"),
    receiveChoices: buildCurrencyChoices("pa"),
    wealth
  });

  const result = await foundry.applications.api.DialogV2.wait({
    window: { title: game.i18n.localize("ETERN.INVENTORY.WEALTH.DIALOG.TITLE") },
    content,
    classes: ["eternamev2", "wealth-convert-dialog-app"],
    buttons: [
      {
        action: "convert",
        label: game.i18n.localize("ETERN.INVENTORY.WEALTH.CONVERT"),
        default: true,
        callback: (_event, button, dialog) => {
          const form = button?.form ?? dialog.element?.querySelector("form");
          const data = new FormDataExtended(form).object;
          return {
            from: String(data.from ?? "po"),
            to: String(data.to ?? "pa"),
            amount: Math.max(0, Math.floor(Number(data.amount ?? 0) || 0))
          };
        }
      },
      { action: "cancel", label: game.i18n.localize("ETERN.INVENTORY.DIALOG.CANCEL") }
    ]
  });

  if (!result || result === "cancel") return null;
  if (result.from === result.to) {
    ui.notifications.warn(game.i18n.localize("ETERN.INVENTORY.WEALTH.ERROR_SAME_CURRENCY"));
    return null;
  }

  const available = Math.max(0, Math.floor(Number(wealth?.[result.from] ?? 0) || 0));
  if (result.amount <= 0 || result.amount > available) {
    ui.notifications.warn(game.i18n.localize("ETERN.INVENTORY.WEALTH.ERROR_INVALID_AMOUNT"));
    return null;
  }

  const giveValue = CURRENCY_VALUES[result.from] ?? 0;
  const receiveValue = CURRENCY_VALUES[result.to] ?? 0;
  if (!giveValue || !receiveValue) return null;

  const baseValue = result.amount * giveValue;
  const receiveAmount = Math.floor(baseValue / receiveValue);
  if (receiveAmount <= 0) {
    ui.notifications.warn(game.i18n.localize("ETERN.INVENTORY.WEALTH.ERROR_ZERO_RESULT"));
    return null;
  }

  return {
    ...result,
    receiveAmount
  };
}
