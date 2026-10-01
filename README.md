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

## API auth (optional)

Set `API_TOKEN` on the server to require `Authorization: Bearer <token>` on every `/api/*` route
(enforced in `middleware.ts`; `GET /api/v1/health` stays public). The UI sends the token from
`localStorage["sf.apiToken"]` or, if set at build time, `NEXT_PUBLIC_API_TOKEN` — note the latter
is visible to anyone who can load the UI. Unset `API_TOKEN` = open API (solo/local use).

---

Developed by zharak
