/**
 * Extension de fiche acteur : Actor sheet context techniques.
 *
 * Responsabilités :
 * - ajouter à l’ActorSheetV2 les comportements propres à cette section ;
 * - lire ou mettre à jour uniquement les champs nécessaires à l’interface ;
 * - conserver les calculs de règles dans les modules `rules` ou `system`.
 *
 * Ce fichier doit rester un module UI spécialisé et ne pas devenir un service métier.
 */

import { buildTechniqueValidationSummary } from '../../system/techniques/validation-service.js';
import { buildTechniqueSlotBudget } from '../../system/techniques/slot-budget-service.js';
import { getLinkedInvocationActor } from '../../system/techniques/invocation-actor-service.js';
import {
  getInvocationPowerBonusTargetChoices,
  getInvocationSizeDefinition,
  normalizeInvocationPowerBonusTarget,
  normalizeInvocationPowerBonusType,
  normalizeInvocationSize
} from '../../system/techniques/invocation-definitions.js';
import { buildProfessionProgressTrack } from '../../rules/professions/progress-track.js';
import { ETERNAME_ATTRIBUTES } from '../../system/constants/attributes.js';
import {
  HERITAGE_FEATURE_TYPES,
  HERITAGE_TYPES,
  normalizeHeritageFeatureType,
  normalizeHeritageType
} from '../../system/constants/heritages.js';

const PROFESSION_QUICK_ACCESS_SECTIONS = [
  ['passives', 'ETERN.PROFESSION.SECTION.PASSIVES'],
  ['keys', 'ETERN.PROFESSION.SECTION.KEYS'],
  ['conditions', 'ETERN.PROFESSION.SECTION.CONDITIONS'],
  ['mechanics', 'ETERN.PROFESSION.SECTION.MECHANICS'],
  ['states', 'ETERN.PROFESSION.SECTION.STATES']
];

function getProgressTestAttributeLabel(attributeKey = '') {
  const key = String(attributeKey ?? '').trim();
  const definition = ETERNAME_ATTRIBUTES[key];
  return definition ? game.i18n.localize(definition.label) : '';
}

function buildProfessionQuickAccessEntries(professionDocuments, selectedProfessionSlots = {}) {
  const selectedIds = new Set([
    String(selectedProfessionSlots?.first ?? '').trim(),
    String(selectedProfessionSlots?.second ?? '').trim()
  ].filter(Boolean));

  return (Array.isArray(professionDocuments) ? professionDocuments : [])
    .filter((profession) => selectedIds.has(String(profession?.id ?? '')))
    .flatMap((profession) => PROFESSION_QUICK_ACCESS_SECTIONS.flatMap(([sectionKey, labelKey]) => {
      const entries = Array.isArray(profession.system?.[sectionKey]) ? profession.system[sectionKey] : [];
      return entries
        .map((entry, entryIndex) => ({ entry, entryIndex }))
        .filter(({ entry }) => Boolean(entry?.isQuickAccess))
        .map(({ entry, entryIndex }) => {
          const counterMax = Math.max(0, Math.floor(Number(entry?.counter?.max ?? 0) || 0));
          const counterCurrent = Math.max(0, Math.floor(Number(entry?.counter?.current ?? 0) || 0));
          const clampedCounterCurrent = counterMax > 0 ? Math.min(counterCurrent, counterMax) : counterCurrent;
          const counterLabel = String(entry?.counter?.label ?? '').trim() || game.i18n.localize('ETERN.TECHNIQUE.MODULES.COUNTER');

          const progressTrack = buildProfessionProgressTrack(entry?.progressTrack);
          progressTrack.enabled = Boolean(entry?.hasProgressTrack && entry?.progressTrack?.enabled);
          progressTrack.label = progressTrack.label || game.i18n.localize('ETERN.TECHNIQUE.MODULES.PROGRESS_TRACK_LABEL');
          progressTrack.testAttributeLabel = getProgressTestAttributeLabel(progressTrack.testAttributeKey);
          progressTrack.canRollTest = Boolean(progressTrack.testAttributeKey && progressTrack.testAttributeLabel);
          progressTrack.rollTestLabel = progressTrack.canRollTest
            ? game.i18n.format('ETERN.TECHNIQUE.MODULES.PROGRESS_TRACK.ROLL_TEST', { attribute: progressTrack.testAttributeLabel })
            : '';

          return {
            id: `${profession.id}-${sectionKey}-${String(entry?.id ?? entryIndex)}`,
            professionId: profession.id,
            professionName: profession.name,
            sectionKey,
            sectionLabel: game.i18n.localize(labelKey),
            entryId: String(entry?.id ?? ''),
            entryIndex,
            name: String(entry?.name ?? '').trim() || '—',
            description: String(entry?.description ?? ''),
            isActive: sectionKey === 'passives' ? Boolean(entry?.isActive) : false,
            canToggleActive: sectionKey === 'passives',
            activeLabel: game.i18n.localize(Boolean(entry?.isActive) ? 'ETERN.PROFESSION.ACTIVE_ON' : 'ETERN.PROFESSION.ACTIVE_OFF'),
            isUniversal: sectionKey !== 'passives' ? Boolean(entry?.isUniversal) : false,
            hasXpCost: Number(entry?.xpCost ?? 0) !== 0,
            xpCost: Math.floor(Number(entry?.xpCost ?? 0) || 0),
            counter: {
              enabled: Boolean(entry?.counter?.enabled),
              label: counterLabel,
              current: clampedCounterCurrent,
              max: counterMax,
              resetNote: String(entry?.counter?.resetNote ?? ''),
              hasMax: counterMax > 0,
              valueLabel: counterMax > 0 ? `${clampedCounterCurrent} / ${counterMax}` : String(clampedCounterCurrent),
              canDecrease: clampedCounterCurrent > 0,
              canIncrease: counterMax <= 0 || clampedCounterCurrent < counterMax
            },
            progressTrack
          };
        });
    }));
}

