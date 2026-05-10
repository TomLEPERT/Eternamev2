/**
 * Préparation des données dérivées des sacs.
 *
 * Responsabilités :
 * - normaliser la capacité de poids du sac ;
 * - appliquer un nom par défaut si le sac n’en possède pas ;
 * - calculer le poids total des objets stockés dans ce sac ;
 * - préparer les labels affichables de charge et de capacité.
 *
 * Ce fichier doit rester dédié aux sacs.
 * Il ne doit pas gérer le déplacement d’objets, le drag and drop,
 * l’inventaire complet ou les règles générales d’encombrement.
 */

import {
  formatBagWeight,
  getBagStoredWeight,
  normalizeBagCapacityWeight
} from "../../constants/bags.js";

/**
 * Prépare les données système d’un item sac.
 *
 * La fonction normalise :
 * - la capacité maximale du sac ;
 * - le nom par défaut ;
 * - le poids actuellement contenu dans le sac ;
 * - les labels de poids pour l’affichage.
 *
 * Le poids contenu est calculé à partir des items de l’acteur parent
 * dont `system.location` vaut `bag` et dont `system.containerId`
 * correspond à l’id du sac.
 *
 * @param {Item} item - Item sac à préparer.
 * @param {object} system - Données système mutables du sac.
 * @returns {void}
 */
export function prepareBagData(item, system) {
  system.capacityWeight = normalizeBagCapacityWeight(system.capacityWeight ?? 0);

  /**
   * Ce champ est vidé pour empêcher qu’un sac soit lui-même considéré
   * comme contenu dans un autre conteneur.
   *
   * Si tu veux autoriser les sacs dans des sacs, supprime cette ligne.
   */
  system.containerId = "";

  if (!String(item.name ?? "").trim()) {
    item.name = game.i18n.localize("ETERN.ITEM.DEFAULT_BAG_NAME");
  }

  const actor = item.parent;
  const storedWeight = getBagStoredWeight(actor, item.id);

  system.derived ??= {};
  system.derived.loadWeight = storedWeight;
  system.derived.loadWeightLabel = formatBagWeight(storedWeight);
  system.derived.capacityWeightLabel = formatBagWeight(system.capacityWeight);
}