import { NextResponse } from "next/server";
import { FALLBACK_PROVINCES, normalizeRegionList } from "@/lib/indonesiaRegions";

const PROVINCES_URL = "https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json";

export async function GET() {
  try {
    const response = await fetch(PROVINCES_URL, { next: { revalidate: 86400 } });
    if (!response.ok) throw new Error("Region provider failed.");
    const provinces = normalizeRegionList(await response.json());
    return NextResponse.json({ source: "emsifa", provinces });
  } catch {
    return NextResponse.json({ source: "fallback", provinces: FALLBACK_PROVINCES });
  }
}
