import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/auditLog";
import { cancelShipment, createShipment, orderStatusForShippingStatus, refreshShipment } from "@/lib/logistics";
import { getOrderById, updateOrderShipping } from "@/lib/store";

export async function POST(request, context) {
  const { id } = await context.params;
  const form = await request.formData();
  const action = String(form.get("action") || "create");
  const returnTo = safeReturnTo(String(form.get("returnTo") || "/admin/orders"));
  const order = await getOrderById(id);

  if (!order) return NextResponse.json({ error: "订单不存在。" }, { status: 404 });

  try {
    let shipping;
    let summary;

    if (action === "create") {
      if (!["cod_confirmed", "paid"].includes(order.status)) {
        throw new Error("请先确认 COD，再创建物流单。");
      }
      if (order.shipping?.providerOrderId && order.shipping?.status !== "cancelled") {
        throw new Error("该订单已经创建过物流单，请勿重复创建。");
      }
      shipping = await createShipment(order, {
        courierCompany: form.get("courierCompany"),
        courierType: form.get("courierType"),
        destinationPostalCode: form.get("destinationPostalCode"),
        weight: form.get("weight"),
        length: form.get("length"),
        width: form.get("width"),
        height: form.get("height")
      });
      summary = `已创建 ${shipping.courierCompany || "Biteship"} 物流单`;
    } else if (action === "refresh") {
      shipping = await refreshShipment(order.shipping);
      summary = "已刷新物流状态";
    } else if (action === "cancel") {
      shipping = await cancelShipment(order.shipping);
      summary = "已取消物流单";
    } else {
      throw new Error("不支持的物流操作。");
    }

    const nextOrderStatus = orderStatusForShippingStatus(shipping.status, order.status);
    const updated = await updateOrderShipping(id, shipping, {
      note: summary,
      orderStatus: nextOrderStatus
    });

    await writeAuditLog({
      action: `shipment_${action}`,
      entityType: "order",
      entityId: id,
      summary,
      details: {
        orderId: id,
        provider: shipping.provider,
        providerOrderId: shipping.providerOrderId,
        waybillId: shipping.waybillId,
        courier: shipping.courierCompany,
        shippingStatus: shipping.status
      }
    });

    return NextResponse.redirect(withMessage(request.url, returnTo, "logisticsSuccess", summary), { status: 303 });
  } catch (error) {
    return NextResponse.redirect(withMessage(request.url, returnTo, "logisticsError", error.message), { status: 303 });
  }
}

function withMessage(requestUrl, returnTo, key, value) {
  const url = new URL(returnTo, requestUrl);
  url.searchParams.set(key, String(value || "操作失败").slice(0, 300));
  return url;
}

function safeReturnTo(value) {
  return value.startsWith("/admin/orders") && !value.startsWith("//") ? value : "/admin/orders";
}
