/**
 * Module d’action technique acteur : Invocation actions.
 *
 * Responsabilités :
 * - isoler les interactions d’interface liées aux techniques d’acteur ;
 * - préparer les données nécessaires aux handlers ApplicationV2 ;
 * - déléguer la logique métier aux services système plutôt que de la dupliquer dans la fiche.
 *
 * Ce fichier doit rester centré sur le comportement UI d’une zone précise de la fiche acteur.
 */

import { createDefaultInvocationItemData } from '../../../system/items/item-factory.js';
import { createOrSyncInvocationActor, getLinkedInvocationActor, syncInvocationActorFromProfile } from '../../../system/techniques/invocation-actor-service.js';

export function registerInvocationTechniqueActions(ActorSheetClass) {
  ActorSheetClass.prototype._onCreateInvocationItem = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;
    const [created] = await this.document.createEmbeddedDocuments('Item', [createDefaultInvocationItemData()], { render: false });
    this.render(false);
    created?.sheet?.render(true);
  };

  ActorSheetClass.prototype._onCreateInvocationActor = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;
    const button = event.currentTarget;
    if (!(button instanceof HTMLElement)) return;
    const itemId = String(button.dataset.itemId ?? '').trim();
    const item = this.document.items.get(itemId);
    if (!item || item.type !== 'invocation') return;
    const actor = await createOrSyncInvocationActor(this.document, item);
    actor?.sheet?.render(true);
    this.render(false);
  };

  ActorSheetClass.prototype._onSyncInvocationActor = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;
    const button = event.currentTarget;
    if (!(button instanceof HTMLElement)) return;
    const itemId = String(button.dataset.itemId ?? '').trim();
    const item = this.document.items.get(itemId);
    if (!item || item.type !== 'invocation') return;
    const linkedActor = getLinkedInvocationActor(item);
    if (!linkedActor) {
      ui.notifications?.warn?.(game.i18n.localize('ETERN.INVOCATION.ACTOR.MISSING'));
      return;
    }
    await syncInvocationActorFromProfile(linkedActor, this.document, item);
    linkedActor.sheet?.render(false);
    this.render(false);
  };

  ActorSheetClass.prototype._onOpenInvocationActor = async function(event) {
    event.preventDefault();
    const button = event.currentTarget;
    if (!(button instanceof HTMLElement)) return;
    const itemId = String(button.dataset.itemId ?? '').trim();
    const item = this.document.items.get(itemId);
    if (!item || item.type !== 'invocation') return;
    const linkedActor = getLinkedInvocationActor(item);
    if (!linkedActor) {
      ui.notifications?.warn?.(game.i18n.localize('ETERN.INVOCATION.ACTOR.MISSING'));
      return;
    }
    linkedActor.sheet?.render(true);
  };
}
