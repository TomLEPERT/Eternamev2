/**
 * Sous-module du constructeur de technique : Array entry actions.
 *
 * Responsabilités :
 * - gérer une famille d’actions du builder de technique ;
 * - normaliser les petites mutations de formulaire côté fiche ;
 * - laisser le calcul XP, les résumés et la validation aux services de technique.
 *
 * Ce fichier doit rester un contrôleur UI ciblé.
 */

import { createBuilderEntry, getInputValue, updateArrayEntryCollection, updateBuilderDocument } from './helpers.js';

export function bindTechniqueArrayEntryActions(sheet, root) {
  bindAddArrayEntryButtons(sheet, root);
  bindRemoveArrayEntryButtons(sheet, root);
  bindDuplicateArrayEntryButtons(sheet, root);
  bindMoveArrayEntryButtons(sheet, root);
  bindArrayEntryFields(sheet, root);
}

function bindAddArrayEntryButtons(sheet, root) {
  for (const button of root.querySelectorAll('[data-action="builder-add-entry"]')) {
    if (button.dataset.boundBuilderAdd === '1') continue;
    button.dataset.boundBuilderAdd = '1';
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      const arrayKey = String(button.dataset.arrayKey ?? '').trim();
      if (!arrayKey) return;

      const next = foundry.utils.deepClone(sheet.document.system?.[arrayKey] ?? []);
      const isHeritagePassive = sheet.document?.type === 'heritage' && arrayKey === 'passives';
      next.push(createBuilderEntry({ withActive: button.dataset.entryKind === 'passive', active: isHeritagePassive }));
      await updateBuilderDocument(sheet, { [`system.${arrayKey}`]: next }, button, { renderSheet: true });
    });
  }
}

function bindRemoveArrayEntryButtons(sheet, root) {
  for (const button of root.querySelectorAll('[data-action="builder-remove-entry"]')) {
    if (button.dataset.boundBuilderRemove === '1') continue;
    button.dataset.boundBuilderRemove = '1';
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      await updateArrayEntryCollection(sheet, button, (next, entryIndex) => {
        next.splice(entryIndex, 1);
      });
    });
  }
}

function bindDuplicateArrayEntryButtons(sheet, root) {
  for (const button of root.querySelectorAll('[data-action="builder-duplicate-entry"]')) {
    if (button.dataset.boundBuilderDuplicate === '1') continue;
    button.dataset.boundBuilderDuplicate = '1';
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      await updateArrayEntryCollection(sheet, button, (next, entryIndex) => {
        const source = next[entryIndex];
        if (!source) return;

        const duplicate = foundry.utils.deepClone(source);
        duplicate.id = foundry.utils.randomID();
        next.splice(entryIndex + 1, 0, duplicate);
      });
    });
  }
}

function bindMoveArrayEntryButtons(sheet, root) {
  for (const button of root.querySelectorAll('[data-action="builder-move-entry"]')) {
    if (button.dataset.boundBuilderMove === '1') continue;
    button.dataset.boundBuilderMove = '1';
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      const direction = Number(button.dataset.direction ?? 0);
      if (!Number.isFinite(direction) || direction === 0) return;

      await updateArrayEntryCollection(sheet, button, (next, entryIndex) => {
        const targetIndex = entryIndex + direction;
        if (targetIndex < 0 || targetIndex >= next.length) return;

        const [entry] = next.splice(entryIndex, 1);
        next.splice(targetIndex, 0, entry);
      });
    });
  }
}

function bindArrayEntryFields(sheet, root) {
  for (const field of root.querySelectorAll('[data-builder-field]')) {
    if (field.dataset.boundBuilderField === '1') continue;
    field.dataset.boundBuilderField = '1';

    const handler = async () => {
      const arrayKey = String(field.dataset.arrayKey ?? '').trim();
      const entryIndex = Number(field.dataset.entryIndex ?? -1);
      const entryField = String(field.dataset.entryField ?? '').trim();
      if (!arrayKey || entryIndex < 0 || !entryField) return;

      const next = foundry.utils.deepClone(sheet.document.system?.[arrayKey] ?? []);
      const entry = next[entryIndex];
      if (!entry) return;

      entry[entryField] = getInputValue(field);
      await updateBuilderDocument(sheet, { [`system.${arrayKey}`]: next }, field, { renderSheet: true });
    };

    field.addEventListener('change', handler);
    if (!(field instanceof HTMLInputElement) || field.type !== 'checkbox') field.addEventListener('blur', handler);
  }
}
