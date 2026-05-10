/**
 * Point d’entrée de préparation des données dérivées des items.
 *
 * Responsabilités :
 * - appliquer les valeurs communes aux items simples ou équipables ;
 * - router chaque type d’item vers son préparateur spécialisé ;
 * - centraliser la liste des préparateurs dérivés disponibles ;
 * - éviter que les documents d’items connaissent les détails de chaque fichier dérivé.
 *
 * Ce fichier doit rester un routeur léger.
 * La logique propre aux armes, armures, métiers, techniques, héritages, invocations,
 * consommables, sacs ou matériaux doit rester dans les fichiers dérivés dédiés.
 */

import { prepareBagData } from "./bag-derived.js";
import { prepareConsumableData } from "./consumable-derived.js";
import {
  prepareArmorData,
  prepareGenericEnchantableItemData,
  prepareShieldData,
  prepareWeaponData
} from "./equipment-derived.js";
import { prepareInvocationData } from "./invocation-derived.js";
import { prepareMaterialData } from "./material-derived.js";
import {
  prepareHeritageData,
  prepareProfessionData,
  prepareTechniqueData
} from "./profession-technique-derived.js";
import { applyCommonItemDefaults } from "./shared-derived.js";

const COMMON_DEFAULT_ITEM_TYPES = new Set([
  "armor",
  "shield",
  "gear",
  "material",
  "object",
  "tool",
  "weapon",
  "consumable",
  "bag"
]);

const ITEM_DERIVED_PREPARERS = {
  armor: prepareArmorData,
  shield: prepareShieldData,
  weapon: prepareWeaponData,

  gear: prepareGenericEnchantableItemData,
  object: prepareGenericEnchantableItemData,
  tool: prepareGenericEnchantableItemData,

  material: prepareMaterialData,
  consumable: prepareConsumableData,
  bag: prepareBagData,

  profession: prepareProfessionData,
  technique: prepareTechniqueData,
  heritage: prepareHeritageData,
  invocation: prepareInvocationData
};

/**
 * Prépare les données dérivées d’un item.
 *
 * La fonction applique d’abord les valeurs communes aux types concernés,
 * puis appelle le préparateur spécialisé correspondant au type de l’item.
 *
 * Les données sont modifiées directement dans `item.system`, comme attendu
 * pendant le cycle de préparation des données Foundry.
 *
 * @param {Item} item - Item dont les données dérivées doivent être préparées.
 * @returns {void}
 */
export function prepareDerivedItemData(item) {
  if (!item) return;

  const system = item.system ?? {};
  const itemType = String(item.type ?? "");

  if (COMMON_DEFAULT_ITEM_TYPES.has(itemType)) {
    applyCommonItemDefaults(system, item);
  }

  const prepare = ITEM_DERIVED_PREPARERS[itemType];

  if (typeof prepare === "function") {
    prepare(item, system);
  }
}