function getLocalizedRecordLabel(record, value) {
  return game.i18n.localize(record[value] ?? String(value ?? ''));
}

function buildHeritageItems(actor) {
  return actor.items.contents
    .filter((item) => item.type === 'heritage')
    .map((item) => {
      const heritageType = normalizeHeritageType(item.system?.heritageType);
      const featureType = normalizeHeritageFeatureType(item.system?.featureType);
      const isPassive = featureType === 'passive';
      const isTechnique = featureType === 'technique';
      const isActive = Boolean(item.system?.active);
      const isPrepared = Boolean(item.system?.prepared);
      const stateLabel = isPassive
        ? game.i18n.localize(isActive ? 'ETERN.HERITAGE.STATE_ACTIVE' : 'ETERN.HERITAGE.STATE_INACTIVE')
        : game.i18n.localize(isPrepared ? 'ETERN.HERITAGE.STATE_PREPARED' : 'ETERN.HERITAGE.STATE_UNPREPARED');
      const componentNames = ['keys', 'conditions', 'mechanics', 'states']
        .flatMap((sectionKey) => Array.isArray(item.system?.[sectionKey]) ? item.system[sectionKey] : [])
        .map((entry) => String(entry?.name ?? '').trim())
        .filter(Boolean);
      const statistics = Array.isArray(item.system?.derived?.summary?.statistics) ? item.system.derived.summary.statistics : [];
      const mainStatistic = statistics.find((entry) => entry.isMain) ?? statistics[0] ?? null;
      const validation = isTechnique ? buildTechniqueValidationSummary(item) : { errors: [], warnings: [] };
      const validationState = validation.errors.length
        ? 'error'
        : validation.warnings.length ? 'warning' : 'success';

      return {
        id: item.id,
        img: item.img,
        name: item.name,
        description: String(item.system?.description ?? ''),
        heritageType,
        featureType,
        typeLabel: getLocalizedRecordLabel(HERITAGE_TYPES, heritageType),
        featureTypeLabel: getLocalizedRecordLabel(HERITAGE_FEATURE_TYPES, featureType),
        isPassive,
        isTechnique,
        isActive,
        isPrepared,
        power: Math.max(0, Math.min(10, Math.floor(Number(item.system?.power ?? 0) || 0))),
        totalXp: Number(item.system?.derived?.totalXp ?? 0) || 0,
        headline: String(item.system?.derived?.summary?.headline ?? ''),
        mainStatisticLabel: mainStatistic ? String(mainStatistic.label ?? '') : '',
        mainStatisticValue: mainStatistic ? String(mainStatistic.finalValue ?? '') : '',
        validationState,
        validationLabel: isTechnique
          ? validationState === 'error'
            ? game.i18n.localize('ETERN.TECHNIQUE.ACTOR.INVALID')
            : validationState === 'warning'
              ? game.i18n.localize('ETERN.TECHNIQUE.ACTOR.WARNING')
              : game.i18n.localize('ETERN.TECHNIQUE.ACTOR.READY')
          : '',
        stateLabel,
        searchText: [item.name, item.system?.description, heritageType, featureType, ...componentNames].filter(Boolean).join(' ').toLowerCase()
      };
    });
}

