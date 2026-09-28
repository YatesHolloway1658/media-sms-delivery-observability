import assert from "node:assert/strict";
import { decideDelivery, deliveryRequest } from "../src/media_delivery";

assert.equal(decideDelivery("delivered"), "sent");
assert.equal(decideDelivery("queued"), "not_sent");
assert.equal(decideDelivery("SENT"), "sent");
assert.throws(() => deliveryRequest.parse({ creatorPhone: "555", mediaAssetId: "a", processingJobId: "j", text: "hi" }));
console.log("delivery decision tests passed");
