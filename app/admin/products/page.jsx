import AdminShell from "@/components/AdminShell";
import LandingPagesList from "@/components/LandingPagesList";
import { getProducts } from "@/lib/store";
import { getAdminLocale } from "@/lib/adminLocaleServer";

export default async function ProductsPage() {
  const products = await getProducts();
  const locale = await getAdminLocale();

  return (
    <AdminShell locale={locale}>
      <LandingPagesList products={products} />
    </AdminShell>
  );
}
