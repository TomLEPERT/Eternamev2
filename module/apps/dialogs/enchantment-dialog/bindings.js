/**
 * Sous-module du dialogue d’enchantement : Bindings.
 *
 * Responsabilités :
 * - isoler une partie du comportement DOM ou formulaire du dialogue ;
 * - garder le dialogue principal lisible ;
 * - éviter de dupliquer la logique de sélection et de validation d’enchantement.
 *
 * Ce fichier ne doit pas contenir de règles d’enchantement lourdes.
 */

import { findDialogForm, getDialogFormCandidates, getEventDialogForm, getEventElement, isFormElement, isInputElement, isSelectElement } from './dom-utils.js';
import { syncDialogPreview, syncDialogPreviewFromEvent } from './form-state.js';

let delegatesInstalled = false;
let hooksInstalled = false;
let scannerId = null;

export function installEnchantmentDialogDelegates() {
  exposeEnchantmentDialogApi();
  if (!delegatesInstalled) {
    delegatesInstalled = true;

    const handleFieldUpdate = (event) => {
      const form = getEventDialogForm(event);
      if (!form) return;

      const target = getEventElement(event);
      if (!(isSelectElement(target) || isInputElement(target))) return;
      syncDialogPreview(form);
    };

    document.addEventListener('change', handleFieldUpdate, true);
    document.addEventListener('input', handleFieldUpdate, true);
  }

  if (!hooksInstalled && globalThis.Hooks?.on) {
    hooksInstalled = true;
    Hooks.on('renderDialogV2', (...args) => bindRenderedEnchantmentDialog(...args));
    Hooks.on('renderApplicationV2', (...args) => bindRenderedEnchantmentDialog(...args));
  }

  if (!scannerId) {
    scannerId = window.setInterval(() => {
      const forms = Array.from(document.querySelectorAll('.enchantment-dialog-form'));
      if (!forms.length) return;
      for (const form of forms) bindDialogForm(form);
    }, 250);
  }
}

export function bindRenderedEnchantmentDialog(...args) {
  for (const candidate of args) {
    const element = candidate?.element ?? candidate;
    const form = findDialogForm(element);
    if (form) return bindDialogForm(form);
  }

  for (const form of getDialogFormCandidates()) bindDialogForm(form);
}

export function bindDialogForm(form) {
  if (!isFormElement(form)) return;

  if (form.dataset.enchantmentDialogBound !== '1') {
    form.dataset.enchantmentDialogBound = '1';

    const update = () => syncDialogPreview(form);
    for (const field of form.querySelectorAll('select[name], input[name]')) {
      field.addEventListener('change', update);
      field.addEventListener('input', update);
    }
  }

  syncDialogPreview(form);
}

export function queueDialogBindings() {
  const bind = () => {
    for (const form of getDialogFormCandidates()) bindDialogForm(form);
  };

  requestAnimationFrame(bind);
  setTimeout(bind, 0);
  setTimeout(bind, 50);
  setTimeout(bind, 150);
  setTimeout(bind, 300);
  setTimeout(bind, 600);
  setTimeout(bind, 1000);
}

export { findDialogForm };

function exposeEnchantmentDialogApi() {
  globalThis.EternameEnchantmentDialog = {
    ...(globalThis.EternameEnchantmentDialog ?? {}),
    sync: syncDialogPreview,
    syncFromEvent: syncDialogPreviewFromEvent
  };
}
