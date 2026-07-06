import { filterOrders, getOrders, ordersToCsv } from "@/lib/store";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const csv = ordersToCsv(
    filterOrders(await getOrders(), {
      status: searchParams.get("status") || "all",
      paymentMethod: searchParams.get("paymentMethod") || "all",
      productSlug: searchParams.get("productSlug") || "all",
      province: searchParams.get("province") || "all",
      from: searchParams.get("from") || "",
      to: searchParams.get("to") || ""
    })
  );
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`
    }
  });
}
