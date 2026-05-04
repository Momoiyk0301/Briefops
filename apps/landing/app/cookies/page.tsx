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
        <p><strong>En bref :</strong> BriefOPS n'utilise aucun cookie publicitaire ou de tracking tiers. Le site public utilise Vercel Analytics, un outil d'audience anonyme et sans cookie. Aucun bandeau de consentement n'est nécessaire.</p>
      </LHighlight>

      <L2>1. Qu'est-ce qu'un cookie ?</L2>
      <LP>Un cookie est un petit fichier texte stocké sur votre appareil lors de la visite d'un site web. Il permet de mémoriser des informations entre vos visites ou pendant une session de navigation.</LP>

      <L2>2. Cookies utilisés par BriefOPS</L2>
      <LP>BriefOPS utilise uniquement des cookies strictement nécessaires au fonctionnement de l'application :</LP>
      <LUl>
        <li><strong>Cookie de session (sb-auth-token)</strong> — Maintient votre session d'authentification active. Supprimé à la déconnexion. Sans ce cookie, la connexion est impossible.</li>
        <li><strong>Cookie de préférences (locale)</strong> — Mémorise votre langue d'interface. Durée : 1 an.</li>
      </LUl>
      <LP>Ces cookies sont strictement nécessaires et ne requièrent pas de consentement selon la directive ePrivacy.</LP>

      <L2>3. Analytics — Vercel Analytics</L2>
      <LP>Le site public events-ops.be utilise <strong>Vercel Analytics</strong>, un outil d'analyse d'audience respectueux de la vie privée. Vercel Analytics :</LP>
      <LUl>
        <li>Ne dépose <strong>aucun cookie</strong> sur votre appareil</li>
        <li>Ne collecte <strong>aucune donnée personnelle</strong> identifiable</li>
        <li>Mesure uniquement des données agrégées et anonymes (pages vues, navigateur, pays)</li>
        <li>Est hébergé sur les serveurs Vercel en Europe (Frankfurt, Allemagne)</li>
      </LUl>
      <LP>Ces données sont utilisées uniquement pour améliorer le service et ne sont jamais revendues ni partagées à des fins publicitaires.</LP>

      <L2>4. Cookies tiers</L2>
      <LP>BriefOPS n'intègre aucun cookie publicitaire, de réseaux sociaux ou d'analytics tiers nécessitant un consentement sur ses pages publiques.</LP>

      <L2>5. Consentement</L2>
      <LP>Aucune bannière de consentement n'est affichée car nous n'utilisons ni cookies non essentiels ni outils de tracking personnel. Si cela devait changer, ce document sera mis à jour et un bandeau de consentement conforme sera ajouté.</LP>

      <L2>6. Gérer les cookies</L2>
      <LP>Vous pouvez configurer votre navigateur pour bloquer ou supprimer les cookies. Notez que la suppression du cookie de session vous déconnectera de BriefOPS. Instructions selon votre navigateur :</LP>
      <LUl>
        <li>Chrome : Paramètres → Confidentialité → Cookies</li>
        <li>Firefox : Paramètres → Vie privée → Cookies</li>
        <li>Safari : Préférences → Confidentialité</li>
        <li>Edge : Paramètres → Cookies et autorisations de site</li>
      </LUl>

      <L2>7. Contact</L2>
      <LP>Pour toute question relative aux cookies : <a href="mailto:info@peak-events.be" className="text-[#1d4ed8]">info@peak-events.be</a></LP>
    </LegalLayout>
  );
}
