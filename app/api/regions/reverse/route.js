import { NextResponse } from "next/server";
import {
  FALLBACK_PROVINCES,
  FALLBACK_REGENCIES,
  findProvinceByName,
  findRegencyByName,
  normalizeRegionList
} from "@/lib/indonesiaRegions";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "定位参数无效。" }, { status: 400 });
  }

  try {
    const reverseUrl = new URL("https://nominatim.openstreetmap.org/reverse");
    reverseUrl.searchParams.set("format", "jsonv2");
    reverseUrl.searchParams.set("lat", String(lat));
    reverseUrl.searchParams.set("lon", String(lon));
    reverseUrl.searchParams.set("addressdetails", "1");
    reverseUrl.searchParams.set("accept-language", "id,en");

    const response = await fetch(reverseUrl, {
      headers: {
        "user-agent": "NusantaraShopPrototype/0.1"
      },
      next: { revalidate: 86400 }
    });
    if (!response.ok) throw new Error("Reverse geocode failed.");

    const payload = await response.json();
    const address = payload.address || {};
    const rawProvinceName = address.state || address.region || address.province;
    const cityName = address.city || address.town || address.municipality || address.county || address.village;
    const provinceName = inferProvinceName(rawProvinceName, cityName);

    const provinceResponse = await fetch(new URL("/api/regions/provinces", request.url), { next: { revalidate: 86400 } });
    const provincePayload = await provinceResponse.json();
    const provinces = normalizeRegionList(provincePayload.provinces).length ? provincePayload.provinces : FALLBACK_PROVINCES;
    const province = findProvinceByName(provinces, provinceName);

    let regencies = [];
    let city = null;
    if (province?.id) {
      const regencyResponse = await fetch(new URL(`/api/regions/regencies?provinceId=${province.id}`, request.url), {
        next: { revalidate: 86400 }
      });
      const regencyPayload = await regencyResponse.json();
      regencies = normalizeRegionList(regencyPayload.regencies).length ? regencyPayload.regencies : FALLBACK_REGENCIES[province.id] || [];
      city = findRegencyByName(regencies, cityName);
    }

    return NextResponse.json({
      source: "nominatim",
      location: {
        lat,
        lon,
        postalCode: address.postcode || "",
        displayName: payload.display_name || "",
        provinceId: province?.id || "",
        province: province?.name || provinceName || "",
        cityId: city?.id || "",
        city: city?.name || cityName || "",
        rawCity: cityName || "",
        rawProvince: provinceName || ""
      },
      regencies
    });
  } catch {
    return NextResponse.json({ error: "定位反查失败，请手动选择省份和城市。" }, { status: 502 });
  }
}

function inferProvinceName(provinceName, cityName) {
  const city = String(cityName || "").toUpperCase();
  if (city.includes("JAKARTA")) return "DKI JAKARTA";
  return provinceName;
}
