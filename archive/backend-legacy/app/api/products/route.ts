import { NextResponse } from "next/server";

import { createRequestContext, toErrorResponse } from "@/http";
import { requireUser } from "@/supabase/server";

export async function GET(request: Request) {
  const ctx = createRequestContext("GET /api/products");

  try {
    const { client, userId } = await requireUser(request);
    const { data, error } = await client
      .from("products")
      .select("id,name,slug,description,stripe_price_id,price_amount,price_currency,billing_interval,features,is_highlighted,sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;

    ctx.info("listed products", { userId, count: data?.length ?? 0 });
    return NextResponse.json({
      data: (data ?? []).map((item) => ({
        ...item,
        features: Array.isArray(item.features) ? item.features.map((entry) => String(entry)) : []
      }))
    });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}
