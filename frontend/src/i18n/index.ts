import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  fr: {
    translation: {
      app: { name: "BriefOps", save: "Enregistrer", loading: "Chargement...", downloadPdf: "Télécharger PDF", soon: "Bientôt disponible" },
      auth: {
        login: "Se connecter",
        register: "Créer un compte",
        email: "Email",
        password: "Mot de passe",
        submitLogin: "Se connecter",
        submitRegister: "Créer un compte",
        continueRegister: "Continuer",
        forgotPassword: "Mot de passe oublié ?",
        offersRedirect: "Compte trouvé. Choisis une offre pour terminer l'activation.",
        accountMissing: "Compte introuvable. Passe en création de compte pour continuer.",
        logout: "Se déconnecter"
      },
      nav: { briefings: "Briefings", modules: "Modules", account: "Compte", billing: "Facturation", settings: "Paramètres", onboarding: "Onboarding", plan: "Plan" },
      onboarding: { title: "Bienvenue", orgName: "Nom de l'organisation", submit: "Continuer", fallback: "L'endpoint onboarding n'est pas encore disponible." },
      documents: {
        kicker: "Exports & Share",
        title: "Documents",
        subtitle: "Retrouve rapidement les PDF générés et les liens publics actifs pour les équipes terrain.",
        pdfTab: "PDFs",
        linksTab: "Liens",
        pdfSearchPlaceholder: "Rechercher un PDF ou un briefing",
        linkSearchPlaceholder: "Rechercher un lien partagé",
        pdfCount: "{{count}} PDF(s)",
        linkCount: "{{count}} lien(s)",
        loadingPdfs: "Chargement des PDFs...",
        loadingLinks: "Chargement des liens...",
        emptyPdfTitle: "Aucun PDF pour le moment",
        emptyPdfHint: "Génère un export depuis un briefing pour le retrouver ici.",
        emptyLinkTitle: "Aucun lien partagé",
        emptyLinkHint: "Crée un lien public depuis un PDF généré pour le retrouver ici.",
        copySuccess: "Lien copié",
        copyError: "Impossible de copier",
        noExpiry: "Aucune expiration",
        open: "Ouvrir",
        copy: "Copier"
      },
      modulesPage: {
        kicker: "Workspace Building Blocks",
        title: "Modules",
        subtitle: "Active les briques utiles à tes équipes et prépare le socle d’un futur marketplace sans alourdir le workflow actuel.",
        searchPlaceholder: "Rechercher un module",
        marketplace: "Marketplace",
        marketplaceSoon: "Marketplace bientot",
        active: "Actifs",
        available: "Disponibles",
        soon: "Soon",
        soonHint: "Extensions et templates à venir.",
        emptyTitle: "Aucun module trouvé",
        emptyHint: "Essaie un autre mot-clé.",
        enabled: "Activé",
        disabled: "Désactivé"
      },
      notificationsPage: {
        kicker: "Operational Alerts",
        title: "Notifications",
        subtitle: "Vue claire sur les événements qui approchent, avec un niveau de priorité lisible et des alertes faciles à purger.",
        searchPlaceholder: "Rechercher une alerte",
        empty: "Aucune notification pour le moment.",
        locationFallback: "Lieu non défini",
        priority: "Priorité {{level}}",
        priorityHigh: "haute",
        priorityMedium: "moyenne",
        priorityLow: "basse",
        todayOrPast: "Aujourd'hui / passé",
        inDays: "Dans {{count}} jour(s)",
        loading: "Chargement des notifications..."
      },
      routeError: {
        fallback: "Une erreur inattendue est survenue.",
        eyebrow: "Erreur application",
        title: "Impossible d'afficher cette page",
        route: "Route: {{path}}",
        back: "Retour",
        dashboard: "Aller au dashboard",
        reload: "Recharger"
      },
      staff: {
        title: "Staff",
        subtitle: "Gestion des membres d'équipe reliés à la table `staff`.",
        addTitle: "Ajouter un membre",
        selectBriefing: "Choisir un briefing",
        addButton: "Ajouter staff",
        adding: "Ajout...",
        listTitle: "Liste staff",
        empty: "Aucun membre staff.",
        noPhone: "Sans téléphone",
        noEmail: "Sans email",
        messages: { added: "Staff ajouté", required: "Briefing et nom requis" },
        placeholders: { fullName: "Nom complet", role: "Rôle", phone: "Téléphone", email: "Email", notes: "Notes" }
      },
      billing: { title: "Facturation", freeLimit: "Plan Free : 3 exports PDF par mois", upgrade: "Passer Pro" },
      settings: {
        title: "Paramètres",
        languageTitle: "Langue de l'interface",
        languageHint: "Choisis la langue utilisée dans l'application.",
        appearanceTitle: "Apparence",
        appearanceHint: "Réglez le mode jour/nuit depuis les paramètres.",
        themeLight: "Jour",
        themeDark: "Nuit",
        preferencesTitle: "Préférences régionales",
        preferencesHint: "Format heure, fuseau et format date pour l'affichage.",
        hourFormat: "Format heure",
        timezone: "Fuseau",
        dateFormat: "Format date"
      },
      editor: {
        saved: "Enregistré",
        saveError: "Échec de l'enregistrement",
        saving: "Enregistrement...",
        savedShort: "Enregistré"
      }
    }
  },
  en: {
    translation: {
      app: { name: "BriefOps", save: "Save", loading: "Loading...", downloadPdf: "Download PDF", soon: "Coming soon" },
      auth: {
        login: "Sign in",
        register: "Create account",
        email: "Email",
        password: "Password",
        submitLogin: "Sign in",
        submitRegister: "Create account",
        continueRegister: "Continue",
        forgotPassword: "Forgot password?",
        offersRedirect: "Account found. Choose a plan to finish activation.",
        accountMissing: "Account not found. Switch to sign up to continue.",
        logout: "Logout"
      },
      nav: { briefings: "Briefings", modules: "Modules", account: "Account", billing: "Billing", settings: "Settings", onboarding: "Onboarding", plan: "Plan" },
      onboarding: { title: "Welcome", orgName: "Organization name", submit: "Continue", fallback: "Onboarding endpoint is not available yet." },
      documents: {
        kicker: "Exports & Share",
        title: "Documents",
        subtitle: "Quickly find generated PDFs and active public links for field teams.",
        pdfTab: "PDFs",
        linksTab: "Links",
        pdfSearchPlaceholder: "Search a PDF or briefing",
        linkSearchPlaceholder: "Search a shared link",
        pdfCount: "{{count}} PDF(s)",
        linkCount: "{{count}} link(s)",
        loadingPdfs: "Loading PDFs...",
        loadingLinks: "Loading links...",
        emptyPdfTitle: "No PDF yet",
        emptyPdfHint: "Generate an export from a briefing to find it here.",
        emptyLinkTitle: "No shared link yet",
        emptyLinkHint: "Create a public link from a generated PDF to find it here.",
        copySuccess: "Link copied",
        copyError: "Unable to copy",
        noExpiry: "No expiry",
        open: "Open",
        copy: "Copy"
      },
      modulesPage: {
        kicker: "Workspace Building Blocks",
        title: "Modules",
        subtitle: "Enable the building blocks your teams need and prepare the base for a future marketplace without adding workflow weight.",
        searchPlaceholder: "Search a module",
        marketplace: "Marketplace",
        marketplaceSoon: "Marketplace soon",
        active: "Active",
        available: "Available",
        soon: "Soon",
        soonHint: "Extensions and templates are coming.",
        emptyTitle: "No module found",
        emptyHint: "Try another keyword.",
        enabled: "Enabled",
        disabled: "Disabled"
      },
      notificationsPage: {
        kicker: "Operational Alerts",
        title: "Notifications",
        subtitle: "A clear view of upcoming events, with readable priorities and easy-to-dismiss alerts.",
        searchPlaceholder: "Search an alert",
        empty: "No notification for now.",
        locationFallback: "Location not set",
        priority: "Priority {{level}}",
        priorityHigh: "high",
        priorityMedium: "medium",
        priorityLow: "low",
        todayOrPast: "Today / past",
        inDays: "In {{count}} day(s)",
        loading: "Loading notifications..."
      },
      routeError: {
        fallback: "An unexpected error occurred.",
        eyebrow: "Application error",
        title: "Unable to display this page",
        route: "Route: {{path}}",
        back: "Back",
        dashboard: "Go to dashboard",
        reload: "Reload"
      },
      staff: {
        title: "Staff",
        subtitle: "Manage team members linked to the `staff` table.",
        addTitle: "Add a member",
        selectBriefing: "Select a briefing",
        addButton: "Add staff",
        adding: "Adding...",
        listTitle: "Staff list",
        empty: "No staff member yet.",
        noPhone: "No phone",
        noEmail: "No email",
        messages: { added: "Staff added", required: "Briefing and name are required" },
        placeholders: { fullName: "Full name", role: "Role", phone: "Phone", email: "Email", notes: "Notes" }
      },
      billing: { title: "Billing", freeLimit: "Free plan: 3 PDF exports per month", upgrade: "Upgrade to Pro" },
      settings: {
        title: "Settings",
        languageTitle: "UI language",
        languageHint: "Choose the language used in the application.",
        appearanceTitle: "Appearance",
        appearanceHint: "Set light/dark mode from settings.",
        themeLight: "Light",
        themeDark: "Dark",
        preferencesTitle: "Regional preferences",
        preferencesHint: "Time format, timezone and date format for display.",
        hourFormat: "Time format",
        timezone: "Timezone",
        dateFormat: "Date format"
      },
      editor: {
        saved: "Saved",
        saveError: "Save failed",
        saving: "Saving...",
        savedShort: "Saved"
      }
    }
  }
} as const;

const saved = typeof window !== "undefined" ? window.localStorage.getItem("briefops:lang") : null;
const initialLng = saved === "fr" || saved === "en" ? saved : "fr";

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLng,
  fallbackLng: "en",
  interpolation: { escapeValue: false }
});

export default i18n;
