/**
 * Service système d’acteur : Derived data.
 *
 * Responsabilités :
 * - préparer ou normaliser les données acteur du système Etername ;
 * - composer les règles pures issues de `module/rules` ;
 * - séparer les données source des données calculées placées dans `system.derived`.
 *
 * Ce fichier doit rester un service métier et ne pas gérer le DOM.
 */

import { prepareCharacterDerivedData } from './character-derived-data.js';
import { prepareMerchantDerivedData } from './merchant-derived-data.js';

export function prepareActorDerivedData(actor) {
  if (!actor?.system) return;

  if (actor.type === 'merchant') {
    prepareMerchantDerivedData(actor);
    return;
  }

  prepareCharacterDerivedData(actor);
}
