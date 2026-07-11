import AdminShell from "@/components/AdminShell";
import AssetManager from "@/components/AssetManager";
import { getAdminAssets } from "@/lib/adminAssets";
import { getProducts } from "@/lib/store";
import { getAdminLocale } from "@/lib/adminLocaleServer";

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  const products = await getProducts();
  const assets = await getAdminAssets(products);
  const locale = await getAdminLocale();

  return (
    <AdminShell locale={locale}>
      <AssetManager assets={assets} />
    </AdminShell>
  );
}
