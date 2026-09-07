# ByoU — Bolt Refinement Prompt v2: Courses + Subscriptions
**Run order: paste the Master Prompt (byou-bolt-prompt.md) first and let it build → then paste this refinement prompt as your next message to Bolt.**

---

## REFINEMENT PROMPT — paste everything between the lines into Bolt

----------------------------------------------------------------------

Extend the existing ByoU app with a course system and a subscription layer. Keep the design system, tone, and all existing flows intact. Details:

**1) NEW ONBOARDING STEP — "Choose your course" (after "Account created 🎉", before the user-guide tour)**
Full-screen with the title "What do you want to get better at?" and three selectable cards:
- 🎯 **Interview Preparation** — "Crack your next job interview. 30 days."
- 💬 **General Conversation** — "Speak easily in daily life. 30 days."
- 🚀 **Interview + Conversation** — "The complete course. 30 days." — pre-highlighted with a "Most popular" badge (center-stage effect; a default the user can change, not a lock-in).
One primary button "Start my course", and a caption: "You can change your course anytime in Profile." Store the selection; the whole app adapts to it.

**2) HOME UPDATES**
- Hero mission card now shows the course context: "Day {n} of 30 · {Course name}" above the mission title, plus a slim linear progress bar (n/30).
- Under the hero, a text link "View course plan →".

**3) NEW SCREEN — Course Plan (opened from Home)**
- Four collapsible week sections ("Week 1 — Introduce yourself with confidence", etc. — pull names from the seed data below).
- Each day is a row: day number, mission title, and a state icon: ✓ done (tappable to redo) · ▶ today (primary color) · 🔒 locked with caption "Unlocks tomorrow".
- Pacing rule: exactly one new day unlocks per calendar day — this is a habit product, not a binge product. Past days always redoable.
- Top of screen: circular progress "Day {n}/30" (goal-gradient).

**4) SEED CURRICULUM DATA (hardcode as a typed constant; Days 1–7 per course; Days 8–30 render as locked rows with titles "Coming up…")**

interview_prep, weeks: W1 "Introduce yourself with confidence", W2 "Talk about your work", W3 "The classic questions", W4 "Pressure-proof". Days:
- D1 "Tell me about yourself" · Qs: "Tell me about yourself." / "What did you study?" · phrases: "I'm ___. I completed ___ in ___." ; "I studied ___ at ___."
- D2 "Your education story" · Qs: "Why did you choose that course?" / "What did you enjoy most in your studies?" · phrases: "I chose ___ because ___." ; "The part I enjoyed most was ___."
- D3 "Your skills" · Qs: "What are you good at?" / "Give me an example of using that skill." · phrases: "I'm good at ___." ; "For example, once I ___."
- D4 "Your goal" · Qs: "What kind of job are you looking for?" / "Why this field?" · phrases: "I'm looking for a role in ___." ; "This field suits me because ___."
- D5 "Your work or training" · Qs: "Tell me about your last project or training." / "What was your responsibility?" · phrases: "In my training, I worked on ___." ; "I was responsible for ___."
- D6 "Your 60-second introduction" · Qs: "Introduce yourself in one minute." / "What makes you a good hire?" · phrases: "To introduce myself, ___." ; "In short, I can ___."
- D7 "Week 1 review — mini mock" · Qs: two random questions from D1–D6 · phrases: review.

general_conversation, weeks: W1 "Everyday small talk", W2 "Plans & stories", W3 "Opinions & reactions", W4 "Real-world situations". Days:
- D1 "Greetings that go further" · Qs: "How are you doing today, really?" / "How was your morning?" · phrases: "Honestly, today has been ___." ; "My morning was ___ because ___."
- D2 "Your weekend" · Qs: "What did you do this weekend?" / "What was the best part?" · phrases: "This weekend I ___." ; "The best part was ___."
- D3 "Your daily routine" · Qs: "Walk me through your normal day." / "What part of the day do you like most?" · phrases: "Usually I start my day with ___." ; "After that, I ___."
- D4 "Small talk starters" · Qs: "How's the weather there today?" / "How do you travel to work or college?" · phrases: "It's quite ___ today." ; "I usually take the ___."
- D5 "Food you love" · Qs: "What's your favourite food?" / "How is it made?" · phrases: "My favourite food is ___." ; "First you ___, then you ___."
- D6 "Your city" · Qs: "Tell me about your city or neighbourhood." / "What should a visitor see?" · phrases: "I live in ___, which is known for ___." ; "You should definitely visit ___."
- D7 "Free talk Friday" · Qs: "Pick any topic and talk for one minute." · phrases: "Let me tell you about ___."

