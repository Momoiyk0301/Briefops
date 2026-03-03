import { NextResponse } from "next/server";

import { getBriefingByPublicToken } from "@/supabase/queries/publicLinks";
import { createPublicTokenClient } from "@/supabase/server";

type Params = { params: Promise<{ token: string }> };

export async function GET(_: Request, { params }: Params) {
  try {
    const { token } = await params;
    const client = createPublicTokenClient(token);
    const data = await getBriefingByPublicToken(client, token);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 404 });
  }
}
