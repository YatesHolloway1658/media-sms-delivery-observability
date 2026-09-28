import { deliverMedia } from "./media_delivery";

const creatorPhone = process.env.CREATOR_PHONE;
if (!creatorPhone) throw new Error("CREATOR_PHONE is required");

const result = await deliverMedia({
  creatorPhone,
  mediaAssetId: process.env.MEDIA_ASSET_ID ?? "asset-demo-01",
  processingJobId: process.env.PROCESSING_JOB_ID ?? "job-demo-01",
  text: process.env.MEDIA_MESSAGE ?? "Your processed media is ready."
});
console.log(JSON.stringify(result));
