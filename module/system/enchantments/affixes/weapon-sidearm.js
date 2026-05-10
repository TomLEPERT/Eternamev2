/**
 * Affixes spécifiques aux armes de poing.
 *
 * Responsabilités :
 * - déclarer les affixes applicables aux armes de catégorie `sidearm` ;
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

import { defineAffix, itemFixed, itemTable } from "./helpers.js";

export const WEAPON_SIDEARM_AFFIXES = Object.freeze([
  /**
   * Préfixe : Saignante.
   *
   * Applique une contrainte narrative ou mécanique liée à l’état Saignement.
   *
   * Actuellement, aucun effet automatique n’est déclaré.
   * L’effet devra donc être appliqué manuellement ou via une future cible système.
   */
  defineAffix({
    id: "weapon.sidearm.prefix.bleeding-on-hit",
    side: "prefix",
    itemTypes: ["weapon"],
    itemCategories: ["sidearm"],
    tags: ["state", "attack"],
    magicWeight: 4,
    label: {
      fr: "Saignante",
      en: "Bleeding"
    },
    description: {
      fr: "Quand vous attaquez avec cette arme, la cible doit effectuer un test de résistance ROB ou subir l’état saignement pendant {value} tour.",
      en: "When you attack with this weapon, the target must pass a ROB resistance test or suffer bleeding for {value} turn."
    },
    rankValues: [1, 1, 2, 2, 3, 3, 4],
    effects: []
  }),

  /**
   * Préfixe : Traumatique.
   *
   * Rend l’arme capable de provoquer une blessure grave si un seuil de dégâts est atteint.
   *
   * Actuellement, aucun effet automatique n’est déclaré.
   * L’effet sert donc surtout à produire une description d’enchantement.
   */
  defineAffix({
    id: "weapon.sidearm.prefix.grave-wound-threshold",
    side: "prefix",
    itemTypes: ["weapon"],
    itemCategories: ["sidearm"],
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
   * Suffixe : Circulaire.
   *
   * Augmente la portée des attaques de zone réalisées avec cette arme.
   *
   * Effet mécanique :
   * - bonus item sur `zoneRangeMeters`.
   *
   * Cette cible est supportée par `SUPPORTED_ENCHANTMENT_ITEM_TARGETS`.
   */
  defineAffix({
    id: "weapon.sidearm.suffix.zone-range",
    side: "suffix",
    itemTypes: ["weapon"],
    itemCategories: ["sidearm"],
    tags: ["zone", "attack"],
    magicWeight: 4,
    label: {
      fr: "Circulaire",
      en: "Circular"
    },
    description: {
      fr: "Les attaques de zone avec cette arme sont augmentées de {value}.",
      en: "Area attacks with this weapon are increased by {value}."
    },
    rankValues: ["1m", "1m", "1m", "2m", "2m", "2m", "3m"],
    effects: [
      itemTable("zoneRangeMeters", [1, 1, 1, 2, 2, 2, 3])
    ]
  }),

  /**
   * Suffixe : Hémorragique.
   *
   * Renforce l’état Saignement en augmentant le nombre de déclenchements par tour.
   *
   * Actuellement, aucun effet automatique n’est déclaré.
   * L’effet devra être interprété par le MJ ou par une future règle dédiée aux états.
   */
  defineAffix({
    id: "weapon.sidearm.suffix.extra-bleeding",
    side: "suffix",
    itemTypes: ["weapon"],
    itemCategories: ["sidearm"],
    tags: ["state", "damage"],
    magicWeight: 5,
    label: {
      fr: "Hémorragique",
      en: "Hemorrhaging"
    },
    description: {
      fr: "L’état Saignement inflige ses DM {value} fois supplémentaire par tour.",
      en: "Bleeding deals its damage {value} extra time per turn."
    },
    rankValues: [1, 1, 1, 1, 1, 1, 2],
    effects: []
  }),

  /**
   * Suffixe : Légère.
   *
   * Ajoute le tag `light` à l’arme.
   *
   * Attention :
   * `itemFixed("tag.light", 1)` ne sera appliqué que si `tag.light`
   * est ajouté aux cibles d’item supportées par les enchantements.
   *
   * En l’état actuel de tes services, cet effet risque d’être filtré
   * par `isSupportedEnchantmentItemTarget()`.
   */
  defineAffix({
    id: "weapon.sidearm.suffix.light-tag",
    side: "suffix",
    itemTypes: ["weapon"],
    itemCategories: ["sidearm"],
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
  })
]);