"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const emptyProduct = {
  title: "",
  slug: "",
  status: "draft",
  subtitle: "",
  heroImage: "",
  problemImage: "",
  videoUrl: "",
  videoPoster: "",
  usageGuideImage: "",
  giftImages: "",
  gallery: "",
  price: 0,
  compareAtPrice: 0,
  variants: "Default",
  benefits: "",
  sections: "",
  reviews: "",
  faqs: "",
  ctaText: "立即购买",
  codEnabled: true,
  paymentMethods: "cod",
  metaPixelId: "",
  tiktokPixelId: "",
  googleAdsId: ""
};

export default function ProductManager({ product }) {
  const router = useRouter();
  const editing = Boolean(product?.id);
  const [form, setForm] = useState(() => toForm(product || emptyProduct));
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [message, setMessage] = useState("");

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const body = fromForm(form);
    const response = await fetch(editing ? `/api/admin/products/${product.id}` : "/api/admin/products", {
      method: editing ? "PUT" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    const payload = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(payload.error || "保存失败。");
      return;
    }

    setForm(toForm(payload.product));
    setMessage("已保存。");
    router.refresh();
    if (!editing) {
      router.push(`/admin/products/${payload.product.id}`);
    }
  }

  async function uploadVideo(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    setMessage("");
    const data = new FormData();
    data.append("file", file);
    data.append("folder", form.slug || "products");

    const response = await fetch("/api/admin/uploads", {
      method: "POST",
      body: data
    });
    const payload = await response.json();
    setUploadingVideo(false);
    event.target.value = "";

    if (!response.ok) {
      setMessage(payload.error || "视频上传失败。");
      return;
    }

    update("videoUrl", payload.url);
    setMessage("演示视频已上传，保存落地页后生效。");
  }

  return (
    <div className="grid">
      <div className="page-head">
        <div>
          <h2>{editing ? "编辑落地页" : "新增落地页"}</h2>
          <p className="muted">每个落地页只绑定一个商品，不展示其他商品入口。</p>
        </div>
        <Link className="btn secondary" href="/admin/products">
          返回列表
        </Link>
      </div>

      <form className="card form-grid product-editor-form" onSubmit={save}>
        <div className="form-section-heading full">
          <span>01</span>
          <div>
            <h3>基础信息</h3>
            <p>控制落地页标题、路径、发布状态和购买按钮。</p>
          </div>
        </div>
        <div className="field">
          <label htmlFor="title">商品标题</label>
          <input id="title" required value={form.title} onChange={(event) => update("title", event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="slug">访问路径</label>
          <input id="slug" required value={form.slug} onChange={(event) => update("slug", event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="status">发布状态</label>
          <select id="status" value={form.status} onChange={(event) => update("status", event.target.value)}>
            <option value="draft">草稿</option>
            <option value="published">已发布</option>
            <option value="archived">已下架</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="ctaText">购买按钮文案</label>
          <input id="ctaText" value={form.ctaText} onChange={(event) => update("ctaText", event.target.value)} />
        </div>
        <div className="field full">
          <label htmlFor="subtitle">副标题</label>
          <textarea id="subtitle" value={form.subtitle} onChange={(event) => update("subtitle", event.target.value)} />
        </div>
        <div className="form-section-heading full">
          <span>02</span>
          <div>
            <h3>媒体素材</h3>
            <p>首图、视频、赠品和详情图都可以粘贴素材管理里的 URL。</p>
          </div>
        </div>
        <div className="field full">
          <label htmlFor="heroImage">首图 URL</label>
          <input id="heroImage" value={form.heroImage} onChange={(event) => update("heroImage", event.target.value)} />
        </div>
        <div className="field full">
          <label htmlFor="videoUrl">演示视频 URL</label>
          <input
            id="videoUrl"
            placeholder="上传视频后会自动填入，也可以粘贴外部视频地址"
            value={form.videoUrl}
            onChange={(event) => update("videoUrl", event.target.value)}
          />
        </div>
        <div className="field full">
          <label htmlFor="videoUpload">上传演示视频</label>
          <input id="videoUpload" accept="video/*" type="file" onChange={uploadVideo} />
          <p className="muted">支持常见视频格式，上传后会自动填入上方视频 URL。</p>
          {uploadingVideo ? <p className="muted">视频上传中...</p> : null}
        </div>
        <div className="field full">
          <label htmlFor="videoPoster">视频封面 URL</label>
          <input
            id="videoPoster"
            placeholder="不填时会使用首图作为视频封面"
            value={form.videoPoster}
            onChange={(event) => update("videoPoster", event.target.value)}
          />
        </div>
        <div className="field full">
          <label htmlFor="giftImages">赠品图片 URL，每行一个</label>
          <textarea
            id="giftImages"
            placeholder="用于促销赠品轮播，点击可放大"
            value={form.giftImages}
            onChange={(event) => update("giftImages", event.target.value)}
          />
        </div>
        <div className="field full">
          <label htmlFor="gallery">详情图片 URL，每行一个</label>
          <textarea id="gallery" value={form.gallery} onChange={(event) => update("gallery", event.target.value)} />
        </div>
        <div className="form-section-heading full">
          <span>03</span>
          <div>
            <h3>价格与支付</h3>
            <p>配置售价、划线价、规格、COD 和在线支付方式。</p>
          </div>
        </div>
        <div className="field">
          <label htmlFor="price">售价</label>
          <input id="price" type="number" value={form.price} onChange={(event) => update("price", event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="compareAtPrice">划线价</label>
          <input
            id="compareAtPrice"
            type="number"
            value={form.compareAtPrice}
            onChange={(event) => update("compareAtPrice", event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="variants">规格，每行一个</label>
          <textarea id="variants" value={form.variants} onChange={(event) => update("variants", event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="paymentMethods">支付方式，每行一个</label>
          <textarea id="paymentMethods" value={form.paymentMethods} onChange={(event) => update("paymentMethods", event.target.value)} />
        </div>
        <label className="field">
          <span>是否开启 COD</span>
          <select value={form.codEnabled ? "yes" : "no"} onChange={(event) => update("codEnabled", event.target.value === "yes")}>
            <option value="yes">开启</option>
            <option value="no">关闭</option>
          </select>
        </label>
        <div className="form-section-heading full">
          <span>04</span>
          <div>
            <h3>页面内容</h3>
            <p>卖点、模块、评价和 FAQ 会按当前模板或自由版式渲染。</p>
          </div>
        </div>
        <div className="field">
          <label htmlFor="benefits">卖点，每行一个</label>
          <textarea id="benefits" value={form.benefits} onChange={(event) => update("benefits", event.target.value)} />
        </div>
        <div className="field full">
          <label htmlFor="sections">内容模块，每行格式：标题 | 正文</label>
          <textarea id="sections" value={form.sections} onChange={(event) => update("sections", event.target.value)} />
        </div>
        <div className="field full">
          <label htmlFor="reviews">用户评价，每行格式：姓名 | 星级 | 内容 | 头像URL | 评论图URL(逗号分隔)</label>
          <textarea id="reviews" value={form.reviews} onChange={(event) => update("reviews", event.target.value)} />
        </div>
        <div className="field full">
          <label htmlFor="faqs">FAQ，每行格式：问题 | 答案</label>
          <textarea id="faqs" value={form.faqs} onChange={(event) => update("faqs", event.target.value)} />
        </div>
        <div className="form-section-heading full">
          <span>05</span>
          <div>
            <h3>追踪代码</h3>
            <p>广告平台 Pixel 和转化回传相关配置。</p>
          </div>
        </div>
        <div className="field">
          <label htmlFor="metaPixelId">Meta Pixel ID</label>
          <input id="metaPixelId" value={form.metaPixelId} onChange={(event) => update("metaPixelId", event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="tiktokPixelId">TikTok Pixel ID</label>
          <input id="tiktokPixelId" value={form.tiktokPixelId} onChange={(event) => update("tiktokPixelId", event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="googleAdsId">Google Ads ID</label>
          <input id="googleAdsId" value={form.googleAdsId} onChange={(event) => update("googleAdsId", event.target.value)} />
        </div>
        <div className="field full">
          {message ? <p className="muted">{message}</p> : null}
          <button className="btn" disabled={saving} type="submit">
            {saving ? "保存中..." : "保存落地页"}
          </button>
        </div>
      </form>
    </div>
  );
}

function toForm(product) {
  return {
    ...emptyProduct,
    ...product,
    giftImages: toTextarea(product.giftImages),
    gallery: toTextarea(product.gallery),
    variants: toTextarea(product.variants),
    benefits: toTextarea(product.benefits),
    paymentMethods: toTextarea(product.paymentMethods),
    sections: toStructuredTextarea(product.sections, (section) => `${section.heading || ""} | ${section.body || ""}`),
    reviews: toStructuredTextarea(product.reviews, (review) =>
      [review.name || "", review.rating || 5, review.text || "", review.avatar || "", (review.gallery || []).join(", ")].join(" | ")
    ),
    faqs: toStructuredTextarea(product.faqs, (faq) => `${faq.question || ""} | ${faq.answer || ""}`),
    metaPixelId: product.pixels?.metaPixelId || "",
    tiktokPixelId: product.pixels?.tiktokPixelId || "",
    googleAdsId: product.pixels?.googleAdsId || ""
  };
}

function fromForm(form) {
  return {
    ...form,
    price: Number(form.price || 0),
    compareAtPrice: Number(form.compareAtPrice || 0),
    giftImages: lines(form.giftImages),
    gallery: lines(form.gallery),
    variants: lines(form.variants),
    benefits: lines(form.benefits),
    paymentMethods: lines(form.paymentMethods),
    sections: lines(form.sections).map((line) => {
      const [heading, ...rest] = line.split("|");
      return { heading: heading?.trim() || "", body: rest.join("|").trim() };
    }),
    reviews: lines(form.reviews).map((line) => {
      const [name, rating, text = "", avatar = "", gallery = ""] = line.split("|");
      return {
        name: name?.trim() || "",
        rating: Number(rating || 5),
        text: text.trim(),
        avatar: avatar.trim(),
        gallery: gallery
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      };
    }),
    faqs: lines(form.faqs).map((line) => {
      const [question, ...rest] = line.split("|");
      return { question: question?.trim() || "", answer: rest.join("|").trim() };
    }),
    pixels: {
      metaPixelId: form.metaPixelId,
      tiktokPixelId: form.tiktokPixelId,
      googleAdsId: form.googleAdsId
    }
  };
}

function lines(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function toTextarea(value) {
  if (Array.isArray(value)) return value.join("\n");
  return String(value || "");
}

function toStructuredTextarea(value, formatter) {
  if (Array.isArray(value)) return value.map(formatter).join("\n");
  return String(value || "");
}
