// Vercel Serverless Function — proxies the Formulary Analyst's requests to
// Google's Gemini API (generateContent) so the API key never reaches the
// browser.
//
// Setup on Vercel:
//   1. Get a key at https://aistudio.google.com/apikey (Google AI Studio has
//      a free tier — no billing setup required to start).
//   2. Project Settings → Environment Variables → add GEMINI_API_KEY
//   3. Redeploy. Vercel auto-detects anything under /api as a function, so
//      no other config is needed.
//
// The browser side (index.html) sends the request body Gemini expects
// (systemInstruction, tools, generationConfig, contents) to /api/chat
// instead of calling generativelanguage.googleapis.com directly. This
// function attaches the model name and API key and forwards it as-is.

const MODEL = 'gemini-3.5-flash';
// This is the current GA Flash model (as of July 2026) — strong at agentic
// tool-calling and cheap enough for a chat panel like this. If Google ships
// a newer default later, just change this one string.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: { message: 'Method not allowed, use POST' } });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: {
        message:
          'GEMINI_API_KEY is not set on the server. Add it in Vercel → Project Settings → Environment Variables, then redeploy.'
      }
    });
    return;
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify(req.body)
      }
    );

    const data = await geminiRes.json();
    res.status(geminiRes.status).json(data);
  } catch (err) {
    res.status(502).json({ error: { message: 'Could not reach Gemini API: ' + err.message } });
  }
}
