"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function AssetManager({ assets }) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [sortMode, setSortMode] = useState("default");
  const [query, setQuery] = useState("");
  const [folder, setFolder] = useState("colorbear-art");
  const [message, setMessage] = useState("");
  const [busyAsset, setBusyAsset] = useState("");
  const [compressingAsset, setCompressingAsset] = useState("");
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [previewAsset, setPreviewAsset] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filteredAssets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const result = assets.filter((asset) => {
      const typeMatch = filter === "all" || asset.type === filter;
      const searchText = `${asset.url} ${asset.name} ${asset.folder} ${asset.compression?.label || ""} ${(asset.references || []).join(" ")}`.toLowerCase();
      const queryMatch = !normalizedQuery || searchText.includes(normalizedQuery);
      return typeMatch && queryMatch;
    });

    if (sortMode === "updated") {
      return [...result].sort((a, b) => (new Date(b.updatedAt).getTime() || 0) - (new Date(a.updatedAt).getTime() || 0));
    }

    if (sortMode === "name") {
      return [...result].sort((a, b) => displayAssetName(a).localeCompare(displayAssetName(b), "zh-CN", { numeric: true }));
    }

    return result;
  }, [assets, filter, query, sortMode]);

  const stats = useMemo(() => {
    const byFamily = new Map();
    for (const asset of assets) {
      const familyKey = getAssetFamilyKey(asset);
      byFamily.set(familyKey, [...(byFamily.get(familyKey) || []), asset]);
    }

    const appliedAssets = assets.filter((asset) => asset.referenceCount > 0);
    const optimizedSize = appliedAssets.reduce((sum, asset) => sum + asset.size, 0);
    const originalSize = appliedAssets.reduce((sum, asset) => {
      const family = byFamily.get(getAssetFamilyKey(asset)) || [];
      const original = family.find((candidate) => !candidate.compression) || asset;
      return sum + original.size;
    }, 0);
    const savingsRate = originalSize ? Math.max(0, Math.round((1 - optimizedSize / originalSize) * 100)) : 0;

    return {
      total: assets.length,
      images: assets.filter((asset) => asset.type === "image").length,
      videos: assets.filter((asset) => asset.type === "video").length,
      optimizedSizeText: formatBytes(optimizedSize),
      originalSizeText: formatBytes(originalSize),
      savingsRate
    };
  }, [assets]);

  const deletableAssets = useMemo(() => filteredAssets.filter((asset) => !asset.referenceCount), [filteredAssets]);
  const selectedSet = useMemo(() => new Set(selectedAssets), [selectedAssets]);
  const selectedVisibleAssets = useMemo(() => filteredAssets.filter((asset) => selectedSet.has(asset.url) && !asset.referenceCount), [filteredAssets, selectedSet]);
  const allDeletableSelected = deletableAssets.length > 0 && deletableAssets.every((asset) => selectedSet.has(asset.url));
  const assetFamilyCounts = useMemo(() => {
    const counts = new Map();
    for (const asset of assets) {
      const familyKey = getAssetFamilyKey(asset);
      if (!familyKey) continue;
      counts.set(familyKey, (counts.get(familyKey) || 0) + 1);
    }
    return counts;
  }, [assets]);

  async function copyUrl(url) {
    await navigator.clipboard.writeText(url);
    setMessage("已复制素材 URL。");
  }

  async function uploadNewAsset(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage("");

    const data = new FormData();
    data.append("file", file);
    data.append("folder", folder || "products");

    const response = await fetch("/api/admin/uploads", {
      method: "POST",
      body: data
    });
    const payload = await response.json();

    setUploading(false);
    event.target.value = "";

    if (!response.ok) {
      setMessage(payload.error || "上传失败。");
      return;
    }

    setMessage("");
    startTransition(() => router.refresh());
  }

  async function replaceAsset(asset, event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setBusyAsset(asset.url);
    setMessage("");

    const data = new FormData();
    data.append("file", file);
    data.append("path", asset.url);

    const response = await fetch("/api/admin/assets/replace", {
      method: "POST",
      body: data
    });
    const payload = await response.json();

    setBusyAsset("");
    event.target.value = "";

    if (!response.ok) {
      setMessage(payload.error || "替换失败。");
      return;
    }

    setMessage("");
    startTransition(() => router.refresh());
  }

  async function deleteAsset(asset) {
    if (asset.referenceCount > 0) {
      setMessage(`不能删除：素材正在被引用（${asset.references.join("、")}）。`);
      return;
    }

    const confirmed = window.confirm(`确认删除这个素材吗？\n${asset.url}`);
    if (!confirmed) return;

    setBusyAsset(asset.url);
    setMessage("");

    const response = await fetch("/api/admin/assets/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: asset.url })
    });
    const payload = await response.json();

    setBusyAsset("");

    if (!response.ok) {
      const detail = payload.references?.length ? `：${payload.references.join("、")}` : "";
      setMessage(`${payload.error || "删除失败。"}${detail}`);
      return;
    }

    setMessage("");
    startTransition(() => router.refresh());
  }

  async function batchDeleteAssets() {
    const targets = selectedVisibleAssets;
    if (!targets.length) {
      setMessage("当前没有选中可删除的未应用素材。");
      return;
    }

    const confirmed = window.confirm(`确认删除 ${targets.length} 个未应用素材吗？`);
    if (!confirmed) return;

    setBusyAsset("batch-delete");
    setMessage("");

    const results = [];
    for (const asset of targets) {
      const response = await fetch("/api/admin/assets/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path: asset.url })
      });
      const payload = await response.json();
      results.push({ asset, ok: response.ok, payload });
    }

    setBusyAsset("");
    setSelectedAssets((current) => current.filter((url) => !targets.some((asset) => asset.url === url)));

    const failed = results.filter((result) => !result.ok);
    if (failed.length) {
      setMessage(`已删除 ${results.length - failed.length} 个，${failed.length} 个失败。失败素材可能已被引用或线上环境不支持删除。`);
    } else {
      setMessage("");
    }

    startTransition(() => router.refresh());
  }

  async function applyAssetToReferences(asset) {
    const confirmed = window.confirm(`切换落地页使用这个素材版本吗？\n${asset.url}`);
    if (!confirmed) return;

    const busyKey = `apply-${asset.url}`;
    setBusyAsset(busyKey);
    setMessage("");

    const response = await fetch("/api/admin/assets/apply", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: asset.url })
    });
    const payload = await response.json();

    setBusyAsset("");

    if (!response.ok) {
      setMessage(payload.error || "应用素材失败。");
      return;
    }

    setMessage("");
    startTransition(() => router.refresh());
  }

  function toggleAssetSelection(asset) {
    if (asset.referenceCount) return;
    setSelectedAssets((current) => {
      if (current.includes(asset.url)) return current.filter((url) => url !== asset.url);
      return [...current, asset.url];
    });
  }

  function toggleAllDeletable() {
    if (allDeletableSelected) {
      setSelectedAssets((current) => current.filter((url) => !deletableAssets.some((asset) => asset.url === url)));
      return;
    }

    setSelectedAssets((current) => Array.from(new Set([...current, ...deletableAssets.map((asset) => asset.url)])));
  }

  async function compressAsset(asset, preset) {
    setCompressingAsset(`${asset.url}-${preset.id}`);
    setMessage("");

    try {
      const blob = await fetch(asset.url).then((response) => response.blob());
      const image = await loadImage(blob);
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);

      const compressedBlob = await canvasToBlob(canvas, "image/webp", preset.quality);
      URL.revokeObjectURL(image.src);

      const originalName = normalizeAssetFamilyBase(asset.name.replace(/\.[^.]+$/, ""));
      const compressedFile = new File([compressedBlob], `${originalName}-${preset.id}.webp`, { type: "image/webp" });
      const data = new FormData();
      data.append("file", compressedFile);
      data.append("folder", uploadFolderFromAsset(asset));
      data.append("compression", preset.id);

      const response = await fetch("/api/admin/uploads", {
        method: "POST",
        body: data
      });
      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error || "压缩上传失败。");
        return;
      }

      setMessage("");
      startTransition(() => router.refresh());
    } catch (error) {
      setMessage(error.message || "压缩失败。");
    } finally {
      setCompressingAsset("");
    }
  }

  return (
    <div className="grid">
      <div className="page-head">
        <div>
          <h2>素材管理</h2>
          <p className="muted">管理落地页使用的图片和视频素材，查看大小、尺寸、路径，并快速替换。</p>
        </div>
      </div>

      <section className="stats-grid assets-stats">
        <Stat label="素材总数" value={stats.total} />
        <Stat label="图片" value={stats.images} />
        <Stat label="视频" value={stats.videos} />
        <SizeStat optimized={stats.optimizedSizeText} original={stats.originalSizeText} savings={stats.savingsRate} />
      </section>

      <section className="card asset-upload-panel">
        <div>
          <h3>上传新素材</h3>
          <p className="muted">上传后会生成新的 URL。要让落地页使用它，可以复制 URL 到落地页编辑页对应字段。</p>
        </div>
        <label className="field">
          <span>保存目录</span>
          <input value={folder} onChange={(event) => setFolder(event.target.value)} placeholder="例如 colorbear-art" />
        </label>
        <label className="btn secondary asset-file-button">
          {uploading ? "上传中..." : "选择文件上传"}
          <input accept="image/*,video/*" disabled={uploading} type="file" onChange={uploadNewAsset} />
        </label>
      </section>

      <section className="card asset-note">
        <strong>替换说明</strong>
        <p className="muted">
          “替换素材”会覆盖同一个 URL，页面不用重新改路径。Vercel 正式环境不适合长期直接写入文件；正式放量后建议切到 Bunny/R2/CDN 素材库。
        </p>
      </section>

      <section className="card asset-toolbar asset-filter-console" aria-label="素材筛选工具">
        <label className="asset-search-box">
          <span className="asset-control-label">搜索素材</span>
          <span className="asset-search-input">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="文件名、目录或 URL" />
            {query ? (
              <button type="button" onClick={() => setQuery("")} aria-label="清空搜索">
                清除
              </button>
            ) : null}
          </span>
        </label>

        <div className="asset-control-strip">
          <ControlGroup label="类型">
            {assetTypeFilters.map((item) => (
              <button
                aria-pressed={filter === item.value}
                className={filter === item.value ? "is-active" : ""}
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </button>
            ))}
          </ControlGroup>
          <ControlGroup label="排序">
            {assetSortOptions.map((item) => (
              <button
                aria-pressed={sortMode === item.value}
                className={sortMode === item.value ? "is-active" : ""}
                key={item.value}
                type="button"
                onClick={() => setSortMode(item.value)}
              >
                {item.label}
              </button>
            ))}
          </ControlGroup>
          <ControlGroup label="视图">
            {assetViewOptions.map((item) => (
              <button
                aria-pressed={viewMode === item.value}
                className={viewMode === item.value ? "is-active" : ""}
                key={item.value}
                type="button"
                onClick={() => setViewMode(item.value)}
              >
                {item.label}
              </button>
            ))}
          </ControlGroup>
        </div>
      </section>

      {message ? <p className="asset-message">{message}</p> : null}
      {isPending ? <p className="muted">正在刷新素材列表...</p> : null}

      <section className="card asset-bulk-bar">
        <label>
          <input
            checked={allDeletableSelected}
            disabled={!deletableAssets.length}
            type="checkbox"
            onChange={toggleAllDeletable}
          />
          <span>选择当前结果中的未应用素材</span>
        </label>
        <p className="muted">
          当前已选 {selectedVisibleAssets.length} 个，可删除 {deletableAssets.length} 个
        </p>
        <button className="btn warn small" disabled={!selectedVisibleAssets.length || busyAsset === "batch-delete"} type="button" onClick={batchDeleteAssets}>
          {busyAsset === "batch-delete" ? "批量删除中..." : "批量删除"}
        </button>
      </section>

      <section className={viewMode === "list" ? "asset-grid asset-list-mode" : "asset-grid"}>
        {viewMode === "list" ? (
          <div className="asset-list-header" aria-hidden="true">
            <span></span>
            <span>预览</span>
            <span>素材信息</span>
            <span>应用与规格</span>
            <span>操作</span>
          </div>
        ) : null}
        {filteredAssets.map((asset) => {
          const familyKey = getAssetFamilyKey(asset);
          const isVersionedAsset = Boolean(familyKey && (assetFamilyCounts.get(familyKey) || 0) > 1);
          const isApplied = Boolean(asset.referenceCount);
          const canApply = Boolean(isVersionedAsset && !isApplied);
          return (
          <article className={`card asset-card ${asset.referenceCount ? "is-referenced" : "is-free"}`} key={asset.url}>
            <div className="asset-select-cell">
              <input
                aria-label={`选择 ${asset.name}`}
                checked={selectedSet.has(asset.url)}
                disabled={Boolean(asset.referenceCount)}
                type="checkbox"
                onChange={() => toggleAssetSelection(asset)}
              />
            </div>
            <button className="asset-preview" type="button" onClick={() => setPreviewAsset(asset)}>
              {asset.type === "image" ? (
                <img alt={asset.name} src={`${asset.url}?v=${encodeURIComponent(asset.updatedAt)}`} />
              ) : (
                <video muted playsInline preload="metadata" src={asset.url} />
              )}
              <span>点击预览</span>
            </button>

            <div className="asset-card-body">
              <div className="asset-title-block">
                <div className="asset-badges">
                  <span className={`pill ${asset.type === "image" ? "published" : "draft"}`}>{asset.type === "image" ? "图片" : "视频"}</span>
                  {isApplied ? <span className="pill draft">已应用</span> : <span className="pill archived">未应用</span>}
                </div>
                <h3 title={displayAssetName(asset)}>{displayAssetName(asset)}</h3>
                <div className="asset-path-row">
                  <code title={displayAssetPath(asset)}>{displayAssetPath(asset)}</code>
                  <button type="button" onClick={() => copyUrl(asset.url)}>
                    复制
                  </button>
                </div>
              </div>

              {viewMode === "list" ? (
                <p className="asset-compact-meta" title={compactAssetSummary(asset)}>
                  {compactAssetSummary(asset)}
                </p>
              ) : (
                <dl className="asset-meta">
                  <div>
                    <dt>大小</dt>
                    <dd>{asset.sizeText}</dd>
                  </div>
                  <div>
                    <dt>尺寸</dt>
                    <dd>{asset.dimensionsText}</dd>
                  </div>
                  <div>
                    <dt>格式</dt>
                    <dd>{asset.extension}</dd>
                  </div>
                  <div>
                    <dt>更新</dt>
                    <dd>{formatAssetDate(asset.updatedAt)}</dd>
                  </div>
                </dl>
              )}

              <div className="asset-usage-panel">
                {asset.referenceCount ? (
                  <p className="asset-references">
                    <span>应用位置</span>
                    {asset.references.join("、")}
                  </p>
                ) : (
                  <p className="asset-references is-free">
                    <span>状态</span>
                    未应用，可删除
                  </p>
                )}

              </div>

              {canCompress(asset) ? (
                <div className="asset-compress">
                  <span>生成 WebP</span>
                  <div>
                    {qualityPresets.map((preset) => (
                      <button
                        className="btn secondary small compact"
                        disabled={compressingAsset === `${asset.url}-${preset.id}`}
                        key={preset.id}
                        type="button"
                        title={`压缩为${preset.label} WebP`}
                        onClick={() => compressAsset(asset, preset)}
                      >
                        {compressingAsset === `${asset.url}-${preset.id}` ? "..." : preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : viewMode === "list" ? (
                <div className="asset-compress asset-compress-empty">-</div>
              ) : (
                null
              )}

              <div className="asset-actions">
                {isApplied ? (
                  <>
                    <button className="btn apply small compact is-applied" disabled type="button" title="当前页面正在使用这个素材">
                      已应用
                    </button>
                    <label className="btn small compact asset-file-button" title="重新上传本地素材覆盖当前 URL">
                      {busyAsset === asset.url ? "..." : "替换"}
                      <input
                        accept={asset.type === "image" ? "image/*" : "video/*"}
                        disabled={busyAsset === asset.url}
                        type="file"
                        onChange={(event) => replaceAsset(asset, event)}
                      />
                    </label>
                  </>
                ) : (
                  <>
                  <button
                    className="btn apply small compact"
                    disabled={!canApply || busyAsset === `apply-${asset.url}`}
                    type="button"
                    title={canApply ? "切换落地页使用这个素材" : "没有可切换的同组素材"}
                    onClick={() => applyAssetToReferences(asset)}
                  >
                    {busyAsset === `apply-${asset.url}` ? "..." : "应用"}
                  </button>
                  {!asset.referenceCount ? (
                    <button className="btn warn small compact" disabled={busyAsset === asset.url} type="button" title="删除素材" onClick={() => deleteAsset(asset)}>
                      {busyAsset === asset.url ? "..." : "删除"}
                    </button>
                  ) : null}
                  </>
                )}
              </div>
            </div>
          </article>
          );
        })}
      </section>

      {!filteredAssets.length ? <p className="muted">没有找到符合条件的素材。</p> : null}

      {previewAsset ? (
        <div className="asset-preview-modal" role="dialog" aria-modal="true" aria-label="素材预览" onClick={() => setPreviewAsset(null)}>
          <div className="asset-preview-modal-panel" onClick={(event) => event.stopPropagation()}>
            <button className="asset-preview-close" type="button" onClick={() => setPreviewAsset(null)}>
              关闭
            </button>
            {previewAsset.type === "image" ? (
              <img alt={previewAsset.name} src={`${previewAsset.url}?v=${encodeURIComponent(previewAsset.updatedAt)}`} />
            ) : (
              <video controls src={previewAsset.url} />
            )}
            <p>{previewAsset.url}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const qualityPresets = [
  { id: "high", label: "高清", quality: 0.86 },
  { id: "balanced", label: "均衡", quality: 0.72 },
  { id: "small", label: "极小", quality: 0.56 }
];

const assetTypeFilters = [
  { value: "all", label: "全部" },
  { value: "image", label: "图片" },
  { value: "video", label: "视频" }
];

const assetSortOptions = [
  { value: "default", label: "默认" },
  { value: "updated", label: "更新" },
  { value: "name", label: "名称" }
];

const assetViewOptions = [
  { value: "grid", label: "卡片" },
  { value: "list", label: "列表" }
];

function Stat({ label, value }) {
  return (
    <div className="card">
      <p className="muted">{label}</p>
      <h3>{value}</h3>
    </div>
  );
}

function SizeStat({ optimized, original, savings }) {
  return (
    <div className="card asset-size-stat">
      <p className="muted">素材优化</p>
      <div className="asset-size-compare">
        <div>
          <span>原素材</span>
          <strong>{original}</strong>
        </div>
        <div>
          <span>优化后</span>
          <strong>{optimized}</strong>
        </div>
      </div>
      <div className="asset-size-saving">
        <span>已应用版本对比原图</span>
        <b>节省 {savings}%</b>
      </div>
    </div>
  );
}

function ControlGroup({ label, children }) {
  return (
    <div className="asset-control-group">
      <span className="asset-control-label">{label}</span>
      <div className="asset-toggle-group">{children}</div>
    </div>
  );
}

function canCompress(asset) {
  return asset.type === "image" && ["JPG", "JPEG", "PNG", "WEBP"].includes(asset.extension) && asset.width && asset.height;
}

function uploadFolderFromAsset(asset) {
  if (asset.folder.startsWith("/uploads/")) return asset.folder.replace("/uploads/", "");
  return "optimized";
}

function loadImage(blob) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("图片读取失败。"));
    image.src = URL.createObjectURL(blob);
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("浏览器不支持当前压缩格式。"));
    }, type, quality);
  });
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function compactAssetFacts(asset) {
  return [formatCompactBytes(asset.size), formatCompactDimensions(asset), asset.extension.toLowerCase(), formatAssetDate(asset.updatedAt)];
}

function compactAssetSummary(asset) {
  const facts = compactAssetFacts(asset).join(" / ");
  return `${assetVariantLabel(asset)} ${facts}`;
}

function getCompressionLabel(asset) {
  if (asset.compression?.label) return asset.compression.label;
  const matches = Array.from(String(asset.name || "").matchAll(/(?:compressed-)?(high|balanced|small)(?:-|\.|$)/gi));
  const match = matches.at(-1);
  if (!match) return "";
  const labels = {
    high: "高清",
    balanced: "均衡",
    small: "极小"
  };
  return labels[match[1].toLowerCase()] || "";
}

function assetVariantLabel(asset) {
  return getCompressionLabel(asset) || "原图";
}

function displayAssetName(asset) {
  return asset.name;
}

function displayAssetPath(asset) {
  return asset.url;
}

function getAssetFamilyKey(asset) {
  if (asset.familyKey) return asset.familyKey;
  const url = String(asset.url || "");
  const lastSlash = url.lastIndexOf("/");
  const folder = lastSlash >= 0 ? url.slice(0, lastSlash) : "";
  const fileName = lastSlash >= 0 ? url.slice(lastSlash + 1) : url;
  const base = fileName.replace(/\.[^.]+$/, "");
  return `${folder}/${normalizeAssetFamilyBase(base)}`;
}

function normalizeAssetFamilyBase(fileBaseName) {
  return String(fileBaseName || "")
    .replace(/^\d+-/, "")
    .replace(/-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "")
    .replace(/-compressed-(high|balanced|small)$/i, "")
    .replace(/-(high|balanced|small)$/i, "");
}

function formatCompactBytes(bytes) {
  if (!Number.isFinite(bytes)) return "-";
  if (bytes < 1024) return `${bytes}b`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}k`;
  const mb = bytes / 1024 / 1024;
  return `${mb >= 10 ? Math.round(mb) : mb.toFixed(1)}m`;
}

function formatCompactDimensions(asset) {
  if (!asset.width || !asset.height) return "未识别";
  return `${asset.width}*${asset.height}`;
}

function formatAssetDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}-${day}`;
}
