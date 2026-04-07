import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus2, Plus, Users, X } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { SearchInput } from "@/components/ui/SearchInput";
import { Textarea } from "@/components/ui/Textarea";
import { createStaffMember, getBriefingsWithFallback, getStaff, toApiMessage } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { StaffMember } from "@/lib/types";

type StaffAggregate = {
  key: string;
  full_name: string;
  role: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  briefingIds: string[];
  briefingTitles: string[];
};

type StaffFormState = {
  briefingId: string;
  fullName: string;
  role: string;
  phone: string;
  email: string;
  notes: string;
};

function buildStaffKey(member: StaffMember) {
  return [member.full_name.trim().toLowerCase(), member.email?.trim().toLowerCase() ?? "", member.phone?.trim() ?? ""].join("|");
}

const INITIAL_FORM: StaffFormState = {
  briefingId: "",
  fullName: "",
  role: "staff",
  phone: "",
  email: "",
  notes: ""
};

export default function StaffPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState<StaffFormState>(INITIAL_FORM);
  const [assignTarget, setAssignTarget] = useState<StaffAggregate | null>(null);
  const [assignSearch, setAssignSearch] = useState("");
  const [selectedBriefingIds, setSelectedBriefingIds] = useState<string[]>([]);

  const staffQuery = useQuery({ queryKey: queryKeys.staff, queryFn: getStaff });
  const briefingsQuery = useQuery({ queryKey: queryKeys.briefingsFallback, queryFn: getBriefingsWithFallback });

  const aggregates = useMemo(() => {
    const byKey = new Map<string, StaffAggregate>();
    const briefingMap = new Map((briefingsQuery.data?.data ?? []).map((briefing) => [briefing.id, briefing.title]));

    (staffQuery.data ?? []).forEach((member) => {
      const key = buildStaffKey(member);
      const current = byKey.get(key);
      if (!current) {
        byKey.set(key, {
          key,
          full_name: member.full_name,
          role: member.role,
          phone: member.phone,
          email: member.email,
          notes: member.notes,
          briefingIds: [member.briefing_id],
          briefingTitles: [briefingMap.get(member.briefing_id) ?? member.briefing_id]
        });
        return;
      }

      if (!current.briefingIds.includes(member.briefing_id)) {
        current.briefingIds.push(member.briefing_id);
        current.briefingTitles.push(briefingMap.get(member.briefing_id) ?? member.briefing_id);
      }
    });

    return Array.from(byKey.values());
  }, [briefingsQuery.data?.data, staffQuery.data]);

  const filteredStaff = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return aggregates;
    return aggregates.filter((member) =>
      [member.full_name, member.role, member.phone ?? "", member.email ?? "", member.briefingTitles.join(" "), member.notes ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [aggregates, search]);

  const assignableBriefings = useMemo(() => {
    const normalizedSearch = assignSearch.trim().toLowerCase();
    return (briefingsQuery.data?.data ?? []).filter((briefing) => {
      if (assignTarget?.briefingIds.includes(briefing.id)) return false;
      if (!normalizedSearch) return true;
      return [briefing.title, briefing.location_text ?? "", briefing.event_date ?? ""].join(" ").toLowerCase().includes(normalizedSearch);
    });
  }, [assignSearch, assignTarget?.briefingIds, briefingsQuery.data?.data]);

  const createMutation = useMutation({
    mutationFn: createStaffMember,
    onSuccess: async () => {
      setForm(INITIAL_FORM);
      setShowCreateModal(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.staff });
      toast.success("Membre du staff ajouté");
    },
    onError: (error) => toast.error(toApiMessage(error))
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!assignTarget || selectedBriefingIds.length === 0) {
        throw new Error("Sélectionne au moins un briefing");
      }

      for (const briefingId of selectedBriefingIds) {
        await createStaffMember({
          briefing_id: briefingId,
          full_name: assignTarget.full_name,
          role: assignTarget.role,
          phone: assignTarget.phone ?? "",
          email: assignTarget.email ?? "",
          notes: assignTarget.notes ?? ""
        });
      }
    },
    onSuccess: async () => {
      setAssignTarget(null);
      setAssignSearch("");
      setSelectedBriefingIds([]);
      await queryClient.invalidateQueries({ queryKey: queryKeys.staff });
      toast.success("Briefings assignés");
    },
    onError: (error) => toast.error(toApiMessage(error))
  });

  const submitCreate = () => {
    if (!form.briefingId || !form.fullName.trim()) {
      toast.error("Nom et briefing requis");
      return;
    }

    createMutation.mutate({
      briefing_id: form.briefingId,
      full_name: form.fullName,
      role: form.role,
      phone: form.phone,
      email: form.email,
      notes: form.notes
    });
  };

  return (
    <section className="stack-page">
      <Card className="page-hero card-pad">
        <div className="max-w-2xl">
          <p className="section-kicker">Crew Coordination</p>
          <h1 className="section-title mt-2">Staff</h1>
          <p className="section-copy mt-2">
            Retrouve les contacts terrain, leurs affectations et ajoute-les rapidement aux bons briefings.
          </p>
        </div>
      </Card>

      <Card className="card-pad">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Rechercher un nom, un rôle ou un briefing"
            className="w-full sm:w-[380px]"
          />
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            Ajouter un membre
          </Button>
        </div>
      </Card>

      <Card className="list-surface hidden overflow-hidden p-0 md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#f6f8fc] text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#7a839d] dark:bg-[#181818] dark:text-[#97a0ba]">
              <tr>
                <th className="px-5 py-4">Nom</th>
                <th className="px-5 py-4">Rôle</th>
                <th className="px-5 py-4">Téléphone</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Briefings assignés</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((member) => (
                <tr key={member.key} className="border-t border-[#edf1f7] dark:border-white/10">
                  <td className="px-5 py-4 font-semibold text-[#111827] dark:text-white">{member.full_name}</td>
                  <td className="px-5 py-4 text-[#42506a] dark:text-[#c8d2ea]">{member.role}</td>
                  <td className="px-5 py-4 text-[#42506a] dark:text-[#c8d2ea]">{member.phone ?? "Non renseigné"}</td>
                  <td className="px-5 py-4 text-[#42506a] dark:text-[#c8d2ea]">{member.email ?? "Non renseigné"}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      {member.briefingTitles.map((title) => (
                        <span
                          key={`${member.key}-${title}`}
                          className="rounded-full border border-[#d9deeb] bg-white px-3 py-1 text-xs text-[#42506a] dark:border-white/10 dark:bg-[#171717] dark:text-[#c8d2ea]"
                        >
                          {title}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end">
                      <Button variant="secondary" onClick={() => setAssignTarget(member)}>
                        <CalendarPlus2 size={14} />
                        Ajouter un briefing
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!staffQuery.isLoading && filteredStaff.length === 0 ? (
          <EmptyState
            icon={<Users size={22} />}
            title="Aucun membre du staff"
            description="Ajoute un premier contact terrain pour commencer les assignations."
            ctaLabel="Ajouter un membre"
            onCta={() => setShowCreateModal(true)}
          />
        ) : null}
      </Card>

      <div className="grid gap-3 md:hidden">
        {!staffQuery.isLoading && filteredStaff.length === 0 ? (
          <Card className="list-surface">
            <EmptyState
              icon={<Users size={22} />}
              title="Aucun membre du staff"
              description="Ajoute un premier contact terrain pour commencer les assignations."
              ctaLabel="Ajouter un membre"
              onCta={() => setShowCreateModal(true)}
            />
          </Card>
        ) : null}

        {filteredStaff.map((member) => (
          <Card key={member.key} className="surface-pad">
            <p className="font-semibold text-[#111827] dark:text-white">{member.full_name}</p>
            <p className="mt-1 text-sm text-[#6f748a] dark:text-[#a8afc6]">{member.role}</p>
            <p className="mt-3 text-sm text-[#42506a] dark:text-[#c8d2ea]">Téléphone: {member.phone ?? "Non renseigné"}</p>
            <p className="mt-1 text-sm text-[#42506a] dark:text-[#c8d2ea]">Email: {member.email ?? "Non renseigné"}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {member.briefingTitles.map((title) => (
                <span
                  key={`${member.key}-${title}`}
                  className="rounded-full border border-[#d9deeb] bg-white px-3 py-1 text-xs text-[#42506a] dark:border-white/10 dark:bg-[#171717] dark:text-[#c8d2ea]"
                >
                  {title}
                </span>
              ))}
            </div>
            <Button className="mt-4 w-full" variant="secondary" onClick={() => setAssignTarget(member)}>
              Ajouter un briefing
            </Button>
          </Card>
        ))}
      </div>

      {showCreateModal ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0f172a]/40 px-4 backdrop-blur-sm">
          <Card className="w-full max-w-2xl p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Ajouter un membre</h2>
                <p className="mt-1 text-sm text-[#6f748a] dark:text-[#a8afc6]">
                  Crée une fiche staff et lie-la directement à un briefing.
                </p>
              </div>
              <button type="button" aria-label="close-create-staff" onClick={() => setShowCreateModal(false)} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-[#1f1f1f]">
                <X size={16} />
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <select
                aria-label="briefing-select"
                className="w-full rounded-[22px] border border-[#dce3f1] bg-white/96 px-4 py-3 text-sm text-[#172033] shadow-[0_10px_28px_rgba(15,23,42,0.05)] outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/12 dark:border-white/10 dark:bg-[#151515] dark:text-white"
                value={form.briefingId}
                onChange={(event) => setForm((prev) => ({ ...prev, briefingId: event.target.value }))}
              >
                <option value="">Sélectionner un briefing</option>
                {(briefingsQuery.data?.data ?? []).map((briefing) => (
                  <option key={briefing.id} value={briefing.id}>
                    {briefing.title}
                  </option>
                ))}
              </select>
              <Input value={form.fullName} onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))} placeholder="Nom complet" />
              <Input value={form.role} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))} placeholder="Rôle" />
              <Input value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} placeholder="Téléphone" />
              <Input value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="Email" />
              <Textarea rows={1} value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} placeholder="Notes terrain" />
            </div>

            <div className="mt-5 flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setShowCreateModal(false)}>
                Annuler
              </Button>
              <Button className="flex-1" onClick={submitCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Ajout..." : "Ajouter"}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

      {assignTarget ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0f172a]/40 px-4 backdrop-blur-sm">
          <Card className="w-full max-w-2xl p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Ajouter un briefing</h2>
                <p className="mt-1 text-sm text-[#6f748a] dark:text-[#a8afc6]">
                  Assigne {assignTarget.full_name} à plusieurs briefings sans recréer sa fiche.
                </p>
              </div>
              <button type="button" aria-label="close-assign-staff" onClick={() => setAssignTarget(null)} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-[#1f1f1f]">
                <X size={16} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <SearchInput
                value={assignSearch}
                onChange={setAssignSearch}
                placeholder="Rechercher un briefing"
                className="w-full"
              />

              <div className="max-h-72 space-y-2 overflow-auto">
                {assignableBriefings.map((briefing) => {
                  const checked = selectedBriefingIds.includes(briefing.id);
                  return (
                    <label
                      key={briefing.id}
                      className="flex items-center justify-between rounded-2xl border border-[#e6e8f2] px-4 py-3 text-sm dark:border-white/10"
                    >
                      <div>
                        <p className="font-medium text-[#111827] dark:text-white">{briefing.title}</p>
                        <p className="mt-1 text-xs text-[#6f748a] dark:text-[#a8afc6]">
                          {briefing.location_text ?? "Lieu non défini"} · {briefing.event_date ?? "Date non définie"}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setSelectedBriefingIds((prev) =>
                            checked ? prev.filter((id) => id !== briefing.id) : [...prev, briefing.id]
                          )
                        }
                      />
                    </label>
                  );
                })}

                {assignableBriefings.length === 0 ? (
                  <p className="text-sm text-[#6f748a] dark:text-[#a8afc6]">Aucun briefing disponible.</p>
                ) : null}
              </div>

              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => setAssignTarget(null)}>
                  Annuler
                </Button>
                <Button className="flex-1" onClick={() => assignMutation.mutate()} disabled={assignMutation.isPending}>
                  {assignMutation.isPending ? "Assignation..." : "Confirmer"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </section>
  );
}
