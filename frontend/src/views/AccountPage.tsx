import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CreditCard, Gauge, Pencil, Upload, UserCircle2, X } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";

import { AvatarBadge } from "@/components/ui/AvatarBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  createStripeCheckoutSessionByPrice,
  createStripePortalSession,
  getMe,
  getProducts,
  getStorageSignedUrl,
  toApiMessage,
  updateMyAvatar,
  updateWorkspaceLogo,
  uploadStorageFile
} from "@/lib/api";
import { formatBytes, getInitials } from "@/lib/branding";
import type { Product } from "@/lib/types";

const PHONE_STORAGE_KEY = "briefops:account_phone";

function toPlanSummary(plan: string | null) {
  if (plan === "starter") return "Starter";
  if (plan === "guest") return "Guest";
  if (plan === "funder") return "Funder";
  if (plan === "enterprise") return "Enterprise";
  return "Pro";
}

function describePlan(product: Product) {
  if (product.slug === "enterprise") return "Modules sur mesure, limites adaptees et accompagnement dedie.";
  if (product.slug === "starter") return "5 briefings/mois, 10 exports PDF/mois et watermark Starter.";
  if (product.slug === "guest" || product.slug === "funder") return "Droits Pro, affichage dedie et stockage 1 GB par workspace.";
  return "Briefings et exports illimites, 1 GB de stockage et sans watermark.";
}

