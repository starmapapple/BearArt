import { notFound } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import ProductManager from "@/components/ProductManager";
import { getProductById } from "@/lib/store";

export default async function EditProductPage({ params }) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  return (
    <AdminShell>
      <ProductManager product={product} />
    </AdminShell>
  );
}
