/**
 * Dialogue ApplicationV2 : Attack roll dialog.
 *
 * Responsabilités :
 * - construire et piloter une fenêtre d’interaction ponctuelle ;
 * - transformer les choix utilisateur en données exploitables par les services ;
 * - garder la validation métier dans les modules système dédiés.
 *
 * Ce fichier doit rester limité au cycle de vie et aux événements du dialogue.
 */

import { getRollModeChoices, ROLL_MODES } from "../../system/rolls/modifiers.js";
import { ATTACK_DEF_COMPARISONS, buildAttackRollData, executeAttackRoll, getAttackAttributeChoices, getAttackDefenseChoices } from "../../system/rolls/attack-roll.js";

export async function openAttackRollDialog(actor, attack) {
  const defaults = buildAttackRollData(actor, attack, {
    attributeKey: 'strength',
    mode: ROLL_MODES.NORMAL,
    vsDefense: ATTACK_DEF_COMPARISONS.EQUAL
  });
  if (!defaults) return null;

  const content = await foundry.applications.handlebars.renderTemplate('systems/eternamev2/templates/dialogs/attack-roll-dialog.hbs', {
    attackName: attack?.name ?? game.i18n.localize('ETERN.ATTACKS.TITLE'),
    damageLabel: attack?.damage ?? '',
    precision: defaults.precision,
    diceCount: defaults.diceCount,
    attributeChoices: getAttackAttributeChoices(defaults.attribute.key),
    modeChoices: getRollModeChoices().map((choice) => ({ ...choice, selected: choice.value === ROLL_MODES.NORMAL })),
    defenseChoices: getAttackDefenseChoices(ATTACK_DEF_COMPARISONS.EQUAL)
  });

  const result = await foundry.applications.api.DialogV2.wait({
    window: { title: game.i18n.localize('ETERN.ATTACKS.ROLL_DIALOG.TITLE') },
    content,
    classes: ['eternamev2', 'attribute-roll-dialog-app'],
    buttons: [{
      action: 'roll',
      label: game.i18n.localize('ETERN.ROLL.DIALOG.ROLL'),
      default: true,
      callback: (_event, button, dialog) => {
        const form = button?.form ?? dialog.element?.querySelector('form');
        return new foundry.applications.ux.FormDataExtended(form).object;
      }
    }, { action: 'cancel', label: game.i18n.localize('ETERN.ROLL.DIALOG.CANCEL') }]
  });

  if (!result || result === 'cancel') return null;
  return executeAttackRoll(actor, attack, {
    attributeKey: result.attributeKey,
    diceCount: Number(result.diceCount ?? defaults.diceCount),
    mode: result.mode ?? ROLL_MODES.NORMAL,
    vsDefense: result.vsDefense ?? ATTACK_DEF_COMPARISONS.EQUAL
  });
}
