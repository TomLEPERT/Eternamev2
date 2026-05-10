/**
 * Document Foundry custom pour les items Etername.
 *
 * Responsabilités :
 * - brancher le cycle de préparation des données du système ;
 * - exposer uniquement les helpers documentaires nécessaires ;
 * - déléguer la logique détaillée aux services de `module/system`.
 *
 * Ce fichier doit rester fin pour éviter de surcharger les classes Document.
 */

import { prepareDerivedItemData } from "../system/items/item-derived.js";

export class EternameItem extends Item {
  prepareDerivedData() {
    super.prepareDerivedData();
    prepareDerivedItemData(this);
  }

  get defenseValue() {
    const raw = Number(this.system?.defBonus ?? this.system?.defense ?? 0);
    return Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : 0;
  }

  get isEquipped() {
    return Boolean(this.system?.equipped);
  }
}
