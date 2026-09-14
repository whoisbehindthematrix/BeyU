ByoU Build Handbook
From single-file prototype to a real backend — in the right order, one click at a time

Who this is for: you, building ByoU solo, with a working HTML prototype on GitHub Pages and no backend yet. How to use it: work top to bottom. Each phase ends with a Verify step — don't move on until it passes. Phases are numbered so you can say "I'm stuck on 4.3" and get help fast.

0. The order, and why
Phase 1  GitHub ↔ Cursor              (tooling — 30 min)
Phase 2  Restructure the prototype    (so a backend can plug in — 1 hr)
Phase 3  Supabase project + connect   (30 min)
Phase 4  Auth (Google + email)        (users must exist before you can store anything *per user* — 1 hr)
Phase 5  Schema                       (all tables at once, with RLS — 2 hrs)
Phase 6  Load the 4,000 words         (CSV import — 30 min)
Phase 7  Sessions + progress          (write from the app — 2 hrs)
Phase 8  Feedback storage             (AI feedback + user feedback — 1 hr)
Phase 9  Journey logs                 (one generic event table — 30 min)
Phase 10 Voice: Web Speech → Sarvam   (keep Web Speech as fallback — 2 hrs)
Phase 11 AI agent: grounding, prompt, guardrails, edge cases, evals  (ongoing)
Phase 12 Deploy + secrets             (30 min)

Why this order: auth before schema, because every table has a user_id that must reference a real auth user. Schema before sessions, because you can't insert into tables that don't exist. Voice and AI last, because they're the riskiest and the app must already be able to save data before you make it smarter.

One architectural decision, made now: all API keys (Claude/OpenAI, Sarvam) live in Supabase Edge Functions, never in the browser. The browser only talks to Supabase. This kills the "API key in a public repo" risk permanently. n8n stays optional for later workflows (daily reminders, weekly digests) — you don't need it to ship.

