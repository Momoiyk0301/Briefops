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
  seoPages: {
    eventBriefingTemplate: SeoPageDictionary;
    briefingGenerator: SeoPageDictionary;
  };
  footer: {
    marketing: string;
    app: string;
    language: string;
  };
};

type SeoPageDictionary = {
  slug: string;
  meta: {
    title: string;
    description: string;
  };
  navLabel: string;
  hero: {
    kicker: string;
    title: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
  };
  sections: Array<{ title: string; description: string }>;
  checklistTitle: string;
  checklist: string[];
  finalCta: {
    title: string;
    description: string;
    button: string;
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
    seoPages: {
      eventBriefingTemplate: {
        slug: "event-briefing-template",
        meta: {
          title: "Event briefing template | Modèle de briefing événementiel | BriefOPS",
          description:
            "Un modèle de briefing événementiel structuré pour centraliser accès, planning, contacts, matériel et consignes terrain."
        },
        navLabel: "Event briefing template",
        hero: {
          kicker: "Modèle opérationnel événementiel",
          title: "Un event briefing template clair pour préparer chaque équipe terrain.",
          description:
            "Structure tes briefings autour des informations essentielles: accès, planning, contacts, livraisons, véhicules, matériel et notes. BriefOPS transforme ce template en document vivant, partageable par lien ou PDF.",
          primaryCta: "Créer un briefing",
          secondaryCta: "Voir le générateur"
        },
        sections: [
          {
            title: "Une structure réutilisable",
            description: "Pars d’un cadre stable pour éviter les oublis entre deux événements, même quand le planning change vite."
          },
          {
            title: "Des modules activables",
            description: "Ajoute uniquement les blocs utiles: accès, livraisons, staff, véhicules, équipement, contacts ou notes libres."
          },
          {
            title: "Un partage prêt terrain",
            description: "Diffuse le briefing en PDF ou via un lien segmenté pour que chaque équipe reçoive seulement les informations utiles."
          }
        ],
        checklistTitle: "Ce que le template doit couvrir",
        checklist: [
          "Lieu, accès, parking et contact sur site",
          "Planning opérationnel et livraisons",
          "Staff, rôles, téléphones et emails utiles",
          "Matériel, véhicules, notes et consignes terrain"
        ],
        finalCta: {
          title: "Remplace les fichiers dispersés par un briefing centralisé.",
          description: "Crée un workspace BriefOPS et transforme ton template en briefing actionnable pour chaque événement.",
          button: "Démarrer gratuitement"
        }
      },
      briefingGenerator: {
        slug: "briefing-generator",
        meta: {
          title: "Briefing generator | Générateur de briefings événementiels | BriefOPS",
          description:
            "Génère des briefings événementiels modulaires, exportables en PDF et partageables par équipe avec BriefOPS."
        },
        navLabel: "Briefing generator",
        hero: {
          kicker: "Générateur de briefing",
          title: "Un briefing generator pour produire des documents terrain en quelques minutes.",
          description:
            "Compose ton briefing avec des modules, prévisualise le rendu A4, exporte en PDF et partage les bonnes informations aux bonnes équipes sans refaire le document à chaque fois.",
          primaryCta: "Générer un briefing",
          secondaryCta: "Voir le template"
        },
        sections: [
          {
            title: "Création plus rapide",
            description: "Démarre avec les informations clés puis enrichis le briefing module par module au lieu de repartir d’un fichier vide."
          },
          {
            title: "PDF et liens publics",
            description: "Génère un PDF versionné ou un lien sécurisé pour les équipes terrain, avec une vue lisible sur mobile."
          },
          {
            title: "Contrôle par workspace",
            description: "Garde les briefings, exports, liens et quotas dans un même espace de travail connecté à ton équipe."
          }
        ],
        checklistTitle: "Fonctions du générateur",
        checklist: [
          "Création de briefings par événement",
          "Modules activables et données structurées",
          "Prévisualisation, export PDF et historique",
          "Partage par équipe avec liens publics"
        ],
        finalCta: {
          title: "Passe d’un fichier statique à un générateur de briefings.",
          description: "BriefOPS t’aide à produire, maintenir et partager les documents opérationnels sans friction.",
          button: "Créer mon premier briefing"
        }
      }
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
    seoPages: {
      eventBriefingTemplate: {
        slug: "event-briefing-template",
        meta: {
          title: "Event briefing template | Eventbriefing sjabloon | BriefOPS",
          description:
            "Een gestructureerd eventbriefing-sjabloon om toegang, planning, contacten, materiaal en terreininfo te centraliseren."
        },
        navLabel: "Event briefing template",
        hero: {
          kicker: "Operationeel eventsjabloon",
          title: "Een helder event briefing template voor elk terreinteam.",
          description:
            "Structureer je briefings rond de essentiele info: toegang, planning, contacten, leveringen, voertuigen, materiaal en notities. BriefOPS maakt van dit template een levend document dat je deelt via link of PDF.",
          primaryCta: "Briefing maken",
          secondaryCta: "Generator bekijken"
        },
        sections: [
          {
            title: "Een herbruikbare structuur",
            description: "Start vanuit een vast kader zodat je niets vergeet tussen events, ook wanneer de planning snel wijzigt."
          },
          {
            title: "Activeerbare modules",
            description: "Voeg alleen de nuttige blokken toe: toegang, leveringen, staff, voertuigen, materiaal, contacten of vrije notities."
          },
          {
            title: "Klaar om te delen",
            description: "Deel de briefing als PDF of via een gesegmenteerde link zodat elk team alleen de juiste info krijgt."
          }
        ],
        checklistTitle: "Wat het template moet bevatten",
        checklist: [
          "Locatie, toegang, parking en contact ter plaatse",
          "Operationele planning en leveringen",
          "Staff, rollen, telefoons en nuttige e-mails",
          "Materiaal, voertuigen, notities en terreinrichtlijnen"
        ],
        finalCta: {
          title: "Vervang losse bestanden door een centrale briefing.",
          description: "Maak een BriefOPS-workspace en zet je template om in een bruikbare briefing voor elk event.",
          button: "Gratis starten"
        }
      },
      briefingGenerator: {
        slug: "briefing-generator",
        meta: {
          title: "Briefing generator | Event briefing generator | BriefOPS",
          description:
            "Genereer modulaire eventbriefings, exporteer ze als PDF en deel ze per team met BriefOPS."
        },
        navLabel: "Briefing generator",
        hero: {
          kicker: "Briefinggenerator",
          title: "Een briefing generator om terrein-documenten in minuten te maken.",
          description:
            "Stel je briefing samen met modules, bekijk de A4-preview, exporteer naar PDF en deel de juiste info met de juiste teams zonder telkens opnieuw te beginnen.",
          primaryCta: "Briefing genereren",
          secondaryCta: "Template bekijken"
        },
        sections: [
          {
            title: "Sneller creeren",
            description: "Begin met de kerninfo en verrijk de briefing module per module in plaats van een leeg document te openen."
          },
          {
            title: "PDF en publieke links",
            description: "Genereer een versie-PDF of beveiligde link voor terreinploegen, met een mobiele weergave."
          },
          {
            title: "Controle per workspace",
            description: "Houd briefings, exports, links en quota samen in een workspace die met je team verbonden is."
          }
        ],
        checklistTitle: "Functies van de generator",
        checklist: [
          "Briefings maken per event",
          "Activeerbare modules en gestructureerde data",
          "Preview, PDF-export en historiek",
          "Delen per team via publieke links"
        ],
        finalCta: {
          title: "Ga van een statisch bestand naar een briefinggenerator.",
          description: "BriefOPS helpt je operationele documenten te maken, onderhouden en delen zonder frictie.",
          button: "Mijn eerste briefing maken"
        }
      }
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
    seoPages: {
      eventBriefingTemplate: {
        slug: "event-briefing-template",
        meta: {
          title: "Event briefing template | Operational event briefing | BriefOPS",
          description:
            "A structured event briefing template to centralise access, schedule, contacts, equipment and field instructions."
        },
        navLabel: "Event briefing template",
        hero: {
          kicker: "Operational event template",
          title: "A clear event briefing template for every field team.",
          description:
            "Structure briefings around the essentials: access, schedule, contacts, deliveries, vehicles, equipment and notes. BriefOPS turns the template into a living document shareable by link or PDF.",
          primaryCta: "Create a briefing",
          secondaryCta: "View generator"
        },
        sections: [
          {
            title: "A reusable structure",
            description: "Start from a stable framework so important details are not missed between events, even when plans move fast."
          },
          {
            title: "Activatable modules",
            description: "Add only the blocks you need: access, deliveries, staff, vehicles, equipment, contacts or free notes."
          },
          {
            title: "Field-ready sharing",
            description: "Share the briefing as a PDF or segmented link so each team receives only the information they need."
          }
        ],
        checklistTitle: "What the template should cover",
        checklist: [
          "Venue, access, parking and on-site contact",
          "Operational schedule and deliveries",
          "Staff, roles, phone numbers and useful emails",
          "Equipment, vehicles, notes and field instructions"
        ],
        finalCta: {
          title: "Replace scattered files with one central briefing.",
          description: "Create a BriefOPS workspace and turn your template into an actionable briefing for every event.",
          button: "Start free"
        }
      },
      briefingGenerator: {
        slug: "briefing-generator",
        meta: {
          title: "Briefing generator | Event briefing software | BriefOPS",
          description:
            "Generate modular event briefings, export them as PDFs and share them by team with BriefOPS."
        },
        navLabel: "Briefing generator",
        hero: {
          kicker: "Briefing generator",
          title: "A briefing generator for field-ready documents in minutes.",
          description:
            "Compose your briefing with modules, preview the A4 output, export to PDF and share the right information with the right teams without rebuilding the document every time.",
          primaryCta: "Generate a briefing",
          secondaryCta: "View template"
        },
        sections: [
          {
            title: "Faster creation",
            description: "Start with the core information and enrich the briefing module by module instead of beginning from a blank file."
          },
          {
            title: "PDFs and public links",
            description: "Generate a versioned PDF or secure link for field teams, with a mobile-readable view."
          },
          {
            title: "Workspace control",
            description: "Keep briefings, exports, links and quotas in a single workspace connected to your team."
          }
        ],
        checklistTitle: "Generator features",
        checklist: [
          "Event-by-event briefing creation",
          "Activatable modules and structured data",
          "Preview, PDF export and history",
          "Team-based sharing with public links"
        ],
        finalCta: {
          title: "Move from static files to a briefing generator.",
          description: "BriefOPS helps you create, maintain and share operational documents without friction.",
          button: "Create my first briefing"
        }
      }
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
