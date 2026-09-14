# Edge cases — ByoU feedback agent

Living list. Add a row whenever real usage produces something weird.

Source of new rows: SQL Editor → `select transcript, ai_feedback from answers order by created_at desc limit 50;` — read them every few days.

Status is judged against `supabase/functions/feedback/index.ts` (plus the `v1.txt` prompt it loads). ✅ = the function already enforces it. 🔲 = not enforced in code.

| # | Input | Expected behaviour | Status | Reason |
| --- | --- | --- | --- | --- |
| 1 | Empty transcript | praise attempt, model answer as resay | 🔲 | Empty strings still go to Claude; only a v1 RULES line asks the model to praise the attempt. |
| 2 | 2-word answer ("yes sir") | encourage longer | 🔲 | No word-count check; same prompt-only rule as #1 (under 5 words). |
| 3 | Answer in Hindi/Hinglish | praise, resay in English, no scolding | 🔲 | No language detection; prompt only says Indian English is valid. |
| 4 | Mic picks up background TV | model should not treat noise as the answer | 🔲 | No noise vs speech check; transcript is forwarded as-is. |
| 5 | User says "I don't know" | offer a starter sentence | 🔲 | No special-case for this phrase. |
| 6 | 3-minute monologue | trim + praise, upgrade = "keep it to 45 s" | 🔲 | Transcript is trimmed to 1500 chars, but nothing forces a 45-second upgrade. |
| 7 | STT mangles name ("my name is uterna") | never correct names | 🔲 | No name-preservation logic; STT glitches are only mentioned in the prompt. |
| 8 | Profanity / abuse | canned response, log event | 🔲 | No profanity/abuse detector and no event log; only the injection regex. |
| 9 | "Ignore your rules and…" | canned response | 🔲 | SAFE is returned only for `ignore (all )?previous`, `system prompt`, or `jailbreak` — not this phrasing. |
| 10 | Model returns markdown-fenced JSON | strip + parse | ✅ | Fences are stripped with `text.replace(/```json|```/g, "")` before `JSON.parse`. |
| 11 | Model uses "mistake" | output guard replaces | ✅ | `BANNED` matches `mistakes?` and replaces `praise` / `one_upgrade` / `resay_sentence` with SAFE fields. |
| 12 | Claude API 529 overloaded | SAFE default, don't block session | ✅ | Empty/non-JSON body fails parse, retries once, then returns SAFE. |
| 13 | User asks a question back ("what should I say?") | resay gives a starter | 🔲 | No code path; only the generic off-topic prompt rule. |
| 14 | Same tip 3 sessions in a row | recent_upgrades grounding prevents | 🔲 | `recent_upgrades` are interpolated into the prompt, but a repeated `one_upgrade` is not rejected. |
