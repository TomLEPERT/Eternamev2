/**
 * DataModel d’item : Fields.
 *
 * Responsabilités :
 * - déclarer les champs persistants du type d’item ;
 * - définir les valeurs initiales et contraintes de formulaire ;
 * - laisser les labels, totaux et résumés calculés à `system.derived`.
 *
 * Ce fichier doit rester déclaratif et ne pas contenir de logique UI.
 */

import { ITEM_SAVE_KEYS } from '../../system/constants/save-keys.js';

const { fields } = foundry.data;

export function stringField(initial = "", options = {}) {
  return new fields.StringField({ required: false, blank: true, initial, ...options });
}

export function numberField(initial = 0, options = {}) {
  return new fields.NumberField({ required: false, initial, ...options });
}

export function booleanField(initial = false, options = {}) {
  return new fields.BooleanField({ required: false, initial, ...options });
}

export function skillField() {
  return new fields.SchemaField({
    name: stringField(""),
    description: stringField("")
  });
}

export function learnedSkillField() {
  return new fields.SchemaField({
    name: stringField(""),
    description: stringField(""),
    learned: booleanField(false)
  });
}

export function saveMapField() {
  const schema = {};
  for (const key of ITEM_SAVE_KEYS) {
    schema[key] = numberField(0, { integer: true });
  }
  return new fields.SchemaField(schema);
}


export function priceField() {
  return new fields.SchemaField({
    pp: numberField(0, { integer: true, min: 0 }),
    rc: numberField(0, { integer: true, min: 0 }),
    po: numberField(0, { integer: true, min: 0 }),
    pa: numberField(0, { integer: true, min: 0 }),
    pc: numberField(0, { integer: true, min: 0 })
  });
}

export function buildTechniqueStatisticArrayField() {
  return new fields.ArrayField(
    new fields.SchemaField({
      id: stringField(''),
      statId: stringField('damage')
    }),
    { required: true, initial: [] }
  );
}

export function buildTechniqueStatisticSlotArrayField() {
  return new fields.ArrayField(
    new fields.SchemaField({
      id: stringField(''),
      slotType: stringField('free'),
      count: numberField(1, { integer: true, min: 1 })
    }),
    { required: true, initial: [] }
  );
}

export function buildTechniqueImprovementArrayField() {
  return new fields.ArrayField(
    new fields.SchemaField({
      id: stringField(''),
      label: stringField(''),
      xpStep: numberField(1, { integer: true, min: 1 }),
      rank: numberField(0, { integer: true, min: 0 }),
      notes: stringField('')
    }),
    { required: true, initial: [] }
  );
}

export function buildTechniqueActorBonusArrayField() {
  return new fields.ArrayField(
    new fields.SchemaField({
      id: stringField(''),
      targetKey: stringField(''),
      value: numberField(0, { integer: true }),
      notes: stringField('')
    }),
    { required: true, initial: [] }
  );
}

export function buildTechniqueProgressTrackField() {
  return new fields.SchemaField({
    enabled: booleanField(false),
    label: stringField(''),
    current: numberField(0, { integer: true, min: 0 }),
    testAttributeKey: stringField(''),
    notes: stringField(''),
    objectivesText: stringField(''),
    boxes: new fields.ArrayField(booleanField(false), { required: true, initial: [] }),
    thresholds: new fields.ArrayField(
      new fields.SchemaField({
        id: stringField(''),
        target: numberField(0, { integer: true, min: 0 }),
        label: stringField(''),
        notes: stringField('')
      }),
      { required: true, initial: [] }
    )
  });
}


export function buildEnchantmentItemBonusArrayField() {
  return new fields.ArrayField(
    new fields.SchemaField({
      id: stringField(''),
      targetKey: stringField(''),
      value: numberField(0),
      notes: stringField('')
    }),
    { required: true, initial: [] }
  );
}

export function buildEnchantmentEntrySourceField() {
  return new fields.SchemaField({
    catalystBase: stringField(''),
    essenceQuality: stringField('none'),
    essenceTag: stringField(''),
    operation: stringField('')
  });
}

export function buildEnchantmentEntryArrayField() {
  return new fields.ArrayField(
    new fields.SchemaField({
      id: stringField(''),
      sourceType: stringField('custom'),
      definitionId: stringField(''),
      family: stringField('affix'),
      side: stringField('prefix'),
      label: stringField(''),
      description: stringField(''),
      tagsText: stringField(''),
      rank: numberField(0, { integer: true, min: 0, max: 7 }),
      magicWeight: numberField(0),
      locked: booleanField(false),
      source: buildEnchantmentEntrySourceField(),
      actorBonuses: buildTechniqueActorBonusArrayField(),
      itemBonuses: buildEnchantmentItemBonusArrayField()
    }),
    { required: true, initial: [] }
  );
}

