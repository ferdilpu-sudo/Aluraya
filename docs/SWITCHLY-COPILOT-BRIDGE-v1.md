# Aluraya ↔ Switchly Copilot Bridge v1

Status: **EXPERIMENTAL / NOT VERIFIED ON WINDOWS**. This file records a code implementation on a feature branch; it is not evidence of a working provider response.

## Activation and boundaries

1. Open Aluraya Windows, sign in to ChatGPT, verify model list, and explicitly confirm eligible plan/usage.
2. In Aluraya Copilot, select **Aktifkan koneksi Switchly**; the sidecar opens a Windows Named Pipe and generates a **fresh random 256-bit pairing code** for this process only.
3. Copy that 43-character code to Switchly > Copilot Agent, click **Hubungkan**. Do not publish/log/share the code.
4. Switchly issues authenticated `inspect` (models) and explicit `send` requests, limited to one reply at a time. No silent Generate, approval or database mutation.
5. Disconnect in either app or exit Aluraya to revoke the in-memory pairing. Restart changes the code.

The chat login, OAuth credentials and encrypted store **remain in Aluraya**. The bridge never exposes tokens, cookies, email, browser handles, or arbitrary tools. Requests use the existing authorized Aluraya ChatSession, with **one-shot** inference detached from the ordinary Aluraya chat history.

## Wire contract

Windows pipe: `\\.\pipe\Aluraya.Switchly.Copilot.v1` (not an HTTP listener).

LF-delimited UTF-8 JSON request (max 64 KB), one request per pipe connection:

- `{"schemaVersion":1,"requestId":"<uuid>","pairingCode":"<43-char-session-code>","operation":"inspect"}`
- `{"schemaVersion":1,"requestId":"<uuid>","pairingCode":"<code>","operation":"send","model":"<listed-model-id>","text":"<1-4000-chars>"}`

Response echoes `schemaVersion` and `requestId`, with `ok:true` and either `models` (bounded to 100 models, no account identifiers) or `reply` (max 6000 characters), or `ok:false,error:<safe-code>`. Response limit 64 KB. No payload contains credentials.

Security: explicit opt-in, unpredictable pairing code, constant-time equality, strict schema, only the local Windows named pipe, no HTTP port, response length bounds, client-side timeouts. Additional Windows OS access-control and Store-packaged-app compatibility must be verified during CA-00 Windows QA; no claims about an explicit custom pipe DACL are made.

## Verification

Run `npm ci`, `npm run check`, Rust unit tests and manual Windows unpackaged+installed startup/paired response checks **without paid Flow Generate**. Aluraya must remain the process owner and be already logged in. Treat a missing app/pipe, stale code, denied plan, unknown model, or timeout as disconnected/blocked, not as an AI response.

The bridge does not currently accept media, stream per-token deltas to Switchly, or carry persistent Project Bible context. These belong to later contract versions / Switchly Context Builder.
