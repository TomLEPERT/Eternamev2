/**
 * Module d’action technique acteur : Item actions.
 *
 * Responsabilités :
 * - isoler les interactions d’interface liées aux techniques d’acteur ;
 * - préparer les données nécessaires aux handlers ApplicationV2 ;
 * - déléguer la logique métier aux services système plutôt que de la dupliquer dans la fiche.
 *
 * Ce fichier doit rester centré sur le comportement UI d’une zone précise de la fiche acteur.
 */

import { createDefaultHeritageItemData, createDefaultTechniqueItemData } from '../../../system/items/item-factory.js';
import { openAttributeRollDialog } from '../../dialogs/attribute-roll-dialog.js';
import { openAttackRollDialog } from '../../dialogs/attack-roll-dialog.js';
import { postTechniqueToChat } from '../../../system/techniques/chat-service.js';
import { postHeritageToChat } from '../../../system/heritages/chat-service.js';
import { normalizeHeritageFeatureType } from '../../../system/constants/heritages.js';
import { buildTechniqueAttackProxy, normalizeTechniqueLinkedAttributeKey, normalizeTechniqueUsageType } from '../../../system/techniques/usage-service.js';

function duplicateOwnedItemData(item) {
  const data = item.toObject();
  delete data._id;
  delete data.id;
  data.name = game.i18n.format('ETERN.UI.COPY_OF', { name: item.name });
  return data;
}

