export const marketingLocales = ["fr", "nl"] as const;

export type MarketingLocale = (typeof marketingLocales)[number];

export function isMarketingLocale(value: string): value is MarketingLocale {
  return marketingLocales.includes(value as MarketingLocale);
}

export function detectMarketingLocale(acceptLanguage: string | null | undefined): MarketingLocale {
  const normalized = String(acceptLanguage ?? "").toLowerCase();
  if (normalized.includes("nl")) return "nl";
  return "fr";
}

type MarketingDictionary = {
  meta: {
    title: string;
    description: string;
  };
  nav: {
    product: string;
    login: string;
    cta: string;
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
    clarity: {
      title: string;
      description: string;
    };
    speed: {
      title: string;
      description: string;
    };
    sharing: {
      title: string;
      description: string;
    };
  };
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
        "BriefOPS aide les équipes événementielles à créer, partager et exporter des briefings opérationnels lisibles, modulaires et mobiles."
    },
    nav: {
      product: "Produit",
      login: "Connexion",
      cta: "Ouvrir l’app"
    },
    hero: {
      kicker: "Briefings événementiels opérationnels",
      title: "La façon simple de préparer un briefing terrain propre, lisible et partageable.",
      description:
        "Centralise les infos critiques d’un événement, active uniquement les modules utiles et partage un rendu clair aux équipes terrain sans perdre du temps dans des documents bricolés.",
      primaryCta: "Accéder à BriefOPS",
      secondaryCta: "Se connecter",
      bullets: [
        "Briefings structurés page par page",
        "Modules activables selon l’événement",
        "Exports PDF et liens staff en quelques clics"
      ]
    },
    sections: {
      clarity: {
        title: "Clarté terrain",
        description: "Les accès, livraisons, notes et contacts restent lisibles sur desktop comme sur mobile."
      },
      speed: {
        title: "Rapide à mettre à jour",
        description: "L’équipe édite un seul briefing vivant au lieu de multiplier les versions perdues."
      },
      sharing: {
        title: "Partage immédiat",
        description: "Expose le briefing en PDF ou via un lien sécurisé selon le besoin du terrain."
      }
    },
    workflow: {
      title: "Pensé pour un MVP opérationnel",
      steps: [
        {
          title: "Créer le briefing",
          description: "Renseigne les métadonnées de l’événement et prépare le canevas de travail."
        },
        {
          title: "Activer les bons modules",
          description: "N’affiche que les blocs utiles pour garder un briefing court, clair et exploitable."
        },
        {
          title: "Partager au bon format",
          description: "Diffuse le briefing aux équipes via PDF ou lien public selon la situation."
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
        "BriefOPS helpt eventteams om gestructureerde, modulaire en mobielvriendelijke briefings te maken, te delen en als PDF te exporteren."
    },
    nav: {
      product: "Product",
      login: "Inloggen",
      cta: "Open de app"
    },
    hero: {
      kicker: "Operationele eventbriefings",
      title: "De eenvoudige manier om een duidelijke, deelbare briefing voor het terrein op te bouwen.",
      description:
        "Bundel alle kritieke eventinfo, activeer alleen de nuttige modules en deel een helder briefingdocument met je teams zonder tijd te verliezen aan rommelige bestanden.",
      primaryCta: "Naar BriefOPS",
      secondaryCta: "Inloggen",
      bullets: [
        "Gestructureerde briefings per pagina",
        "Modules per eventtype inschakelen",
        "PDF-export en staff links in enkele klikken"
      ]
    },
    sections: {
      clarity: {
        title: "Duidelijk op het terrein",
        description: "Toegang, leveringen, notities en contactinfo blijven leesbaar op desktop en mobiel."
      },
      speed: {
        title: "Snel bij te werken",
        description: "Je team werkt in één levende briefing in plaats van verloren versies rond te sturen."
      },
      sharing: {
        title: "Direct delen",
        description: "Deel de briefing als PDF of via een beveiligde link afhankelijk van de situatie."
      }
    },
    workflow: {
      title: "Gebouwd voor een pragmatische MVP",
      steps: [
        {
          title: "Briefing aanmaken",
          description: "Vul de eventmetadata in en zet een duidelijke operationele basis op."
        },
        {
          title: "Juiste modules activeren",
          description: "Toon alleen de relevante blokken zodat de briefing kort en bruikbaar blijft."
        },
        {
          title: "Delen in het juiste formaat",
          description: "Verspreid de briefing via PDF of publieke link, aangepast aan de teams op het terrein."
        }
      ]
    },
    footer: {
      marketing: "Marketingsite",
      app: "Applicatie",
      language: "Taal"
    }
  }
};

export function getMarketingDictionary(locale: MarketingLocale) {
  return dictionaries[locale];
}