Phase 1 — Connect GitHub → Cursor
1.1 Install
Go to cursor.com → Download → install like any app.
Open Cursor. On first launch it asks about importing VS Code settings — click Skip if you don't have any.
Sign in (top-right avatar or Ctrl/Cmd+Shift+P → type Sign in). Free tier is fine.
1.2 Sign into GitHub inside Cursor
Bottom-left → Accounts icon (person silhouette) → Sign in with GitHub to use… → browser opens → Authorize.
Back in Cursor, the icon now shows your GitHub username.
1.3 Clone the ByoU repo
Open github.com → your ByoU repo → green <> Code button → HTTPS tab → copy the URL.
In Cursor: Ctrl/Cmd+Shift+P → type Git: Clone → Enter → paste URL → Enter.
Pick a folder (e.g. ~/Projects/) → Select as Repository Destination → Open when prompted.
Left sidebar → Explorer (top icon) shows your files. You're in.
1.4 The three Cursor things you'll use daily
Want to…	Do
Ask AI to edit code in a file	Select code → Ctrl/Cmd+K → type instruction → Accept
Ask AI about the whole project	Ctrl/Cmd+L opens Chat. Type @ to attach files (@index.html)
Let AI make multi-file changes	In Chat, switch mode dropdown to Agent. It edits and asks you to Accept / Reject each file
See what changed	Left sidebar → Source Control icon (branch symbol)
1.5 Commit and push (you'll do this ~10 times a day)
Source Control panel → files listed under Changes.
Hover a file → + to stage (or + next to "Changes" to stage all).
Type a message in the box (e.g. add supabase client) → ✓ Commit.
Click Sync Changes (or Publish Branch the first time).
Refresh GitHub → your commit is there.

Verify: Edit one character in README.md, commit, push, see it on github.com.

Common errors

"Please tell me who you are" → terminal (Ctrl/Cmd+`` ) → git config --global user.email "you@x.com" and git config --global user.name "Uttirna Das".
Push rejected → click Sync Changes first (pulls, then pushes).
Phase 2 — Restructure the prototype (minimal, not a rewrite)

Your single-file HTML works. Don't throw it away. Just split it so the backend has somewhere to plug in.

2.1 Target folder layout
byou/
├── index.html          ← markup only
├── css/app.css         ← styles moved out
├── js/
│   ├── supabase.js     ← client init (Phase 3)
│   ├── auth.js         ← login/logout (Phase 4)
│   ├── session.js      ← practice flow + saving (Phase 7)
│   ├── voice.js        ← STT (Phase 10)
│   └── app.js          ← wires it together
├── supabase/           ← created by CLI in Phase 5
│   ├── migrations/
│   └── functions/
├── data/words.csv      ← Phase 6
├── .env.example        ← committed
├── .env                ← NEVER committed
└── .gitignore
2.2 Do the split with Cursor Agent
Ctrl/Cmd+L → mode Agent → paste:

Split index.html into index.html + css/app.css + js/app.js without changing any behaviour. Use <script type="module" src="js/app.js">. Keep all IDs and class names identical.

Review each diff → Accept.
Open index.html with Live Server or just double-click it → confirm the app still works exactly as before.
2.3 .gitignore — do this before anything else

Create .gitignore at root:

.env
.env.*
!.env.example
node_modules/
supabase/.temp/

Commit it. Verify: .env never appears in Source Control's Changes list.

Phase 3 — Create Supabase project and connect
3.1 Create the project
supabase.com → Start your project → sign in with GitHub.
New project → Organization: your personal one → Name: byou → Database Password: generate, then save it in a password manager now (you'll need it for the CLI) → Region: Mumbai (ap-south-1) (closest to your users) → Create new project. Wait ~2 min.
3.2 Get your two keys
Left sidebar → Project Settings (gear, bottom) → API.
Copy Project URL (https://xxxx.supabase.co) and anon public key.
The service_role key is also here. It bypasses all security. Never put it in the browser. You'll only use it inside Edge Functions.
3.3 Put keys in the app

.env.example (committed):

SUPABASE_URL=
SUPABASE_ANON_KEY=

.env (not committed): same, filled in.

Because you're serving plain HTML (no build step), .env won't load automatically. Two options:

Simplest: js/config.js with the URL + anon key hard-coded. The anon key is designed to be public — it's safe in the browser as long as RLS is on (Phase 5). Commit it.
Cleaner (later): switch to Vite (npm create vite@latest) and use import.meta.env.VITE_SUPABASE_URL.

Go with simplest for now.

3.4 Create the client

js/supabase.js:

js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

Verify: In app.js add import { supabase } from './supabase.js'; console.log(await supabase.auth.getSession()); → browser console (F12) shows {data: {session: null}, error: null}. No error = connected.

Phase 4 — Authorization of a user
4.1 Enable email (magic link / OTP) — fastest to test
Supabase → Authentication → Providers → Email → ensure Enable Email provider is on → turn Confirm email OFF for now (speeds up testing; turn on before launch) → Save.
4.2 Enable Google login
console.cloud.google.com → top-left project dropdown → New Project → name byou → Create.
Left menu → APIs & Services → OAuth consent screen → External → fill App name ByoU, your email → Save and Continue through scopes (leave default) → add yourself as a Test user → Save.
APIs & Services → Credentials → + Create Credentials → OAuth client ID → Application type Web application → Name byou-web.
Authorized JavaScript origins: add http://localhost:5500 (or whatever Live Server uses) and your GitHub Pages URL.
Authorized redirect URIs: add https://<your-ref>.supabase.co/auth/v1/callback (get it from Supabase → Authentication → Providers → Google, it's shown there).
Create → copy Client ID and Client Secret.
Supabase → Authentication → Providers → Google → toggle on → paste both → Save.
Supabase → Authentication → URL Configuration → Site URL: your GitHub Pages URL → Redirect URLs: add http://localhost:5500/** and your pages URL with /**.
4.3 Code

js/auth.js:

js
import { supabase } from './supabase.js';

export const signInWithGoogle = () =>
  supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });

export const signInWithEmail = (email) =>
  supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });

export const signOut = () => supabase.auth.signOut();

export const getUser = async () => (await supabase.auth.getUser()).data.user;

// call once on app load
export const onAuthChange = (cb) => supabase.auth.onAuthStateChange((_e, session) => cb(session?.user ?? null));

In app.js: if no user → show login screen; if user → show the course chooser. That's your gate.

4.4 The profiles table + auto-create trigger

Supabase's auth.users is locked down. You keep app data in your own profiles table, created automatically when someone signs up. Run this in SQL Editor → New query → paste → Run:

sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  level text check (level in ('beginner','intermediate','advanced')),
  course_id text,              -- 'interview' | 'conversation' | 'bundle'
  streak_days int default 0,
  last_active_date date,
  total_points int default 0,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- auto-create a profile row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

