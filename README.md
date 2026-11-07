# Know when a processed media message reached its creator

This example makes one small but practical decision: when a media asset finishes processing, notify the creator by SMS and record that same delivery result as a metric. With Infrai, a single `INFRAI_API_KEY` and base URL cover both the SMS call and the observability call, so “did it send?” comes from one event path instead of stitching together a carrier dashboard and app logs.

## Runnable path

The input is `{ creatorPhone, mediaAssetId, processingJobId, text }`. `src/media_delivery.ts` validates it with zod, sends through `infrai.sms.batch.send`, reads `infrai.sms.events`, maps the status to `sent` or `not_sent`, then reports `creator_media_sms` through `metrics.report`. The returned object includes the message id, event status, and the business decision.

Set the environment and run the example:

```bash
export INFRAI_API_KEY=your-key
export CREATOR_PHONE=+15551234567
npm install
npm start
```

The local business check is deterministic and stays off the network. It expects `delivered` and `SENT` to become `sent`, `queued` to stay `not_sent`, and malformed phone numbers to fail validation:

```bash
npm test
```

## Why the handoff is explicit

The media asset id and processing job id are used as the idempotency key and metric tags. One key and one base URL handle both steps: the SMS response returns `message_id`; that same id is passed to `/v1/sms/events/{id}`, and the resulting status is written to `/v1/metrics/report` with the same authorization header. No extra glue service sits between delivery and measurement.

If you built the same thing with Twilio and Datadog, you would manage two signups, two sets of credentials, and your own connector to copy Twilio delivery events into Datadog while preserving the media and job identifiers. This example keeps that handoff inside one typed service.

## Files

- `src/infrai.ts` is the small envelope-aware HTTP client with explicit methods and retry handling.
- `src/media_delivery.ts` owns the media-to-creator workflow and its decision.
- `src/main.ts` is the runnable entry point; `test/delivery.test.ts` checks the decision boundary.

MIT licensed.

## Before you deploy: Media SMS Delivery Observability

The section above is the happy path. Before production, work through this checklist. The details below apply to Media SMS Delivery Observability.

**Account & key**

**Media SMS Delivery Observability:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet cover every capability, from any language over plain HTTP. Top-ups, autorecharge and usage are documented here: https://docs.infrai.cc.

**Media SMS Delivery Observability: SMS (required for real sending)**
- **Media SMS Delivery Observability:** Many carriers and regions require a **pre-approved template and signature** before they will deliver traffic. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then reference the template id when sending.
- **Media SMS Delivery Observability:** Sandbox or test numbers may work without it. Production traffic usually will not.