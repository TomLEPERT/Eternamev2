/**
 * Suffixes de malédictions disponibles pour les enchantements.
 *
 * Responsabilités :
 * - déclarer les définitions de malédictions applicables en suffixe ;
 * - fournir leur id stable ;
 * - indiquer leur poids magique négatif ;
 * - associer leurs tags de filtrage ;
 * - fournir leurs labels et descriptions localisés en français et en anglais.
 *
 * Ce fichier ne doit contenir que des données de registre.
 * Il ne doit pas générer les malédictions, les appliquer aux items
 * ou gérer leur affichage dans les fiches.
 */

export const SUFFIX_CURSES = Object.freeze([
  Object.freeze({
    id: "curse.suffix.rule-of-three",
    side: "suffix",
    magicWeight: -4,
    tags: Object.freeze(["meta"]),
    label: Object.freeze({
      fr: "Règle de trois",
      en: "Rule of three"
    }),
    description: Object.freeze({
      fr: "Il faut remplir une condition 3 fois avant que l’effet s’active.",
      en: "A condition must be met 3 times before the effect triggers."
    })
  }),

  Object.freeze({
    id: "curse.suffix.relentless",
    side: "suffix",
    magicWeight: -4,
    tags: Object.freeze(["attack"]),
    label: Object.freeze({
      fr: "Acharné",
      en: "Relentless"
    }),
    description: Object.freeze({
      fr: "L’effet nécessite de toucher la cible 3 fois avant de s’activer.",
      en: "The effect requires hitting the target 3 times before it triggers."
    })
  }),

  Object.freeze({
    id: "curse.suffix.burst-start",
    side: "suffix",
    magicWeight: -3,
    tags: Object.freeze(["combat"]),
    label: Object.freeze({
      fr: "Départ en trombe",
      en: "Burst start"
    }),
    description: Object.freeze({
      fr: "L’effet ne peut être activé qu’au premier tour de combat.",
      en: "The effect only activates on the first round of combat."
    })
  }),

  Object.freeze({
    id: "curse.suffix.joker",
    side: "suffix",
    magicWeight: -4,
    tags: Object.freeze(["meta"]),
    label: Object.freeze({
      fr: "Joker",
      en: "Joker"
    }),
    description: Object.freeze({
      fr: "L’effet est limité à 1d6 utilisations.",
      en: "The effect is limited to 1d6 uses."
    })
  }),

  Object.freeze({
    id: "curse.suffix.recharge",
    side: "suffix",
    magicWeight: -2,
    tags: Object.freeze(["meta"]),
    label: Object.freeze({
      fr: "Recharge",
      en: "Recharge"
    }),
    description: Object.freeze({
      fr: "L’objet est soumis à un effet de recharge (6+).",
      en: "The item is subject to a recharge effect (6+)."
    })
  }),

  Object.freeze({
    id: "curse.suffix.warm-up",
    side: "suffix",
    magicWeight: -2,
    tags: Object.freeze(["meta"]),
    label: Object.freeze({
      fr: "Échauffement",
      en: "Warm-up"
    }),
    description: Object.freeze({
      fr: "L’effet ne s’active qu’après avoir subi ROB dégâts.",
      en: "The effect only activates after the bearer has taken ROB damage."
    })
  }),

  Object.freeze({
    id: "curse.suffix.adrenaline",
    side: "suffix",
    magicWeight: -6,
    tags: Object.freeze(["life"]),
    label: Object.freeze({
      fr: "Adrénaline",
      en: "Adrenaline"
    }),
    description: Object.freeze({
      fr: "L’effet ne s’active que lorsque le porteur a subi au moins 2 blessures graves.",
      en: "The effect only activates when the bearer has suffered at least 2 severe wounds."
    })
  }),

  Object.freeze({
    id: "curse.suffix.decisive",
    side: "suffix",
    magicWeight: -2,
    tags: Object.freeze(["attack"]),
    label: Object.freeze({
      fr: "Décisif",
      en: "Decisive"
    }),
    description: Object.freeze({
      fr: "L’effet ne s’active que lorsqu’un coup critique est réalisé.",
      en: "The effect only activates on a critical hit."
    })
  }),

  Object.freeze({
    id: "curse.suffix.limited",
    side: "suffix",
    magicWeight: -4,
    tags: Object.freeze(["attribute"]),
    label: Object.freeze({
      fr: "Limitée",
      en: "Limited"
    }),
    description: Object.freeze({
      fr: "L’objet ne permet pas de dépasser 5 points dans une caractéristique.",
      en: "The item cannot raise an attribute above 5."
    })
  }),

  Object.freeze({
    id: "curse.suffix.unstable",
    side: "suffix",
    magicWeight: -3,
    tags: Object.freeze(["meta"]),
    label: Object.freeze({
      fr: "Instable",
      en: "Unstable"
    }),
    description: Object.freeze({
      fr: "L’effet a 1 chance sur 6 d’échouer ou de causer un résultat négatif.",
      en: "The effect has a 1-in-6 chance to fail or cause a negative outcome."
    })
  }),

  Object.freeze({
    id: "curse.suffix.nemesis",
    side: "suffix",
    magicWeight: -3,
    tags: Object.freeze(["enemy"]),
    label: Object.freeze({
      fr: "Némésis",
      en: "Nemesis"
    }),
    description: Object.freeze({
      fr: "L’effet ne s’active que face à un certain type d’adversaires.",
      en: "The effect only activates against a specific type of foe."
    })
  })
]);