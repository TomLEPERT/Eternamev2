/**
 * Dialogue ApplicationV2 : Enchantment dialog.
 *
 * Responsabilités :
 * - construire et piloter une fenêtre d’interaction ponctuelle ;
 * - transformer les choix utilisateur en données exploitables par les services ;
 * - garder la validation métier dans les modules système dédiés.
 *
 * Ce fichier doit rester limité au cycle de vie et aux événements du dialogue.
 */

import { applyCatalystToItem } from '../../system/enchantments/services/catalyst-service.js';
import { renderEnchantmentDialogContent } from '../../system/enchantments/dialog-context.js';
import { localize } from '../../system/i18n/localization.js';
import {
  bindRenderedEnchantmentDialog,
  findDialogForm,
  installEnchantmentDialogDelegates,
  queueDialogBindings
} from './enchantment-dialog/bindings.js';
import { parseEnchantmentFormResult } from './enchantment-dialog/form-state.js';

export async function openEnchantmentDialog(item) {
  installEnchantmentDialogDelegates();
  const content = await renderEnchantmentDialogContent(item);
  queueDialogBindings();

  const result = await foundry.applications.api.DialogV2.wait({
    window: {
      title: localize('ETERN.ENCHANTING.DIALOG.TITLE', { item: item?.name ?? game.i18n.localize('ETERN.ITEM.DEFAULT_ITEM_NAME') })
    },
    position: { width: 980, height: 720 },
    content,
    classes: ['eternamev2', 'enchantment-dialog-app'],
    render: (...args) => {
      bindRenderedEnchantmentDialog(...args);
      requestAnimationFrame(() => bindRenderedEnchantmentDialog(...args));
      setTimeout(() => bindRenderedEnchantmentDialog(...args), 0);
    },
    buttons: [
      {
        action: 'apply',
        label: localize('ETERN.ENCHANTING.DIALOG.APPLY'),
        default: true,
        callback: async (_event, button, dialog) => {
          const form = button?.form ?? findDialogForm(dialog?.element) ?? dialog.element?.querySelector('form');
          const config = parseEnchantmentFormResult(form, item);
          const outcome = await applyCatalystToItem(item, config);
          ui.notifications.info(outcome.message);
          return outcome;
        }
      },
      {
        action: 'cancel',
        label: localize('ETERN.ROLL.DIALOG.CANCEL')
      }
    ]
  });

  if (!result || result.action === 'cancel') return null;
  return result;
}
