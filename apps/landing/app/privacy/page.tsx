import type { Metadata } from "next";
import { LegalLayout, L2, LP, LUl, LHighlight } from "@/marketing/LegalLayout";

export const metadata: Metadata = {
  title: "Politique de confidentialité — BriefOPS",
  description: "Politique de confidentialité RGPD de BriefOPS",
  robots: { index: true, follow: true }
};

export default function PrivacyPage() {
  return (
    <LegalLayout
      kicker="RGPD · Document légal"
      title="Politique de confidentialité"
      updated="Dernière mise à jour : 4 mai 2026 · Conforme RGPD (UE) 2016/679 · Peak Events SRL"
    >
      <LHighlight>
        <p><strong>En bref :</strong> Nous collectons uniquement les données nécessaires au fonctionnement du service. Nous ne vendons jamais vos données. Vous pouvez exercer vos droits à tout moment via <a href="mailto:info@peak-events.be" className="text-[#1d4ed8]">info@peak-events.be</a>.</p>
      </LHighlight>

      <L2>1. Responsable du traitement</L2>
      <LP>
        <strong>Peak Events SRL</strong><br />
        Avenue AJ Slegers 174, 1200 Bruxelles, Belgique<br />
        Numéro d'entreprise (BCE) : 1014.209.333<br />
        TVA : BE 1014.209.333<br />
        Email : <a href="mailto:info@peak-events.be" className="text-[#1d4ed8]">info@peak-events.be</a>
      </LP>

      <L2>2. Données collectées</L2>
      <LP>Nous collectons les données suivantes dans le cadre du service :</LP>
      <LUl>
        <li><strong>Adresse email</strong> — Authentification, notifications, communication (base légale : exécution du contrat)</li>
        <li><strong>Données événementielles</strong> — Briefings, planning, accès, matériel, consignes (base légale : exécution du contrat, supprimées à la clôture du compte)</li>
        <li><strong>Données staff</strong> — Noms, rôles, contacts des membres d'équipe saisis par l'utilisateur (base légale : exécution du contrat, supprimées à la clôture du compte)</li>
        <li><strong>Logs techniques</strong> — Adresse IP, navigateur, actions (sécurité et débogage, base légale : intérêt légitime, conservation : 90 jours)</li>
        <li><strong>Email waitlist</strong> — Communication d'accès anticipé (base légale : consentement, jusqu'au lancement ou désabonnement)</li>
      </LUl>
      <LP>Les données événementielles et staff sont conservées <strong>12 mois</strong> suivant la clôture du compte, puis supprimées définitivement.</LP>

      <L2>3. Sous-traitants</L2>
      <LP>BriefOPS utilise les sous-traitants suivants, tous conformes au RGPD :</LP>
      <LUl>
        <li><strong>Vercel</strong> — Hébergement frontend, CDN et analytics anonymes (UE, serveurs Frankfurt fra1, Allemagne)</li>
        <li><strong>Supabase</strong> — Base de données, authentification et stockage (UE, AWS eu-west-1, Irlande)</li>
        <li><strong>Resend</strong> — Envoi d'emails transactionnels (UE)</li>
        <li><strong>Google Search Console</strong> — Analyse de la visibilité dans les résultats de recherche (données de crawl anonymes uniquement, aucune donnée personnelle utilisateur transmise)</li>
      </LUl>
      <LP>Aucun transfert de données personnelles hors UE n'est effectué sans garanties appropriées (clauses contractuelles types ou décision d'adéquation).</LP>

      <L2>4. Cookies et traceurs</L2>
      <LP>BriefOPS utilise uniquement des cookies strictement nécessaires au fonctionnement du service (session d'authentification). Le site public utilise Vercel Analytics, un outil d'analyse d'audience anonyme et sans cookie. Voir notre <a href="/cookies" className="text-[#1d4ed8]">Politique cookies</a>.</LP>

      <L2>5. Vos droits RGPD</L2>
      <LP>Conformément au RGPD, vous disposez des droits suivants :</LP>
      <LUl>
        <li><strong>Accès</strong> — obtenir une copie de vos données personnelles</li>
        <li><strong>Rectification</strong> — corriger des données inexactes</li>
        <li><strong>Effacement</strong> — supprimer votre compte et toutes vos données</li>
        <li><strong>Portabilité</strong> — exporter vos données dans un format structuré</li>
        <li><strong>Opposition</strong> — s'opposer à certains traitements fondés sur l'intérêt légitime</li>
        <li><strong>Limitation</strong> — limiter temporairement un traitement</li>
      </LUl>
      <LP>Pour exercer vos droits : <a href="mailto:info@peak-events.be" className="text-[#1d4ed8]">info@peak-events.be</a>. Réponse sous 30 jours. En cas de réclamation non résolue, vous pouvez saisir l'<a href="https://www.dataprotectionauthority.be" target="_blank" rel="noopener noreferrer" className="text-[#1d4ed8]">Autorité de protection des données (APD)</a>.</LP>

      <L2>6. Sécurité</L2>
      <LP>Les données sont chiffrées en transit (TLS 1.3) et au repos (AES-256 via Supabase). Les accès sont contrôlés par des politiques Row-Level Security (RLS). Des audits de sécurité sont réalisés régulièrement.</LP>

      <L2>7. Contact</L2>
      <LP>Pour toute question relative à la protection des données : <a href="mailto:info@peak-events.be" className="text-[#1d4ed8]">info@peak-events.be</a></LP>
    </LegalLayout>
  );
}
