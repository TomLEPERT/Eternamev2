/**
 * Extension de fiche acteur : Actor sheet bonus states.
 *
 * Responsabilités :
 * - ajouter à l’ActorSheetV2 les comportements propres à cette section ;
 * - lire ou mettre à jour uniquement les champs nécessaires à l’interface ;
 * - conserver les calculs de règles dans les modules `rules` ou `system`.
 *
 * Ce fichier doit rester un module UI spécialisé et ne pas devenir un service métier.
 */

import { getPreparedStates, getStateDefinition } from "../../system/constants/states.js";
import { ETERNAME_ATTRIBUTES } from "../../system/constants/attributes.js";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"'`]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "`": "&#96;"
  }[char] ?? char));
}

function localizeAttributeLabel(key) {
  const meta = ETERNAME_ATTRIBUTES[key];
  return meta ? game.i18n.localize(meta.label) : key;
}

async function rollStateMessage(actor, stateId, rollId, formula = "1d6") {
  const roll = await (new Roll(formula)).roll({ async: true });
  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: `<strong>${escapeHtml(stateId)}</strong> — ${escapeHtml(rollId)}`
  });
  return Number(roll.total ?? 0) || 0;
}

function buildStateCardsMarkup(states = []) {
  const activeStates = states.filter((state) => state.active);
  if (!activeStates.length) {
    return `<p class="active-states-empty">${game.i18n.localize("ETERN.STATES.ACTIVE_EMPTY")}</p>`;
  }

  return activeStates.map((state) => {
    const buttons = state.hasActions
      ? `<div class="active-state-actions">${state.rollButtons.map((button) => `
          <button type="button" class="state-roll-button" data-state-id="${escapeHtml(state.id)}" data-roll-id="${escapeHtml(button.id)}">${escapeHtml(button.label)}</button>
        `).join("")}</div>`
      : "";

    const value = `<div class="active-state-value"><span>${game.i18n.localize("ETERN.STATES.VALUE_DURATION")}</span><strong>${escapeHtml(state.value)}</strong></div>`;

    return `
      <article class="active-state-card" data-state-card="${escapeHtml(state.id)}">
        <header class="active-state-card-header">
          <div>
            <h4>${escapeHtml(state.name)}</h4>
            <span class="active-state-category">${escapeHtml(state.category)}</span>
          </div>
          ${value}
        </header>
        <p class="active-state-description">${escapeHtml(state.description ?? "")}</p>
        ${buttons}
      </article>
    `;
  }).join("");
}

export function registerActorSheetBonusStates(ActorSheetClass) {
  ActorSheetClass.prototype._onStateRollAction = async function(event) {
    event.preventDefault();

    const button = event.currentTarget;
    if (!(button instanceof HTMLElement)) return;

    const stateId = String(button.dataset.stateId ?? "");
    const rollId = String(button.dataset.rollId ?? "default");
    if (!stateId) return;

    const path = `system.states.${stateId}`;
    const current = foundry.utils.getProperty(this.document, path) ?? {};
    const currentValue = Number(current?.value ?? 0) || 0;

    if (stateId === "bleeding" && rollId === "duration") {
      const total = await rollStateMessage(this.document, stateId, rollId);
      await this._updateDocument({ [`${path}.active`]: true, [`${path}.value`]: total }, button);
      this._refreshStatePanels();
      return;
    }

    if (stateId === "burn" && rollId === "ignite") {
      const total = await rollStateMessage(this.document, stateId, rollId);
      const active = total >= 5;
      await this._updateDocument({ [`${path}.active`]: active }, button);
      this._refreshStatePanels();
      ui.notifications?.info?.(active ? game.i18n.localize("ETERN.STATES.BURN_SUCCESS") : game.i18n.localize("ETERN.STATES.BURN_FAIL"));
      return;
    }

    if (stateId === "burn" && rollId === "tick") {
      const total = await rollStateMessage(this.document, stateId, rollId);
      let content = "";
      if (total <= 2) {
        content = game.i18n.localize("ETERN.STATES.BURN_TICK_END");
        await this._updateDocument({ [`${path}.active`]: false, [`${path}.value`]: 0 }, button);
        this._refreshStatePanels();
      } else if (total <= 5) {
        content = game.i18n.localize("ETERN.STATES.BURN_TICK_3");
      } else {
        content = game.i18n.localize("ETERN.STATES.BURN_TICK_6");
      }

      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.document }),
        content: `<p><strong>${game.i18n.localize("ETERN.STATES.BURN")}</strong> — <strong>${total}</strong> → ${escapeHtml(content)}</p>`
      });
      return;
    }

    if (stateId === "frozen" && rollId === "test") {
      const total = await rollStateMessage(this.document, stateId, rollId);
      if (total >= 5) {
        await this._updateDocument({ [`${path}.active`]: true, [`${path}.value`]: currentValue + 1 }, button);
        this._refreshStatePanels();
        ui.notifications?.info?.(game.i18n.localize("ETERN.STATES.FROZEN_SUCCESS"));
      } else {
        ui.notifications?.info?.(game.i18n.localize("ETERN.STATES.FROZEN_FAIL"));
      }
      return;
    }

    if (stateId === "manaLeak" && rollId === "loss") {
      const total = await rollStateMessage(this.document, stateId, rollId);
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.document }),
        content: `<p><strong>${game.i18n.localize("ETERN.STATES.MANA_LEAK")}</strong> : ${game.i18n.format("ETERN.STATES.MANA_LEAK_MESSAGE", { value: total })}</p>`
      });
      return;
    }

    if (stateId === "madness" && rollId === "action") {
      const total = await rollStateMessage(this.document, stateId, rollId);
      const result = total <= 2
        ? game.i18n.localize("ETERN.STATES.MADNESS_1_2")
        : total <= 4
          ? game.i18n.localize("ETERN.STATES.MADNESS_3_4")
          : game.i18n.localize("ETERN.STATES.MADNESS_5_6");

      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.document }),
        content: `<p><strong>${game.i18n.localize("ETERN.STATES.MADNESS")}</strong> : <strong>${total}</strong> → ${escapeHtml(result)}</p>`
      });
      return;
    }

    await rollStateMessage(this.document, stateId, rollId);
  };

  ActorSheetClass.prototype._refreshStatePanels = function() {
    const root = this._getRootElement();
    if (!root) return;

    const states = getPreparedStates(this.document.system ?? {});

    for (const state of states) {
      const checkbox = root.querySelector(`input[name="system.states.${CSS.escape(state.id)}.active"]`);
      if (checkbox instanceof HTMLInputElement && checkbox.type === "checkbox") {
        checkbox.checked = Boolean(state.active);
      }

      const valueInput = root.querySelector(`input[name="system.states.${CSS.escape(state.id)}.value"]`);
      if (valueInput instanceof HTMLInputElement && document.activeElement !== valueInput) {
        valueInput.value = String(state.value ?? 0);
      }
    }

    const container = root.querySelector("[data-active-states]");
    if (container) {
      container.innerHTML = buildStateCardsMarkup(states);
      this._bindStateControls(root);
    }
  };

  ActorSheetClass.prototype._bindStateControls = function(root) {
    this._bindElements(root, {
      selector: '.state-roll-button[data-state-id][data-roll-id]',
      datasetKey: 'boundStateRoll',
      eventName: 'click',
      handlerName: '_onStateRollAction'
    });

    this._bindElements(root, {
      selector: '[data-action="roll-resistance"]',
      datasetKey: 'boundResistanceRoll',
      eventName: 'click',
      handlerName: '_onResistanceRollClick'
    });
  };

  ActorSheetClass.prototype._getBonusValue = function(path, fallback = 0) {
    const value = foundry.utils.getProperty(this.document, path);
    return Number.isFinite(Number(value)) ? Number(value) : fallback;
  };

  ActorSheetClass.prototype._getBonusStateSummary = function() {
    return getPreparedStates(this.document.system ?? {});
  };

  ActorSheetClass.prototype._getStateResistanceLabel = function() {
    const attrKey = String(this.document.system?.stateResistance?.attr ?? 'robustness');
    return localizeAttributeLabel(attrKey);
  };

  ActorSheetClass.prototype._getStateDefinition = function(stateId) {
    return getStateDefinition(stateId);
  };
}
