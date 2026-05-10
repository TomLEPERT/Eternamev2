/**
 * Document Foundry custom pour les acteurs Etername.
 *
 * Responsabilités :
 * - brancher le cycle de préparation des données du système ;
 * - exposer uniquement les helpers documentaires nécessaires ;
 * - déléguer la logique détaillée aux services de `module/system`.
 *
 * Ce fichier doit rester fin pour éviter de surcharger les classes Document.
 */

import { prepareActorDerivedData } from '../system/actors/derived-data.js';

export class EternameActor extends Actor {
  prepareDerivedData() {
    super.prepareDerivedData();
    prepareActorDerivedData(this);
  }
}