export function buildCharacterTechniqueContext(actor) {
  const professionDocuments = actor.items.contents.filter((item) => item.type === 'profession');

  const professionItems = professionDocuments
    .map((item) => ({
      id: item.id,
      name: item.name,
      description: String(item.system?.description ?? ''),
      passiveCount: Array.isArray(item.system?.passives) ? item.system.passives.length : 0,
      keyCount: Array.isArray(item.system?.keys) ? item.system.keys.length : 0,
      conditionCount: Array.isArray(item.system?.conditions) ? item.system.conditions.length : 0,
      mechanicCount: Array.isArray(item.system?.mechanics) ? item.system.mechanics.length : 0,
      stateCount: Array.isArray(item.system?.states) ? item.system.states.length : 0
    }));

  const professionMap = new Map(professionItems.map((item) => [item.id, item]));
  const selectedProfessionSlots = actor.system?.techniques?.professionSlots ?? { first: '', second: '' };
  const quickAccessProfessionEntries = buildProfessionQuickAccessEntries(professionDocuments, selectedProfessionSlots);
  const heritageItems = buildHeritageItems(actor);

  const techniqueItems = actor.items.contents
    .filter((item) => item.type === 'technique')
    .map((item) => {
      const validation = buildTechniqueValidationSummary(item);
      const statistics = Array.isArray(item.system?.derived?.summary?.statistics) ? item.system.derived.summary.statistics : [];
      const mainStatistic = statistics.find((entry) => entry.isMain) ?? statistics[0] ?? null;
      const linkedProfessions = (Array.isArray(item.system?.professionIds) ? item.system.professionIds : [])
        .map((professionId) => professionMap.get(String(professionId ?? ''))?.name)
        .filter(Boolean);

      const searchableParts = [
        item.name,
        String(item.system?.description ?? ''),
        String(item.system?.derived?.summary?.headline ?? ''),
        String(item.system?.derived?.summary?.shortText ?? ''),
        ...linkedProfessions,
        ...(Array.isArray(item.system?.keys) ? item.system.keys.map((entry) => String(entry?.name ?? '')) : []),
        ...(Array.isArray(item.system?.conditions) ? item.system.conditions.map((entry) => String(entry?.name ?? '')) : []),
        ...(Array.isArray(item.system?.mechanics) ? item.system.mechanics.map((entry) => String(entry?.name ?? '')) : []),
        ...(Array.isArray(item.system?.states) ? item.system.states.map((entry) => String(entry?.name ?? '')) : [])
      ];

      const validationState = validation.errors.length
        ? 'error'
        : validation.warnings.length ? 'warning' : 'success';

      const invocationFlags = item.flags?.eternamev2 ?? {};
      const slotBudget = item.system?.derived?.slotBudget ?? buildTechniqueSlotBudget(item.system ?? {}, actor);
      const componentBadges = [
        Array.isArray(item.system?.conditions) && item.system.conditions.length ? `${item.system.conditions.length} ${game.i18n.localize('ETERN.TECHNIQUE.SECTION.CONDITIONS')}` : '',
        Array.isArray(item.system?.mechanics) && item.system.mechanics.length ? `${item.system.mechanics.length} ${game.i18n.localize('ETERN.TECHNIQUE.SECTION.MECHANICS')}` : '',
        Array.isArray(item.system?.states) && item.system.states.length ? `${item.system.states.length} ${game.i18n.localize('ETERN.TECHNIQUE.SECTION.STATES')}` : ''
      ].filter(Boolean);

      const slotSourceBadges = (Array.isArray(slotBudget?.breakdownSections) ? slotBudget.breakdownSections : [])
        .map((section) => `${section.label} ${section.totalLabel}`);

      return {
        id: item.id,
        img: item.img,
        name: item.name,
        description: String(item.system?.description ?? ''),
        isPrepared: Boolean(item.system?.prepared),
        isInvocationGranted: invocationFlags.generatedInvocationTechnique === true,
        power: Math.max(0, Math.min(10, Math.floor(Number(item.system?.power ?? 0) || 0))),
        totalXp: Number(item.system?.derived?.totalXp ?? 0) || 0,
        creationXp: Number(item.system?.derived?.creationXp ?? 0) || 0,
        headline: String(item.system?.derived?.summary?.headline ?? ''),
        shortText: String(item.system?.derived?.summary?.shortText ?? ''),
        linkedProfessions,
        componentBadges,
        slotSourceBadges,
        mainStatisticLabel: mainStatistic ? String(mainStatistic.label ?? '') : '',
        mainStatisticValue: mainStatistic ? String(mainStatistic.finalValue ?? '') : '',
        validationState,
        validationLabel: validationState === 'error'
          ? game.i18n.localize('ETERN.TECHNIQUE.ACTOR.INVALID')
          : validationState === 'warning'
            ? game.i18n.localize('ETERN.TECHNIQUE.ACTOR.WARNING')
            : game.i18n.localize('ETERN.TECHNIQUE.ACTOR.READY'),
        hasWarnings: validation.warnings.length > 0,
        hasErrors: validation.errors.length > 0,
        searchText: searchableParts.filter(Boolean).join(' ').toLowerCase()
      };
    });

  const invocationItems = actor.items.contents
    .filter((item) => item.type === 'invocation')
    .map((item) => {
      const validation = item.system?.derived?.validation ?? { errors: [], warnings: [] };
      const validationState = validation.errors?.length
        ? 'error'
        : validation.warnings?.length ? 'warning' : 'success';

      const summary = item.system?.derived?.summary ?? {};
      const linkedTechniqueName = actor.items.get(String(item.system?.techniqueId ?? ''))?.name ?? '';
      const linkedActor = getLinkedInvocationActor(item);

      return {
        id: item.id,
        name: item.name,
        description: String(item.system?.description ?? ''),
        sizeLabel: game.i18n.localize(summary.sizeDefinition?.labelKey ?? 'ETERN.INVOCATION.SIZE.MEDIUM'),
        pointsLabel: `${Number(summary.totalAllocated ?? 0) || 0} / ${Number(summary.sizeDefinition?.pointBudget ?? 0) || 0}`,
        linkedTechniqueName,
        linkedActorId: linkedActor?.id ?? '',
        linkedActorName: linkedActor?.name ?? '',
        hasLinkedActor: Boolean(linkedActor),
        scaledCreationXp: Number(summary.scaledCreationXp ?? 0) || 0,
        validationState,
        validationLabel: validationState === 'error'
          ? game.i18n.localize('ETERN.TECHNIQUE.ACTOR.INVALID')
          : validationState === 'warning'
            ? game.i18n.localize('ETERN.TECHNIQUE.ACTOR.WARNING')
            : game.i18n.localize('ETERN.TECHNIQUE.ACTOR.READY')
      };
    });

  return {
    invocationActorSummary: buildInvocationActorSummary(actor, techniqueItems),
    techniques: {
      professionSlots: {
        first: buildProfessionSlotOptions(selectedProfessionSlots.first, professionItems),
        second: buildProfessionSlotOptions(selectedProfessionSlots.second, professionItems)
      },
      selectedProfessionSummaries: {
        first: professionMap.get(String(selectedProfessionSlots.first ?? '')) ?? null,
        second: professionMap.get(String(selectedProfessionSlots.second ?? '')) ?? null
      },
      professions: professionItems,
      heritages: heritageItems,
      ancestralHeritages: heritageItems.filter((entry) => entry.heritageType === 'ancestral'),
      culturalHeritages: heritageItems.filter((entry) => entry.heritageType === 'cultural'),
      techniques: techniqueItems,
      invocations: invocationItems,
      prepared: techniqueItems.filter((entry) => entry.isPrepared),
      quickAccess: quickAccessProfessionEntries,
      counts: {
        total: techniqueItems.length,
        prepared: techniqueItems.filter((entry) => entry.isPrepared).length,
        heritages: heritageItems.length,
        ancestralHeritages: heritageItems.filter((entry) => entry.heritageType === 'ancestral').length,
        culturalHeritages: heritageItems.filter((entry) => entry.heritageType === 'cultural').length,
        quickAccess: quickAccessProfessionEntries.length,
        invocations: invocationItems.length
      }
    }
  };
}

