import AdminShell from "@/components/AdminShell";
import AssetManager from "@/components/AssetManager";
import { getAdminAssets } from "@/lib/adminAssets";
import { getProducts } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  const products = await getProducts();
  const assets = await getAdminAssets(products);

  return (
    <AdminShell>
      <AssetManager assets={assets} />
    </AdminShell>
  );
}