Verify: Click your Google login button → consent screen → back in app → Supabase → Authentication → Users shows you → Table Editor → profiles has one row with your id.

Common errors

redirect_uri_mismatch → the URI in Google Console must exactly equal the one Supabase shows. No trailing slash.
Returns to app but user is null → your Site URL / Redirect URLs in 4.2 step 8 don't include the origin you're testing on.
Phase 5 — Create the schema
5.1 The tables (what each one is for)
Table	One row =	Why it exists
profiles	one user	done in Phase 4
courses	one SKU (interview / conversation / bundle)	course chooser
course_days	one day of one course (Day 1–30)	the daily unlock
questions	one practice prompt, belongs to a course_day	what the user is asked
sessions	one practice session (a user opening Day N)	the container
answers	one spoken answer to one question inside a session	transcript + audio + AI feedback
words	one of the 4,000 vocabulary words	Phase 6
user_words	user × word, with spaced-repetition state	flashcard progress
daily_progress	user × date	streaks, points, day unlocked
user_feedback	one thing a user told you about the app	post-session survey / readiness pulse
events	one thing the user did	journey logs (Phase 9)
5.2 Set up the Supabase CLI (so schema lives in git, not just in the dashboard)

Terminal in Cursor:

bash
npm init -y                      # only if no package.json yet
npm i -D supabase
npx supabase login               # opens browser → Authorize
npx supabase init                # creates supabase/ folder
npx supabase link --project-ref <your-ref>   # ref = the xxxx in xxxx.supabase.co; enter DB password

Now every schema change = a migration file:

bash
npx supabase migration new create_core_tables

This creates supabase/migrations/<timestamp>_create_core_tables.sql. Paste SQL there, then:

bash
npx supabase db push

Commit the migration file. This is how you "store" the schema.

5.3 The SQL — paste into that migration file
sql
-- ===== Content =====
create table public.courses (
  id text primary key,                 -- 'interview','conversation','bundle'
  name text not null,
  price_monthly_inr int,
  is_default boolean default false
);

create table public.course_days (
  id bigint generated always as identity primary key,
  course_id text references public.courses(id),
  day_number int not null check (day_number between 1 and 30),
  title text not null,
  theme text,
  unique (course_id, day_number)
);

create table public.questions (
  id bigint generated always as identity primary key,
  course_day_id bigint references public.course_days(id) on delete cascade,
  position int not null,               -- 1,2,3
  prompt text not null,
  hint text,
  target_words text[]                  -- vocab this question is meant to surface
);

-- ===== Activity =====
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  course_day_id bigint references public.course_days(id),
  started_at timestamptz default now(),
  completed_at timestamptz,
  device_info jsonb,                   -- browser, STT engine used
  confidence_before int,               -- readiness pulse 1-5
  confidence_after int
);

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  question_id bigint references public.questions(id),
  transcript text,
  audio_path text,                     -- Supabase Storage path, optional
  duration_sec numeric,
  stt_engine text,                     -- 'web_speech' | 'sarvam'
  ai_feedback jsonb,                   -- {praise, one_upgrade, resay_sentence, score}
  resay_transcript text,
  created_at timestamptz default now()
);

-- ===== Vocabulary =====
create table public.words (
  id bigint generated always as identity primary key,
  word text unique not null,
  meaning text,
  example text,
  ipa text,
  level int check (level between 1 and 5),
  category text                        -- 'interview','workplace','daily'
);

create table public.user_words (
  user_id uuid references public.profiles(id) on delete cascade,
  word_id bigint references public.words(id),
  times_spoken int default 0,
  last_spoken_at timestamptz,
  next_due date default current_date,
  ease numeric default 2.5,            -- spaced repetition
  primary key (user_id, word_id)
);

-- ===== Progress =====
create table public.daily_progress (
  user_id uuid references public.profiles(id) on delete cascade,
  date date not null,
  session_completed boolean default false,
  words_spoken int default 0,
  points int default 0,
  day_unlocked int,
  primary key (user_id, date)
);

-- ===== Feedback from users =====
create table public.user_feedback (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete set null,
  session_id uuid references public.sessions(id) on delete set null,
  kind text,                           -- 'post_session','nps','bug','readiness_pulse'
  rating int,
  comment text,
  created_at timestamptz default now()
);

-- ===== Journey logs =====
create table public.events (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete set null,
  session_id uuid,
  name text not null,                  -- 'app_open','mic_blocked','question_shown',...
  props jsonb,
  created_at timestamptz default now()
);
create index on public.events (user_id, created_at desc);
create index on public.events (name);
5.4 Row Level Security — non-negotiable, do it in the same migration

