"use client";

import { useState } from "react";

export default function CopyOrderButton({ orderId }) {
  const [copied, setCopied] = useState(false);

  async function copyOrderId() {
    if (!orderId) return;
    await navigator.clipboard.writeText(orderId);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button className="btn secondary status-copy-button" type="button" onClick={copyOrderId} disabled={!orderId}>
      {copied ? "Nomor disalin" : "Salin nomor pesanan"}
    </button>
  );
}
