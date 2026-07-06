import { redirect } from "next/navigation";
import { handleGatewayWebhook } from "@/lib/payments";

export async function POST(request) {
  const form = await request.formData();
  const orderId = form.get("orderId");
  await handleGatewayWebhook({
    provider: "mock_gateway",
    orderId,
    status: "paid",
    reference: `mock_paid_${orderId}`
  });
  redirect(`/checkout/success?orderId=${orderId}`);
}
