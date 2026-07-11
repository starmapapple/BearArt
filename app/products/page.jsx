import { redirect } from "next/navigation";

export const metadata = {
  title: "全部商品",
  description: "查看当前已发布的商品落地页。"
};

export default function ProductsPage() {
  redirect("/p/colorbear-art");
}