combined, weeks: W1–W4 "The complete path". Pattern: D1–D4 = interview_prep D1–D4 · D5 = general_conversation D2 · D6 = general_conversation D3 · D7 "Mixed review — mini mock" (one interview + one conversation question).

**5) NEW SCREEN — Plans (subscription)**
Triggers: a "⭐ Upgrade" row in Profile, and shown ONCE automatically after the Day-1 feedback confetti, always with a clearly visible dismiss: "Maybe later — continue free (1 mission a day)". Never hard-block practice.
Layout (monthly/yearly toggle at top):
- Small anchor line above the cards: "Offline coaching costs ₹2,000–5,000 a month. ByoU:"
- Card 1 **Interview Preparation** — ₹99/mo · ₹699/yr — full 30-day interview course, weekly mock interview, 15 min practice/day.
- Card 2 **Interview + Conversation** (center, elevated, "MOST POPULAR · Save ₹49/mo" badge) — ₹149/mo · ₹999/yr — both full courses, 40 min/day, mock interviews, early access to group discussions. Primary CTA: "Start 7-day free trial".
- Card 3 **General Conversation** — ₹99/mo · ₹699/yr — full 30-day conversation course, 15 min practice/day.
- Free tier reminder at bottom: "Free forever: 1 daily mission + word warm-up."
- DEMO_MODE checkout: tapping any plan opens a sheet "Demo checkout — no payment in prototype" with a Confirm button → success state, plan badge appears in Profile.
Pricing psychology to implement visually: the two ₹99 singles flank the ₹149 bundle so the bundle reads as the obvious deal (decoy + anchoring + center-stage). Keep copy honest and warm — no fake timers, no dark patterns.

**6) PROFILE UPDATES**
- Show current plan badge (Free / Interview / Conversation / Complete) + "Manage plan" → Plans screen.
- "Change course" opens the same three-card chooser; changing course keeps streak and points, resets day counter with a confirm dialog explaining that.

**7) FREE-TIER RULES (enforce in UI, gently)**
Free: today's mission + flashcards only. Locked for free users: redoing past days beyond yesterday, Day-7/14/21/28 mock days (show "Included in your course plan ⭐"), and >1 mission/day. Locks always explain what unlocks them — never a bare padlock.

**8) ACCEPTANCE ADDITIONS**
- New-user path: signup → course chooser (bundle pre-highlighted) → tour → Day 1 mission → confetti → Plans appears once → dismiss → Home shows "Day 1 of 30 ✓".
- Course Plan screen: Day 2 locked until tomorrow (for demo, add a hidden dev button "advance day" in Profile → About, so the flow can be demonstrated).
- Switching course from Profile works and the Home hero updates.

----------------------------------------------------------------------

## New UX laws this adds (append to your Step-4 design rationale)

| Law / effect | Where |
|---|---|
| Decoy effect | Two ₹99 singles make the ₹149 bundle the rational pick |
| Center-stage effect | Bundle card centered, elevated, badged — where the eye expects "the right choice" |
| Anchoring | "Coaching ₹2,000–5,000/mo" line reframes ₹149 as trivially cheap |
| Default effect | Bundle pre-highlighted at course selection; freely changeable |
| Goal-gradient (again) | Day n/30 bars, week accordions, "Unlocks tomorrow" pull-forward |
| Commitment & consistency | Choosing a named 30-day course is a self-promise the daily unlock honours |
| Ethical guardrail | Soft paywall with a permanent free path; no countdown timers, no guilt copy |
