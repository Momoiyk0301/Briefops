import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { createStaffMember, getBriefingsWithFallback, getStaff, toApiMessage } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
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

  const staffQuery = useQuery({ queryKey: queryKeys.staff, queryFn: getStaff });
  const briefingsQuery = useQuery({ queryKey: queryKeys.briefingsFallback, queryFn: getBriefingsWithFallback });

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
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">{t("staff.title")}</h1>
        <p className="mt-1 text-sm text-[#6f748a] dark:text-[#a8afc6]">
          {t("staff.subtitle")}
        </p>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold">{t("staff.addTitle")}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <select
            className="w-full rounded-2xl border border-[#e6e8f2] bg-white px-4 py-2.5 text-sm text-[#111] outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-[#151515] dark:text-white"
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

      <Card className="p-6">
        <h2 className="text-lg font-semibold">{t("staff.listTitle")}</h2>
        {staffQuery.isLoading ? <p className="mt-3 text-sm">{t("app.loading")}</p> : null}
        {staffQuery.error ? <p className="mt-3 text-sm text-red-600">{toApiMessage(staffQuery.error)}</p> : null}
        <div className="mt-4 space-y-3">
          {(staffQuery.data ?? []).map((member) => (
            <div key={member.id} className="rounded-xl border border-[#e8eaf3] p-3 dark:border-white/10">
              <p className="font-semibold">{member.full_name}</p>
              <p className="text-sm text-[#6f748a] dark:text-[#a8afc6]">
                {member.role} · {member.phone || t("staff.noPhone")} · {member.email || t("staff.noEmail")}
              </p>
              {member.notes ? <p className="mt-1 text-sm">{member.notes}</p> : null}
            </div>
          ))}
          {!staffQuery.isLoading && (staffQuery.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-[#6f748a] dark:text-[#a8afc6]">{t("staff.empty")}</p>
          ) : null}
        </div>
      </Card>
    </section>
  );
}
