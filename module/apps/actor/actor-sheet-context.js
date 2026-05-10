/**
 * Extension de fiche acteur : Actor sheet context.
 *
 * Responsabilités :
 * - ajouter à l’ActorSheetV2 les comportements propres à cette section ;
 * - lire ou mettre à jour uniquement les champs nécessaires à l’interface ;
 * - conserver les calculs de règles dans les modules `rules` ou `system`.
 *
 * Ce fichier doit rester un module UI spécialisé et ne pas devenir un service métier.
 */

import { buildCharacterCoreContext } from './actor-sheet-context-core.js';
import { buildCharacterTechniqueContext } from './actor-sheet-context-techniques.js';
import { buildCharacterAttackContext } from './actor-sheet-context-attacks.js';

export function prepareCharacterSheetContext(context, options = {}) {
  return {
    ...context,
    ...buildCharacterCoreContext(this.document, options),
    ...buildCharacterTechniqueContext(this.document, options),
    ...buildCharacterAttackContext(this.document, options)
  };
}