export function buildInvocationActorSummary(actor, techniqueItems = []) {
  if (String(actor?.type ?? '') !== 'invocation') return null;

  const invocationSystem = actor.system?.invocation ?? {};
  const sourceActor = game.actors?.get?.(String(invocationSystem.sourceActorId ?? '')) ?? null;
  const sourceProfile = sourceActor?.items?.get?.(String(invocationSystem.profileItemId ?? '')) ?? null;
  const sourceTechnique = sourceActor?.items?.get?.(String(invocationSystem.sourceTechniqueId ?? '')) ?? null;
  const size = normalizeInvocationSize(invocationSystem.sourceInvocationSize ?? 'medium');
  const sizeDefinition = getInvocationSizeDefinition(size);
  const sourceSummary = sourceProfile?.system?.derived?.summary ?? null;
  const summaryPowerBoons = Array.isArray(sourceSummary?.powerBoons) ? sourceSummary.powerBoons : [];
  const appliedEntries = Array.isArray(invocationSystem.generatedBonuses?.appliedPowerBoons)
    ? invocationSystem.generatedBonuses.appliedPowerBoons
    : [];

  const activeBonuses = appliedEntries
    .filter((entry) => Boolean(entry?.applied))
    .map((entry, index) => {
      const sourceEntry = summaryPowerBoons.find((powerEntry) => String(powerEntry?.id ?? '') === String(entry?.id ?? '')) ?? null;
      return {
        id: String(entry?.id ?? `power-boon-${index}`),
        label: formatInvocationActorBonusLabel(sourceEntry ?? entry),
        notes: String(sourceEntry?.notes ?? '')
      };
    });

  const grantedTechniques = (Array.isArray(techniqueItems) ? techniqueItems : [])
    .filter((entry) => Boolean(entry?.isInvocationGranted))
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      power: entry.power,
      mainStatisticLabel: entry.mainStatisticLabel,
      mainStatisticValue: entry.mainStatisticValue
    }));

  return {
    sourceActorName: sourceActor?.name ?? '',
    sourceProfileName: sourceProfile?.name ?? '',
    sourceTechniqueName: sourceTechnique?.name ?? '',
    sourceTechniquePower: Math.max(0, Math.floor(Number(invocationSystem.generatedFromPower ?? 0) || 0)),
    sizeLabel: game.i18n.localize(sizeDefinition?.labelKey ?? 'ETERN.INVOCATION.SIZE.MEDIUM'),
    activeBonuses,
    grantedTechniques,
    hasSourceActor: Boolean(sourceActor),
    hasSourceProfile: Boolean(sourceProfile),
    hasSourceTechnique: Boolean(sourceTechnique),
    hasActiveBonuses: activeBonuses.length > 0,
    hasGrantedTechniques: grantedTechniques.length > 0
  };
}

