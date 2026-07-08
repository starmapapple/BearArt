import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/auditLog";
import { deleteProduct, updateProduct } from "@/lib/store";

export async function PUT(request, context) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const product = await updateProduct(id, body);
    if (!product) {
      return NextResponse.json({ error: "落地页不存在。" }, { status: 404 });
    }
    await writeAuditLog({
      action: "product_updated",
      entityType: "product",
      entityId: product.id,
      summary: `更新落地页：${product.title}`,
      details: { id: product.id, slug: product.slug, title: product.title }
    });
    return NextResponse.json({ product });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(_request, context) {
  try {
    const { id } = await context.params;
    const product = await deleteProduct(id);
    if (!product) {
      return NextResponse.json({ error: "落地页不存在。" }, { status: 404 });
    }
    await writeAuditLog({
      action: "product_deleted",
      entityType: "product",
      entityId: product.id,
      summary: `删除落地页：${product.title}`,
      details: { id: product.id, slug: product.slug, title: product.title, status: product.status }
    });
    return NextResponse.json({ ok: true, product });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
