"use client";

import { useState } from "react";

export default function AdminDeployButton() {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function deploy() {
    if (status === "loading") return;
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

  return (
    <div className="admin-deploy-control">
      <button className="admin-deploy-button" type="button" onClick={deploy} disabled={status === "loading"}>
        {status === "loading" ? "发布中..." : "发布线上"}
      </button>
      {message ? <span className={`admin-deploy-message is-${status}`}>{message}</span> : null}
    </div>
  );
}
