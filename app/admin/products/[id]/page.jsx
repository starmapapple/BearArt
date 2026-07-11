import { notFound } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import ProductManager from "@/components/ProductManager";
import { getProductById } from "@/lib/store";
import { getAdminLocale } from "@/lib/adminLocaleServer";

export default async function EditProductPage({ params }) {
  const { id } = await params;
  const product = await getProductById(id);
  const locale = await getAdminLocale();
  if (!product) notFound();

  return (
    <AdminShell locale={locale}>
      <ProductManager product={product} />
    </AdminShell>
  );
}
