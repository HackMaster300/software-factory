<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/de11f175-ff9f-442a-825b-5ccbbc3170c1

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Security configuration (optional)

Set `API_TOKEN` on the server to require `Authorization: Bearer <token>` on every `/api/*` route
(enforced in `middleware.ts`; `GET /api/v1/health` stays public). The UI sends the token from
`localStorage["sf.apiToken"]` or, if set at build time, `NEXT_PUBLIC_API_TOKEN` — note the latter
is visible to anyone who can load the UI. Unset `API_TOKEN` = open API (solo/local use).

`/api/ai/generate` refuses custom `baseUrl`s that resolve to private, loopback, link-local or
cloud-metadata addresses. To use a local/LAN endpoint (e.g. Ollama), opt in explicitly:
`AI_PRIVATE_HOST_ALLOWLIST=localhost,127.0.0.1`. Verbose AI request logging is off by default;
enable with `AI_DEBUG_LOGS=1` (server) / `NEXT_PUBLIC_AI_DEBUG_LOGS=1` (browser).

---

Developed by zharak
