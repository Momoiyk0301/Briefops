import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { EditorCore, MetadataExtra } from "@/lib/types";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

const schema = z.object({
  title: z.string().min(1),
  event_date: z.string().optional(),
  location_text: z.string().optional(),
  main_contact_name: z.string().optional(),
  main_contact_phone: z.string().optional(),
  global_notes: z.string().optional()
});

type Values = z.infer<typeof schema>;

type Props = {
  core: EditorCore;
  metadata: MetadataExtra;
  onChange: (core: EditorCore, metadata: MetadataExtra) => void;
};

export function MetadataForm({ core, metadata, onChange }: Props) {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: core.title,
      event_date: core.event_date ?? "",
      location_text: core.location_text,
      main_contact_name: metadata.main_contact_name,
      main_contact_phone: metadata.main_contact_phone,
      global_notes: metadata.global_notes
    }
  });

  useEffect(() => {
    form.reset({
      title: core.title,
      event_date: core.event_date ?? "",
      location_text: core.location_text,
      main_contact_name: metadata.main_contact_name,
      main_contact_phone: metadata.main_contact_phone,
      global_notes: metadata.global_notes
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
          global_notes: values.global_notes ?? ""
        }
      );
    });

    return () => subscription.unsubscribe();
  }, [form, onChange]);

  return (
    <div className="space-y-2">
      <Input placeholder="Title" {...form.register("title")} />
      <Input type="date" {...form.register("event_date")} />
      <Input placeholder="Location" {...form.register("location_text")} />
      <Input placeholder="Main contact name" {...form.register("main_contact_name")} />
      <Input placeholder="Main contact phone" {...form.register("main_contact_phone")} />
      <Textarea rows={3} placeholder="Global notes" {...form.register("global_notes")} />
    </div>
  );
}
