import { z } from "zod";
import { infrai } from "./infrai";

export const deliveryRequest = z.object({
  creatorPhone: z.string().regex(/^\+[1-9]\d{7,14}$/),
  mediaAssetId: z.string().min(1),
  processingJobId: z.string().min(1),
  text: z.string().min(1).max(480)
});
export type DeliveryRequest = z.infer<typeof deliveryRequest>;

export type DeliveryDecision = "sent" | "not_sent";

export function decideDelivery(status: string): DeliveryDecision {
  return ["delivered", "sent"].includes(status.toLowerCase()) ? "sent" : "not_sent";
}

export async function deliverMedia(request: DeliveryRequest) {
  const input = deliveryRequest.parse(request);
  const key = `media-${input.mediaAssetId}-${input.processingJobId}`;
  const [message] = await infrai.sms.batch.send({ messages: [{ to: input.creatorPhone, text: input.text }] }, key);
  const event = await infrai.sms.events(message.message_id);
  const decision = decideDelivery(event.status);
  await infrai.metrics.report({ name: "creator_media_sms", value: decision === "sent" ? 1 : 0, type: "counter", tags: { media_asset_id: input.mediaAssetId, processing_job_id: input.processingJobId, message_id: message.message_id, decision } }, key);
  return { messageId: message.message_id, decision, status: event.status };
}
