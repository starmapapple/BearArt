"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PAYMENT_METHOD_LABELS } from "@/lib/paymentMethods";
import { INDONESIA_PHONE_HINT, validateIndonesiaWhatsapp } from "@/lib/phone";
import { INDONESIA_NAME_HINT, validateIndonesiaName } from "@/lib/nameValidation";
import { getAnalyticsContext, getAttribution, trackEvent } from "@/lib/analyticsClient";

const PAYMENT_METHOD_ORDER = ["cod", "virtual_account", "qris", "ewallet", "card"];

export default function CheckoutForm({ product, locale = "zh" }) {
  const isId = locale === "id";
  const labels = isId
    ? {
        formTitle: "Isi Data Pesanan",
        formSubtitle: "Isi alamat pengiriman dan pilih metode pembayaran.",
        collapse: "Tutup",
        variant: "Pilihan Paket",
        name: "Nama",
        phone: "Nomor WhatsApp",
        phonePlaceholder: "081234567890 atau +6281234567890",
        location: "Lokasi",
        useLocation: "Gunakan Lokasi Saat Ini",
        locating: "Mencari lokasi...",
        province: "Provinsi",
        city: "Kota/Kabupaten",
        loadingProvince: "Memuat provinsi...",
        chooseProvince: "Pilih provinsi",
        loadingCity: "Memuat kota/kabupaten...",
        chooseCity: "Pilih kota/kabupaten",
        address: "Alamat Lengkap",
        payment: "Metode Pembayaran",
        confirmPurchase: "Konfirmasi Pembelian",
        processing: "Diproses...",
        requiredPhone: "Nomor WhatsApp wajib diisi.",
        requiredAddress: "Mohon lengkapi data pengiriman.",
        requiredProvince: "Pilih provinsi pengiriman.",
        requiredCity: "Pilih kota/kabupaten pengiriman.",
        fixHighlighted: "Lengkapi bagian yang ditandai lalu coba lagi.",
        addressHint: "Alamat lengkap wajib diisi, minimal 8 karakter.",
        orderFail: "Pesanan gagal, silakan coba lagi.",
        nameHint: "Masukkan nama yang valid, minimal 2 karakter. Boleh memakai huruf, angka, spasi, titik, apostrof, atau tanda hubung.",
        phoneHint: "Masukkan nomor WhatsApp Indonesia yang valid, contoh 081234567890 atau +6281234567890.",
        virtual_account: "Virtual Account",
        cod: "COD"
      }
    : {
        formTitle: "填写订单信息",
        formSubtitle: "填写收货信息并选择支付方式。",
        collapse: "收起",
        variant: "规格",
        name: "姓名",
        phone: "WhatsApp 手机号",
        phonePlaceholder: "081234567890 或 +6281234567890",
        location: "定位",
        useLocation: "使用当前位置",
        locating: "定位中...",
        province: "省份",
        city: "城市",
        loadingProvince: "正在加载省份...",
        chooseProvince: "请选择省份",
        loadingCity: "正在加载城市/县...",
        chooseCity: "请选择城市/县",
        address: "详细地址",
        payment: "支付方式",
        confirmPurchase: "",
        processing: "处理中...",
        requiredPhone: "请填写 WhatsApp 手机号。",
        requiredAddress: "请填写完整的收货信息。",
        requiredProvince: "请选择省份。",
        requiredCity: "请选择城市/县。",
        fixHighlighted: "请先补全标红字段后再提交。",
        addressHint: "请填写具体收货地址，至少 8 个字符。",
        orderFail: "下单失败，请稍后重试。",
        nameHint: INDONESIA_NAME_HINT,
        phoneHint: INDONESIA_PHONE_HINT
      };
  const methods = useMemo(() => {
    const allowed = product.paymentMethods || [];
    const available = product.codEnabled ? allowed : allowed.filter((method) => method !== "cod");
    return [...available].sort((a, b) => {
      const left = PAYMENT_METHOD_ORDER.indexOf(a);
      const right = PAYMENT_METHOD_ORDER.indexOf(b);
      const leftOrder = left === -1 ? PAYMENT_METHOD_ORDER.length : left;
      const rightOrder = right === -1 ? PAYMENT_METHOD_ORDER.length : right;
      return leftOrder - rightOrder;
    });
  }, [product]);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    cityId: "",
    province: "",
    provinceId: "",
    postalCode: "",
    location: null,
    variant: product.variants?.[0] || "",
    quantity: 1,
    paymentMethod: methods[0] || "virtual_account"
  });
  const [status, setStatus] = useState({ loading: false, error: "" });
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [addressError, setAddressError] = useState("");
  const [regionErrors, setRegionErrors] = useState({ province: "", city: "" });
  const [locationStatus, setLocationStatus] = useState({ loading: false, message: "" });
  const [regions, setRegions] = useState({ provinces: [], regencies: [], loadingProvinces: true, loadingRegencies: false });
  const [open, setOpen] = useState(false);
  const fieldRefs = useRef({});
  const analyticsRef = useRef({ productId: product.id, productSlug: product.slug, paymentMethod: methods[0] || "virtual_account" });
  analyticsRef.current = {
    productId: product.id,
    productSlug: product.slug,
    paymentMethod: form.paymentMethod
  };

  useEffect(() => {
    function openCheckout(event) {
      const target = event.target.closest?.('a[href="#checkout"], button[data-open-checkout]');
      if (!target) return;
      event.preventDefault();
      setOpen(true);
      const analytics = analyticsRef.current;
      trackEvent("checkout_open", {
        productId: analytics.productId,
        productSlug: analytics.productSlug,
        paymentMethod: analytics.paymentMethod,
        payload: {
          placement: target.dataset.analyticsPlacement || target.className || "checkout_link"
        }
      });
    }

    function closeWithEscape(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("click", openCheckout);
    document.addEventListener("keydown", closeWithEscape);
    if (window.location.hash === "#checkout") {
      setOpen(true);
      const analytics = analyticsRef.current;
      trackEvent("checkout_open", {
        productId: analytics.productId,
        productSlug: analytics.productSlug,
        paymentMethod: analytics.paymentMethod,
        payload: { placement: "hash" }
      });
    }

    return () => {
      document.removeEventListener("click", openCheckout);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadProvinces() {
      try {
        const response = await fetch("/api/regions/provinces");
        const payload = await response.json();
        if (active) {
          setRegions((current) => ({
            ...current,
            provinces: payload.provinces || [],
            loadingProvinces: false
          }));
        }
      } catch {
        if (active) {
          setRegions((current) => ({ ...current, loadingProvinces: false }));
        }
      }
    }

    loadProvinces();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadRegencies() {
      if (!form.provinceId) {
        setRegions((current) => ({ ...current, regencies: [], loadingRegencies: false }));
        return;
      }

      setRegions((current) => ({ ...current, regencies: [], loadingRegencies: true }));
      try {
        const response = await fetch(`/api/regions/regencies?provinceId=${encodeURIComponent(form.provinceId)}`);
        const payload = await response.json();
        if (active) {
          setRegions((current) => ({
            ...current,
            regencies: payload.regencies || [],
            loadingRegencies: false
          }));
        }
      } catch {
        if (active) {
          setRegions((current) => ({ ...current, regencies: [], loadingRegencies: false }));
        }
      }
    }

    loadRegencies();
    return () => {
      active = false;
    };
  }, [form.provinceId]);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateName(value) {
    setForm((current) => ({ ...current, name: value }));
    setNameError("");
    setStatus((current) => (current.error === labels.nameHint || current.error === labels.fixHighlighted ? { loading: false, error: "" } : current));
  }

  function validateNameField() {
    const nameValidation = validateIndonesiaName(form.name);
    if (!nameValidation.valid) {
      setNameError(labels.nameHint);
      trackFormError("name", labels.nameHint);
      return false;
    }

    setNameError("");
    return true;
  }

  function updatePhone(value) {
    setForm((current) => ({ ...current, phone: value }));
    setPhoneError("");
    setStatus((current) => (current.error === labels.phoneHint || current.error === labels.fixHighlighted ? { loading: false, error: "" } : current));
  }

  function validatePhoneField() {
    if (!form.phone.trim()) {
      setPhoneError(labels.requiredPhone);
      trackFormError("phone", labels.requiredPhone);
      return false;
    }

    const phoneValidation = validateIndonesiaWhatsapp(form.phone);
    if (!phoneValidation.valid) {
      setPhoneError(labels.phoneHint);
      trackFormError("phone", labels.phoneHint);
      return false;
    }

    setPhoneError("");
    return true;
  }

  function updateAddress(value) {
    setForm((current) => ({ ...current, address: value }));
    setAddressError("");
    setStatus((current) =>
      current.error === labels.addressHint || current.error === labels.requiredAddress || current.error === labels.fixHighlighted ? { loading: false, error: "" } : current
    );
  }

  function validateAddressField() {
    if (form.address.trim().length < 8) {
      setAddressError(labels.addressHint);
      trackFormError("address", labels.addressHint);
      return false;
    }

    setAddressError("");
    return true;
  }

  function focusFirstInvalidField(field) {
    window.setTimeout(() => {
      const target = fieldRefs.current[field];
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.focus({ preventScroll: true });
    }, 0);
  }

  function chooseProvince(provinceId) {
    const province = regions.provinces.find((item) => item.id === provinceId);
    setForm((current) => ({
      ...current,
      provinceId,
      province: province?.name || "",
      cityId: "",
      city: ""
    }));
    setRegionErrors((current) => ({
      province: provinceId ? "" : current.province,
      city: provinceId ? labels.requiredCity : current.city
    }));
    setStatus((current) => (current.error === labels.requiredAddress || current.error === labels.fixHighlighted ? { loading: false, error: "" } : current));
  }

  function chooseCity(cityId) {
    const city = regions.regencies.find((item) => item.id === cityId);
    setForm((current) => ({
      ...current,
      cityId,
      city: city?.name || ""
    }));
    setRegionErrors((current) => ({ ...current, city: cityId ? "" : current.city }));
    setStatus((current) => (current.error === labels.requiredAddress || current.error === labels.fixHighlighted ? { loading: false, error: "" } : current));
  }

  function choosePaymentMethod(value) {
    update("paymentMethod", value);
    trackEvent("payment_method_select", {
      productId: product.id,
      productSlug: product.slug,
      paymentMethod: value
    });
  }

  function trackFormError(field, message) {
    trackEvent("form_error", {
      productId: product.id,
      productSlug: product.slug,
      paymentMethod: form.paymentMethod,
      city: form.city,
      province: form.province,
      payload: { field, message }
    });
  }

  async function useCurrentLocation() {
    trackEvent("location_request", {
      productId: product.id,
      productSlug: product.slug
    });

    if (!window.isSecureContext) {
      trackEvent("location_failed", {
        productId: product.id,
        productSlug: product.slug,
        payload: { reason: "insecure_context" }
      });
      setLocationStatus({
        loading: false,
        message: isId
          ? "Browser hanya mengizinkan lokasi di HTTPS atau localhost. Silakan pilih provinsi dan kota secara manual."
          : "浏览器只允许在 HTTPS 或 localhost 环境获取定位，请手动选择省份和城市。"
      });
      return;
    }

    if (!navigator.geolocation) {
      trackEvent("location_failed", {
        productId: product.id,
        productSlug: product.slug,
        payload: { reason: "unsupported" }
      });
      setLocationStatus({
        loading: false,
        message: isId ? "Browser tidak mendukung lokasi. Silakan pilih provinsi dan kota secara manual." : "当前浏览器不支持定位，请手动选择省份和城市。"
      });
      return;
    }

    const permissionState = await getGeolocationPermissionState();
    if (permissionState === "denied") {
      trackEvent("location_failed", {
        productId: product.id,
        productSlug: product.slug,
        payload: { reason: "permission_denied_before_prompt" }
      });
      setLocationStatus({
        loading: false,
        message: isId
          ? "Izin lokasi sudah ditolak, jadi popup tidak akan muncul lagi. Ubah izin lokasi di pengaturan browser atau pilih manual."
          : "浏览器已经拒绝定位权限，所以不会再弹出授权框。请在浏览器网站设置中允许定位，或手动选择省份和城市。"
      });
      return;
    }

    setLocationStatus({
      loading: true,
      message:
        permissionState === "prompt"
          ? isId
            ? "Browser akan meminta izin lokasi. Pilih izinkan."
            : "浏览器将请求定位权限，请点击允许。"
          : isId
            ? "Sedang mengambil lokasi..."
            : "正在获取当前位置..."
    });

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          maximumAge: 300000,
          timeout: 10000
        });
      });

      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      const response = await fetch(`/api/regions/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`);
      const payload = await response.json();

      if (!response.ok || !payload.location?.provinceId || !payload.location?.cityId) {
        trackEvent("location_failed", {
          productId: product.id,
          productSlug: product.slug,
          payload: { reason: "reverse_lookup_failed" }
        });
        setLocationStatus({
          loading: false,
          message: payload.error || (isId ? "Lokasi tidak dikenali. Silakan pilih provinsi dan kota secara manual." : "无法根据当前位置识别省份和城市，请手动选择。")
        });
        setForm((current) => ({
          ...current,
          location: { lat, lon, source: "browser" }
        }));
        return;
      }

      setRegions((current) => ({
        ...current,
        regencies: payload.regencies || current.regencies,
        loadingRegencies: false
      }));
      setForm((current) => ({
        ...current,
        provinceId: payload.location.provinceId,
        province: payload.location.province,
        cityId: payload.location.cityId,
        city: payload.location.city,
        postalCode: payload.location.postalCode || "",
        location: {
          lat,
          lon,
          source: payload.source || "browser",
          displayName: payload.location.displayName || ""
        }
      }));
      setLocationStatus({
        loading: false,
        message: isId
          ? `Lokasi terdeteksi: ${payload.location.province} / ${payload.location.city}${payload.location.postalCode ? `, kode pos ${payload.location.postalCode}` : ""}.`
          : `已定位到 ${payload.location.province} / ${payload.location.city}${payload.location.postalCode ? `，邮编 ${payload.location.postalCode}` : ""}。`
      });
      trackEvent("location_success", {
        productId: product.id,
        productSlug: product.slug,
        city: payload.location.city,
        province: payload.location.province,
        payload: { source: payload.source || "browser" }
      });
    } catch (error) {
      trackEvent("location_failed", {
        productId: product.id,
        productSlug: product.slug,
        payload: { reason: error?.code ? `browser_${error.code}` : "unknown" }
      });
      setLocationStatus({ loading: false, message: locationErrorMessage(error, isId) });
    }
  }

  async function submitOrder(event) {
    event.preventDefault();
    trackEvent("checkout_submit_attempt", {
      productId: product.id,
      productSlug: product.slug,
      paymentMethod: form.paymentMethod,
      city: form.city,
      province: form.province
    });

    let firstInvalidField = "";
    let hasError = false;
    const nameValidation = validateIndonesiaName(form.name);
    if (!nameValidation.valid) {
      setNameError(labels.nameHint);
      if (!firstInvalidField) firstInvalidField = "name";
      hasError = true;
      trackFormError("name", labels.nameHint);
    } else {
      setNameError("");
    }

    const phoneValidation = validateIndonesiaWhatsapp(form.phone);
    if (!phoneValidation.valid) {
      setPhoneError(labels.phoneHint);
      if (!firstInvalidField) firstInvalidField = "phone";
      hasError = true;
      trackFormError("phone", labels.phoneHint);
    } else {
      setPhoneError("");
    }

    const nextRegionErrors = {
      province: form.province ? "" : labels.requiredProvince,
      city: form.city ? "" : labels.requiredCity
    };
    setRegionErrors(nextRegionErrors);
    if (nextRegionErrors.province) {
      if (!firstInvalidField) firstInvalidField = "province";
      hasError = true;
      trackFormError("province", nextRegionErrors.province);
    }
    if (nextRegionErrors.city) {
      if (!firstInvalidField) firstInvalidField = "city";
      hasError = true;
      trackFormError("city", nextRegionErrors.city);
    }

    const addressValid = form.address.trim().length >= 8;
    if (!addressValid) {
      setAddressError(labels.addressHint);
      if (!firstInvalidField) firstInvalidField = "address";
      hasError = true;
      trackFormError("address", labels.addressHint);
    } else {
      setAddressError("");
    }

    if (hasError) {
      setStatus({ loading: false, error: labels.fixHighlighted });
      focusFirstInvalidField(firstInvalidField);
      return;
    }

    setStatus({ loading: true, error: "" });

    const analyticsContext = getAnalyticsContext();
    const utm = getAttribution();

    if (window.dataLayer) {
      window.dataLayer.push({
        event: "begin_checkout",
        productId: product.id,
        productSlug: product.slug,
        paymentMethod: form.paymentMethod
      });
    }
    pushAdEvent("InitiateCheckout", {
      content_ids: [product.slug],
      content_name: product.title,
      value: product.price,
      currency: product.currency || "IDR"
    });

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        variant: form.variant,
        quantity: form.quantity,
        paymentMethod: form.paymentMethod,
        pageUrl: window.location.href,
        utm,
        analytics: {
          visitorId: analyticsContext.visitorId,
          sessionId: analyticsContext.sessionId,
          firstAttribution: analyticsContext.firstAttribution,
          lastAttribution: analyticsContext.lastAttribution
        },
        customer: {
          name: nameValidation.normalized,
          phone: phoneValidation.e164,
          address: form.address,
          city: form.city,
          province: form.province,
          postalCode: form.postalCode
        },
        location: form.location
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      setStatus({ loading: false, error: payload.error || labels.orderFail });
      trackFormError("order_submit", payload.error || labels.orderFail);
      trackEvent("api_error", {
        productId: product.id,
        productSlug: product.slug,
        paymentMethod: form.paymentMethod,
        city: form.city,
        province: form.province,
        payload: { endpoint: "/api/orders", message: payload.error || labels.orderFail }
      });
      return;
    }

    trackEvent("order_created", {
      productId: product.id,
      productSlug: product.slug,
      orderId: payload.order.id,
      paymentMethod: form.paymentMethod,
      value: payload.order.total,
      city: form.city,
      province: form.province
    });

    if (window.dataLayer) {
      window.dataLayer.push({
        event: form.paymentMethod === "cod" ? "cod_submit" : "payment_redirect",
        orderId: payload.order.id,
        productSlug: product.slug,
        total: payload.order.total
      });
    }

    trackEvent(form.paymentMethod === "cod" ? "cod_submit" : "payment_redirect", {
      productId: product.id,
      productSlug: product.slug,
      orderId: payload.order.id,
      paymentMethod: form.paymentMethod,
      value: payload.order.total,
      city: form.city,
      province: form.province
    });
    pushAdEvent(form.paymentMethod === "cod" ? "Lead" : "AddPaymentInfo", {
      content_ids: [product.slug],
      content_name: product.title,
      value: payload.order.total,
      currency: payload.order.currency || "IDR"
    });

    window.location.href = payload.checkoutUrl;
  }

  return (
    <>
    {open ? <button aria-label={labels.collapse} className="checkout-backdrop" type="button" onClick={() => setOpen(false)} /> : null}
    {open ? (
    <div className="checkout-card is-open" id="checkout">
      <form className="checkout-form" noValidate onSubmit={submitOrder}>
        <div className="checkout-form-head">
          <div>
            <strong>{labels.formTitle}</strong>
            <p className="muted">{labels.formSubtitle}</p>
          </div>
          <button
            aria-label={labels.collapse}
            className="btn secondary small"
            type="button"
            onClick={() => setOpen(false)}
          >
            {labels.collapse}
          </button>
        </div>
        <div className="form-grid">
          <div className="field full">
            <label htmlFor="variant">{labels.variant}</label>
            <select id="variant" value={form.variant} onChange={(event) => update("variant", event.target.value)}>
              {(product.variants || ["Default"]).map((variant) => (
                <option key={variant} value={variant}>
                  {variant}
                </option>
              ))}
            </select>
          </div>
          <div className="field full">
            <label htmlFor="name">{labels.name}</label>
            <input
              aria-describedby={nameError ? "name-error" : undefined}
              aria-invalid={Boolean(nameError)}
              id="name"
              ref={(node) => {
                fieldRefs.current.name = node;
              }}
              required
              value={form.name}
              onBlur={validateNameField}
              onChange={(event) => updateName(event.target.value)}
            />
            {nameError ? (
              <p className="field-error" id="name-error">
                {nameError}
              </p>
            ) : null}
          </div>
          <div className="field full">
            <label htmlFor="phone">{labels.phone}</label>
            <input
              id="phone"
              inputMode="tel"
              placeholder={labels.phonePlaceholder}
              ref={(node) => {
                fieldRefs.current.phone = node;
              }}
              required
              value={form.phone}
              aria-invalid={Boolean(phoneError)}
              aria-describedby={phoneError ? "phone-error" : undefined}
              onBlur={validatePhoneField}
              onChange={(event) => updatePhone(event.target.value)}
            />
            {phoneError ? (
              <p className="field-error" id="phone-error">
                {phoneError}
              </p>
            ) : null}
          </div>
          <div className="field full">
            <label>{labels.location}</label>
            <button className="btn secondary" disabled={locationStatus.loading} onClick={useCurrentLocation} type="button">
              {locationStatus.loading ? labels.locating : labels.useLocation}
            </button>
            {locationStatus.message ? <p className="muted">{locationStatus.message}</p> : null}
          </div>
          <div className="field">
            <label htmlFor="province">{labels.province}</label>
            <select
              aria-describedby={regionErrors.province ? "province-error" : undefined}
              aria-invalid={Boolean(regionErrors.province)}
              disabled={regions.loadingProvinces}
              id="province"
              ref={(node) => {
                fieldRefs.current.province = node;
              }}
              required
              value={form.provinceId}
              onChange={(event) => chooseProvince(event.target.value)}
            >
              <option value="">{regions.loadingProvinces ? labels.loadingProvince : labels.chooseProvince}</option>
              {regions.provinces.map((province) => (
                <option key={province.id} value={province.id}>
                  {province.name}
                </option>
              ))}
            </select>
            {regionErrors.province ? (
              <p className="field-error" id="province-error">
                {regionErrors.province}
              </p>
            ) : null}
          </div>
          <div className="field">
            <label htmlFor="city">{labels.city}</label>
            <select
              aria-describedby={regionErrors.city ? "city-error" : undefined}
              aria-invalid={Boolean(regionErrors.city)}
              disabled={!form.provinceId || regions.loadingRegencies}
              id="city"
              ref={(node) => {
                fieldRefs.current.city = node;
              }}
              required
              value={form.cityId}
              onChange={(event) => chooseCity(event.target.value)}
            >
              <option value="">{regions.loadingRegencies ? labels.loadingCity : labels.chooseCity}</option>
              {regions.regencies.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
            {regionErrors.city ? (
              <p className="field-error" id="city-error">
                {regionErrors.city}
              </p>
            ) : null}
          </div>
          <div className="field full">
            <label htmlFor="address">{labels.address}</label>
            <textarea
              aria-describedby={addressError ? "address-error" : undefined}
              aria-invalid={Boolean(addressError)}
              id="address"
              minLength={8}
              ref={(node) => {
                fieldRefs.current.address = node;
              }}
              required
              value={form.address}
              onBlur={validateAddressField}
              onChange={(event) => updateAddress(event.target.value)}
            />
            {addressError ? (
              <p className="field-error" id="address-error">
                {addressError}
              </p>
            ) : null}
          </div>
        </div>

        <div className="field">
          <label>{labels.payment}</label>
          <div className="radio-grid">
            {methods.map((method) => (
              <label className="radio-tile" key={method}>
                <input
                  checked={form.paymentMethod === method}
                  name="paymentMethod"
                  type="radio"
                  value={method}
                  onChange={(event) => choosePaymentMethod(event.target.value)}
                />
                {labels[method] || PAYMENT_METHOD_LABELS[method] || method}
              </label>
            ))}
          </div>
        </div>

        {status.error ? <p className="muted">{status.error}</p> : null}
        <button className="btn" disabled={status.loading} type="submit">
          {status.loading ? labels.processing : labels.confirmPurchase || product.ctaText || (isId ? "Pesan Sekarang" : "立即购买")}
        </button>
      </form>
    </div>
    ) : null}
    </>
  );
}

