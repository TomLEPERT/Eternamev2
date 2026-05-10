/**
 * Module d’action technique acteur : Profession actions.
 *
 * Responsabilités :
 * - isoler les interactions d’interface liées aux techniques d’acteur ;
 * - préparer les données nécessaires aux handlers ApplicationV2 ;
 * - déléguer la logique métier aux services système plutôt que de la dupliquer dans la fiche.
 *
 * Ce fichier doit rester centré sur le comportement UI d’une zone précise de la fiche acteur.
 */

import { createDefaultProfessionItemData } from '../../../system/items/item-factory.js';
import { openAttributeRollDialog } from '../../dialogs/attribute-roll-dialog.js';
import { toggleProfessionProgressBox } from '../../../rules/professions/progress-track.js';

const PROFESSION_ENTRY_SECTION_KEYS = new Set(['passives', 'keys', 'conditions', 'mechanics', 'states']);

export function registerProfessionTechniqueActions(ActorSheetClass) {
  ActorSheetClass.prototype._onCreateProfessionItem = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;
    const [created] = await this.document.createEmbeddedDocuments('Item', [createDefaultProfessionItemData()], { render: false });
    this.render(false);
    created?.sheet?.render(true);
  };

  ActorSheetClass.prototype._onToggleProfessionPassiveActive = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;
    const button = event.currentTarget;
    if (!(button instanceof HTMLElement)) return;

    await updateProfessionEntryFromActorSheet(this, button, ({ entry, arrayKey }) => {
      if (arrayKey !== 'passives') return false;
      entry.isActive = !Boolean(entry.isActive);
      return true;
    });
  };

  ActorSheetClass.prototype._onAdjustProfessionCounter = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;
    const button = event.currentTarget;
    if (!(button instanceof HTMLElement)) return;

    const delta = Math.trunc(Number(button.dataset.delta ?? 0) || 0);
    if (!delta) return;

    await updateProfessionEntryFromActorSheet(this, button, ({ entry }) => {
      entry.counter ??= { enabled: true, label: '', current: 0, max: 0, resetNote: '' };
      entry.counter.enabled = true;

      const current = Math.max(0, Math.floor(Number(entry.counter.current ?? 0) || 0));
      const max = Math.max(0, Math.floor(Number(entry.counter.max ?? 0) || 0));
      const next = Math.max(0, current + delta);
      entry.counter.current = max > 0 ? Math.min(next, max) : next;
      return entry.counter.current !== current;
    });
  };

  ActorSheetClass.prototype._onToggleProfessionProgressBox = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;
    const button = event.currentTarget;
    if (!(button instanceof HTMLElement)) return;

    const boxIndex = Number(button.dataset.boxIndex ?? -1);
    if (!Number.isInteger(boxIndex) || boxIndex < 0) return;

    await updateProfessionEntryFromActorSheet(this, button, ({ entry }) => {
      if (!entry.hasProgressTrack) return false;
      const previous = JSON.stringify(entry.progressTrack ?? {});
      entry.progressTrack = toggleProfessionProgressBox(entry.progressTrack, boxIndex);
      return JSON.stringify(entry.progressTrack) !== previous;
    });
  };

  ActorSheetClass.prototype._onRollProfessionProgressTest = async function(event) {
    event.preventDefault();
    const button = event.currentTarget;
    if (!(button instanceof HTMLElement)) return;

    const attributeKey = String(button.dataset.attributeKey ?? '').trim();
    if (!attributeKey) return;

    await openAttributeRollDialog(this.document, attributeKey);
  };
}

function resolveProfessionEntry(actor, source) {
  const professionId = String(source?.dataset?.itemId ?? '').trim();
  const arrayKey = String(source?.dataset?.arrayKey ?? '').trim();
  const entryId = String(source?.dataset?.entryId ?? '').trim();
  const fallbackIndex = Number(source?.dataset?.entryIndex ?? -1);

  if (!professionId || !PROFESSION_ENTRY_SECTION_KEYS.has(arrayKey)) return null;

  const item = actor.items.get(professionId);
  if (!item || item.type !== 'profession') return null;

  const entries = foundry.utils.deepClone(item.system?.[arrayKey] ?? []);
  if (!Array.isArray(entries)) return null;

  let entryIndex = entryId ? entries.findIndex((entry) => String(entry?.id ?? '') === entryId) : -1;
  if (entryIndex < 0 && fallbackIndex >= 0 && fallbackIndex < entries.length) entryIndex = fallbackIndex;
  if (entryIndex < 0) return null;

  const entry = entries[entryIndex];
  if (!entry) return null;

  return { item, arrayKey, entryIndex, entry, entries };
}

async function updateProfessionEntryFromActorSheet(sheet, source, mutate) {
  const resolved = resolveProfessionEntry(sheet.document, source);
  if (!resolved || typeof mutate !== 'function') return;

  const changed = mutate(resolved);
  if (!changed) return;

  await sheet._updateOwnedItem(resolved.item.id, { [`system.${resolved.arrayKey}`]: resolved.entries }, source);
}
