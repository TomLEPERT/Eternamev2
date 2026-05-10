/**
 * Fragment de schéma personnage : Save definitions.
 *
 * Responsabilités :
 * - déclarer un groupe cohérent de champs DataModel ;
 * - centraliser les valeurs initiales et contraintes de validation ;
 * - éviter de dupliquer les définitions entre modèles d’acteurs.
 *
 * Ce fichier doit rester déclaratif et sans logique de règles.
 */

export const SAVE_DEFINITIONS = [
  ['dodge', { labelKey: 'ETERN.SAVE.DODGE', sourceAttr: 'agility' }],
  ['parry', { labelKey: 'ETERN.SAVE.PARRY', sourceAttr: 'instinct' }],
  ['pain', { labelKey: 'ETERN.SAVE.PAIN', sourceAttr: 'robustness' }],
  ['cover', { labelKey: 'ETERN.SAVE.COVER', sourceAttr: 'reasoning' }],
  ['armor', { labelKey: 'ETERN.SAVE.ARMOR', sourceAttr: '' }],
  ['fire', { labelKey: 'ETERN.SAVE.FIRE', sourceAttr: '' }],
  ['ice', { labelKey: 'ETERN.SAVE.ICE', sourceAttr: '' }],
  ['lightning', { labelKey: 'ETERN.SAVE.LIGHTNING', sourceAttr: '' }],
  ['earth', { labelKey: 'ETERN.SAVE.EARTH', sourceAttr: '' }],
  ['wind', { labelKey: 'ETERN.SAVE.WIND', sourceAttr: '' }],
  ['mental', { labelKey: 'ETERN.SAVE.MENTAL', sourceAttr: 'reasoning' }],
  ['acid', { labelKey: 'ETERN.SAVE.ACID', sourceAttr: '' }],
  ['magic', { labelKey: 'ETERN.SAVE.MAGIC', sourceAttr: '' }]
];
