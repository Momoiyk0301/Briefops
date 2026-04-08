import { z } from "zod";

import { NotesData } from "@/lib/types";

export const notesSchema = z.object({
  text: z.string()
});

export const defaultNotesData: NotesData = {
  text: ""
};