function buildProfessionSlotOptions(currentValue, professionItems) {
  const selected = String(currentValue ?? '');
  return [
    { value: '', label: game.i18n.localize('ETERN.TECHNIQUE.PROFESSION_SLOT.EMPTY'), selected: selected === '' },
    ...professionItems.map((item) => ({
      value: item.id,
      label: item.name,
      selected: item.id === selected
    }))
  ];
}

function localizeInvocationPowerBonusTargetForActor(type, target) {
  const normalizedType = normalizeInvocationPowerBonusType(type);
  const normalizedTarget = normalizeInvocationPowerBonusTarget(normalizedType, target);
  if (!normalizedTarget) return '';

  const choice = getInvocationPowerBonusTargetChoices(normalizedType)
    .find((entry) => String(entry.value ?? '') === normalizedTarget);
  return choice ? game.i18n.localize(choice.labelKey) : normalizedTarget;
}

function formatInvocationActorBonusLabel(entry) {
  const type = normalizeInvocationPowerBonusType(entry?.type ?? 'hp');
  const targetLabel = localizeInvocationPowerBonusTargetForActor(type, entry?.target ?? '');
  switch (type) {
    case 'hp':
      return game.i18n.localize('ETERN.INVOCATION.ACTOR.BONUS_LABEL.HP');
    case 'attribute':
      return game.i18n.format('ETERN.INVOCATION.ACTOR.BONUS_LABEL.ATTRIBUTE', { target: targetLabel || '—' });
    case 'damage':
      return game.i18n.localize('ETERN.INVOCATION.ACTOR.BONUS_LABEL.DAMAGE');
    case 'defense':
      return game.i18n.localize('ETERN.INVOCATION.ACTOR.BONUS_LABEL.DEFENSE');
    case 'attack':
      return game.i18n.format('ETERN.INVOCATION.ACTOR.BONUS_LABEL.ATTACK', { target: targetLabel || '—' });
    case 'save':
      return game.i18n.format('ETERN.INVOCATION.ACTOR.BONUS_LABEL.SAVE', { target: targetLabel || '—' });
    case 'magic':
      return game.i18n.format('ETERN.INVOCATION.ACTOR.BONUS_LABEL.MAGIC', { target: targetLabel || '—' });
    default:
      return game.i18n.localize(`ETERN.INVOCATION.POWER_BONUS.${String(type).toUpperCase()}`);
  }
}
