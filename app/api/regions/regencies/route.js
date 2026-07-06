import { NextResponse } from "next/server";
import { FALLBACK_REGENCIES, normalizeRegionList } from "@/lib/indonesiaRegions";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const provinceId = searchParams.get("provinceId") || "";

  if (!provinceId) {
    return NextResponse.json({ error: "请选择省份。" }, { status: 400 });
  }

  try {
    const response = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provinceId}.json`, {
      next: { revalidate: 86400 }
    });
    if (!response.ok) throw new Error("Region provider failed.");
    const regencies = normalizeRegionList(await response.json());
    return NextResponse.json({ source: "emsifa", regencies });
  } catch {
    return NextResponse.json({ source: "fallback", regencies: FALLBACK_REGENCIES[provinceId] || [] });
  }
}
