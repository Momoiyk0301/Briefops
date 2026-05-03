import type { Metadata } from "next";
import { LegalLayout, L2, LP, LUl, LHighlight } from "@/marketing/LegalLayout";

export const metadata: Metadata = {
  title: "Politique cookies — BriefOPS",
  description: "Politique d'utilisation des cookies de BriefOPS",
  robots: { index: true, follow: true }
};

export default function CookiesPage() {
  return (
    <LegalLayout
      kicker="Document légal"
      title="Politique cookies"
      updated="Dernière mise à jour : 4 mai 2026 · Peak Events SRL"
    >
      <LHighlight>
        <p><strong>En bref :</strong> BriefOPS n'utilise aucun cookie publicitaire ou de tracking tiers. Seuls des cookies strictement nécessaires au fonctionnement du service sont utilisés.</p>
      </LHighlight>

      <L2>1. Qu'est-ce qu'un cookie ?</L2>
      <LP>Un cookie est un petit fichier texte stocké sur votre appareil lors de la visite d'un site web. Il permet de mémoriser des informations entre vos visites ou pendant une session de navigation.</LP>

      <L2>2. Cookies utilisés par BriefOPS</L2>
      <LP>BriefOPS utilise uniquement des cookies strictement nécessaires :</LP>
      <LUl>
        <li><strong>Cookie de session (sb-auth-token)</strong> — Maintient votre session d'authentification active. Supprimé à la déconnexion. Sans ce cookie, la connexion est impossible.</li>
        <li><strong>Cookie de préférences (locale)</strong> — Mémorise votre langue d'interface. Durée : 1 an.</li>
      </LUl>

      <L2>3. Cookies tiers</L2>
      <LP>BriefOPS n'intègre aucun cookie publicitaire, de réseaux sociaux, ou d'analytics tiers sur ses pages publiques. Stripe (prestataire de paiement) peut déposer ses propres cookies lors du processus de paiement — ceux-ci sont soumis à la <a href="https://stripe.com/fr/privacy" target="_blank" rel="noopener noreferrer" className="text-[#1d4ed8]">politique de confidentialité de Stripe</a>.</LP>

      <L2>4. Consentement</L2>
      <LP>Les cookies strictement nécessaires ne requièrent pas de consentement selon la directive ePrivacy. Aucune bannière de consentement n'est affichée car nous n'utilisons pas de cookies non essentiels.</LP>

      <L2>5. Gérer les cookies</L2>
      <LP>Vous pouvez configurer votre navigateur pour bloquer ou supprimer les cookies. Notez que la suppression du cookie de session vous déconnectera de BriefOPS. Instructions selon votre navigateur :</LP>
      <LUl>
        <li>Chrome : Paramètres → Confidentialité → Cookies</li>
        <li>Firefox : Paramètres → Vie privée → Cookies</li>
        <li>Safari : Préférences → Confidentialité</li>
        <li>Edge : Paramètres → Cookies et autorisations de site</li>
      </LUl>

      <L2>6. Contact</L2>
      <LP>Pour toute question relative aux cookies : <a href="mailto:privacy@events-ops.be" className="text-[#1d4ed8]">privacy@events-ops.be</a></LP>
    </LegalLayout>
  );
}
