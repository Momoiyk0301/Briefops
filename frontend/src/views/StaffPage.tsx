import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { createStaffMember, getBriefingsWithFallback, getStaff, toApiMessage } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { SearchInput } from "@/components/ui/SearchInput";
import { Textarea } from "@/components/ui/Textarea";

export default function StaffPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [briefingId, setBriefingId] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("staff");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");

  const staffQuery = useQuery({ queryKey: queryKeys.staff, queryFn: getStaff });
  const briefingsQuery = useQuery({ queryKey: queryKeys.briefingsFallback, queryFn: getBriefingsWithFallback });
  const filteredStaff = useMemo(() => {
    const members = staffQuery.data ?? [];
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return members;
    return members.filter((member) =>
      [member.full_name, member.role, member.phone ?? "", member.email ?? "", member.notes ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [search, staffQuery.data]);

  const createMutation = useMutation({
    mutationFn: createStaffMember,
    onSuccess: async () => {
      setFullName("");
      setRole("staff");
      setPhone("");
      setEmail("");
      setNotes("");
      await queryClient.invalidateQueries({ queryKey: queryKeys.staff });
      toast.success(t("staff.messages.added"));
    },
    onError: (error) => toast.error(toApiMessage(error))
  });

  const submit = () => {
    if (!briefingId || !fullName.trim()) {
      toast.error(t("staff.messages.required"));
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

  return (
    <section className="stack-page">
      <Card className="page-hero card-pad">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="section-kicker">Crew Coordination</p>
            <h1 className="section-title mt-3">{t("staff.title")}</h1>
            <p className="section-copy mt-3">{t("staff.subtitle")}</p>
          </div>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Rechercher un membre du staff"
            className="w-full sm:w-[320px]"
          />
        </div>
      </Card>

      <Card className="card-pad">
        <h2 className="text-lg font-semibold">{t("staff.addTitle")}</h2>
        <div className="cards-grid-2 mt-4">
          <select
            className="w-full rounded-[22px] border border-[#dce3f1] bg-white/96 px-4 py-3 text-sm text-[#172033] shadow-[0_10px_28px_rgba(15,23,42,0.05)] outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/12 dark:border-white/10 dark:bg-[#151515] dark:text-white"
            value={briefingId}
            onChange={(event) => setBriefingId(event.target.value)}
          >
            <option value="">{t("staff.selectBriefing")}</option>
            {(briefingsQuery.data?.data ?? []).map((briefing) => (
              <option key={briefing.id} value={briefing.id}>
                {briefing.title}
              </option>
            ))}
          </select>
          <Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder={t("staff.placeholders.fullName")} />
          <Input value={role} onChange={(event) => setRole(event.target.value)} placeholder={t("staff.placeholders.role")} />
          <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder={t("staff.placeholders.phone")} />
          <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t("staff.placeholders.email")} />
          <Textarea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={t("staff.placeholders.notes")} />
        </div>
        <div className="mt-4">
          <Button onClick={submit} disabled={createMutation.isPending}>
            {createMutation.isPending ? t("staff.adding") : t("staff.addButton")}
          </Button>
        </div>
      </Card>

      <Card className="list-surface card-pad">
        <h2 className="text-lg font-semibold">{t("staff.listTitle")}</h2>
        {staffQuery.isLoading ? <p className="mt-3 text-sm">{t("app.loading")}</p> : null}
        {staffQuery.error ? <p className="mt-3 text-sm text-red-600">{toApiMessage(staffQuery.error)}</p> : null}
        <div className="mt-4 space-y-3">
          {filteredStaff.map((member) => (
            <div key={member.id} className="rounded-[24px] border border-[#e8eaf3] bg-white/88 p-4 dark:border-white/10">
              <p className="font-semibold">{member.full_name}</p>
              <p className="text-sm text-[#6f748a] dark:text-[#a8afc6]">
                {member.role} · {member.phone || t("staff.noPhone")} · {member.email || t("staff.noEmail")}
              </p>
              {member.notes ? <p className="mt-1 text-sm">{member.notes}</p> : null}
            </div>
          ))}
          {!staffQuery.isLoading && filteredStaff.length === 0 ? (
            <div className="empty-state">
              <div>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[20px] bg-brand-500/12 text-brand-600 dark:text-brand-300">
                  <Users size={22} />
                </div>
                <p className="text-lg font-semibold">{t("staff.empty")}</p>
              </div>
            </div>
          ) : null}
        </div>
      </Card>
    </section>
  );
}