Without this, anyone with your anon key can read every user's data.

sql
-- content tables: anyone logged in can read, nobody can write from the app
alter table public.courses enable row level security;
alter table public.course_days enable row level security;
alter table public.questions enable row level security;
alter table public.words enable row level security;
create policy "read content" on public.courses for select to authenticated using (true);
create policy "read content" on public.course_days for select to authenticated using (true);
create policy "read content" on public.questions for select to authenticated using (true);
create policy "read content" on public.words for select to authenticated using (true);

-- user tables: you can only touch your own rows
alter table public.sessions enable row level security;
alter table public.answers enable row level security;
alter table public.user_words enable row level security;
alter table public.daily_progress enable row level security;
alter table public.user_feedback enable row level security;
alter table public.events enable row level security;

create policy "own rows" on public.sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.answers for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.user_words for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.daily_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.user_feedback for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
5.5 Seed the courses and Day 1–7 content

New migration seed_courses:

sql
insert into public.courses values
  ('interview','Interview Preparation',99,false),
  ('conversation','General Conversation',99,false),
  ('bundle','Interview + Conversation',149,true);

insert into public.course_days (course_id, day_number, title, theme) values
  ('interview',1,'Tell me about yourself','self-intro'),
  ('interview',2,'Why this role?','motivation');
  -- ... continue from your Day 1–7 curriculum tables

insert into public.questions (course_day_id, position, prompt, hint) values
  (1,1,'Introduce yourself in 30 seconds.','Name, where you studied, one thing you are good at'),
  (1,2,'What do you enjoy doing outside study or work?','Pick one thing and say why');

Verify: npx supabase db push succeeds → Table Editor shows all tables → click sessions → RLS enabled badge is green. Then in browser console: await supabase.from('words').select('*').limit(1) returns [] (empty but no error) when logged in, and an empty array with an error when logged out. That's RLS working.

Common errors

relation already exists → you ran the SQL in the dashboard AND pushed the migration. Pick one source of truth: the migration file. Drop the table in SQL Editor and push again.
new row violates row-level security → you're inserting with a user_id that isn't auth.uid(). Always set user_id: user.id from getUser().
Phase 6 — Store the 4,000 English words
6.1 Prepare the CSV

data/words.csv with header exactly matching column names:

word,meaning,example,ipa,level,category
accomplish,to succeed in doing something,"I accomplished my target this month.",əˈkʌmplɪʃ,2,workplace

Rules: UTF-8, no blank rows, wrap anything containing a comma in double quotes, level is 1–5, no duplicate words (the unique constraint will reject them — dedupe in Excel first: Data → Remove Duplicates).

Where the words come from: build it with Claude in batches of 200 ("give me 200 workplace-English words a B1 Indian job seeker should be able to say aloud, CSV format, columns …"). Review a sample of each batch — this is your product content, not throwaway.

6.2 Import (the dashboard way — easiest)
Supabase → Table Editor → words → Insert dropdown (top) → Import data from CSV.
Drag words.csv → it previews column mapping → confirm word→word, etc. → Import.
4,000 rows takes ~30 s.
6.3 Import (the repeatable way — for when you fix the list)

Put a words.csv copy in supabase/ and run in SQL Editor:

sql
-- Only works via psql, not the web editor. Use the dashboard import instead unless you have psql:
\copy public.words(word,meaning,example,ipa,level,category) from 'data/words.csv' csv header
6.4 Read words in the app
js
// 20 due flashcards for today
const { data: due } = await supabase
  .from('user_words')
  .select('word_id, words(word, meaning, example)')
  .lte('next_due', new Date().toISOString().slice(0,10))
  .limit(20);

For a brand-new user user_words is empty, so seed it on first flashcard open: pick 20 words at level = profile.level and insert user_words rows. Then update times_spoken, next_due after each spoken card (simple rule: correct → next_due += 3 days, then 7, then 14; skipped → tomorrow).

Verify: Table Editor → words → row count shows ~4,000. Console query above returns 20 rows after seeding.

