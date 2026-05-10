/**
 * Affixes communs aux armes.
 *
 * Responsabilités :
 * - déclarer les affixes génériques applicables aux items de type `weapon` ;
 * - définir les affixes de préfixe et de suffixe ;
 * - fournir les labels et descriptions localisés ;
 * - définir les valeurs par rang ;
 * - déclarer les effets mécaniques associés quand ils existent.
 *
 * Ce fichier ne doit contenir que des définitions d’affixes.
 * Il ne doit pas appliquer les bonus, générer les enchantements
 * ou modifier directement les items.
 */

import {
  defineAffix,
  actorRank,
  itemRank,
  itemTable,
  specialFlag,
  specialRank,
  specialTable,
  summonRank,
  summonTable
} from "./helpers.js";

/**
 * Liste des affixes communs aux armes.
 *
 * Chaque entrée est construite avec `defineAffix()` afin de garantir
 * une structure stable pour le registre d’enchantement.
 */
export const WEAPON_COMMON_AFFIXES = Object.freeze([
  /**
   * Préfixe : Précise.
   *
   * Améliore la PRC du porteur lors des attaques avec l’arme.
   */
  defineAffix({
    id: "weapon.prefix.prc",
    side: "prefix",
    itemTypes: ["weapon"],
    tags: ["attack"],
    magicWeight: 1,
    label: { fr: "Précise", en: "Accurate" },
    description: { fr: "L’arme obtient un bonus de {value} PRC.", en: "The weapon gains a {value} PRC bonus." },
    rankValues: [1, 1, 2, 2, 3, 3, 4, 4],
    effects: [actorRank("combat.prc")]
  }),

  /**
   * Préfixe : Disciplinée.
   *
   * Améliore la PRD du porteur lors des attaques avec l’arme.
   */
  defineAffix({
    id: "weapon.prefix.prd",
    side: "prefix",
    itemTypes: ["weapon"],
    tags: ["attack"],
    magicWeight: 1,
    label: { fr: "Disciplinée", en: "Disciplined" },
    description: { fr: "L’arme obtient un bonus de {value} PRD.", en: "The weapon gains a {value} PRD bonus." },
    rankValues: [1, 1, 2, 2, 3, 3, 4, 4],
    effects: [actorRank("combat.prd")]
  }),

  /**
   * Préfixe : Mystique.
   *
   * Améliore la PRM du porteur pour les usages magiques de l’arme.
   */
  defineAffix({
    id: "weapon.prefix.prm",
    side: "prefix",
    itemTypes: ["weapon"],
    tags: ["spell", "magic"],
    magicWeight: 1,
    label: { fr: "Mystique", en: "Mystic" },
    description: { fr: "L’arme obtient un bonus de {value} PRM.", en: "The weapon gains a {value} PRM bonus." },
    rankValues: [1, 1, 2, 2, 3, 3, 4, 4],
    effects: [actorRank("combat.prm")]
  }),

  /**
   * Préfixe : Indétectable.
   *
   * Ajoute un effet spécial indiquant que l’arme devient indétectable.
   */
  defineAffix({
    id: "weapon.prefix.undetectable",
    side: "prefix",
    itemTypes: ["weapon"],
    tags: ["stealth"],
    magicWeight: 4,
    label: { fr: "Indétectable", en: "Undetectable" },
    description: { fr: "Indétectable.", en: "Undetectable." },
    rankValues: ["-", "-", 1, 1, 1, 1, 1, 1],
    effects: [specialFlag("undetectable", 1)]
  }),

  /**
   * Préfixe : Puissante.
   *
   * Accorde un bonus de Puissance aux attaques réalisées avec l’arme.
   */
  defineAffix({
    id: "weapon.prefix.power",
    side: "prefix",
    itemTypes: ["weapon"],
    tags: ["attack", "damage"],
    magicWeight: 3,
    label: { fr: "Puissante", en: "Mighty" },
    description: { fr: "Les attaques avec cette arme obtiennent un bonus de {value} Puissance.", en: "Attacks with this weapon gain {value} Power." },
    rankValues: [1, 1, 2, 2, 3, 3, 4, 4],
    effects: [actorRank("power")]
  }),

  /**
   * Préfixe : Tranchante.
   *
   * Ajoute des dés de dégâts à l’arme.
   */
  defineAffix({
    id: "weapon.prefix.weapon-damage",
    side: "prefix",
    itemTypes: ["weapon"],
    tags: ["damage"],
    magicWeight: 1,
    label: { fr: "Tranchante", en: "Keen" },
    description: { fr: "DM de l’arme : {value}.", en: "Weapon damage: {value}." },
    rankValues: ["1d6", "1d6", "2d6", "2d6", "3d6", "3d6", "4d6", "4d6"],
    effects: [itemTable("damageDiceBonus", [1, 1, 2, 2, 3, 3, 4, 4])]
  }),

  /**
   * Préfixe : Canalisatrice.
   *
   * Ajoute des dés de dégâts aux sorts lancés avec l’arme.
   */
  defineAffix({
    id: "weapon.prefix.spell-damage",
    side: "prefix",
    itemTypes: ["weapon"],
    tags: ["damage", "spell"],
    magicWeight: 2,
    label: { fr: "Canalisatrice", en: "Channeling" },
    description: { fr: "DM des sorts avec l’arme : {value}.", en: "Spell damage with the weapon: {value}." },
    rankValues: ["1d6", "1d6", "2d6", "2d6", "3d6", "3d6", "4d6", "4d6"],
    effects: [specialTable("spellDamageDiceBonus", [1, 1, 2, 2, 3, 3, 4, 4])]
  }),

  /**
   * Préfixe : Sans limite.
   *
   * Active un effet spécial indiquant que les dégâts n’ont plus de limite.
   */
  defineAffix({
    id: "weapon.prefix.unlimited-damage",
    side: "prefix",
    itemTypes: ["weapon"],
    tags: ["damage", "meta"],
    magicWeight: 4,
    label: { fr: "Sans limite", en: "Unbound" },
    description: { fr: "DM sans limite.", en: "Unlimited damage." },
    rankValues: ["-", "-", "-", "-", 1, 1, 1, 1],
    effects: [specialFlag("unlimitedDamage", 1)]
  }),

  /**
   * Préfixe : Perforante.
   *
   * Force la cible à cocher une ou plusieurs cases supplémentaires
   * lorsqu’une sauvegarde est provoquée par l’arme.
   */
  defineAffix({
    id: "weapon.prefix.extra-save-box",
    side: "prefix",
    itemTypes: ["weapon"],
    tags: ["attack", "save"],
    magicWeight: 3,
    label: { fr: "Perforante", en: "Piercing" },
    description: { fr: "Les attaques avec cette arme font cocher {value} case supplémentaire avec une sauvegarde.", en: "Attacks with this weapon force {value} extra save box." },
    rankValues: ["-", "-", 1, 1, 1, 1, 2, 2],
    effects: [specialTable("extraSaveBox", [0, 0, 1, 1, 1, 1, 2, 2])]
  }),

  /**
   * Préfixe : Vampirique.
   *
   * Soigne le porteur lorsqu’il inflige des dégâts avec l’arme.
   */
  defineAffix({
    id: "weapon.prefix.life-on-hit",
    side: "prefix",
    itemTypes: ["weapon"],
    tags: ["damage", "life"],
    magicWeight: 3,
    label: { fr: "Vampirique", en: "Vampiric" },
    description: { fr: "Vous vous soignez de {value} quand vous infligez des DM avec cette arme.", en: "You heal {value} when you deal damage with this weapon." },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [specialRank("lifeOnHit")]
  }),

  /**
   * Préfixe : De l’invocateur.
   *
   * Augmente les dégâts des invocations du porteur.
   */
  defineAffix({
    id: "weapon.prefix.summon-damage",
    side: "prefix",
    itemTypes: ["weapon"],
    tags: ["damage", "summon"],
    magicWeight: 3,
    label: { fr: "De l’invocateur", en: "Invoker’s" },
    description: { fr: "Vos invocations obtiennent {value} DM supplémentaire.", en: "Your summons gain {value} bonus damage." },
    rankValues: ["1d6", "1d6", "2d6", "2d6", "3d6", "3d6", "4d6", "4d6"],
    effects: [summonTable("damageDiceBonus", [1, 1, 2, 2, 3, 3, 4, 4])]
  }),

  /**
   * Préfixe : Du commandant.
   *
   * Augmente la PRC des invocations du porteur.
   */
  defineAffix({
    id: "weapon.prefix.summon-prc",
    side: "prefix",
    itemTypes: ["weapon"],
    tags: ["attack", "summon"],
    magicWeight: 4,
    label: { fr: "Du commandant", en: "Commander’s" },
    description: { fr: "Vos invocations obtiennent {value} PRC supplémentaire.", en: "Your summons gain {value} bonus PRC." },
    rankValues: [1, 1, 2, 2, 3, 3, 4, 4],
    effects: [summonRank("combat.prc")]
  }),

  /**
   * Préfixe : Du maréchal.
   *
   * Augmente la PRD des invocations du porteur.
   */
  defineAffix({
    id: "weapon.prefix.summon-prd",
    side: "prefix",
    itemTypes: ["weapon"],
    tags: ["attack", "summon"],
    magicWeight: 4,
    label: { fr: "Du maréchal", en: "Marshal’s" },
    description: { fr: "Vos invocations obtiennent {value} PRD supplémentaire.", en: "Your summons gain {value} bonus PRD." },
    rankValues: [1, 1, 2, 2, 3, 3, 4, 4],
    effects: [summonRank("combat.prd")]
  }),

  /**
   * Préfixe : Du thaumaturge.
   *
   * Augmente la PRM des invocations du porteur.
   */
  defineAffix({
    id: "weapon.prefix.summon-prm",
    side: "prefix",
    itemTypes: ["weapon"],
    tags: ["spell", "summon"],
    magicWeight: 4,
    label: { fr: "Du thaumaturge", en: "Thaumaturge’s" },
    description: { fr: "Vos invocations obtiennent {value} PRM supplémentaire.", en: "Your summons gain {value} bonus PRM." },
    rankValues: [1, 1, 2, 2, 3, 3, 4, 4],
    effects: [summonRank("combat.prm")]
  }),

  /**
   * Suffixe : De promptitude.
   *
   * Augmente l’initiative du porteur.
   */
  defineAffix({
    id: "weapon.suffix.initiative",
    side: "suffix",
    itemTypes: ["weapon"],
    tags: ["mobility"],
    magicWeight: 1,
    label: { fr: "De promptitude", en: "of Swiftness" },
    description: { fr: "Vous obtenez un bonus de {value} Initiative.", en: "You gain a {value} Initiative bonus." },
    rankValues: [1, 2, 3, 4, 5, 6, 7, 7],
    effects: [actorRank("initiative")]
  }),

  /**
   * Suffixe : Du colosse.
   *
   * Augmente la Force du porteur.
   */
  defineAffix({
    id: "weapon.suffix.strength",
    side: "suffix",
    itemTypes: ["weapon"],
    tags: ["attribute"],
    magicWeight: 3,
    label: { fr: "Du colosse", en: "of the Colossus" },
    description: { fr: "Vous obtenez un bonus de {value} FOR.", en: "You gain a {value} STR bonus." },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank("attributesValue.strength")]
  }),

  /**
   * Suffixe : De la main sûre.
   *
   * Augmente l’Habilité du porteur.
   */
  defineAffix({
    id: "weapon.suffix.hability",
    side: "suffix",
    itemTypes: ["weapon"],
    tags: ["attribute"],
    magicWeight: 3,
    label: { fr: "De la main sûre", en: "of the Steady Hand" },
    description: { fr: "Vous obtenez un bonus de {value} HAB.", en: "You gain a {value} HAB bonus." },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank("attributesValue.hability")]
  }),

  /**
   * Suffixe : De l’archimage.
   *
   * Augmente la Magie du porteur.
   */
  defineAffix({
    id: "weapon.suffix.magic",
    side: "suffix",
    itemTypes: ["weapon"],
    tags: ["attribute", "magic"],
    magicWeight: 3,
    label: { fr: "De l’archimage", en: "of the Archmage" },
    description: { fr: "Vous obtenez un bonus de {value} MAG.", en: "You gain a {value} MAG bonus." },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank("attributesValue.magic")]
  }),

  /**
   * Suffixe : Du guetteur.
   *
   * Augmente la Perception du porteur.
   */
  defineAffix({
    id: "weapon.suffix.perception",
    side: "suffix",
    itemTypes: ["weapon"],
    tags: ["attribute"],
    magicWeight: 4,
    label: { fr: "Du guetteur", en: "of the Watcher" },
    description: { fr: "Vous obtenez un bonus de {value} PER.", en: "You gain a {value} PER bonus." },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [actorRank("attributesValue.perception")]
  }),

  /**
   * Suffixe : Accessible.
   *
   * Réduit les prérequis nécessaires pour utiliser l’objet.
   */
  defineAffix({
    id: "weapon.suffix.requirement-reduction",
    side: "suffix",
    itemTypes: ["weapon"],
    tags: ["meta"],
    magicWeight: 1,
    label: { fr: "Accessible", en: "Accessible" },
    description: { fr: "Cet objet réduit de {value} ses prérequis pour être utilisé.", en: "This item reduces its requirements by {value}." },
    rankValues: [1, 1, 1, 1, 2, 2, 2, 2],
    effects: [itemRank("special.requirementReduction")]
  }),

  /**
   * Suffixe : Déporté.
   *
   * Transfère les enchantements de l’objet vers les invocations du porteur.
   */
  defineAffix({
    id: "weapon.suffix.invocation-transfer",
    side: "suffix",
    itemTypes: ["weapon"],
    tags: ["meta", "summon"],
    magicWeight: 6,
    label: { fr: "Déporté", en: "Redirected" },
    description: { fr: "Les enchantements de cet objet sont appliqués à vos invocations plutôt qu’à vous.", en: "This item’s enchantments apply to your summons instead of you." },
    rankValues: ["-", "-", "-", "-", "-", "-", 1, 1],
    effects: [specialFlag("summonTransfer", 1)]
  }),

  /**
   * Suffixe : Allégée.
   *
   * Modifie le poids de l’objet selon la valeur de rang.
   */
  defineAffix({
    id: "weapon.suffix.weight",
    side: "suffix",
    itemTypes: ["weapon"],
    tags: ["meta"],
    magicWeight: 1,
    label: { fr: "Allégée", en: "Lightened" },
    description: { fr: "Cet objet pèse {value}.", en: "This item weighs {value}." },
    rankValues: [2, 2, 2, 1, 1, 1, 0.3, 0.3],
    effects: [itemRank("weight")]
  }),

  /**
   * Suffixe : Expansion.
   *
   * Augmente la portée des attaques de zone réalisées avec l’arme.
   */
  defineAffix({
    id: "weapon.suffix.zone-range",
    side: "suffix",
    itemTypes: ["weapon"],
    tags: ["attack", "zone"],
    magicWeight: 4,
    label: { fr: "Expansion", en: "Expanding" },
    description: { fr: "Les attaques de zone avec cette arme sont augmentées de {value}.", en: "Area attacks with this weapon are increased by {value}." },
    rankValues: ["1m", "1m", "1m", "2m", "2m", "2m", "3m", "3m"],
    effects: [itemTable("zoneRangeMeters", [1, 1, 1, 2, 2, 2, 3, 3])]
  }),

  /**
   * Suffixe : Givrée.
   *
   * Augmente le nombre d’applications supplémentaires de l’état Gelé.
   */
  defineAffix({
    id: "weapon.suffix.extra-frozen",
    side: "suffix",
    itemTypes: ["weapon"],
    tags: ["state", "ice"],
    magicWeight: 5,
    label: { fr: "Givrée", en: "Frostbound" },
    description: { fr: "L’état Gelé s’applique {value} fois supplémentaire par tour.", en: "Frozen applies {value} extra time per turn." },
    rankValues: [1, 1, 1, 1, 1, 1, 2, 2],
    effects: [specialTable("state.frozenExtra", [1, 1, 1, 1, 1, 1, 2, 2])]
  }),

  /**
   * Suffixe : Incandescente.
   *
   * Augmente le nombre d’applications supplémentaires de l’état Brûlure.
   */
  defineAffix({
    id: "weapon.suffix.extra-burn",
    side: "suffix",
    itemTypes: ["weapon"],
    tags: ["state", "damage", "fire"],
    magicWeight: 5,
    label: { fr: "Incandescente", en: "Incandescent" },
    description: { fr: "L’état Brûlure s’applique {value} fois supplémentaire par tour.", en: "Burn applies {value} extra time per turn." },
    rankValues: [1, 1, 1, 1, 1, 1, 2, 2],
    effects: [specialTable("state.burnExtra", [1, 1, 1, 1, 1, 1, 2, 2])]
  }),

  /**
   * Suffixe : Vénéneuse.
   *
   * Augmente le nombre de déclenchements supplémentaires de l’état Empoisonné.
   */
  defineAffix({
    id: "weapon.suffix.extra-poison",
    side: "suffix",
    itemTypes: ["weapon"],
    tags: ["state", "damage", "acid"],
    magicWeight: 5,
    label: { fr: "Vénéneuse", en: "Venomous" },
    description: { fr: "L’état Empoisonné inflige ses DM {value} fois supplémentaire par tour.", en: "Poison deals its damage {value} extra time per turn." },
    rankValues: [1, 1, 1, 1, 1, 2, 2, 2],
    effects: [specialTable("state.poisonExtra", [1, 1, 1, 1, 1, 2, 2, 2])]
  }),

  /**
   * Suffixe : Tutélaire.
   *
   * Augmente les PV des invocations du porteur.
   */
  defineAffix({
    id: "weapon.suffix.summon-hp",
    side: "suffix",
    itemTypes: ["weapon"],
    tags: ["life", "summon"],
    magicWeight: 4,
    label: { fr: "Tutélaire", en: "Guardian" },
    description: { fr: "Vos invocations obtiennent {value} PV supplémentaire.", en: "Your summons gain {value} bonus HP." },
    rankValues: [1, 1, 1, 2, 2, 2, 3, 3],
    effects: [summonRank("hpMax")]
  })
]);