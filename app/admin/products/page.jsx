import AdminShell from "@/components/AdminShell";
import LandingPagesList from "@/components/LandingPagesList";
import { getProducts } from "@/lib/store";

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <AdminShell>
      <LandingPagesList products={products} />
    </AdminShell>
  );
}