export default function AccountPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const productsQuery = useQuery({ queryKey: ["products"], queryFn: getProducts });
  const [searchParams] = useSearchParams();
  const [submittingPlanId, setSubmittingPlanId] = useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [phone, setPhone] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const billingPlansRef = useRef<HTMLDivElement | null>(null);

  const user = meQuery.data?.user;
  const workspace = meQuery.data?.workspace ?? meQuery.data?.org;
  const role = meQuery.data?.role ?? "member";
  const plan = meQuery.data?.plan ?? "starter";
  const usage = meQuery.data?.usage;
  const subscriptionStatus = meQuery.data?.subscription_status ?? null;
  const currentPeriodEnd = meQuery.data?.current_period_end ?? null;
  const billingState = searchParams.get("billing");
  const hasPaymentIssue = ["past_due", "unpaid", "incomplete", "incomplete_expired"].includes(String(subscriptionStatus ?? "").toLowerCase());

  useEffect(() => {
    const storedPhone = window.localStorage.getItem(PHONE_STORAGE_KEY) ?? "";
    setPhone(storedPhone);
    setDraftPhone(storedPhone);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function resolveImages() {
      try {
        if (workspace?.logo_path) {
          const url = await getStorageSignedUrl("logos", workspace.logo_path);
          if (!cancelled) setLogoUrl(url);
        } else if (!cancelled) {
          setLogoUrl(null);
        }

        if (user?.avatar_path) {
          const url = await getStorageSignedUrl("avatars", user.avatar_path);
          if (!cancelled) setAvatarUrl(url);
        } else if (!cancelled) {
          setAvatarUrl(null);
        }
      } catch {
        if (!cancelled) {
          setLogoUrl(null);
          setAvatarUrl(null);
        }
      }
    }

    void resolveImages();
    return () => {
      cancelled = true;
    };
  }, [user?.avatar_path, workspace?.logo_path]);

  const usageLabel = useMemo(() => {
    if (!usage) return "Aucune donnee";
    if (usage.pdf_exports_limit === null) return `${usage.pdf_exports_used} PDF utilises, quota illimite`;
    return `${usage.pdf_exports_used}/${usage.pdf_exports_limit} PDF utilises`;
  }, [usage]);

  if (meQuery.isLoading) return <Card>Chargement...</Card>;
  if (meQuery.error) return <Card>{toApiMessage(meQuery.error)}</Card>;

  const handleCheckout = async (product: Product) => {
    if (product.slug === "enterprise") {
      navigate("/help?subject=enterprise");
      return;
    }
    if (!product.stripe_price_id) {
      toast.error("Prix Stripe manquant pour cette offre.");
      return;
    }

    try {
      setSubmittingPlanId(product.id);
      const session = await createStripeCheckoutSessionByPrice({
        stripe_price_id: product.stripe_price_id,
        plan: product.slug as "starter" | "pro" | "guest" | "funder",
        workspace_name: workspace?.name
      });
      window.location.href = session.url;
    } catch (error) {
      toast.error(toApiMessage(error));
      setSubmittingPlanId(null);
    }
  };

  const openPortal = async () => {
    try {
      setOpeningPortal(true);
      const session = await createStripePortalSession();
      window.location.href = session.url;
    } catch (error) {
      const message = toApiMessage(error);
      if (/aucune facturation stripe active|start checkout first/i.test(message)) {
        billingPlansRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
        toast.error("Aucune facturation active pour ce compte. Choisis une offre pour activer Stripe.");
      } else {
        toast.error(message);
      }
      setOpeningPortal(false);
    }
  };

  const handleSaveProfile = () => {
    window.localStorage.setItem(PHONE_STORAGE_KEY, draftPhone.trim());
    setPhone(draftPhone.trim());
    setEditingProfile(false);
    toast.success("Profil mis a jour");
  };

  const handleCancelProfile = () => {
    setDraftPhone(phone);
    setEditingProfile(false);
  };

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      const uploaded = await uploadStorageFile("avatars", file);
      await updateMyAvatar(uploaded.path);
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Avatar mis a jour");
    } catch (error) {
      toast.error(toApiMessage(error));
    } finally {
      setUploadingAvatar(false);
      event.target.value = "";
    }
  };

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const uploaded = await uploadStorageFile("logos", file);
      await updateWorkspaceLogo(uploaded.path);
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Logo du workspace mis a jour");
    } catch (error) {
      toast.error(toApiMessage(error));
    } finally {
      setUploadingLogo(false);
      event.target.value = "";
    }
  };

  const workspaceInitials = workspace?.initials || getInitials(workspace?.name, "WS");
  const userInitials = user?.initials || getInitials(user?.full_name || user?.email, "US");
  const billingProducts = (productsQuery.data ?? []).filter((product) => ["starter", "pro", "guest", "funder", "enterprise"].includes(product.slug));

  return (
    <section className="stack-page">
      <Card className="page-hero card-pad">
        <p className="section-kicker">Compte</p>
        <h1 className="section-title mt-2">Mon compte</h1>
        <p className="section-copy mt-2">Profil, branding workspace, quotas MVP et options de facturation.</p>
      </Card>

      <div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="card-pad">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <UserCircle2 size={18} />
              <div>
                <h2 className="text-lg font-semibold">Profil</h2>
                <p className="mt-1 text-sm text-[#6f748a] dark:text-[#a8afc6]">Resume par defaut, edition seulement quand necessaire.</p>
              </div>
            </div>

            {!editingProfile ? (
              <button
                type="button"
                aria-label="edit-profile"
                onClick={() => setEditingProfile(true)}
                className="rounded-full border border-[#e6e8f2] p-2 text-[#6f748a] transition hover:bg-[#f6f8fc] dark:border-white/10 dark:text-[#a8afc6] dark:hover:bg-[#1a1a1a]"
              >
                <Pencil size={16} />
              </button>
            ) : (
              <button
                type="button"
                aria-label="cancel-profile-edit-icon"
                onClick={handleCancelProfile}
                className="rounded-full border border-[#e6e8f2] p-2 text-[#6f748a] transition hover:bg-[#f6f8fc] dark:border-white/10 dark:text-[#a8afc6] dark:hover:bg-[#1a1a1a]"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className={`mt-4 rounded-[24px] border p-4 ${editingProfile ? "border-brand-500/30 bg-brand-500/5" : "border-[#e6e8f2] dark:border-white/10"}`}>
            <div className="flex items-center gap-4">
              <AvatarBadge label="Avatar utilisateur" imageUrl={avatarUrl} initials={userInitials} />
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#dde3f2] bg-white px-4 py-2 text-sm font-semibold text-[#172033] shadow-[0_8px_24px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#171717] dark:text-white">
                <Upload size={14} />
                {uploadingAvatar ? "Upload..." : "Changer l’avatar"}
                <input aria-label="upload-avatar" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">Email</p>
                <p className="mt-1 font-semibold">{user?.email ?? "Indisponible"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">Plan</p>
                <p className="mt-1 font-semibold">{toPlanSummary(plan)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">Role</p>
                <div className="mt-1">
                  <Badge>{role}</Badge>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">Telephone</p>
                {editingProfile ? (
                  <div className="mt-1">
                    <Input
                      aria-label="profile-phone-input"
                      value={draftPhone}
                      onChange={(event) => setDraftPhone(event.target.value)}
                      placeholder={phone || "+33 ..."}
                    />
                  </div>
                ) : (
                  <p className="mt-1 font-semibold">{phone || "Non renseigne"}</p>
                )}
              </div>
            </div>

            {editingProfile ? (
              <div className="mt-4 flex gap-2">
                <Button variant="secondary" onClick={handleCancelProfile}>
                  Cancel
                </Button>
                <Button onClick={handleSaveProfile}>Save</Button>
              </div>
            ) : null}
          </div>
        </Card>

        <Card className="card-pad">
          <div className="flex items-center gap-2">
            <Building2 size={18} />
            <h2 className="text-lg font-semibold">Workspace branding</h2>
          </div>
          <div className="mt-4 rounded-[24px] border border-[#e6e8f2] p-4 dark:border-white/10">
            <div className="flex items-center gap-4">
              <AvatarBadge label="Logo workspace" imageUrl={logoUrl} initials={workspaceInitials} />
              <div className="min-w-0">
                <p className="font-semibold">{workspace?.name ?? "Aucun workspace"}</p>
                <p className="text-sm text-[#6f748a] dark:text-[#a8afc6]">
                  Expiration: {workspace?.due_at ? new Date(workspace.due_at).toLocaleDateString("fr-BE") : "—"}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#dde3f2] bg-white px-4 py-2 text-sm font-semibold text-[#172033] shadow-[0_8px_24px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#171717] dark:text-white">
                <Pencil size={14} />
                {uploadingLogo ? "Upload..." : "Modifier le logo"}
                <input aria-label="upload-logo" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-3 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="card-pad">
          <div className="flex items-center gap-2">
            <Gauge size={18} />
            <h2 className="text-lg font-semibold">Quotas</h2>
          </div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-[#e6e8f2] px-4 py-4 dark:border-white/10">
              <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">Briefings utilises</p>
              <p className="mt-2 text-2xl font-bold">{workspace?.briefings_count ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-[#e6e8f2] px-4 py-4 dark:border-white/10">
              <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">Quota PDF</p>
              <p className="mt-2 text-2xl font-bold">{usage?.pdf_exports_remaining === null ? "Illimite" : usage?.pdf_exports_remaining ?? 0}</p>
              <p className="mt-1 text-sm text-[#6f748a] dark:text-[#a8afc6]">Restants ce mois</p>
            </div>
            <div className="rounded-2xl border border-[#e6e8f2] px-4 py-4 dark:border-white/10">
              <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">Stockage</p>
              <p className="mt-2 font-semibold">{formatBytes(workspace?.storage_used_bytes ?? 0)}</p>
            </div>
            <div className="rounded-2xl border border-[#e6e8f2] px-4 py-4 dark:border-white/10">
              <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">Usage PDF</p>
              <p className="mt-2 font-semibold">{usageLabel}</p>
            </div>
          </div>
        </Card>

        <Card className="card-pad">
          <div className="flex items-center gap-2">
            <CreditCard size={18} />
            <h2 className="text-lg font-semibold">Facturation</h2>
          </div>

          {billingState === "returned" ? (
            <div className="mt-5 rounded-[24px] border border-[#d8e8dd] bg-[#f4fbf6] p-4 text-sm leading-6 text-[#256146] dark:border-[#28543d] dark:bg-[#102419] dark:text-[#92d3a9]">
              Retour du portail de facturation enregistre.
            </div>
          ) : null}

          {hasPaymentIssue ? (
            <div className="mt-5 rounded-[24px] border border-[#f0d5da] bg-[#fff8f9] p-4 text-sm leading-6 text-[#8f3148] dark:border-[#4f2530] dark:bg-[#211419] dark:text-[#ff9cb0]">
              Une action est requise sur la facturation.
            </div>
          ) : null}

          <div className="mt-5 rounded-[24px] border border-brand-500/20 bg-brand-500/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-[#6f748a] dark:text-[#a8afc6]">Offre active</p>
                <p className="mt-1 text-2xl font-bold">{toPlanSummary(plan)}</p>
              </div>
              <Badge>{subscriptionStatus ?? "inactive"}</Badge>
            </div>
            <p className="mt-3 text-sm text-[#6f748a] dark:text-[#a8afc6]">
              Echeance profil: {currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString("fr-BE") : "—"}
            </p>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3" ref={billingPlansRef}>
            {billingProducts.map((product) => (
              <div
                key={product.id}
                className={`rounded-2xl border px-4 py-4 ${product.slug === "pro" ? "border-brand-500/40 bg-brand-500/5 dark:border-brand-400/30 dark:bg-brand-400/10" : "border-[#e6e8f2] dark:border-white/10"}`}
              >
                <p className="text-sm font-semibold">{product.name}</p>
                <p className="mt-1 text-sm text-[#6f748a] dark:text-[#a8afc6]">{describePlan(product)}</p>
                <p className="mt-3 text-lg font-bold">
                  {product.slug === "enterprise" || product.price_amount == null || !product.price_currency || !product.billing_interval
                    ? "Sur mesure"
                    : new Intl.NumberFormat("fr-BE", { style: "currency", currency: product.price_currency.toUpperCase() }).format(product.price_amount / 100)}
                </p>
                <Button
                  className="mt-4 w-full"
                  disabled={submittingPlanId !== null && submittingPlanId !== product.id}
                  onClick={() => void handleCheckout(product)}
                >
                  {submittingPlanId === product.id ? "Redirection..." : product.slug === "enterprise" ? "Contact us" : "Choisir"}
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <Button variant="secondary" disabled={openingPortal} onClick={() => void openPortal()}>
              {openingPortal ? "Ouverture..." : "Gerer la facturation"}
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}
