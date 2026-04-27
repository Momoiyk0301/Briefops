export const marketingLocales = ["fr", "nl", "en"] as const;

export type MarketingLocale = (typeof marketingLocales)[number];

export function isMarketingLocale(value: string): value is MarketingLocale {
  return marketingLocales.includes(value as MarketingLocale);
}

export function detectMarketingLocale(acceptLanguage: string | null | undefined): MarketingLocale {
  const normalized = String(acceptLanguage ?? "").toLowerCase();
  if (normalized.includes("nl")) return "nl";
  if (normalized.includes("en")) return "en";
  return "fr";
}

type MarketingDictionary = {
  meta: {
    title: string;
    description: string;
  };
  nav: {
    product: string;
    solution: string;
    howItWorks: string;
    login: string;
    cta: string;
  };
  problem: {
    label: string;
    text: string;
  };
  hero: {
    kicker: string;
    title: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
    bullets: string[];
  };
  sections: {
    clarity: { title: string; description: string };
    speed: { title: string; description: string };
    sharing: { title: string; description: string };
  };
  features: Array<{ title: string; description: string }>;
  workflow: {
    title: string;
    steps: Array<{ title: string; description: string }>;
  };
  footer: {
    marketing: string;
    app: string;
    language: string;
  };
};

const dictionaries: Record<MarketingLocale, MarketingDictionary> = {
  fr: {
    meta: {
      title: "BriefOPS | Briefings événementiels clairs pour les équipes terrain",
      description:
        "BriefOPS centralise toutes les informations opérationnelles d'un événement dans un briefing structuré, partageable par lien ou PDF, accessible sur mobile."
    },
    nav: {
      product: "Produit",
      solution: "Solution",
      howItWorks: "Comment ça marche",
      login: "Connexion",
      cta: "Essai gratuit"
    },
    problem: {
      label: "Le problème",
      text: "Les infos d'un événement sont éparpillées dans des fichiers bricolés, des chats et des mails. Les équipes terrain arrivent avec les mauvaises infos — ou pas d'infos du tout."
    },
    hero: {
      kicker: "SaaS pour les équipes événementielles",
      title: "Toutes les informations terrain réunies dans un seul briefing, accessible en quelques secondes.",
      description:
        "BriefOPS centralise les infos opérationnelles dans un document structuré et modulaire. Chaque équipe reçoit uniquement ce qui la concerne, via un lien ou un PDF — lisible sur mobile, prêt pour le terrain.",
      primaryCta: "Essai gratuit",
      secondaryCta: "Se connecter",
      bullets: [
        "Modules activables selon l'événement",
        "Partage segmenté par équipe",
        "Mobile, lisible sur le terrain"
      ]
    },
    sections: {
      clarity: {
        title: "Information centralisée",
        description: "Accès, planning, contacts, matériel — tout dans un seul document, sans version multiple ni confusion."
      },
      speed: {
        title: "Modules adaptables",
        description: "Active uniquement les blocs utiles et personnalise le contenu selon les besoins et les équipes impliquées."
      },
      sharing: {
        title: "Partage segmenté",
        description: "Lien ou PDF, avec une segmentation par équipe pour ne diffuser que les informations pertinentes à chacun."
      }
    },
    features: [
      {
        title: "Tout en un seul document",
        description: "Accès, planning, contacts, matériel — centralisés dans un briefing structuré, accessible en quelques secondes depuis n'importe quel appareil."
      },
      {
        title: "Modules activables",
        description: "Active uniquement les blocs utiles selon l'événement. Le briefing s'adapte aux besoins et aux équipes impliquées."
      },
      {
        title: "Partage segmenté par équipe",
        description: "Chaque groupe reçoit uniquement les informations qui le concernent, via un lien sécurisé ou un export PDF."
      },
      {
        title: "Mobile, prêt pour le terrain",
        description: "Accessible sur n'importe quel appareil, sans application à installer. Les équipes ont la bonne info au bon moment, sans confusion."
      }
    ],
    workflow: {
      title: "Comment ça marche",
      steps: [
        {
          title: "Centralise les infos",
          description: "Rassemble toutes les informations opérationnelles de l'événement dans un seul document structuré."
        },
        {
          title: "Adapte avec les modules",
          description: "Active les blocs utiles et personnalise le contenu selon les équipes et les besoins du terrain."
        },
        {
          title: "Partage au bon groupe",
          description: "Diffuse via lien sécurisé ou PDF — chaque équipe reçoit uniquement ce qui la concerne, au bon moment."
        }
      ]
    },
    footer: {
      marketing: "Site marketing",
      app: "Application",
      language: "Langue"
    }
  },

  nl: {
    meta: {
      title: "BriefOPS | Duidelijke eventbriefings voor operationele teams",
      description:
        "BriefOPS centraliseert alle operationele eventinfo in één gestructureerde briefing, deelbaar via link of PDF, toegankelijk op mobiel."
    },
    nav: {
      product: "Product",
      solution: "Oplossing",
      howItWorks: "Hoe het werkt",
      login: "Inloggen",
      cta: "Gratis starten"
    },
    problem: {
      label: "Het probleem",
      text: "Eventinfo is verspreid over losse bestanden, chats en mails. Terreinteams komen aan met de verkeerde info — of helemaal geen info."
    },
    hero: {
      kicker: "SaaS voor eventteams",
      title: "Alle terreininfo gebundeld in één briefing, toegankelijk in enkele seconden.",
      description:
        "BriefOPS centraliseert operationele info in één gestructureerd, modulair document. Elk team ontvangt alleen wat relevant is, via een link of PDF — leesbaar op mobiel, klaar voor het terrein.",
      primaryCta: "Gratis starten",
      secondaryCta: "Inloggen",
      bullets: [
        "Modules per evenementtype activeren",
        "Gesegmenteerd delen per team",
        "Mobiel leesbaar op het terrein"
      ]
    },
    sections: {
      clarity: {
        title: "Gecentraliseerde info",
        description: "Toegang, planning, contacten, materiaal — alles in één document, zonder verwarring of meerdere versies."
      },
      speed: {
        title: "Aanpasbare modules",
        description: "Activeer alleen de nuttige blokken en pas de inhoud aan per team en per situatie op het terrein."
      },
      sharing: {
        title: "Gesegmenteerd delen",
        description: "Link of PDF, met teamsegmentatie zodat iedereen alleen de voor hem relevante informatie ontvangt."
      }
    },
    features: [
      {
        title: "Alles in één document",
        description: "Toegang, planning, contacten, materiaal — gecentraliseerd in een gestructureerde briefing, toegankelijk in enkele seconden."
      },
      {
        title: "Aanpasbare modules",
        description: "Activeer alleen de nuttige blokken per evenement. De briefing past zich aan aan de behoeften van elk team."
      },
      {
        title: "Gesegmenteerd delen per team",
        description: "Elke groep ontvangt alleen de informatie die voor hen relevant is, via een beveiligde link of PDF-export."
      },
      {
        title: "Mobiel, klaar voor het terrein",
        description: "Toegankelijk op elk apparaat zonder app te installeren. Teams hebben de juiste info op het juiste moment, zonder verwarring."
      }
    ],
    workflow: {
      title: "Hoe het werkt",
      steps: [
        {
          title: "Centraliseer de info",
          description: "Bundel alle operationele eventgegevens in één duidelijk en gestructureerd document."
        },
        {
          title: "Pas aan met modules",
          description: "Activeer de nuttige modules en stel de inhoud in per team en per teamsituatie."
        },
        {
          title: "Deel met de juiste groep",
          description: "Via link of PDF met teamsegmentatie — elk teamlid krijgt alleen wat voor hem relevant is, op het juiste moment."
        }
      ]
    },
    footer: {
      marketing: "Marketingsite",
      app: "Applicatie",
      language: "Taal"
    }
  },

  en: {
    meta: {
      title: "BriefOPS | Clear event briefings for field teams",
      description:
        "BriefOPS centralises all operational event information in a structured briefing, shareable via link or PDF, accessible on mobile."
    },
    nav: {
      product: "Product",
      solution: "Solution",
      howItWorks: "How it works",
      login: "Sign in",
      cta: "Get started free"
    },
    problem: {
      label: "The problem",
      text: "Event information is scattered across loose files, chats and emails. Field teams show up with the wrong information — or no information at all."
    },
    hero: {
      kicker: "SaaS for event teams",
      title: "All field information in one briefing, accessible in seconds.",
      description:
        "BriefOPS centralises operational event information in a single structured, modular document. Each team receives only what is relevant — via a link or PDF, readable on mobile, ready for the field.",
      primaryCta: "Get started free",
      secondaryCta: "Sign in",
      bullets: [
        "Activatable modules per event",
        "Segmented sharing per team",
        "Mobile-ready for the field"
      ]
    },
    sections: {
      clarity: {
        title: "Centralised info",
        description: "Access, schedule, contacts, equipment — all in one document, no confusion, no multiple versions."
      },
      speed: {
        title: "Adaptable modules",
        description: "Activate only the relevant blocks and customise the content per team and per situation."
      },
      sharing: {
        title: "Segmented sharing",
        description: "Link or PDF, with team segmentation so everyone only sees the information relevant to them."
      }
    },
    features: [
      {
        title: "Everything in one document",
        description: "Access, schedule, contacts, equipment — centralised in a structured briefing, accessible in seconds from any device."
      },
      {
        title: "Activatable modules",
        description: "Enable only the blocks needed for each event. The briefing adapts to the requirements of each team and mission."
      },
      {
        title: "Team-segmented sharing",
        description: "Each group receives only the information relevant to them, via a secure link or PDF export."
      },
      {
        title: "Mobile-ready for the field",
        description: "Accessible on any device with no app to install. Teams have the right information at the right time, without confusion."
      }
    ],
    workflow: {
      title: "How it works",
      steps: [
        {
          title: "Centralise the info",
          description: "Gather all operational event information in a single clear, structured document."
        },
        {
          title: "Customise with modules",
          description: "Activate the useful modules and set the content per team and per field situation."
        },
        {
          title: "Share with the right group",
          description: "Via link or PDF with team segmentation — each member receives only what is relevant to them, at the right moment."
        }
      ]
    },
    footer: {
      marketing: "Marketing site",
      app: "Application",
      language: "Language"
    }
  }
};

export function getMarketingDictionary(locale: MarketingLocale) {
  return dictionaries[locale];
}