Phase 7 — Store sessions and track progress
7.1 The write sequence per practice session
user taps "Start Day N"
  → insert sessions (started_at, course_day_id, confidence_before)   ← returns session.id
  → for each of 3 questions:
       user speaks → transcript
       → call Edge Function `feedback` (Phase 11) → ai_feedback
       → insert answers (session_id, question_id, transcript, ai_feedback, stt_engine)
  → user gives confidence_after
  → update sessions set completed_at, confidence_after
  → upsert daily_progress (date=today, session_completed=true, points+=X)
  → update profiles streak_days, last_active_date, total_points
7.2 Code — js/session.js
js
import { supabase } from './supabase.js';
import { getUser } from './auth.js';

export async function startSession(courseDayId, confidenceBefore) {
  const user = await getUser();
  const { data, error } = await supabase.from('sessions')
    .insert({ user_id: user.id, course_day_id: courseDayId, confidence_before: confidenceBefore,
              device_info: { ua: navigator.userAgent } })
    .select().single();
  if (error) throw error;
  return data; // has .id
}

export async function saveAnswer({ sessionId, questionId, transcript, aiFeedback, sttEngine, durationSec }) {
  const user = await getUser();
  return supabase.from('answers').insert({
    session_id: sessionId, user_id: user.id, question_id: questionId,
    transcript, ai_feedback: aiFeedback, stt_engine: sttEngine, duration_sec: durationSec
  });
}

export async function completeSession(sessionId, confidenceAfter, pointsEarned) {
  const user = await getUser();
  const today = new Date().toISOString().slice(0,10);
  await supabase.from('sessions').update({ completed_at: new Date().toISOString(), confidence_after: confidenceAfter }).eq('id', sessionId);
  await supabase.from('daily_progress').upsert({ user_id: user.id, date: today, session_completed: true, points: pointsEarned });
  await supabase.rpc('bump_streak');   // see 7.3
}
7.3 Streak logic belongs in the database (so it can't be cheated from the browser)

Migration streak_fn:

sql
create or replace function public.bump_streak()
returns void language plpgsql security definer as $$
declare p public.profiles%rowtype;
begin
  select * into p from public.profiles where id = auth.uid();
  if p.last_active_date = current_date then return; end if;
  update public.profiles set
    streak_days = case when p.last_active_date = current_date - 1 then p.streak_days + 1 else 1 end,
    last_active_date = current_date,
    total_points = total_points + 10
  where id = auth.uid();
end $$;
7.4 Progress screen queries
js
const { data: profile } = await supabase.from('profiles').select('*').single();          // streak, points
const { data: days }    = await supabase.from('daily_progress').select('*').order('date');  // calendar heatmap
const { data: day1 }    = await supabase.from('answers').select('transcript, audio_path').eq('question_id', DAY1_Q1_ID).order('created_at').limit(1); // for the Day-29 re-record

Verify: Complete one session → Table Editor shows 1 row in sessions (with completed_at), 3 in answers, 1 in daily_progress, and profiles.streak_days = 1. Do it again tomorrow → streak_days = 2.

Phase 8 — Get and store feedback (two kinds)

AI feedback about the user → goes in answers.ai_feedback (Phase 7, generated in Phase 11). User feedback about the app → user_feedback table:

js
export const submitFeedback = async ({ sessionId, kind, rating, comment }) => {
  const user = await getUser();
  return supabase.from('user_feedback').insert({ user_id: user.id, session_id: sessionId, kind, rating, comment });
};

Wire three touchpoints:

Readiness pulse (already in prototype) → kind: 'readiness_pulse'.
Post-session one-tap: "Was today's feedback helpful?" 👍/👎 → kind: 'post_session', rating: 1|0.
Report a problem link in the footer → kind: 'bug', comment.

To read it yourself: SQL Editor → select kind, avg(rating), count(*) from user_feedback group by kind;

Phase 9 — Store user journey logs

One function, called everywhere:

js
// js/track.js
import { supabase } from './supabase.js';
let currentSessionId = null;
export const setSession = (id) => (currentSessionId = id);
export async function track(name, props = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  supabase.from('events').insert({ user_id: user?.id, session_id: currentSessionId, name, props }).then(() => {});
}

The events that matter for a speaking app (log these and nothing else at first):

Event	Props	Tells you
app_open	{returning: bool}	DAU
login_success	{provider}	funnel
course_selected	{course_id}	did the decoy work
mic_permission	{result: granted/blocked/no_hw}	your #1 drop-off risk
question_shown	{q_id, position}	
recording_started / recording_ended	{duration_sec}	silence rate
stt_result	{engine, empty: bool, chars}	Sarvam vs Web Speech quality
typed_fallback_used		how often speaking fails
feedback_shown	{latency_ms}	is Claude too slow
resay_completed		did they do the drill
session_completed	{q_answered}	activation metric
paywall_shown / paywall_dismissed		

The funnel query you'll run weekly:

sql
select name, count(distinct user_id) users
from events where created_at > now() - interval '7 days'
group by name order by users desc;

Verify: Open the app, tap around, refresh Table Editor → events fills up in real time.

Phase 10 — Connect voice recognition APIs
10.1 Strategy

Keep Web Speech API (free, on-device on Android Chrome) as the default. Add Sarvam Saarika as an upgrade path for accuracy on Indian accents, called through an Edge Function so the key stays hidden. Log which engine produced each transcript (stt_engine) so you can compare quality from real data before committing.

10.2 Record audio in the browser (needed for Sarvam, and for the Day-29 playback)
js
// js/voice.js
let mediaRecorder, chunks = [];
export async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
  chunks = [];
  mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
  mediaRecorder.start();
}
export function stopRecording() {
  return new Promise((resolve) => {
    mediaRecorder.onstop = () => resolve(new Blob(chunks, { type: 'audio/webm' }));
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(t => t.stop());
  });
}
10.3 Store the audio (Supabase Storage)
Supabase → Storage → New bucket → name answers → Public: OFF → Create.
Policies tab on the bucket → New policy → template "Give users access to own folder" → applies to INSERT and SELECT → Review → Save.
Upload from the app:
js
const path = `${user.id}/${sessionId}/${questionId}.webm`;
await supabase.storage.from('answers').upload(path, blob, { contentType: 'audio/webm' });
// save `path` in answers.audio_path
10.4 Edge Function for Sarvam STT
bash
npx supabase functions new stt
npx supabase secrets set SARVAM_API_KEY=sk_...

