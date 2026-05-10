/**
 * Préfixe de malédictions disponibles pour les enchantements.
 *
 * Responsabilités :
 * - déclarer les définitions de malédictions applicables en préfixe ;
 * - fournir leur id stable ;
 * - indiquer leur poids magique négatif ;
 * - associer leurs tags de filtrage ;
 * - fournir leurs labels et descriptions localisés en français et en anglais.
 *
 * Ce fichier ne doit contenir que des données de registre.
 * Il ne doit pas générer les malédictions, les appliquer aux items
 * ou gérer leur affichage dans les fiches.
 */

export const PREFIX_CURSES = Object.freeze([
  Object.freeze({
    id: "curse.prefix.meteorological",
    side: "prefix",
    magicWeight: -3,
    tags: Object.freeze(["weather"]),
    label: Object.freeze({
      fr: "Météorologique",
      en: "Meteorological"
    }),
    description: Object.freeze({
      fr: "L’effet ne s’active que sous certaines conditions météorologiques.",
      en: "The effect only activates under certain weather conditions."
    })
  }),

  Object.freeze({
    id: "curse.prefix.environmental",
    side: "prefix",
    magicWeight: -3,
    tags: Object.freeze(["environment"]),
    label: Object.freeze({
      fr: "Environnementale",
      en: "Environmental"
    }),
    description: Object.freeze({
      fr: "Les effets de cet objet ne s’appliquent que dans un environnement précis.",
      en: "The item only works in a specific environment."
    })
  }),

  Object.freeze({
    id: "curse.prefix.seasonal",
    side: "prefix",
    magicWeight: -5,
    tags: Object.freeze(["season"]),
    label: Object.freeze({
      fr: "Saisonnier",
      en: "Seasonal"
    }),
    description: Object.freeze({
      fr: "Les effets de cet objet ne s’appliquent qu’à une certaine période de l’année.",
      en: "The item only works during a specific season."
    })
  }),

  Object.freeze({
    id: "curse.prefix.draining",
    side: "prefix",
    magicWeight: -2,
    tags: Object.freeze(["life"]),
    label: Object.freeze({
      fr: "Drainant",
      en: "Draining"
    }),
    description: Object.freeze({
      fr: "Chaque utilisation fait perdre ROB PV à l’utilisateur.",
      en: "Each use costs the bearer ROB HP."
    })
  }),

  Object.freeze({
    id: "curse.prefix.battery",
    side: "prefix",
    magicWeight: -3,
    tags: Object.freeze(["meta"]),
    label: Object.freeze({
      fr: "Batterie",
      en: "Battery"
    }),
    description: Object.freeze({
      fr: "L’objet nécessite d’être rechargé par un rituel adéquat.",
      en: "The item must be recharged by an adequate ritual."
    })
  }),

  Object.freeze({
    id: "curse.prefix.bound",
    side: "prefix",
    magicWeight: -2,
    tags: Object.freeze(["meta"]),
    label: Object.freeze({
      fr: "Liée",
      en: "Bound"
    }),
    description: Object.freeze({
      fr: "L’objet ne peut plus être retiré par des moyens conventionnels.",
      en: "The item cannot be removed by conventional means."
    })
  }),

  Object.freeze({
    id: "curse.prefix.personal",
    side: "prefix",
    magicWeight: -1,
    tags: Object.freeze(["meta"]),
    label: Object.freeze({
      fr: "Personnel",
      en: "Personal"
    }),
    description: Object.freeze({
      fr: "L’objet n’est utilisable que par un personnage.",
      en: "The item can only be used by one character."
    })
  }),

  Object.freeze({
    id: "curse.prefix.hidden",
    side: "prefix",
    magicWeight: -2,
    tags: Object.freeze(["meta"]),
    label: Object.freeze({
      fr: "Caché",
      en: "Hidden"
    }),
    description: Object.freeze({
      fr: "Certains effets de l’objet restent cachés même après identification.",
      en: "Some effects stay hidden even after identification."
    })
  }),

  Object.freeze({
    id: "curse.prefix.addictive",
    side: "prefix",
    magicWeight: -2,
    tags: Object.freeze(["meta"]),
    label: Object.freeze({
      fr: "Addictif",
      en: "Addictive"
    }),
    description: Object.freeze({
      fr: "L’objet pousse le personnage à l’utiliser même dans des conditions inappropriées.",
      en: "The item urges its bearer to use it in inappropriate situations."
    })
  }),

  Object.freeze({
    id: "curse.prefix.ethereal",
    side: "prefix",
    magicWeight: -4,
    tags: Object.freeze(["meta"]),
    label: Object.freeze({
      fr: "Éthérée",
      en: "Ethereal"
    }),
    description: Object.freeze({
      fr: "L’objet a un nombre d’utilisations limitées avant d’être détruit ou vidé.",
      en: "The item has limited uses before it is destroyed or emptied."
    })
  })
]);