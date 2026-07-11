"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ResetAnalyticsButton() {
  const router = useRouter();
  const [status, setStatus] = useState("idle");

  async function reset() {
    if (!window.confirm("确认从现在开始重新统计？历史订单和事件仍会保留，但不会再计入分析看板。")) return;
    setStatus("loading");
    try {
      const response = await fetch("/api/admin/analytics/reset", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "重置失败");
      setStatus("success");
      router.refresh();
    } catch (error) {
      setStatus("error");
      window.alert(error.message || "重置失败");
    }
  }

  return (
    <button className="btn secondary analytics-reset-button" type="button" onClick={reset} disabled={status === "loading"}>
      {status === "loading" ? "正在重置..." : status === "success" ? "已重置" : "重置统计起点"}
    </button>
  );
}
