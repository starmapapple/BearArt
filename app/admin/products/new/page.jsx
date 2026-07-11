import AdminShell from "@/components/AdminShell";
import ProductManager from "@/components/ProductManager";
import { getAdminLocale } from "@/lib/adminLocaleServer";

export default async function NewProductPage() {
  const locale = await getAdminLocale();
  return (
    <AdminShell locale={locale}>
      <ProductManager />
    </AdminShell>
  );
}
