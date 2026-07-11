"use client";

import { useEffect, useRef, useState } from "react";
import { useAdminLanguage } from "@/components/AdminLanguageProvider";

const deploySteps = [
  { key: "requested", label: "已触发", progress: 18, seconds: 0 },
  { key: "building", label: "构建中", progress: 55, seconds: 12 },
  { key: "promoting", label: "上线中", progress: 82, seconds: 45 },
  { key: "ready", label: "可检查", progress: 100, seconds: 90 }
];

export default function AdminDeployButton() {
  const { t } = useAdminLanguage();
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [isConfigured, setIsConfigured] = useState(null);
  const [deployProgress, setDeployProgress] = useState(0);
  const [deployStep, setDeployStep] = useState(null);
  const [checkUrl, setCheckUrl] = useState("");
  const timersRef = useRef([]);

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

  useEffect(() => {
    return () => clearProgressTimers();
  }, []);

  function clearProgressTimers() {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }

  function scheduleProgress(siteUrl) {
    clearProgressTimers();
    deploySteps.forEach((step) => {
      const timer = window.setTimeout(() => {
        setDeployStep({ ...step, label: t(step.label) });
        setDeployProgress(step.progress);
        if (step.key === "requested") {
          setMessage(t("Vercel 已收到发布请求。"));
        }
        if (step.key === "building") {
          setMessage(t("正在构建线上版本..."));
        }
        if (step.key === "promoting") {
          setMessage(t("正在切换到最新线上版本..."));
        }
        if (step.key === "ready") {
          setStatus("success");
          setMessage(t("发布流程已完成，可以打开线上检查。"));
          setCheckUrl(siteUrl || "https://grupbeli.com/p/colorbear-art");
        }
      }, step.seconds * 1000);
      timersRef.current.push(timer);
    });
  }

  async function deploy() {
    if (status === "loading" || status === "progress" || isConfigured === false) return;
    const confirmed = window.confirm(t("确认发布到线上？Vercel 会用当前 GitHub 代码重新构建正式站。"));
    if (!confirmed) return;

    setStatus("loading");
    setMessage("");
    setDeployProgress(8);
    setDeployStep({ key: "starting", label: t("准备中"), progress: 8 });
    setCheckUrl("");

    try {
      const response = await fetch("/api/admin/deploy", {
        method: "POST",
        headers: { "content-type": "application/json" }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("发布失败"));
      }

      const siteUrl = data.checkUrl || "https://grupbeli.com/p/colorbear-art";
      setStatus("progress");
      setMessage(data.message || t("已触发发布，Vercel 正在构建。"));
      setDeployStep({ ...deploySteps[0], label: t(deploySteps[0].label) });
      setDeployProgress(deploySteps[0].progress);
      scheduleProgress(siteUrl);
    } catch (error) {
      setStatus("error");
      setMessage(error.message || t("发布失败"));
      setDeployProgress(0);
      setDeployStep(null);
    }
  }

  const isDisabled = status === "loading" || status === "progress" || isConfigured !== true;
  const buttonText =
    isConfigured === false ? t("未配置发布") : status === "loading" || status === "progress" ? t("发布中...") : t("发布线上");

  return (
    <div className="admin-deploy-control">
      <button
        className="admin-deploy-button"
        type="button"
        onClick={deploy}
        disabled={isDisabled}
        title={isConfigured === false ? t("缺少 VERCEL_DEPLOY_HOOK_URL") : t("发布到线上")}
      >
        {buttonText}
      </button>
      {message ? (
        <div className={`admin-deploy-progress is-${status}`} role="status" aria-live="polite">
          <div className="admin-deploy-progress-head">
            <strong>{deployStep?.label || (status === "error" ? t("发布失败") : t("发布状态"))}</strong>
            <span>{deployProgress}%</span>
          </div>
          <div className="admin-deploy-track" aria-hidden="true">
            <span style={{ width: `${deployProgress}%` }} />
          </div>
          <p>{message}</p>
          {checkUrl ? (
            <a href={checkUrl} target="_blank" rel="noreferrer">
              {t("打开线上检查")}
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
