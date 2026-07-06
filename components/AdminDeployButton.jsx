"use client";

import { useEffect, useState } from "react";

export default function AdminDeployButton() {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [isConfigured, setIsConfigured] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function checkDeployHook() {
      try {
        const response = await fetch("/api/admin/deploy", { cache: "no-store" });
        const data = await response.json();

        if (isMounted) {
          setIsConfigured(Boolean(data.configured));
        }
      } catch {
        if (isMounted) {
          setIsConfigured(false);
        }
      }
    }

    checkDeployHook();

    return () => {
      isMounted = false;
    };
  }, []);

  async function deploy() {
    if (status === "loading" || isConfigured === false) return;
    const confirmed = window.confirm("确认发布到线上？Vercel 会用当前 GitHub 代码重新构建正式站。");
    if (!confirmed) return;

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/admin/deploy", {
        method: "POST",
        headers: { "content-type": "application/json" }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "发布失败");
      }

      setStatus("success");
      setMessage(data.message || "已触发发布");
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "发布失败");
    }
  }

  const isDisabled = status === "loading" || isConfigured !== true;
  const buttonText = isConfigured === false ? "未配置发布" : status === "loading" ? "发布中..." : "发布线上";

  return (
    <div className="admin-deploy-control">
      <button
        className="admin-deploy-button"
        type="button"
        onClick={deploy}
        disabled={isDisabled}
        title={isConfigured === false ? "缺少 VERCEL_DEPLOY_HOOK_URL" : "发布到线上"}
      >
        {buttonText}
      </button>
      {message ? <span className={`admin-deploy-message is-${status}`}>{message}</span> : null}
    </div>
  );
}
