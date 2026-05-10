/**
 * Affixes spécifiques aux armes mécaniques.
 *
 * Responsabilités :
 * - déclarer les affixes applicables aux armes de catégorie `mechanical` ;
 * - définir leur côté d’application : préfixe ou suffixe ;
 * - fournir leurs tags de filtrage ;
 * - définir leur poids magique ;
 * - fournir leurs labels et descriptions localisés ;
 * - définir leurs valeurs par rang ;
 * - déclarer les effets mécaniques quand ils sont supportés par le système.
 *
 * Ce fichier ne doit contenir que des définitions d’affixes.
 * Il ne doit pas générer les enchantements, appliquer les bonus,
 * modifier les items ou gérer l’interface.
 */

import { defineAffix, actorRank, itemTable } from "./helpers.js";

export const WEAPON_MECHANICAL_AFFIXES = Object.freeze([
  /**
   * Préfixe : Traumatique.
   *
   * Permet de provoquer une blessure grave si l’attaque atteint
   * un seuil de dégâts donné.
   *
   * Actuellement, aucun effet automatique n’est déclaré.
   * L’effet est donc descriptif et doit être appliqué par la règle de combat
   * ou interprété par le MJ.
   */
  defineAffix({
    id: "weapon.mechanical.prefix.grave-wound-threshold",
    side: "prefix",
    itemTypes: ["weapon"],
    itemCategories: ["mechanical"],
    tags: ["state", "attack"],
    magicWeight: 5,
    label: {
      fr: "Traumatique",
      en: "Traumatic"
    },
    description: {
      fr: "Quand vous attaquez avec cette arme et infligez au moins {value} DM, la cible doit effectuer un test de résistance ROB ou subir une blessure grave.",
      en: "When you attack with this weapon and deal at least {value} damage, the target must pass a ROB resistance test or suffer a grave wound."
    },
    rankValues: [8, 8, 7, 7, 6, 6, 5],
    effects: []
  }),

  /**
   * Préfixe : De longue portée.
   *
   * Augmente la portée de l’arme.
   *
   * Effet mécanique :
   * - bonus item sur `rangeMeters`.
   *
   * Cette cible est supportée par les enchantements d’item.
   */
  defineAffix({
    id: "weapon.mechanical.prefix.range",
    side: "prefix",
    itemTypes: ["weapon"],
    itemCategories: ["mechanical"],
    tags: ["attack"],
    magicWeight: 2,
    label: {
      fr: "De longue portée",
      en: "Long-range"
    },
    description: {
      fr: "L’arme obtient un bonus de {value} Portée.",
      en: "The weapon gains {value} Range."
    },
    rankValues: ["3m", "3m", "6m", "6m", "9m", "9m", "12m"],
    effects: [
      itemTable("rangeMeters", [3, 3, 6, 6, 9, 9, 12])
    ]
  }),

  /**
   * Suffixe : Du tireur.
   *
   * Accorde un bonus d’Agilité au porteur.
   *
   * Effet mécanique :
   * - bonus acteur sur `attributesValue.agility`.
   */
  defineAffix({
    id: "weapon.mechanical.suffix.agility",
    side: "suffix",
    itemTypes: ["weapon"],
    itemCategories: ["mechanical"],
    tags: ["attribute"],
    magicWeight: 4,
    label: {
      fr: "Du tireur",
      en: "Sharpshooter’s"
    },
    description: {
      fr: "Vous obtenez un bonus de {value} AGI.",
      en: "You gain a {value} AGI bonus."
    },
    rankValues: [1, 1, 1, 2, 2, 2, 3],
    effects: [
      actorRank("attributesValue.agility")
    ]
  }),

  /**
   * Suffixe : Perçante.
   *
   * Renforce l’état Saignement en augmentant le nombre de déclenchements
   * supplémentaires par tour.
   *
   * Actuellement, aucun effet automatique n’est déclaré.
   * L’effet reste donc descriptif tant qu’aucune cible dédiée aux états
   * n’existe dans le système d’enchantement.
   */
  defineAffix({
    id: "weapon.mechanical.suffix.extra-bleeding",
    side: "suffix",
    itemTypes: ["weapon"],
    itemCategories: ["mechanical"],
    tags: ["state", "damage"],
    magicWeight: 5,
    label: {
      fr: "Perçante",
      en: "Piercing"
    },
    description: {
      fr: "L’état Saignement inflige ses DM {value} fois supplémentaire par tour.",
      en: "Bleeding deals its damage {value} extra time per turn."
    },
    rankValues: [1, 1, 1, 1, 2, 2, 2],
    effects: []
  }),

  /**
   * Suffixe : Fluide.
   *
   * Rend le rechargement plus simple en le transformant en action
   * d’utilisation d’objet.
   *
   * Actuellement, aucun effet automatique n’est déclaré.
   * L’effet est donc descriptif, sauf si tu ajoutes plus tard une cible dédiée
   * au rechargement ou aux tags d’arme.
   */
  defineAffix({
    id: "weapon.mechanical.suffix.reload-object-action",
    side: "suffix",
    itemTypes: ["weapon"],
    itemCategories: ["mechanical"],
    tags: ["meta"],
    magicWeight: 5,
    label: {
      fr: "Fluide",
      en: "Fluid"
    },
    description: {
      fr: "Recharger l’arme devient une action d’utilisation d’objet.",
      en: "Reloading the weapon becomes a use object action."
    },
    rankValues: ["-", "-", "-", "-", 1, 1, 1],
    effects: []
  })
]);