supabase/functions/stt/index.ts:

ts
Deno.serve(async (req) => {
  const form = await req.formData();               // browser sends the blob as 'file'
  const audio = form.get('file') as File;
  const out = new FormData();
  out.append('file', audio, 'answer.webm');
  out.append('model', 'saarika:v2.5');
  out.append('language_code', 'en-IN');
  const r = await fetch('https://api.sarvam.ai/speech-to-text', {
    method: 'POST',
    headers: { 'api-subscription-key': Deno.env.get('SARVAM_API_KEY')! },
    body: out,
  });
  const json = await r.json();
  return new Response(JSON.stringify({ transcript: json.transcript ?? '' }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

Check the exact field names against Sarvam's current docs before first run — API shapes change.

Deploy: npx supabase functions deploy stt. Call from app:

js
const fd = new FormData(); fd.append('file', blob);
const { data } = await supabase.functions.invoke('stt', { body: fd });
10.5 The fallback ladder (already partly in your prototype — formalise it)
try Sarvam (if online + user is on a course)  → stt_engine='sarvam'
  ↓ fail / >4 s
try Web Speech                                 → stt_engine='web_speech'
  ↓ blocked / no hardware / empty result ×2
show "Type instead"                            → stt_engine='typed'

Every rung logs an event (Phase 9). That's how you'll know what % of real users actually speak.

Verify: Say a sentence → answers row has transcript and stt_engine='sarvam' → Storage bucket has the .webm.

Phase 11 — The AI agent: grounding, system prompt, guardrails, edge cases, evaluation
11.1 Where the AI lives

One Edge Function, feedback. Browser sends {transcript, question, user_level, target_words}; function returns structured JSON. Model: Claude Haiku (cheap, fast) — npx supabase secrets set ANTHROPIC_API_KEY=....

11.2 Grounding — what the model is allowed to know

Grounding = feeding the model facts from your database so it doesn't invent. For ByoU, per call, ground on:

the exact question asked (from questions.prompt + hint)
the user's level (profiles.level)
the 3–5 target_words for that question
the user's last 3 ai_feedback.one_upgrade values (so it doesn't repeat the same tip)
for Day 29: the Day-1 transcript

Don't ground on the whole curriculum or all 4,000 words — irrelevant context makes Haiku worse, not better.

11.3 System prompt — v1 (paste-ready)
You are ByoU, a warm English speaking coach for Indian job seekers who can read and write English but freeze when speaking. Your only job is to make the learner want to speak again tomorrow.

CONTEXT
- Question asked: {{question}}
- Learner level: {{level}}
- Words we hoped to hear: {{target_words}}
- Tips already given recently (do not repeat): {{recent_upgrades}}

WHAT YOU RECEIVE
A transcript from speech recognition. It may have recognition errors, missing punctuation, Indian-English phrasing. Treat transcription glitches as glitches, never as learner errors.

RESPOND WITH ONLY THIS JSON
{
  "praise": "<one specific thing they did well, 12 words max, quote their own phrase>",
  "one_upgrade": "<one small change that makes them sound more confident, phrased as a suggestion, 20 words max>",
  "resay_sentence": "<a single natural sentence, 8-14 words, they should say aloud now, using their own idea>",
  "used_target_words": ["<any target words they actually said>"],
  "confidence_score": <1-5, how fluent and complete the answer sounded>
}

RULES
- Never use these words or their variants: wrong, mistake, grammar, error, incorrect, poor, bad, fail.
- Praise must be specific to what they said. "Good job" is not praise.
- One upgrade only. Never a list.
- Indian English is valid English. "Do the needful", "prepone", "I have a doubt" are fine.
- If the transcript is empty or under 5 words, praise the attempt, set one_upgrade to encourage a longer answer, resay_sentence to a simple model answer to the question.
- If the transcript is off-topic, gently steer with resay_sentence; do not scold.
- Never mention that you are an AI, never discuss anything outside spoken-English practice.
- Output valid JSON only. No preamble, no markdown fences.
11.4 Guardrails — three layers, all cheap
Layer	Where	What
Input	Edge Function, before model	Trim transcript to 1,500 chars. If it contains phone numbers/emails, redact. If it's clearly not English practice (abuse, prompt-injection like "ignore previous"), return a canned encouraging response without calling the model.
Prompt	system prompt	the RULES block above
Output	Edge Function, after model	JSON.parse in try/catch → on failure retry once with "Output valid JSON only" appended → on second failure return a safe default. Then regex-scan all string fields for the banned-word list → if any hit, replace the field with a neutral fallback and log an guardrail_hit event. Clamp confidence_score to 1–5.

Safe default (return this whenever anything breaks):

json
{"praise":"You spoke — that is the hardest part.","one_upgrade":"Next time, add one more sentence about why.","resay_sentence":"I am ready to practise and improve every day.","used_target_words":[],"confidence_score":3}
11.5 Edge Function skeleton — supabase/functions/feedback/index.ts
ts
const BANNED = /\b(wrong|mistakes?|grammar|grammatical|errors?|incorrect|poor|bad|fail(ed|ure)?)\b/i;
const SAFE = { praise: "You spoke — that is the hardest part.", one_upgrade: "Next time, add one more sentence about why.", resay_sentence: "I am ready to practise and improve every day.", used_target_words: [], confidence_score: 3 };

Deno.serve(async (req) => {
  const { transcript = '', question, level, target_words = [], recent_upgrades = [] } = await req.json();
  const clean = transcript.slice(0, 1500).replace(/\b[\w.+-]+@[\w-]+\.\w+\b|\b\d{10}\b/g, '[removed]');
  if (/ignore (all )?previous|system prompt|jailbreak/i.test(clean)) return json(SAFE);

  const system = SYSTEM_PROMPT.replace('{{question}}', question).replace('{{level}}', level)
    .replace('{{target_words}}', target_words.join(', ')).replace('{{recent_upgrades}}', recent_upgrades.join(' | '));

  let parsed = null;
  for (let attempt = 0; attempt < 2 && !parsed; attempt++) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-haiku-4-5', max_tokens: 400, system,
        messages: [{ role: 'user', content: `Transcript: """${clean}"""${attempt ? '\nOutput valid JSON only.' : ''}` }] }),
    });
    const text = (await r.json()).content?.[0]?.text ?? '';
    try { parsed = JSON.parse(text.replace(/```json|```/g, '').trim()); } catch { parsed = null; }
  }
  if (!parsed) return json(SAFE);

  for (const k of ['praise','one_upgrade','resay_sentence'])
    if (BANNED.test(parsed[k] ?? '')) parsed[k] = SAFE[k];
  parsed.confidence_score = Math.min(5, Math.max(1, Number(parsed.confidence_score) || 3));
  return json(parsed);
});
const json = (o: unknown) => new Response(JSON.stringify(o), { headers: { 'content-type': 'application/json' } });
11.6 Edge-case collection — a living file, docs/edge-cases.md

