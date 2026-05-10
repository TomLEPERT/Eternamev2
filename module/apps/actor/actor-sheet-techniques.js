/**
 * Extension de fiche acteur : Actor sheet techniques.
 *
 * Responsabilités :
 * - ajouter à l’ActorSheetV2 les comportements propres à cette section ;
 * - lire ou mettre à jour uniquement les champs nécessaires à l’interface ;
 * - conserver les calculs de règles dans les modules `rules` ou `system`.
 *
 * Ce fichier doit rester un module UI spécialisé et ne pas devenir un service métier.
 */

import { registerTechniqueBindings } from './techniques/bindings.js';
import { registerTechniqueFilters } from './techniques/filters.js';
import { registerTechniqueItemActions } from './techniques/item-actions.js';
import { registerProfessionTechniqueActions } from './techniques/profession-actions.js';
import { registerInvocationTechniqueActions } from './techniques/invocation-actions.js';

export function registerActorSheetTechniques(ActorSheetClass) {
  registerTechniqueFilters(ActorSheetClass);
  registerTechniqueItemActions(ActorSheetClass);
  registerProfessionTechniqueActions(ActorSheetClass);
  registerInvocationTechniqueActions(ActorSheetClass);
  registerTechniqueBindings(ActorSheetClass);
}
