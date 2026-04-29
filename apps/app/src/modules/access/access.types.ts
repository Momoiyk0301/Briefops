import { z } from "zod";

import { AccessData } from "@/lib/types";

export const accessSchema = z.object({
  address: z.string(),
  parking: z.string(),
  entrance: z.string(),
  on_site_contact: z.string()
});

export const defaultAccessData: AccessData = {
  address: "",
  parking: "",
  entrance: "",
  on_site_contact: ""
};

