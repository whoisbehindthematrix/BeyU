# ByoU

Mobile web English speaking coach. Vercel serves this folder.

## Environment variables

Set these in **Vercel → Settings → Environment Variables** (Production):

| Name | Where it is used |
| --- | --- |
| `SUPABASE_URL` | Build (`scripts/write-config.mjs`) |
| `SUPABASE_ANON_KEY` | Build (`scripts/write-config.mjs`) |
| `SARVAM_API_KEY` | Server only — `/api/transcribe`. Never put this in client JS. |

Speech-to-text: the browser records audio and POSTs it to `/api/transcribe` (needs `SARVAM_API_KEY` on Vercel). If that route is missing locally or the key is unset, the app falls back to the existing Supabase `stt` function.
