/**
 * Affixes spécifiques aux armes de bois.
 *
 * Responsabilités :
 * - déclarer les affixes applicables aux armes de catégorie `wooden` ;
 * - séparer les affixes par côté : préfixe ou suffixe ;
 * - fournir les labels et descriptions localisés ;
 * - définir les valeurs par rang via `rankValues` ;
 * - déclarer les effets mécaniques quand ils sont supportés par le système.
 *
 * Ce fichier ne doit contenir que des définitions d’affixes.
 * Il ne doit pas générer les enchantements, appliquer les bonus,
 * modifier les items ou gérer l’interface.
 */

import { defineAffix, actorRank, itemFixed } from "./helpers.js";

export const WEAPON_WOODEN_AFFIXES = Object.freeze([
  /**
   * Préfixe : De retenue.
   *
   * Donne des dés supplémentaires lors d’une attaque non létale.
   *
   * Actuellement, aucun effet mécanique n’est appliqué automatiquement.
   * L’effet est donc seulement descriptif, sauf si tu ajoutes une cible système dédiée.
   */
  defineAffix({
    id: "weapon.wooden.prefix.non-lethal-dice",
    side: "prefix",
    itemTypes: ["weapon"],
    itemCategories: ["wooden"],
    tags: ["attack"],
    magicWeight: 2,
    label: {
      fr: "De retenue",
      en: "Tempering"
    },
    description: {
      fr: "Vous obtenez {value} dés supplémentaires lors d’une attaque non létale.",
      en: "You gain {value} extra dice on a non-lethal attack."
    },
    rankValues: [1, 1, 1, 2, 2, 2, 3],
    effects: []
  }),

  /**
   * Suffixe : De l’éclaireur.
   *
   * Accorde un bonus à la valeur d’Instinct du porteur.
   *
   * Effet mécanique :
   * - bonus acteur sur `attributesValue.instinct`.
   */
  defineAffix({
    id: "weapon.wooden.suffix.instinct",
    side: "suffix",
    itemTypes: ["weapon"],
    itemCategories: ["wooden"],
    tags: ["attribute"],
    magicWeight: 4,
    label: {
      fr: "De l’éclaireur",
      en: "Pathfinder’s"
    },
    description: {
      fr: "Vous obtenez un bonus de {value} INS.",
      en: "You gain a {value} INS bonus."
    },
    rankValues: [1, 1, 1, 2, 2, 2, 3],
    effects: [
      actorRank("attributesValue.instinct")
    ]
  }),

  /**
   * Suffixe : Du guet.
   *
   * Augmente la zone de contrôle du porteur.
   *
   * Actuellement, aucun effet mécanique n’est appliqué automatiquement.
   * Si tu veux rendre cet effet actif, il faudra ajouter une cible supportée,
   * par exemple `combat.controlZone` ou `zoneControl`, selon ta nomenclature.
   */
  defineAffix({
    id: "weapon.wooden.suffix.control-zone",
    side: "suffix",
    itemTypes: ["weapon"],
    itemCategories: ["wooden"],
    tags: ["zone", "attack"],
    magicWeight: 4,
    label: {
      fr: "Du guet",
      en: "Wardening"
    },
    description: {
      fr: "Votre zone de contrôle augmente de {value}.",
      en: "Your control zone increases by {value}."
    },
    rankValues: ["1m", "1m", "1m", "2m", "2m", "2m", "3m"],
    effects: []
  }),

  /**
   * Suffixe : Légère.
   *
   * Ajoute le tag `light` à l’arme.
   *
   * Attention :
   * `itemFixed("tag.light", 1)` ne sera appliqué que si `tag.light`
   * est ajouté aux cibles supportées par les enchantements d’item.
   *
   * En l’état actuel de tes services, cet effet risque d’être ignoré.
   */
  defineAffix({
    id: "weapon.wooden.suffix.light-tag",
    side: "suffix",
    itemTypes: ["weapon"],
    itemCategories: ["wooden"],
    tags: ["meta"],
    magicWeight: 2,
    label: {
      fr: "Légère",
      en: "Light"
    },
    description: {
      fr: "L’arme obtient le tag Légère.",
      en: "The weapon gains the Light tag."
    },
    rankValues: [1, 1, 1, 1, 1, 1, 1],
    effects: [
      itemFixed("tag.light", 1)
    ]
  }),

  /**
   * Suffixe : Du duelliste.
   *
   * Améliore la sauvegarde de parade du porteur.
   *
   * Effet mécanique :
   * - bonus acteur sur `saves.parry`.
   */
  defineAffix({
    id: "weapon.wooden.suffix.parry-save",
    side: "suffix",
    itemTypes: ["weapon"],
    itemCategories: ["wooden"],
    tags: ["defense", "save"],
    magicWeight: 4,
    label: {
      fr: "Du duelliste",
      en: "Duelist’s"
    },
    description: {
      fr: "Votre sauvegarde de parade est améliorée de {value}.",
      en: "Your parry save is improved by {value}."
    },
    rankValues: [1, 1, 2, 2, 3, 3, 4],
    effects: [
      actorRank("saves.parry")
    ]
  })
]);