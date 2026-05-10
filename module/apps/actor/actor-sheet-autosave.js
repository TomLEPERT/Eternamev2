/**
 * Extension de fiche acteur : Actor sheet autosave.
 *
 * Responsabilités :
 * - ajouter à l’ActorSheetV2 les comportements propres à cette section ;
 * - lire ou mettre à jour uniquement les champs nécessaires à l’interface ;
 * - conserver les calculs de règles dans les modules `rules` ou `system`.
 *
 * Ce fichier doit rester un module UI spécialisé et ne pas devenir un service métier.
 */

import { registerSheetAutosaveMethods } from '../shared/form-autosave.js';

export function registerActorSheetAutosave(ActorSheetClass) {
  registerSheetAutosaveMethods(ActorSheetClass, {
    methodNames: {
      clearPendingSave: '_clearPendingSave',
      queueAutosave: '_queueAutosave',
      flushAutosave: '_flushAutosave',
      autosaveField: '_autosaveField',
      onFieldInput: '_onFieldInput',
      onFieldChange: '_onFieldChange',
      onFieldBlur: '_onTextareaBlur'
    },
    emptyNumberValue: 0,
    updateDocument(changes, activeElement = null) {
      return this._updateDocument(changes, activeElement);
    }
  });

  ActorSheetClass.prototype._updateDocument = async function(changes, activeElement = null) {
    this._captureViewState(activeElement);
    await this.document.update(changes, { render: false });
    this._refreshLiveView();
  };

  ActorSheetClass.prototype._setText = function(root, selector, value) {
    if (!root) return;

    const el = root.querySelector(selector);
    if (el) el.textContent = String(value ?? '');
  };

  ActorSheetClass.prototype._setFieldValue = function(root, selector, value) {
    if (!root) return;

    const field = root.querySelector(selector);
    if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement)) return;

    const normalized = String(value ?? '');
    if (field.value !== normalized) field.value = normalized;
  };
}
