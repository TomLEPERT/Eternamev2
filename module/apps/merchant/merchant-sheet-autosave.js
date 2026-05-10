/**
 * Extension de fiche marchand : Merchant sheet autosave.
 *
 * Responsabilités :
 * - gérer une section ou un comportement de la fiche marchand ;
 * - préparer les données d’affichage liées au commerce ;
 * - déléguer les calculs de richesse et de transaction aux services dédiés.
 *
 * Ce fichier doit rester un module UI de marchand.
 */

import { registerSheetAutosaveMethods } from '../shared/form-autosave.js';

const shouldSkipMerchantField = (name) => name === 'discountPercent';

export function registerMerchantSheetAutosave(MerchantSheetClass) {
  registerSheetAutosaveMethods(MerchantSheetClass, {
    methodNames: {
      clearPendingSave: '_merchantClearPendingSave',
      queueAutosave: '_merchantQueueAutosave',
      flushAutosave: '_merchantFlushAutosave',
      autosaveField: '_merchantAutosaveField',
      onFieldInput: '_onMerchantFieldInput',
      onFieldChange: '_onMerchantFieldChange',
      onFieldBlur: '_onMerchantFieldBlur'
    },
    shouldSkipField: shouldSkipMerchantField,
    emptyNumberValue: 0
  });
}