export function buildEnchantingField() {
  return new fields.SchemaField({
    baseQuality: stringField('base'),
    customPrefixMax: numberField(1, { integer: true, min: 0 }),
    customSuffixMax: numberField(1, { integer: true, min: 0 }),
    notes: stringField(''),
    entries: buildEnchantmentEntryArrayField(),
    derived: new fields.SchemaField({
      prefixMax: numberField(1, { integer: true, min: 0 }),
      suffixMax: numberField(1, { integer: true, min: 0 }),
      prefixUsed: numberField(0, { integer: true, min: 0 }),
      suffixUsed: numberField(0, { integer: true, min: 0 }),
      prefixAvailable: numberField(1, { integer: true, min: 0 }),
      suffixAvailable: numberField(1, { integer: true, min: 0 }),
      affixCount: numberField(0, { integer: true, min: 0 }),
      curseCount: numberField(0, { integer: true, min: 0 }),
      totalMagicWeight: numberField(0)
    })
  });
}
export function buildTechniqueProgressRewardArrayField() {
  return new fields.ArrayField(
    new fields.SchemaField({
      id: stringField(''),
      threshold: numberField(0, { integer: true, min: 0 }),
      targetKey: stringField(''),
      value: numberField(0, { integer: true }),
      notes: stringField('')
    }),
    { required: true, initial: [] }
  );
}

export function buildTechniqueCounterField() {
  return new fields.SchemaField({
    enabled: booleanField(false),
    label: stringField(''),
    current: numberField(0, { integer: true, min: 0 }),
    max: numberField(0, { integer: true, min: 0 }),
    resetNote: stringField('')
  });
}

export function buildProfessionEntryArrayField({ withActive = false, withUniversal = false } = {}) {
  return new fields.ArrayField(
    new fields.SchemaField({
      id: stringField(''),
      name: stringField(''),
      description: stringField(''),
      xpCost: numberField(0, { integer: true }),
      referenceKey: stringField(''),
      stateId: stringField(''),
      extraStatisticSlots: numberField(0, { integer: true, min: 0 }),
      isQuickAccess: booleanField(false),
      hasStatisticSlots: booleanField(false),
      statisticSlots: buildTechniqueStatisticSlotArrayField(),
      hasStatistics: booleanField(false),
      statistics: buildTechniqueStatisticArrayField(),
      counter: buildTechniqueCounterField(),
      hasImprovements: booleanField(false),
      improvements: buildTechniqueImprovementArrayField(),
      hasActorBonuses: booleanField(false),
      actorBonuses: buildTechniqueActorBonusArrayField(),
      hasProgressTrack: booleanField(false),
      progressTrack: buildTechniqueProgressTrackField(),
      hasProgressRewards: booleanField(false),
      progressRewards: buildTechniqueProgressRewardArrayField(),
      ...(withActive ? { isActive: booleanField(false) } : {}),
      ...(withUniversal ? { isUniversal: booleanField(false) } : {})
    }),
    { required: true, initial: [] }
  );
}

export function buildTechniqueComponentArrayField() {
  return new fields.ArrayField(
    new fields.SchemaField({
      id: stringField(''),
      name: stringField(''),
      description: stringField(''),
      xpCost: numberField(0, { integer: true }),
      referenceKey: stringField(''),
      stateId: stringField(''),
      extraStatisticSlots: numberField(0, { integer: true, min: 0 }),
      statisticSlots: buildTechniqueStatisticSlotArrayField(),
      sourceProfessionId: stringField(''),
      sourceEntryId: stringField(''),
      sourceReferenceKey: stringField(''),
      sourceLabel: stringField(''),
      isUniversal: booleanField(false)
    }),
    { required: true, initial: [] }
  );
}

export function buildTechniqueProfessionIdArrayField() {
  return new fields.ArrayField(new fields.StringField({ required: true, blank: false, initial: '' }), { required: true, initial: [] });
}

export function buildTechniquePowerEnhancementArrayField() {
  return new fields.ArrayField(
    new fields.SchemaField({
      threshold: numberField(0, { integer: true, min: 0, max: 10 }),
      statisticId: stringField('')
    }),
    {
      required: true,
      initial: [
        { threshold: 3, statisticId: '' },
        { threshold: 6, statisticId: '' },
        { threshold: 9, statisticId: '' },
        { threshold: 10, statisticId: '' }
      ]
    }
  );
}

export function buildCommonItemSchema() {
  return {
    quantity: numberField(1, { integer: true, min: 1 }),
    weight: numberField(1, { min: 0 }),
    location: stringField('backpack'),
    containerId: stringField(''),
    legality: stringField('legal'),
    description: stringField(''),
    price: priceField()
  };
}
