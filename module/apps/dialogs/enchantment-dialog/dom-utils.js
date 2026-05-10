/**
 * Sous-module du dialogue d’enchantement : Dom utils.
 *
 * Responsabilités :
 * - isoler une partie du comportement DOM ou formulaire du dialogue ;
 * - garder le dialogue principal lisible ;
 * - éviter de dupliquer la logique de sélection et de validation d’enchantement.
 *
 * Ce fichier ne doit pas contenir de règles d’enchantement lourdes.
 */

export function isElement(value) {
  return Boolean(value && typeof value === 'object' && typeof value.querySelector === 'function');
}

export function hasTagName(value, tagName) {
  return String(value?.tagName ?? '').toUpperCase() === tagName;
}

export function isFormElement(value) {
  return hasTagName(value, 'FORM') && typeof value.querySelector === 'function';
}

export function isInputElement(value) {
  return hasTagName(value, 'INPUT');
}

export function isSelectElement(value) {
  return hasTagName(value, 'SELECT');
}

export function findClosestElement(target, selector) {
  return typeof target?.closest === 'function' ? target.closest(selector) : null;
}

export function getEventPath(event) {
  if (typeof event?.composedPath === 'function') return event.composedPath();
  const path = [];
  let node = event?.target ?? null;
  while (node) {
    path.push(node);
    node = node.parentNode ?? node.host ?? null;
  }
  return path;
}

export function getEventElement(event, selector = '') {
  for (const entry of getEventPath(event)) {
    if (!entry || typeof entry !== 'object') continue;
    if (selector) {
      if (typeof entry.matches === 'function' && entry.matches(selector)) return entry;
      if (typeof entry.closest === 'function') {
        const closest = entry.closest(selector);
        if (closest) return closest;
      }
    } else if (isElement(entry) || hasTagName(entry, 'SELECT') || hasTagName(entry, 'INPUT')) {
      return entry;
    }
  }
  return null;
}

export function getEventDialogForm(event) {
  const form = getEventElement(event, '.enchantment-dialog-form');
  return isFormElement(form) ? form : null;
}

export function findDialogForm(dialogElement) {
  if (!isElement(dialogElement)) return null;
  return dialogElement.querySelector?.('.enchantment-dialog-form') ?? null;
}

export function getDialogFormCandidates() {
  return Array.from(document.querySelectorAll('.enchantment-dialog-form'))
    .filter((form) => isFormElement(form));
}
