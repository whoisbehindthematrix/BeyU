-- ===== Content =====

-- One row is a course a user can choose (interview, conversation, or bundle).
create table public.courses (
  id text primary key,                 -- 'interview','conversation','bundle'
  name text not null,
  price_monthly_inr int,
  is_default boolean default false
);

-- One row is a single day (1–30) inside a course.
create table public.course_days (
  id bigint generated always as identity primary key,
  course_id text references public.courses(id),
  day_number int not null check (day_number between 1 and 30),
  title text not null,
  theme text,
  unique (course_id, day_number)
);

-- One row is a speaking prompt on a course day (position 1, 2, or 3).
create table public.questions (
  id bigint generated always as identity primary key,
  course_day_id bigint references public.course_days(id) on delete cascade,
  position int not null,               -- 1,2,3
  prompt text not null,
  hint text,
  target_words text[]                  -- vocab this question is meant to surface
);

-- ===== Activity =====

-- One row is one practice sitting by a user on a course day.
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

-- One row is one spoken or typed reply to a question in a session.
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

-- One row is one vocabulary item in the word bank.
create table public.words (
  id bigint generated always as identity primary key,
  word text unique not null,
  meaning text,
  example text,
  ipa text,
  level int check (level between 1 and 5),
  category text                        -- 'interview','workplace','daily'
);

-- One row is one user's spaced-repetition state for one word.
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

-- One row is one user's progress for one calendar day.
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

-- One row is one piece of feedback the user sent about the app.
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

-- One row is one analytics event in a user's journey.
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

-- ===== RLS (handbook 5.4) =====

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
