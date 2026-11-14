# DRB PLUS Chatbot v2 — setup

## 1. Razorpay keys (5 min)
1. Razorpay Dashboard → **Account & Settings → API Keys → Generate Key** (Live mode).
2. Copy **Key ID** and **Key Secret** (secret is shown only once).

## 2. Google Sheet + Calendar + Email (10 min)
1. Create a new Google Sheet named **DRB PLUS Bookings** (signed in as drbborthakur@gmail.com).
2. **Extensions → Apps Script** → delete everything → paste `google-apps-script.gs`.
3. Change `PASTE-YOUR-SECRET-WORD-HERE` to any secret word, e.g. `drb-7391-booking`. Save.
4. **Deploy → New deployment → type: Web app** → Execute as: **Me** → Who has access: **Anyone** → Deploy → allow permissions.
5. Copy the **Web app URL** (ends in `/exec`).

## 3. Vercel environment variables
Vercel → project **drbplus-chatbot** → Settings → Environment Variables → add:

| Name | Value |
|---|---|
| RAZORPAY_KEY_ID | from step 1 |
| RAZORPAY_KEY_SECRET | from step 1 |
| GOOGLE_SCRIPT_URL | from step 2.5 |
| GOOGLE_SCRIPT_TOKEN | your secret word from step 2.3 |
| ANTHROPIC_API_KEY | already there |

Then **Deployments → ⋯ → Redeploy**.

## 4. Test
Book yourself at Digboi, pay ₹500, check: Sheet row, Calendar event, email, WhatsApp button. Refund the test from Razorpay.

## Editing later
Everything (fee, timings, days, holidays, phone, addresses, AI instructions) is in **config/clinic.js**.
Block a date: add it to `holidays`, e.g. `"2026-12-25",`.
