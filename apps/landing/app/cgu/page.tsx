import type { Metadata } from "next";
import { LegalLayout, L2, LP, LUl, LHighlight } from "@/marketing/LegalLayout";

export const metadata: Metadata = {
  title: "CGU — BriefOPS",
  description: "Conditions Générales d'Utilisation de BriefOPS",
  robots: { index: true, follow: true }
};

export default function CguPage() {
  return (
    <LegalLayout
      kicker="Document légal"
      title="Conditions Générales d'Utilisation"
      updated="Dernière mise à jour : 4 mai 2026 · BriefOPS · Peak Events SRL · events-ops.be"
    >
      <L2>1. Objet</L2>
      <LP>Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme BriefOPS, accessible à l'adresse events-ops.be, éditée par Peak Events SRL. En accédant au service, l'utilisateur accepte sans réserve les présentes CGU.</LP>

      <L2>2. Description du service</L2>
      <LP>BriefOPS est un logiciel SaaS (Software as a Service) destiné aux professionnels de l'événementiel. Il permet la création, la structuration, l'exportation et le partage de briefings opérationnels pour les équipes terrain. Le service est accessible par abonnement mensuel ou annuel via une interface web.</LP>

      <L2>3. Accès au service</L2>
      <LP>L'accès à BriefOPS est réservé aux personnes physiques ou morales agissant dans le cadre d'une activité professionnelle. L'utilisateur doit créer un compte avec une adresse email valide. BriefOPS se réserve le droit de refuser ou de suspendre tout accès en cas de violation des présentes CGU.</LP>

      <L2>4. Abonnement et facturation</L2>
      <LP>Le service est proposé sous forme d'abonnement payant. La facturation est effectuée via <strong>Stripe</strong>, prestataire de paiement tiers. En souscrivant à un abonnement :</LP>
      <LUl>
        <li>Le client autorise BriefOPS à débiter automatiquement sa carte bancaire ou son compte à chaque période de renouvellement.</li>
        <li>Les tarifs sont indiqués hors TVA. La TVA applicable est celle en vigueur dans le pays de résidence du client.</li>
        <li>Les factures sont émises électroniquement et accessibles depuis le tableau de bord.</li>
      </LUl>
      <LHighlight>
        <p><strong>Résiliation :</strong> L'abonnement peut être résilié à tout moment depuis les paramètres du compte. La résiliation prend effet à la fin de la période de facturation en cours. Aucun remboursement prorata n'est accordé sauf obligation légale.</p>
      </LHighlight>

      <L2>5. Propriété intellectuelle</L2>
      <LP>BriefOPS et l'ensemble de ses composants (interface, algorithmes, design, marques) sont la propriété exclusive de Peak Events SRL. L'utilisateur bénéficie d'un droit d'utilisation personnel, non exclusif et non transférable. Toute reproduction, représentation ou redistribution sans autorisation écrite préalable est interdite.</LP>

      <L2>6. Données utilisateur</L2>
      <LP>Les données saisies par l'utilisateur (briefings, contacts, fichiers) lui appartiennent. BriefOPS n'exploite pas ces données à des fins commerciales. L'utilisateur peut exporter et supprimer ses données à tout moment. Voir notre <a href="/privacy" className="text-[#1d4ed8]">Politique de confidentialité</a> pour le détail du traitement.</LP>

      <L2>7. Disponibilité du service</L2>
      <LP>BriefOPS s'engage à maintenir une disponibilité du service de 99,5 % par mois, hors maintenances planifiées. Des interruptions ponctuelles peuvent survenir pour des raisons de maintenance ou de force majeure. BriefOPS ne peut être tenu responsable des dommages indirects liés à une interruption de service.</LP>

      <L2>8. Limitation de responsabilité</L2>
      <LP>BriefOPS est un outil de support à l'organisation opérationnelle. L'utilisateur reste seul responsable de l'exactitude des informations saisies dans ses briefings. BriefOPS ne saurait être tenu responsable des conséquences opérationnelles résultant d'informations erronées ou incomplètes.</LP>

      <L2>9. Modifications des CGU</L2>
      <LP>BriefOPS se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification substantielle par email au moins 30 jours avant l'entrée en vigueur. La poursuite de l'utilisation du service vaut acceptation des nouvelles CGU.</LP>

      <L2>10. Droit applicable</L2>
      <LP>Les présentes CGU sont soumises au droit belge. Tout litige relatif à leur interprétation ou leur exécution sera soumis aux tribunaux compétents de Bruxelles, Belgique.</LP>

      <L2>11. Contact</L2>
      <LP>Pour toute question relative aux présentes CGU : <a href="mailto:legal@events-ops.be" className="text-[#1d4ed8]">legal@events-ops.be</a></LP>
    </LegalLayout>
  );
}