async function getGeolocationPermissionState() {
  try {
    if (!navigator.permissions?.query) return "unknown";
    const permission = await navigator.permissions.query({ name: "geolocation" });
    return permission.state;
  } catch {
    return "unknown";
  }
}

function locationErrorMessage(error, isId = false) {
  if (error?.code === 1) {
    return isId
      ? "Izin lokasi ditolak. Ubah izin lokasi di pengaturan browser atau pilih provinsi dan kota secara manual."
      : "定位权限被拒绝。请在浏览器网站设置中允许定位，或手动选择省份和城市。";
  }

  if (error?.code === 2) {
    return isId
      ? "Lokasi belum bisa didapatkan. Periksa koneksi atau pilih provinsi dan kota secara manual."
      : "暂时无法获取当前位置，请检查网络或手动选择省份和城市。";
  }

  if (error?.code === 3) {
    return isId
      ? "Permintaan lokasi terlalu lama. Coba lagi atau pilih provinsi dan kota secara manual."
      : "定位请求超时，请重试或手动选择省份和城市。";
  }

  return isId ? "Lokasi gagal didapatkan. Silakan pilih provinsi dan kota secara manual." : "定位失败，请手动选择省份和城市。";
}

function pushAdEvent(name, payload) {
  if (typeof window === "undefined") return;
  if (window.fbq) {
    window.fbq("track", name, payload);
    if (name === "Lead") {
      window.fbq("trackCustom", "CODSubmit", payload);
    }
  }
  if (window.ttq) {
    window.ttq.track(name, payload);
    if (name === "Lead") {
      window.ttq.track("CODSubmit", payload);
    }
  }
}
