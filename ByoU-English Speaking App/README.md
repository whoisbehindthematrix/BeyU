# ByoU

Mobile web English speaking coach. Vercel serves this folder.

## Environment variables

Set these in **Vercel → Settings → Environment Variables** (Production):

| Name | Where it is used |
| --- | --- |
| `SUPABASE_URL` | Build (`scripts/write-config.mjs`) |
| `SUPABASE_ANON_KEY` | Build (`scripts/write-config.mjs`) |
| `SARVAM_API_KEY` | Server only — `/api/transcribe`. Never put this in client JS. |

Speech-to-text runs on the server. The browser records audio and POSTs it to `/api/transcribe`; that function calls Sarvam with `SARVAM_API_KEY`.
