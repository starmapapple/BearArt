import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/auditLog";
import { createProduct, getProducts } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ products: await getProducts() });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const product = await createProduct(body);
    await writeAuditLog({
      action: "product_created",
      entityType: "product",
      entityId: product.id,
      summary: `新增落地页：${product.title}`,
      details: { id: product.id, slug: product.slug, title: product.title }
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
