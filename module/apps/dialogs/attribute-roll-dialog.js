/**
 * Dialogue ApplicationV2 : Attribute roll dialog.
 *
 * Responsabilités :
 * - construire et piloter une fenêtre d’interaction ponctuelle ;
 * - transformer les choix utilisateur en données exploitables par les services ;
 * - garder la validation métier dans les modules système dédiés.
 *
 * Ce fichier doit rester limité au cycle de vie et aux événements du dialogue.
 */

import { targetToIndexString } from "../../rules/derived/attributes.js";
import { buildAttributeRollData, executeAttributeRoll } from "../../system/rolls/attribute-roll.js";
import { getRollModeChoices, ROLL_MODES } from "../../system/rolls/modifiers.js";

export async function openAttributeRollDialog(actor, attributeKey) {
  const rollData = buildAttributeRollData(actor, attributeKey, { mode: ROLL_MODES.NORMAL });
  if (!rollData) return null;

  const modeChoices = getRollModeChoices().map((choice) => ({
    ...choice,
    selected: choice.value === ROLL_MODES.NORMAL
  }));

  const content = await foundry.applications.handlebars.renderTemplate("systems/eternamev2/templates/dialogs/attribute-roll-dialog.hbs", {
    attribute: rollData.attribute,
    diceCount: rollData.diceCount,
    baseTargetLabel: targetToIndexString(rollData.threshold.baseTarget),
    modeChoices
  });

  const result = await foundry.applications.api.DialogV2.wait({
    window: {
      title: game.i18n.format("ETERN.ROLL.DIALOG.TITLE", { attribute: rollData.attribute.label })
    },
    content,
    classes: ["eternamev2", "attribute-roll-dialog-app"],
    buttons: [
      {
        action: "roll",
        label: game.i18n.localize("ETERN.ROLL.DIALOG.ROLL"),
        default: true,
        callback: (_event, button, dialog) => {
          const form = button?.form ?? dialog.element?.querySelector("form");
          const formData = new foundry.applications.ux.FormDataExtended(form).object;
          return formData.mode ?? ROLL_MODES.NORMAL;
        }
      },
      {
        action: "cancel",
        label: game.i18n.localize("ETERN.ROLL.DIALOG.CANCEL")
      }
    ]
  });

  if (!result || result === "cancel") return null;
  return executeAttributeRoll(actor, attributeKey, { mode: result });
}
