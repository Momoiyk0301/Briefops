import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus2, Users } from "lucide-react";
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
  source: StaffMember;
  briefingIds: string[];
  briefingTitles: string[];
};

function buildStaffKey(member: StaffMember) {
  return [member.full_name.trim().toLowerCase(), member.email?.trim().toLowerCase() ?? "", member.phone?.trim() ?? ""].join("|");
}

export default function StaffPage() {
  const queryClient = useQueryClient();
  const [briefingId, setBriefingId] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("staff");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");
  const [assignTarget, setAssignTarget] = useState<StaffAggregate | null>(null);
  const [assignBriefingId, setAssignBriefingId] = useState("");

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
          source: member,
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

  const createMutation = useMutation({
    mutationFn: createStaffMember,
    onSuccess: async () => {
      setFullName("");
      setRole("staff");
      setPhone("");
      setEmail("");
      setNotes("");
      setBriefingId("");
      await queryClient.invalidateQueries({ queryKey: queryKeys.staff });
      toast.success("Membre du staff ajouté");
    },
    onError: (error) => toast.error(toApiMessage(error))
  });

  const assignMutation = useMutation({
    mutationFn: createStaffMember,
    onSuccess: async () => {
      setAssignTarget(null);
      setAssignBriefingId("");
      await queryClient.invalidateQueries({ queryKey: queryKeys.staff });
      toast.success("Staff assigné au briefing");
    },
    onError: (error) => toast.error(toApiMessage(error))
  });

  const submit = () => {
    if (!briefingId || !fullName.trim()) {
      toast.error("Nom et briefing requis");
      return;
    }
    createMutation.mutate({
      briefing_id: briefingId,
      full_name: fullName,
      role,
      phone,
      email,
      notes
    });
  };

  const submitAssign = () => {
    if (!assignTarget || !assignBriefingId) {
      toast.error("Choisis un briefing");
      return;
    }

    assignMutation.mutate({
      briefing_id: assignBriefingId,
      full_name: assignTarget.full_name,
      role: assignTarget.role,
      phone: assignTarget.phone ?? "",
      email: assignTarget.email ?? "",
      notes: assignTarget.notes ?? ""
    });
  };

  return (
    <section className="stack-page">
      <Card className="page-hero card-pad">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="section-kicker">Crew Coordination</p>
            <h1 className="section-title mt-2">Staff</h1>
            <p className="section-copy mt-2">
              Retrouve les contacts terrain, leurs affectations et assigne-les rapidement à un briefing.
            </p>
          </div>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Rechercher un nom, un rôle ou un briefing"
            className="w-full sm:w-[340px]"
          />
        </div>
      </Card>

      <Card className="card-pad">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Ajouter un membre</h2>
            <p className="mt-1 text-sm text-[#6f748a] dark:text-[#a8afc6]">Un formulaire simple pour créer une première affectation.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <select
            className="w-full rounded-[22px] border border-[#dce3f1] bg-white/96 px-4 py-3 text-sm text-[#172033] shadow-[0_10px_28px_rgba(15,23,42,0.05)] outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/12 dark:border-white/10 dark:bg-[#151515] dark:text-white"
            value={briefingId}
            onChange={(event) => setBriefingId(event.target.value)}
          >
            <option value="">Sélectionner un briefing</option>
            {(briefingsQuery.data?.data ?? []).map((briefing) => (
              <option key={briefing.id} value={briefing.id}>
                {briefing.title}
              </option>
            ))}
          </select>
          <Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Nom complet" />
          <Input value={role} onChange={(event) => setRole(event.target.value)} placeholder="Rôle" />
          <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Téléphone" />
          <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
          <Textarea rows={1} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notes terrain" />
        </div>
        <div className="mt-4">
          <Button onClick={submit} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Ajout..." : "Ajouter au staff"}
          </Button>
        </div>
      </Card>

      <Card className="list-surface hidden overflow-hidden p-0 md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#f6f8fc] text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#7a839d] dark:bg-[#181818] dark:text-[#97a0ba]">
              <tr>
                <th className="px-5 py-4">Nom</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Téléphone</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Events assignés</th>
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
                  <td className="px-5 py-4 text-[#42506a] dark:text-[#c8d2ea]">{member.briefingIds.length}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end">
                      <Button variant="secondary" onClick={() => setAssignTarget(member)}>
                        <CalendarPlus2 size={14} />
                        Assign to briefing
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
            ctaLabel="Ajouter au staff"
            onCta={() => document.querySelector<HTMLInputElement>('input[placeholder="Nom complet"]')?.focus()}
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
              ctaLabel="Ajouter au staff"
              onCta={() => document.querySelector<HTMLInputElement>('input[placeholder="Nom complet"]')?.focus()}
            />
          </Card>
        ) : null}
        {filteredStaff.map((member) => (
          <Card key={member.key} className="surface-pad">
            <p className="font-semibold text-[#111827] dark:text-white">{member.full_name}</p>
            <p className="mt-1 text-sm text-[#6f748a] dark:text-[#a8afc6]">{member.role}</p>
            <p className="mt-3 text-sm text-[#42506a] dark:text-[#c8d2ea]">Téléphone: {member.phone ?? "Non renseigné"}</p>
            <p className="mt-1 text-sm text-[#42506a] dark:text-[#c8d2ea]">Email: {member.email ?? "Non renseigné"}</p>
            <p className="mt-1 text-sm text-[#42506a] dark:text-[#c8d2ea]">Events assignés: {member.briefingIds.length}</p>
            <Button className="mt-4 w-full" variant="secondary" onClick={() => setAssignTarget(member)}>
              Assign to briefing
            </Button>
          </Card>
        ))}
      </div>

      {assignTarget ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0f172a]/40 px-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6">
            <h2 className="text-xl font-semibold">Assign to briefing</h2>
            <p className="mt-2 text-sm text-[#6f748a] dark:text-[#a8afc6]">
              Assigner {assignTarget.full_name} à un autre briefing sans recréer sa fiche.
            </p>
            <div className="mt-5 stack-section">
              <select
                aria-label="Choisir un briefing"
                className="w-full rounded-[22px] border border-[#dce3f1] bg-white/96 px-4 py-3 text-sm text-[#172033] shadow-[0_10px_28px_rgba(15,23,42,0.05)] outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/12 dark:border-white/10 dark:bg-[#151515] dark:text-white"
                value={assignBriefingId}
                onChange={(event) => setAssignBriefingId(event.target.value)}
              >
                <option value="">Sélectionner un briefing</option>
                {(briefingsQuery.data?.data ?? []).map((briefing) => (
                  <option key={briefing.id} value={briefing.id} disabled={assignTarget.briefingIds.includes(briefing.id)}>
                    {briefing.title}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => setAssignTarget(null)}>
                  Annuler
                </Button>
                <Button className="flex-1" onClick={submitAssign} disabled={assignMutation.isPending}>
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
