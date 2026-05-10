/**
 * Utilitaire partagé d’application : Form autosave.
 *
 * Responsabilités :
 * - factoriser un comportement UI réutilisable entre plusieurs fiches ;
 * - rester indépendant d’un type d’acteur ou d’item précis ;
 * - limiter les dépendances aux APIs ApplicationV2 et au DOM.
 *
 * Ce fichier ne doit pas contenir de règles de jeu.
 */

const DEFAULT_AUTOSAVE_DELAY = 180;

export function isAutosaveFieldElement(element) {
  return element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement;
}

export function getAutosaveFieldName(element) {
  return isAutosaveFieldElement(element) ? String(element.getAttribute('name') ?? '').trim() : '';
}

export function normalizeAutosaveFieldValue(element, { emptyNumberValue = 0 } = {}) {
  if (element instanceof HTMLInputElement) {
    if (element.type === 'checkbox') return element.checked;
    if (element.type === 'number' || element.type === 'range') {
      if (element.value === '') return emptyNumberValue;
      const value = Number(element.value);
      return Number.isFinite(value) ? value : emptyNumberValue;
    }
  }

  return element?.value ?? '';
}

export function clearPendingFieldSave(sheet, name) {
  const pending = sheet?._pendingFieldSaves?.get?.(name);
  if (!pending) return;

  clearTimeout(pending.timeoutId);
  sheet._pendingFieldSaves.delete(name);
}

export function queuePendingFieldSave(sheet, element, {
  delay = DEFAULT_AUTOSAVE_DELAY,
  shouldSkipField = () => false,
  persist = null
} = {}) {
  if (!sheet?.document?.isOwner || !isAutosaveFieldElement(element)) return;

  const name = getAutosaveFieldName(element);
  if (!name || shouldSkipField(name, element, sheet)) return;

  clearPendingFieldSave(sheet, name);
  const timeoutId = window.setTimeout(() => {
    sheet._pendingFieldSaves.delete(name);
    void (persist ?? persistAutosaveField)(sheet, element, { shouldSkipField });
  }, delay);

  sheet._pendingFieldSaves.set(name, { timeoutId });
}

export async function flushPendingFieldSave(sheet, element, {
  shouldSkipField = () => false,
  persist = null
} = {}) {
  const name = getAutosaveFieldName(element);
  if (!name || shouldSkipField(name, element, sheet)) return;

  clearPendingFieldSave(sheet, name);
  await (persist ?? persistAutosaveField)(sheet, element, { shouldSkipField });
}

export async function persistAutosaveField(sheet, element, {
  shouldSkipField = () => false,
  emptyNumberValue = 0,
  updateDocument = null
} = {}) {
  if (!sheet?.document?.isOwner || !isAutosaveFieldElement(element)) return;

  const name = getAutosaveFieldName(element);
  if (!name || shouldSkipField(name, element, sheet)) return;

  const next = normalizeAutosaveFieldValue(element, { emptyNumberValue });
  const current = foundry.utils.getProperty(sheet.document, name);
  if (current === next) return;

  const update = updateDocument ?? ((changes) => sheet.document.update(changes, { render: false }));
  await update.call(sheet, { [name]: next }, element);
}

export function bindSheetAutosaveFields(sheet, root, {
  shouldSkipField = () => false,
  shouldQueueInputField = () => true,
  emptyNumberValue = 0,
  updateDocument = null,
  inputDatasetKey = 'boundAutosaveInput',
  changeDatasetKey = 'boundAutosaveChange',
  blurDatasetKey = 'boundAutosaveBlur'
} = {}) {
  if (!root) return;

  const persist = (instance, element) => persistAutosaveField(instance, element, {
    shouldSkipField,
    emptyNumberValue,
    updateDocument
  });

  for (const field of root.querySelectorAll('input[name], select[name], textarea[name]')) {
    if (!isAutosaveFieldElement(field)) continue;
    const name = getAutosaveFieldName(field);
    if (!name || shouldSkipField(name, field, sheet)) continue;

    const canQueueInput = (
      field instanceof HTMLTextAreaElement
      || (field instanceof HTMLInputElement && !['checkbox', 'radio'].includes(field.type))
    );

    if (canQueueInput && shouldQueueInputField(name, field, sheet) && field.dataset[inputDatasetKey] !== '1') {
      field.dataset[inputDatasetKey] = '1';
      field.addEventListener('input', () => {
        queuePendingFieldSave(sheet, field, { shouldSkipField, persist });
      });
    }

    if (field.dataset[changeDatasetKey] !== '1') {
      field.dataset[changeDatasetKey] = '1';
      field.addEventListener('change', () => {
        void flushPendingFieldSave(sheet, field, { shouldSkipField, persist });
      });
    }

    if (canQueueInput && field.dataset[blurDatasetKey] !== '1') {
      field.dataset[blurDatasetKey] = '1';
      field.addEventListener('blur', () => {
        void flushPendingFieldSave(sheet, field, { shouldSkipField, persist });
      });
    }
  }
}

export function registerSheetAutosaveMethods(SheetClass, {
  methodNames = {},
  shouldSkipField = () => false,
  emptyNumberValue = 0,
  updateDocument = null,
  delay = DEFAULT_AUTOSAVE_DELAY
} = {}) {
  const {
    clearPendingSave = '_clearPendingSave',
    queueAutosave = '_queueAutosave',
    flushAutosave = '_flushAutosave',
    autosaveField = '_autosaveField',
    onFieldInput = '_onFieldInput',
    onFieldChange = '_onFieldChange',
    onFieldBlur = '_onFieldBlur'
  } = methodNames;

  SheetClass.prototype[clearPendingSave] = function(name) {
    clearPendingFieldSave(this, name);
  };

  SheetClass.prototype[queueAutosave] = function(element, customDelay = delay) {
    queuePendingFieldSave(this, element, {
      delay: customDelay,
      shouldSkipField,
      persist: (sheet, field) => this[autosaveField](field)
    });
  };

  SheetClass.prototype[flushAutosave] = async function(element) {
    await flushPendingFieldSave(this, element, {
      shouldSkipField,
      persist: (sheet, field) => this[autosaveField](field)
    });
  };

  SheetClass.prototype[autosaveField] = async function(element) {
    await persistAutosaveField(this, element, {
      shouldSkipField,
      emptyNumberValue,
      updateDocument: updateDocument ? ((changes, field) => updateDocument.call(this, changes, field)) : null
    });
  };

  SheetClass.prototype[onFieldInput] = function(event) {
    const element = event.target;
    if (!isAutosaveFieldElement(element)) return;
    if (element instanceof HTMLInputElement && ['checkbox', 'radio'].includes(element.type)) return;

    this[queueAutosave](element);
  };

  SheetClass.prototype[onFieldChange] = async function(event) {
    const element = event.target;
    if (!isAutosaveFieldElement(element)) return;

    await this[flushAutosave](element);
  };

  SheetClass.prototype[onFieldBlur] = async function(event) {
    const element = event.target;
    if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) return;

    await this[flushAutosave](element);
  };
}
