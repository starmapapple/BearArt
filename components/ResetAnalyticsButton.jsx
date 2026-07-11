"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminLanguage } from "@/components/AdminLanguageProvider";

export default function ResetAnalyticsButton() {
  const router = useRouter();
  const { t } = useAdminLanguage();
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function reset() {
    setStatus("loading");
    setError("");
    try {
      const response = await fetch("/api/admin/analytics/reset", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || t("重置失败"));
      setStatus("success");
      router.refresh();
    } catch (error) {
      setStatus("error");
      setError(error.message || t("重置失败"));
    }
  }

  if (status === "confirming") {
    return (
      <div className="analytics-reset-confirm" role="group" aria-label={t("重置统计起点")}>
        <span>{t("历史数据会保留，但不再计入看板。")}</span>
        <button className="btn danger" type="button" onClick={reset}>{t("确认清理")}</button>
        <button className="btn secondary" type="button" onClick={() => setStatus("idle")}>{t("取消")}</button>
      </div>
    );
  }

  return (
    <div className="analytics-reset-control">
      <button
        className="btn secondary analytics-reset-button"
        type="button"
        onClick={() => setStatus("confirming")}
        disabled={status === "loading" || status === "success"}
      >
        {status === "loading" ? t("正在重置...") : status === "success" ? t("已重置") : t("重置统计起点")}
      </button>
      {error ? <span className="analytics-reset-error" role="alert">{error}</span> : null}
    </div>
  );
}
