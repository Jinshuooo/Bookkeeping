// Supabase Edge Function: Gold Price Proxy
// Proxies requests to gold-api.com to avoid CORS issues
//
// Deploy with: supabase functions deploy gold-price

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const GOLDAPI_URL = "https://api.gold-api.com/price/XAU/CNY";
const OUNCE_TO_GRAM = 31.1034768;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS, status: 204 });
  }

  try {
    const response = await fetch(GOLDAPI_URL, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Gold API returned ${response.status}` }),
        { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    // gold-api.com returns price per troy ounce, convert to per gram
    const pricePerGram = data.price / OUNCE_TO_GRAM;

    const result = {
      price_per_gram: Math.round(pricePerGram * 100) / 100,
      timestamp: data.updatedAt || new Date().toISOString(),
      currency: data.currency || "CNY",
    };

    return new Response(JSON.stringify(result), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Failed to fetch gold price" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
