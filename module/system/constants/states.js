/**
 * Référentiel et helpers liés aux états du système Etername.
 *
 * Responsabilités :
 * - déclarer la liste des états disponibles ;
 * - associer chaque état à ses clés i18n ;
 * - définir les éventuels boutons de jet associés à certains états ;
 * - lire l’état actuel d’un acteur depuis ses données système ;
 * - préparer une version localisée des états pour les templates.
 *
 * Ce fichier ne doit pas contenir la logique d’application des malus ou effets mécaniques.
 * Les règles qui modifient les statistiques doivent rester dans les modules de règles dédiés.
 *
 * Note :
 * le nom `stats.js` est ambigu pour ce contenu.
 * Un nom comme `states.js` ou `actor-states.js` serait plus clair.
 */

const STATE_CATEGORY_KEYS = Object.freeze({
  general: "ETERN.STATES.CATEGORY_GENERAL",
  physical: "ETERN.STATES.CATEGORY_PHYSICAL",
  magical: "ETERN.STATES.CATEGORY_MAGICAL"
});

const STATE_ROLL_BUTTONS = Object.freeze({
  duration1d6: {
    id: "duration",
    labelKey: "ETERN.STATES.BUTTONS.DURATION_1D6"
  },

  test5Plus: {
    id: "test",
    labelKey: "ETERN.STATES.BUTTONS.TEST_5_PLUS"
  },

  ignite5Plus: {
    id: "ignite",
    labelKey: "ETERN.STATES.BUTTONS.TEST_5_PLUS"
  },

  turn1d6: {
    id: "tick",
    labelKey: "ETERN.STATES.BUTTONS.TURN_1D6"
  },

  loss1d6: {
    id: "loss",
    labelKey: "ETERN.STATES.BUTTONS.LOSS_1D6"
  },

  action1d6: {
    id: "action",
    labelKey: "ETERN.STATES.BUTTONS.ACTION_1D6"
  }
});

/**
 * Crée une définition d’état dans un format commun.
 *
 * Cette fonction évite de répéter la même structure pour chaque état.
 *
 * @param {string} id - Identifiant interne de l’état.
 * @param {string} nameKey - Clé i18n du nom de l’état.
 * @param {string} categoryKey - Clé i18n de la catégorie.
 * @param {string} descriptionKey - Clé i18n de la description.
 * @param {{id: string, labelKey: string}[]} [rollButtons=[]] - Boutons de jet disponibles pour cet état.
 * @returns {{id: string, nameKey: string, categoryKey: string, descriptionKey: string, rollButtons: object[]}} Définition d’état.
 */
function createStateDefinition(id, nameKey, categoryKey, descriptionKey, rollButtons = []) {
  return {
    id,
    nameKey,
    categoryKey,
    descriptionKey,
    rollButtons
  };
}

/**
 * Liste canonique des états disponibles dans le système.
 *
 * Les ids sont des valeurs internes stables.
 * Les textes affichés passent par les clés i18n.
 *
 * @type {{id: string, nameKey: string, categoryKey: string, descriptionKey: string, rollButtons: object[]}[]}
 */
