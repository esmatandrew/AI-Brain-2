# Formulary Brain — GNP Market Intelligence

An AI-powered business development tool built on your Business Development Standard Sheet (42,246 SKU records, Egypt, 2021–2026 YTD).

## What it does

- **Opportunity Leaderboard** — auto-scores every ATC4 category on growth (CAGR 2021→2025), fragmentation (HHI), and whether GNP is already present, and surfaces the top white-space opportunities as stamped index cards.
- **Market Explorer** — filter/rank the full dataset by ATC4 category, molecule, corporation, product, or dosage form; sort by value, growth, YoY, fragmentation, or competitor count; click any row for a 6-year trend chart.
- **AI Formulary Analyst** — a chat panel with real tool access to the dataset. It doesn't summarize a snapshot — every answer is backed by a live aggregation query it runs against all 42,246 records (via two tools: `search_terms` to find exact category/molecule/company names, and `analyze_market` to aggregate value, CAGR, YoY growth, HHI, and competitor count). It always cites the real numbers it pulled, and flags 2026 figures as year-to-date.

## Files

- `index.html` — the full application (dashboard + AI chat), single file.
- `data.json` — the dataset, converted from your Excel sheet into a compact, dictionary-encoded format the app loads at runtime (5.6 MB — compresses to roughly 1–1.5 MB over gzip, which both Netlify and Vercel apply automatically).
- `api/chat.js` — a serverless function that holds your **Gemini** API key server-side and proxies the AI Analyst's requests to Google's `generateContent` endpoint. Needed on any real deployment (Vercel, Netlify, etc.) — the browser never calls Google directly.
- `vercel.json` — optional, just sets a cache header on `data.json`. Safe to delete if you're not using Vercel.

## Deploy on Vercel

1. Put `index.html`, `data.json`, `api/chat.js`, and `vercel.json` in one folder — keep the `api/` folder structure as-is, Vercel auto-detects anything under `/api` as a serverless function.
2. Push it to a GitHub repo, then **Import Project** on vercel.com and point it at that repo. (Or `vercel deploy` from the CLI if you'd rather skip GitHub.)
3. Get a key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) — Google AI Studio has a free tier, no billing setup required to start.
4. In the Vercel project → **Settings → Environment Variables**, add `GEMINI_API_KEY` with that key, then redeploy so the function picks it up.
5. Done — the dashboard, Opportunity Leaderboard, and AI Analyst panel all work end-to-end. `index.html` posts to `/api/chat`, which attaches the key and forwards to Gemini.

## Deploy on Netlify instead

Same idea, different function folder. Netlify Functions live under `netlify/functions/` rather than `/api/`, and it would read the key from `GEMINI_API_KEY` the same way via **Site settings → Environment variables**. If you want to go this route, say so and I'll restructure `api/chat.js` into a Netlify Function — the logic itself doesn't change, just the file location and the export format (`exports.handler` instead of Vercel's `export default`).

## Which Gemini model, and switching it

`api/chat.js` currently calls `gemini-3.5-flash` — the current GA Flash model, good at agentic tool-calling and cheap enough for a chat panel like this. It's set once, near the top of that file (`const MODEL = ...`), so swapping to `gemini-3.1-pro-preview` for stronger reasoning (higher cost) or a newer model as Google ships one is a one-line change, no redeploy of `index.html` needed.

## Running inside Claude's environment

If you ever paste this back into a Claude conversation and ask for a version that "just works" without any key setup, Claude's own environment can call the Anthropic API directly with no key handling on your end — that's a different, Claude-only code path and not what's shipped here, since this version is built to run standalone on Vercel with your own Gemini key.

## Updating the data

When you refresh the Business Development Standard Sheet, re-run the same Excel → `data.json` conversion (ask me to regenerate it from a new upload) and redeploy. The app doesn't touch the Excel file directly — everything client-side reads from `data.json`.

## Notes on the numbers

- All values are EGP local currency, exactly as they appear in your sheet's `LC Value` columns.
- **2026 is partial-year (YTD).** The app never averages it into CAGR or YoY growth — it's shown separately and labeled everywhere it appears.
- **HHI** (Herfindahl-Hirschman Index, 0–10,000) measures how concentrated a category is among corporations in 2025. Below ~1,500 = fragmented/competitive; above ~2,500 = concentrated, often a near-monopoly.
- **GNP detection** is based on the corporation label containing "NAPI" (matches "GLOBAL NAPI*" in your data). If GNP's naming in the sheet ever changes, that one check in `index.html` (`isGnpCorpLabel`) needs a matching update.
- The opportunity score weights growth 45%, fragmentation 30%, and GNP's absence 25% — tunable in `computeOpportunities()` in `index.html` if you want to weight differently (e.g. prioritize pure market size instead).