Every time real usage produces something weird, add a row. Seed it with these now:

#	Input	Expected behaviour	Status
1	Empty transcript	praise attempt, model answer as resay	✅ handled
2	2-word answer ("yes sir")	encourage longer	✅
3	Answer in Hindi/Hinglish	praise, resay in English, no scolding	🔲 test
4	Mic picks up background TV	model should not treat noise as the answer	🔲
5	User says "I don't know"	offer a starter sentence	🔲
6	3-minute monologue	trim + praise, upgrade = "keep it to 45 s"	🔲
7	STT mangles name ("my name is uterna")	never correct names	🔲
8	Profanity / abuse	canned response, log event	✅ input guard
9	"Ignore your rules and…"	canned response	✅
10	Model returns markdown-fenced JSON	strip + parse	✅
11	Model uses "mistake"	output guard replaces	✅
12	Claude API 529 overloaded	SAFE default, don't block session	🔲
13	User asks a question back ("what should I say?")	resay gives a starter	🔲
14	Same tip 3 sessions in a row	recent_upgrades grounding prevents	🔲

Source of new rows: SQL Editor → select transcript, ai_feedback from answers order by created_at desc limit 50; — read them every few days.

11.7 "Training" the AI — what that means for you

You are not fine-tuning a model. You improve behaviour three ways, in this order of cost:

