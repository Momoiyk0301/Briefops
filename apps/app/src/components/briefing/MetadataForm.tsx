import { KeyboardEvent, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { DateInput } from "@/components/input/date";
import { TelephoneInput } from "@/components/input/telephone";
import { TextAreaInput, TextInput } from "@/components/input/text";
import { Input } from "@/components/ui/Input";
import { Toggle } from "@/components/ui/Toggle";
import { EditorCore, MetadataExtra } from "@/lib/types";

const schema = z.object({
  title: z.string().min(1),
  event_date: z.string().optional(),
  location_text: z.string().optional(),
  main_contact_name: z.string().optional(),
  main_contact_phone: z.string().optional(),
  global_notes: z.string().optional(),
  team_mode: z.boolean().optional(),
  teams: z.array(z.string()).optional()
});

type Values = z.infer<typeof schema>;

type Props = {
  core: EditorCore;
  metadata: MetadataExtra;
  onChange: (core: EditorCore, metadata: MetadataExtra) => void;
};

export function MetadataForm({ core, metadata, onChange }: Props) {
  const [teamInput, setTeamInput] = useState("");

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: core.title,
      event_date: core.event_date ?? "",
      location_text: core.location_text,
      main_contact_name: metadata.main_contact_name,
      main_contact_phone: metadata.main_contact_phone,
      global_notes: metadata.global_notes,
      team_mode: metadata.team_mode,
      teams: metadata.teams
    }
  });

  useEffect(() => {
    form.reset({
      title: core.title,
      event_date: core.event_date ?? "",
      location_text: core.location_text,
      main_contact_name: metadata.main_contact_name,
      main_contact_phone: metadata.main_contact_phone,
      global_notes: metadata.global_notes,
      team_mode: metadata.team_mode,
      teams: metadata.teams
    });
  }, [core, metadata, form]);

  useEffect(() => {
    const subscription = form.watch((values) => {
      onChange(
        {
          title: values.title ?? "",
          event_date: values.event_date ? values.event_date : null,
          location_text: values.location_text ?? ""
        },
        {
          main_contact_name: values.main_contact_name ?? "",
          main_contact_phone: values.main_contact_phone ?? "",
          global_notes: values.global_notes ?? "",
          team_mode: Boolean(values.team_mode),
          teams: (values.teams ?? []).filter((team): team is string => Boolean(team && team.trim()))
        }
      );
    });

    return () => subscription.unsubscribe();
  }, [form, onChange]);

  const teamMode = Boolean(form.watch("team_mode"));
  const teams = form.watch("teams") ?? [];

  const addTeam = () => {
    const next = teamInput.trim();
    if (!next) return;
    if (teams.some((team) => team.toLowerCase() === next.toLowerCase())) {
      setTeamInput("");
      return;
    }
    form.setValue("teams", [...teams, next], { shouldDirty: true, shouldTouch: true });
    setTeamInput("");
  };

  const onTeamKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addTeam();
  };

  return (
    <div className="space-y-2">
      <TextInput placeholder="Title" {...form.register("title")} />
      <DateInput {...form.register("event_date")} />
      <TextInput placeholder="Location" {...form.register("location_text")} />
      <TextInput placeholder="Main contact name" {...form.register("main_contact_name")} />
      <TelephoneInput placeholder="Main contact phone" {...form.register("main_contact_phone")} />
      <TextAreaInput rows={3} placeholder="Global notes" {...form.register("global_notes")} />

      <div className="rounded-xl border border-[#e6e8f2] p-3 dark:border-white/10">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Team mode</p>
          <Toggle
            checked={teamMode}
            onChange={(value) => {
              form.setValue("team_mode", value, { shouldDirty: true, shouldTouch: true });
              if (!value) form.setValue("teams", [], { shouldDirty: true, shouldTouch: true });
            }}
          />
        </div>

        {teamMode ? (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Add a team (e.g. audio)"
                value={teamInput}
                onChange={(event) => setTeamInput(event.target.value)}
                onKeyDown={onTeamKeyDown}
              />
              <button
                type="button"
                className="rounded-xl border border-[#d9dcea] px-3 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-white/10 dark:hover:bg-[#1f1f1f]"
                onClick={addTeam}
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {teams.map((team) => (
                <button
                  key={team}
                  type="button"
                  className="rounded-full border border-brand-300 bg-brand-50 px-2 py-1 text-[11px] font-medium text-brand-700 dark:border-brand-500/30 dark:bg-brand-900/20 dark:text-brand-300"
                  onClick={() => form.setValue("teams", teams.filter((value) => value !== team), { shouldDirty: true, shouldTouch: true })}
                >
                  {team} x
                </button>
              ))}
              {teams.length === 0 ? <p className="text-xs text-slate-500">No team yet.</p> : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
