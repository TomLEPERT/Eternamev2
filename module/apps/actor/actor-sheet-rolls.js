/**
 * Extension de fiche acteur : Actor sheet rolls.
 *
 * Responsabilités :
 * - ajouter à l’ActorSheetV2 les comportements propres à cette section ;
 * - lire ou mettre à jour uniquement les champs nécessaires à l’interface ;
 * - conserver les calculs de règles dans les modules `rules` ou `system`.
 *
 * Ce fichier doit rester un module UI spécialisé et ne pas devenir un service métier.
 */

import { nextTickValue, targetToIndexString, indexStringToTarget } from "../../rules/derived/attributes.js";
import { openAttributeRollDialog } from "../dialogs/attribute-roll-dialog.js";

function getAttributeTicks(actor, key) {
  return foundry.utils.getProperty(actor, `system.attributes.${key}.ticks`) ?? 0;
}

function getAttrRollContext(actor, attrKey) {
  const derived = actor.system?.derived?.attributes?.[attrKey] ?? {};
  const base = actor.system?.attributes?.[attrKey] ?? {};
  const index = String(derived.index ?? base.index ?? '6+');
  return {
    key: attrKey,
    label: game.i18n.localize(base?.label ?? `ETERN.ATTR.${String(attrKey).toUpperCase()}`),
    abbr: String(base?.abbr ?? attrKey).toUpperCase(),
    ticks: Math.max(0, Math.floor(Number(base?.ticks ?? 0) || 0)),
    bonusDice: Math.max(0, Math.floor(Number(derived?.bonusDice ?? 0) || 0)),
    index,
    threshold: indexStringToTarget(index),
    diceCount: 0
  };
}

async function renderDiceRollCard({ actor, eyebrow, title, targetLabel, formulaLabel, ticksLabel = null, modeLabel = null, baseTargetLabel = null, dice = [], successes = 0, extraLines = [] }) {
  const content = await foundry.applications.handlebars.renderTemplate('systems/eternamev2/templates/chat/attribute-roll.hbs', {
    actorName: actor.name,
    attribute: { label: title, abbr: '' },
    eyebrow,
    title,
    modeLabel,
    diceCount: dice.length,
    targetLabel,
    baseTargetLabel,
    thresholdAdjusted: Boolean(baseTargetLabel && baseTargetLabel !== targetLabel),
    dice,
    successes,
    hasSuccesses: successes > 0,
    formulaLabel,
    ticksLabel,
    extraLines
  });
  return content;
}

async function createResistanceRollMessage(actor) {
  const attrKey = String(actor.system?.stateResistance?.attr ?? 'robustness');
  const attr = getAttrRollContext(actor, attrKey);
  const roll = await (new Roll('2d6')).evaluate();
  const dice = (roll.dice?.[0]?.results ?? []).map((result, index) => ({
    index,
    value: Number(result?.result ?? 0),
    success: Number(result?.result ?? 0) >= attr.threshold
  }));
  const successes = dice.filter((die) => die.success).length;
  const content = await renderDiceRollCard({
    actor,
    eyebrow: game.i18n.localize('ETERN.STATES.RESISTANCE_ROLL'),
    title: `${attr.label} (${attr.abbr})`,
    targetLabel: targetToIndexString(attr.threshold),
    formulaLabel: '2d6',
    modeLabel: null,
    ticksLabel: null,
    dice,
    successes
  });
  await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), rolls: [roll], content });
}

async function createOverdoseRollMessage(actor) {
  const overdoseValue = Number(actor.system?.overdose ?? 0) || 0;
  const attr = getAttrRollContext(actor, 'robustness');
  const diceCount = Math.max(1, 3 + attr.ticks + attr.bonusDice);
  const required = Math.max(0, 2 + (overdoseValue - 3));
  const roll = await (new Roll(`${diceCount}d6`)).evaluate();
  const dice = (roll.dice?.[0]?.results ?? []).map((result, index) => ({
    index,
    value: Number(result?.result ?? 0),
    success: Number(result?.result ?? 0) >= attr.threshold
  }));
  const successes = dice.filter((die) => die.success).length;
  const success = successes >= required;

  const extraLines = [
    { label: game.i18n.localize('ETERN.OVERDOSE.REQUIRED_LABEL'), value: required },
    { label: game.i18n.localize('ETERN.OVERDOSE.OUTCOME_LABEL'), value: game.i18n.localize(success ? 'ETERN.OVERDOSE.SUCCESS' : 'ETERN.OVERDOSE.FAIL') }
  ];

  const content = await renderDiceRollCard({
    actor,
    eyebrow: game.i18n.localize('ETERN.OVERDOSE.TITLE'),
    title: `${attr.label} (${attr.abbr})`,
    targetLabel: targetToIndexString(attr.threshold),
    formulaLabel: `${diceCount}d6`,
    ticksLabel: attr.ticks + attr.bonusDice,
    dice,
    successes,
    extraLines
  });

  await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), rolls: [roll], content });

  if (!success) {
    const weakened = Boolean(actor.system?.states?.weakened?.active);
    const updates = {};
    if (weakened) {
      updates['system.resources.hp.severeWounds'] = Math.min(4, Math.max(0, Number(actor.system?.resources?.hp?.severeWounds ?? 0) + 1));
    } else {
      updates['system.states.weakened.active'] = true;
    }
    if (Object.keys(updates).length) await actor.update(updates);
  }
}

export function registerActorSheetRolls(ActorSheetClass) {
  ActorSheetClass.prototype._onAttributeTickClick = async function(event) {
    event.preventDefault();
    if (!this.document.isOwner) return;

    const button = event.currentTarget;
    if (!(button instanceof HTMLElement)) return;

    const key = button.dataset.attr;
    const index = Number(button.dataset.index);
    if (!key || Number.isNaN(index)) return;

    const current = getAttributeTicks(this.document, key);
    const next = nextTickValue(current, index);

    await this._updateDocument({ [`system.attributes.${key}.ticks`]: next }, button);
    this._syncAttributeTicks(key, next);
  };

  ActorSheetClass.prototype._syncAttributeTicks = function(key, value) {
    const root = this._getRootElement();
    if (!root || !key) return;

    const baseValue = Number(value) || 0;
    const bonusValue = Math.max(0, Number(this.document.system?.derived?.attributes?.[key]?.bonusDice ?? 0) || 0);
    const totalActive = Math.max(0, Math.min(4, baseValue + bonusValue));
    for (const tick of root.querySelectorAll(`.attribute-tick[data-attr="${CSS.escape(key)}"]`)) {
      const index = Number(tick.dataset.index);
      const isActive = Number.isFinite(index) && index < totalActive;
      const isBonus = Number.isFinite(index) && index >= baseValue && index < totalActive;
      tick.classList.toggle('active', isActive);
      tick.classList.toggle('is-bonus', isBonus);
    }
  };

  ActorSheetClass.prototype._onOverdoseRollClick = async function(event) {
    event.preventDefault();
    await createOverdoseRollMessage(this.document);
  };

  ActorSheetClass.prototype._onResistanceRollClick = async function(event) {
    event.preventDefault();
    await createResistanceRollMessage(this.document);
  };

  ActorSheetClass.prototype._onAttributeRollClick = async function(event) {
    event.preventDefault();
    const button = event.currentTarget;
    if (!(button instanceof HTMLElement)) return;
    const key = button.dataset.attr;
    if (!key) return;
    await openAttributeRollDialog(this.document, key);
  };
}