export const ETERNAME_STATES = [
  createStateDefinition(
    "surprised",
    "ETERN.STATES.LIST.SURPRISED.NAME",
    STATE_CATEGORY_KEYS.general,
    "ETERN.STATES.LIST.SURPRISED.DESCRIPTION"
  ),

  createStateDefinition(
    "stunned",
    "ETERN.STATES.LIST.STUNNED.NAME",
    STATE_CATEGORY_KEYS.general,
    "ETERN.STATES.LIST.STUNNED.DESCRIPTION"
  ),

  createStateDefinition(
    "destabilized",
    "ETERN.STATES.LIST.DESTABILIZED.NAME",
    STATE_CATEGORY_KEYS.general,
    "ETERN.STATES.LIST.DESTABILIZED.DESCRIPTION"
  ),

  createStateDefinition(
    "slowed",
    "ETERN.STATES.LIST.SLOWED.NAME",
    STATE_CATEGORY_KEYS.general,
    "ETERN.STATES.LIST.SLOWED.DESCRIPTION"
  ),

  createStateDefinition(
    "prone",
    "ETERN.STATES.LIST.PRONE.NAME",
    STATE_CATEGORY_KEYS.general,
    "ETERN.STATES.LIST.PRONE.DESCRIPTION"
  ),

  createStateDefinition(
    "weakened",
    "ETERN.STATES.LIST.WEAKENED.NAME",
    STATE_CATEGORY_KEYS.general,
    "ETERN.STATES.LIST.WEAKENED.DESCRIPTION"
  ),

  createStateDefinition(
    "fear",
    "ETERN.STATES.LIST.FEAR.NAME",
    STATE_CATEGORY_KEYS.general,
    "ETERN.STATES.LIST.FEAR.DESCRIPTION"
  ),

  createStateDefinition(
    "blinded",
    "ETERN.STATES.LIST.BLINDED.NAME",
    STATE_CATEGORY_KEYS.physical,
    "ETERN.STATES.LIST.BLINDED.DESCRIPTION"
  ),

  createStateDefinition(
    "deaf",
    "ETERN.STATES.LIST.DEAF.NAME",
    STATE_CATEGORY_KEYS.physical,
    "ETERN.STATES.LIST.DEAF.DESCRIPTION"
  ),

  createStateDefinition(
    "bleeding",
    "ETERN.STATES.LIST.BLEEDING.NAME",
    STATE_CATEGORY_KEYS.physical,
    "ETERN.STATES.LIST.BLEEDING.DESCRIPTION",
    [STATE_ROLL_BUTTONS.duration1d6]
  ),

  createStateDefinition(
    "pain",
    "ETERN.STATES.LIST.PAIN.NAME",
    STATE_CATEGORY_KEYS.physical,
    "ETERN.STATES.LIST.PAIN.DESCRIPTION"
  ),

  createStateDefinition(
    "immobilized",
    "ETERN.STATES.LIST.IMMOBILIZED.NAME",
    STATE_CATEGORY_KEYS.physical,
    "ETERN.STATES.LIST.IMMOBILIZED.DESCRIPTION"
  ),

  createStateDefinition(
    "necrosis",
    "ETERN.STATES.LIST.NECROSIS.NAME",
    STATE_CATEGORY_KEYS.physical,
    "ETERN.STATES.LIST.NECROSIS.DESCRIPTION"
  ),

  createStateDefinition(
    "burn",
    "ETERN.STATES.LIST.BURN.NAME",
    STATE_CATEGORY_KEYS.magical,
    "ETERN.STATES.LIST.BURN.DESCRIPTION",
    [
      STATE_ROLL_BUTTONS.ignite5Plus,
      STATE_ROLL_BUTTONS.turn1d6
    ]
  ),

  createStateDefinition(
    "frozen",
    "ETERN.STATES.LIST.FROZEN.NAME",
    STATE_CATEGORY_KEYS.magical,
    "ETERN.STATES.LIST.FROZEN.DESCRIPTION",
    [STATE_ROLL_BUTTONS.test5Plus]
  ),

  createStateDefinition(
    "shock",
    "ETERN.STATES.LIST.SHOCK.NAME",
    STATE_CATEGORY_KEYS.magical,
    "ETERN.STATES.LIST.SHOCK.DESCRIPTION"
  ),

  createStateDefinition(
    "poisoned",
    "ETERN.STATES.LIST.POISONED.NAME",
    STATE_CATEGORY_KEYS.magical,
    "ETERN.STATES.LIST.POISONED.DESCRIPTION"
  ),

  createStateDefinition(
    "manaLeak",
    "ETERN.STATES.LIST.MANA_LEAK.NAME",
    STATE_CATEGORY_KEYS.magical,
    "ETERN.STATES.LIST.MANA_LEAK.DESCRIPTION",
    [STATE_ROLL_BUTTONS.loss1d6]
  ),

  createStateDefinition(
    "silenced",
    "ETERN.STATES.LIST.SILENCED.NAME",
    STATE_CATEGORY_KEYS.magical,
    "ETERN.STATES.LIST.SILENCED.DESCRIPTION"
  ),

  createStateDefinition(
    "madness",
    "ETERN.STATES.LIST.MADNESS.NAME",
    STATE_CATEGORY_KEYS.magical,
    "ETERN.STATES.LIST.MADNESS.DESCRIPTION",
    [STATE_ROLL_BUTTONS.action1d6]
  ),

  createStateDefinition(
    "charmed",
    "ETERN.STATES.LIST.CHARMED.NAME",
    STATE_CATEGORY_KEYS.magical,
    "ETERN.STATES.LIST.CHARMED.DESCRIPTION"
  )
];

