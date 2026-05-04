import type { Metadata } from "next";
import { LegalLayout, L2, LP } from "@/marketing/LegalLayout";

export const metadata: Metadata = {
  title: "Mentions légales — BriefOPS",
  description: "Mentions légales de BriefOPS, édité par Peak Events SRL",
  robots: { index: true, follow: true }
};

export default function MentionsLegalesPage() {
  return (
    <LegalLayout
      kicker="Document légal"
      title="Mentions légales"
      updated="Dernière mise à jour : 4 mai 2026 · Peak Events SRL"
    >
      <L2>Éditeur du site</L2>
      <LP>
        <strong>Peak Events SRL</strong><br />
        Belgique<br />
        Email : <a href="mailto:hello@events-ops.be" className="text-[#1d4ed8]">hello@events-ops.be</a><br />
        Site : <a href="https://events-ops.be" className="text-[#1d4ed8]">events-ops.be</a>
      </LP>

      <L2>Directeur de la publication</L2>
      <LP>Le directeur de la publication est le gérant de Peak Events SRL.</LP>

      <L2>Hébergement</L2>
      <LP>
        Le site est hébergé par <strong>Vercel Inc.</strong><br />
        340 Pine Street, Suite 701, San Francisco, CA 94104, USA<br />
        Les données sont stockées en Europe (UE) via Vercel Edge Network.
      </LP>

      <L2>Infrastructure technique</L2>
      <LP>
        Base de données et authentification : <strong>Supabase</strong> (UE)<br />
        Paiement : <strong>Stripe</strong> (UE, certifié PCI-DSS)<br />
        Emails transactionnels : <strong>Resend</strong> (UE)
      </LP>

      <L2>Propriété intellectuelle</L2>
      <LP>L'ensemble du contenu de ce site (textes, images, logos, interface) est protégé par le droit d'auteur et appartient à Peak Events SRL. Toute reproduction, même partielle, est interdite sans autorisation écrite préalable.</LP>

      <L2>Limitation de responsabilité</L2>
      <LP>Peak Events SRL s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées sur ce site. Toutefois, elle ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations disponibles. Peak Events SRL décline toute responsabilité pour tout dommage résultant de l'utilisation de ce site.</LP>

      <L2>Droit applicable</L2>
      <LP>Les présentes mentions légales sont soumises au droit belge. En cas de litige, les tribunaux de Bruxelles sont seuls compétents.</LP>

      <L2>Contact</L2>
      <LP>Pour toute question : <a href="mailto:hello@events-ops.be" className="text-[#1d4ed8]">hello@events-ops.be</a></LP>
    </LegalLayout>
  );
}
