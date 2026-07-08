"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteProductButton({ product }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(`确认删除「${product.title}」？\n\n删除后后台列表会移除这个落地页，前台 /p/${product.slug} 也无法继续访问。`);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE"
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "删除失败，请稍后再试。");
      }
      router.refresh();
    } catch (error) {
      alert(error.message);
      setIsDeleting(false);
    }
  }

  return (
    <button className="btn danger small" type="button" disabled={isDeleting} onClick={handleDelete}>
      {isDeleting ? "删除中" : "删除"}
    </button>
  );
}