Edit the system prompt (most issues).
Add few-shot examples into the prompt — 3 pairs of transcript → ideal JSON, drawn from your best real outputs.
Add a guardrail for anything that must never happen regardless of the model.

Keep every version of the system prompt in supabase/functions/feedback/prompts/v1.txt, v2.txt… and record which version generated each answer: add prompt_version to ai_feedback JSON. Otherwise you can't tell whether v3 is better than v2.

11.8 Evaluation — the minimum viable eval loop

Golden set: evals/golden.jsonl — 30 real transcripts (anonymised), each with your own hand-written ideal JSON. Grow it to 100.

Automated checks (evals/run.js, run with node evals/run.js after every prompt change):

Valid JSON: 100% required
Banned words in output: 0 required
praise quotes something actually in the transcript: ≥ 90%
resay_sentence length 8–14 words: ≥ 90%
one_upgrade ≠ any of recent_upgrades: 100%
Latency p95 < 3 s

Human check (weekly, 20 min): pick 10 random answers from the last week, score each 1–5 on "would this make me want to speak again?" Track the average. That number matters more than any automated metric.

A/B, when you have >50 users: put prompt_version in events props for feedback_shown, and compare session_completed and post_session 👍 rate between versions.

Verify Phase 11: node evals/run.js passes all hard checks on the golden set; one real session produces a feedback object with prompt_version in it.

Phase 12 — Deploy and keep secrets secret
Secrets audit: search the repo (Ctrl/Cmd+Shift+F) for sk-, sk_, service_role, api-key. Nothing should match. If anything ever got committed, rotate the key immediately — deleting the commit is not enough.
Frontend: keep GitHub Pages (Settings → Pages → Deploy from branch main, folder /). Or move to Netlify (drag folder → done, better redirects for auth).
Add the live URL to Supabase → Authentication → URL Configuration and to Google OAuth origins (Phase 4.2).
Edge Functions: npx supabase functions deploy deploys all. Check logs at Supabase → Edge Functions → function → Logs.
Turn Confirm email back on (Phase 4.1).
Test on a real mid-range Android phone in Chrome, on mobile data, not Wi-Fi.
Appendix A — The daily loop once everything works
morning   → SQL: events funnel (Phase 9) + user_feedback avg
          → read 10 latest answers + ai_feedback → add edge cases
build     → change in Cursor → commit → push
          → schema change? migration + db push
          → prompt change? new version file + run evals
evening   → test on phone → deploy
Appendix B — Cheat sheet
Need	Command / click
New migration	npx supabase migration new <name> → edit → npx supabase db push
New Edge Function	npx supabase functions new <name> → npx supabase functions deploy <name>
Set a secret	npx supabase secrets set KEY=value
See DB errors	Supabase → Logs → Postgres
See function errors	Supabase → Edge Functions → name → Logs
Reset a test user	Authentication → Users → ⋯ → Delete user (cascades everything)
Ask Cursor about an error	Ctrl/Cmd+L → paste error → @ the file
Appendix C — What NOT to build yet

Group discussion (WebRTC), leaderboard, payments, n8n workflows, Bulbul TTS. Each one only makes sense after Phase 12 has 20+ real users completing sessions.