/**
 * Index des états par id.
 *
 * Cela évite de refaire un `.find()` à chaque recherche d’état.
 *
 * @type {Map<string, object>}
 */
const STATE_DEFINITIONS_BY_ID = new Map(
  ETERNAME_STATES.map((state) => [state.id, state])
);

/**
 * Localise une clé i18n avec fallback.
 *
 * Cette fonction évite de répéter les vérifications de clé vide.
 * Elle dépend de `game.i18n`, donc elle doit être appelée seulement après l’initialisation de Foundry.
 *
 * @param {string} key - Clé i18n à localiser.
 * @param {string} [fallback=""] - Valeur utilisée si la clé est absente.
 * @returns {string} Texte localisé ou fallback.
 */
function localize(key, fallback = "") {
  return key ? game.i18n.localize(key) : fallback;
}

/**
 * Normalise la valeur numérique associée à un état.
 *
 * Cette valeur peut représenter une intensité, une durée, un compteur ou une autre donnée simple.
 * La fonction évite que `NaN` se propage dans le contexte de fiche.
 *
 * @param {unknown} value - Valeur brute à normaliser.
 * @returns {number} Valeur numérique valide.
 */
function normalizeStateValue(value) {
  const numericValue = Number(value ?? 0);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

/**
 * Récupère la définition système d’un état.
 *
 * @param {string} stateId - Identifiant interne de l’état.
 * @returns {object|null} Définition de l’état, ou `null` si l’id est inconnu.
 */
export function getStateDefinition(stateId) {
  return STATE_DEFINITIONS_BY_ID.get(String(stateId ?? "")) ?? null;
}

/**
 * Récupère les données courantes d’un état depuis les données système d’un acteur.
 *
 * La fonction renvoie toujours une structure stable :
 * - `active` : indique si l’état est actif ;
 * - `value` : valeur numérique associée à l’état.
 *
 * @param {object} [system={}] - Données système de l’acteur.
 * @param {string} [stateId=""] - Identifiant interne de l’état.
 * @returns {{active: boolean, value: number}} Données courantes de l’état.
 */
export function getStateData(system = {}, stateId = "") {
  const current = system?.states?.[stateId] ?? {};

  return {
    active: Boolean(current?.active),
    value: normalizeStateValue(current?.value)
  };
}

/**
 * Prépare la liste complète des états pour l’affichage dans une fiche.
 *
 * Pour chaque état, la fonction ajoute :
 * - le nom localisé ;
 * - la catégorie localisée ;
 * - la description localisée ;
 * - les données actuelles de l’acteur ;
 * - les boutons de jet localisés ;
 * - un booléen `hasActions` utile pour les templates.
 *
 * @param {object} [system={}] - Données système de l’acteur.
 * @returns {object[]} Liste des états enrichis et localisés pour le template.
 */
export function getPreparedStates(system = {}) {
  return ETERNAME_STATES.map((state) => {
    const data = getStateData(system, state.id);
    const rollButtons = (state.rollButtons ?? []).map((button) => ({
      ...button,
      label: localize(button.labelKey, button.id)
    }));

    return {
      ...state,
      name: localize(state.nameKey, state.id),
      category: localize(state.categoryKey, ""),
      description: localize(state.descriptionKey, ""),
      active: data.active,
      value: data.value,
      rollButtons,
      hasActions: rollButtons.length > 0
    };
  });
}