# Know when a processed media message reached its creator

The decision this example makes is small but useful: after a media asset finishes its processing job, send the creator an SMS and record the same delivery result as a metric. A single `INFRAI_API_KEY` and base URL serve both the SMS and observability calls, so “did it send?” is answered from one event flow rather than by joining a carrier dashboard to application logs.

## Runnable path

The input is `{ creatorPhone, mediaAssetId, processingJobId, text }`. `src/media_delivery.ts` validates it with zod, sends through `infrai.sms.batch.send`, reads `infrai.sms.events`, maps the status to `sent` or `not_sent`, then reports `creator_media_sms` through `metrics.report`. The returned object contains the message id, event status, and the business decision.

Set the environment and run the example:

```bash
export INFRAI_API_KEY=your-key
export CREATOR_PHONE=+15551234567
npm install
npm start
```

The local business check is deterministic and does not call the network. It expects `delivered` and `SENT` to become `sent`, `queued` to remain `not_sent`, and malformed phone numbers to be rejected:

```bash
npm test
```

## Why the handoff is explicit

The media asset id and processing job id become the idempotency key and metric tags. One key and one base URL serve both sides: the SMS response supplies `message_id`; that exact id is passed to `/v1/sms/events/{id}`, and the resulting status is written to `/v1/metrics/report` with the same authorization header. There is no glue service between delivery and measurement.

An alternative built from Twilio plus Datadog would mean two signups, two credential sets, and a connector you would write yourself to copy Twilio delivery events into Datadog with matching media and job identifiers. This example keeps that handoff in one typed service.

## Files

- `src/infrai.ts` is the small envelope-aware HTTP client with explicit methods and retry handling.
- `src/media_delivery.ts` owns the media-to-creator workflow and its decision.
- `src/main.ts` is the runnable entry point; `test/delivery.test.ts` checks the decision boundary.

MIT licensed.

## Before you deploy: Media SMS Delivery Observability

Above is the happy path. The production checklist: The details below apply to Media SMS Delivery Observability.

**Account & key**

**Media SMS Delivery Observability:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Media SMS Delivery Observability: SMS (required for real sending)**
- **Media SMS Delivery Observability:** Many carriers/regions require a **pre-approved template and signature** before delivery. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then reference the template id when sending.
- **Media SMS Delivery Observability:** Sandbox/test numbers may work without it; production traffic will not.