export function registerTechniqueItemActions(ActorSheetClass) {
  ActorSheetClass.prototype._onCreateTechniqueItem = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;
    const professionIds = [
      String(this.document.system?.techniques?.professionSlots?.first ?? '').trim(),
      String(this.document.system?.techniques?.professionSlots?.second ?? '').trim()
    ].filter(Boolean);
    const [created] = await this.document.createEmbeddedDocuments('Item', [createDefaultTechniqueItemData(professionIds)], { render: false });
    this.render(false);
    created?.sheet?.render(true);
  };


  ActorSheetClass.prototype._onCreateHeritageItem = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;
    const button = event.currentTarget;
    if (!(button instanceof HTMLElement)) return;
    const heritageType = String(button.dataset.heritageType ?? 'ancestral').trim() === 'cultural' ? 'cultural' : 'ancestral';
    const featureType = String(button.dataset.featureType ?? 'passive').trim() === 'technique' ? 'technique' : 'passive';
    this._captureViewState(button);
    const [created] = await this.document.createEmbeddedDocuments('Item', [createDefaultHeritageItemData(heritageType, featureType)], { render: false });
    if (created && (String(created.system?.heritageType ?? '') !== heritageType || String(created.system?.featureType ?? '') !== featureType)) {
      await created.update({
        'system.heritageType': heritageType,
        'system.featureType': featureType,
        img: featureType === 'technique' ? 'icons/svg/explosion.svg' : 'icons/svg/book.svg'
      }, { render: false });
    }
    this.render(false);
    created?.sheet?.render(true);
  };

  ActorSheetClass.prototype._onDuplicateHeritageItem = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;
    const button = event.currentTarget;
    if (!(button instanceof HTMLElement)) return;
    const itemId = String(button.dataset.itemId ?? '').trim();
    const item = this.document.items.get(itemId);
    if (!item || item.type !== 'heritage') return;
    this._captureViewState(button);
    const [created] = await this.document.createEmbeddedDocuments('Item', [duplicateOwnedItemData(item)], { render: false });
    this.render(false);
    created?.sheet?.render(true);
  };

  ActorSheetClass.prototype._onToggleHeritageActive = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;
    const button = event.currentTarget;
    if (!(button instanceof HTMLElement)) return;
    const itemId = String(button.dataset.itemId ?? '').trim();
    const item = this.document.items.get(itemId);
    if (!item || item.type !== 'heritage') return;
    const nextActive = !Boolean(item.system?.active);
    const changes = { 'system.active': nextActive };

    if (nextActive && normalizeHeritageFeatureType(item.system?.featureType) === 'passive') {
      const passives = foundry.utils.deepClone(Array.isArray(item.system?.passives) ? item.system.passives : []);
      if (passives.length && !passives.some((passive) => Boolean(passive?.isActive))) {
        for (const passive of passives) passive.isActive = true;
        changes['system.passives'] = passives;
      }
    }

    await this._updateOwnedItem(itemId, changes, button);
  };

  ActorSheetClass.prototype._onToggleHeritagePrepared = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;
    const button = event.currentTarget;
    if (!(button instanceof HTMLElement)) return;
    const itemId = String(button.dataset.itemId ?? '').trim();
    const item = this.document.items.get(itemId);
    if (!item || item.type !== 'heritage') return;
    await this._updateOwnedItem(itemId, { 'system.prepared': !Boolean(item.system?.prepared) }, button);
  };


  ActorSheetClass.prototype._onUseHeritageItem = async function(event) {
    event.preventDefault();
    const button = event.currentTarget;
    if (!(button instanceof HTMLElement)) return;
    const itemId = String(button.dataset.itemId ?? '').trim();
    const item = this.document.items.get(itemId);
    if (!item || item.type !== 'heritage') return;

    if (normalizeHeritageFeatureType(item.system?.featureType) === 'technique') {
      const usageType = normalizeTechniqueUsageType(item.system?.usageType ?? 'attack');
      if (usageType === 'ritual') {
        const attributeKey = normalizeTechniqueLinkedAttributeKey(item.system?.linkedAttributeKey ?? 'magic');
        const result = await openAttributeRollDialog(this.document, attributeKey);
        if (!result) return;
        await postTechniqueToChat(this.document, item, { usageType, attributeKey });
        return;
      }

      const result = await openAttackRollDialog(this.document, buildTechniqueAttackProxy(item));
      if (!result) return;
      await postTechniqueToChat(this.document, item, { usageType });
      return;
    }

    await postHeritageToChat(this.document, item);
  };

  ActorSheetClass.prototype._onCreateTechniqueFromProfession = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;
    const professionId = String(event.currentTarget?.dataset?.itemId ?? '').trim();
    if (!professionId || !this.document.items.get(professionId)) return;
    const [created] = await this.document.createEmbeddedDocuments('Item', [createDefaultTechniqueItemData([professionId])], { render: false });
    this.render(false);
    created?.sheet?.render(true);
  };

  ActorSheetClass.prototype._onOpenTechniqueItem = async function(event) {
    event.preventDefault();
    const itemId = String(event.currentTarget?.dataset?.itemId ?? '').trim();
    if (!itemId) return;
    const item = this.document.items.get(itemId);
    if (!item) return;
    item.sheet?.render(true);
  };

  ActorSheetClass.prototype._onDuplicateTechniqueItem = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;
    const button = event.currentTarget;
    if (!(button instanceof HTMLElement)) return;
    const itemId = String(button.dataset.itemId ?? '').trim();
    const item = this.document.items.get(itemId);
    if (!item) return;
    this._captureViewState(button);
    const [created] = await this.document.createEmbeddedDocuments('Item', [duplicateOwnedItemData(item)], { render: false });
    this.render(false);
    created?.sheet?.render(true);
  };

  ActorSheetClass.prototype._onToggleTechniquePrepared = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;
    const button = event.currentTarget;
    if (!(button instanceof HTMLElement)) return;
    const itemId = String(button.dataset.itemId ?? '').trim();
    const item = this.document.items.get(itemId);
    if (!item || item.type !== 'technique') return;
    await this._updateOwnedItem(itemId, { 'system.prepared': !Boolean(item.system?.prepared) }, button);
  };

  ActorSheetClass.prototype._onUseTechniqueItem = async function(event) {
    event.preventDefault();
    const button = event.currentTarget;
    if (!(button instanceof HTMLElement)) return;
    const itemId = String(button.dataset.itemId ?? '').trim();
    const item = this.document.items.get(itemId);
    if (!item || item.type !== 'technique') return;

    const usageType = normalizeTechniqueUsageType(item.system?.usageType ?? 'attack');
    if (usageType === 'ritual') {
      const attributeKey = normalizeTechniqueLinkedAttributeKey(item.system?.linkedAttributeKey ?? 'magic');
      const result = await openAttributeRollDialog(this.document, attributeKey);
      if (!result) return;
      await postTechniqueToChat(this.document, item, { usageType, attributeKey });
      return;
    }

    const result = await openAttackRollDialog(this.document, buildTechniqueAttackProxy(item));
    if (!result) return;
    await postTechniqueToChat(this.document, item, { usageType });
  };
}
