/**
 * Référentiel des attributs principaux du système Etername.
 *
 * Responsabilités :
 * - déclarer la liste canonique des attributs utilisés par les personnages ;
 * - associer chaque attribut à son abréviation, sa clé i18n, son icône et sa couleur ;
 * - fournir une valeur maximale commune pour les scores d’attributs.
 *
 * Ce fichier doit rester un fichier de données.
 * Il ne doit pas contenir de logique de calcul, de jet ou de rendu d’interface.
 *
 * Attention :
 * les clés d’attributs sont utilisées dans les données des acteurs.
 * Les renommer nécessite une migration des données existantes.
 */

const ATTRIBUTE_ICON_PATH = "systems/eternamev2/assets/icons/attributes/";

/**
 * Valeur maximale autorisée pour un attribut.
 *
 * Cette constante sert à centraliser la limite système afin d’éviter
 * d’avoir la valeur `18` répétée dans les modèles, feuilles ou règles.
 *
 * @type {number}
 */
export const ETERNAME_ATTRIBUTE_MAX_VALUE = 18;

/**
 * Liste canonique des attributs du système.
 *
 * Chaque entrée contient :
 * - `abbr` : abréviation affichable dans l’interface ;
 * - `label` : clé i18n du nom complet de l’attribut ;
 * - `icon` : chemin de l’icône associée ;
 * - `color` : couleur d’accent utilisée pour l’affichage.
 *
 * Les clés d’objet, comme `strength`, `robustness` ou `agility`,
 * sont les identifiants internes utilisés par le code et les données acteur.
 *
 * @type {Record<string, {abbr: string, label: string, icon: string, color: string}>}
 */
export const ETERNAME_ATTRIBUTES = {
  strength: {
    abbr: "FOR",
    label: "ETERN.ATTR.STRENGTH",
    icon: `${ATTRIBUTE_ICON_PATH}for.svg`,
    color: "#b13a1c"
  },

  robustness: {
    abbr: "ROB",
    label: "ETERN.ATTR.ROBUSTNESS",
    icon: `${ATTRIBUTE_ICON_PATH}rob.svg`,
    color: "#b8841d"
  },
  
  hability: {
    abbr: "HAB",
    label: "ETERN.ATTR.HABILITY",
    icon: `${ATTRIBUTE_ICON_PATH}hab.svg`,
    color: "#c2702a"
  },

  agility: {
    abbr: "AGI",
    label: "ETERN.ATTR.AGILITY",
    icon: `${ATTRIBUTE_ICON_PATH}agi.svg`,
    color: "#6e8f2e"
  },

  perception: {
    abbr: "PER",
    label: "ETERN.ATTR.PERCEPTION",
    icon: `${ATTRIBUTE_ICON_PATH}per.svg`,
    color: "#6e275f"
  },

  instinct: {
    abbr: "INS",
    label: "ETERN.ATTR.INSTINCT",
    icon: `${ATTRIBUTE_ICON_PATH}ins.svg`,
    color: "#7a4d39"
  },

  reasoning: {
    abbr: "RAI",
    label: "ETERN.ATTR.REASONING",
    icon: `${ATTRIBUTE_ICON_PATH}rai.svg`,
    color: "#426b90"
  },

  knowledge: {
    abbr: "SAV",
    label: "ETERN.ATTR.KNOWLEDGE",
    icon: `${ATTRIBUTE_ICON_PATH}sav.svg`,
    color: "#243f75"
  },

  aura: {
    abbr: "AUR",
    label: "ETERN.ATTR.AURA",
    icon: `${ATTRIBUTE_ICON_PATH}aur.svg`,
    color: "#36bdd0"
  },

  bagou: {
    abbr: "BAG",
    label: "ETERN.ATTR.BAGOU",
    icon: `${ATTRIBUTE_ICON_PATH}bag.svg`,
    color: "#8b48b7"
  },

  magic: {
    abbr: "MAG",
    label: "ETERN.ATTR.MAGIC",
    icon: `${ATTRIBUTE_ICON_PATH}mag.svg`,
    color: "#58698d"
  },

  chance: {
    abbr: "CHA",
    label: "ETERN.ATTR.CHANCE",
    icon: `${ATTRIBUTE_ICON_PATH}cha.svg`,
    color: "#e0b500"
  }
};