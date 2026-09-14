import { supabase } from "./supabase.js";

const DAILY_CAP = 20;
const SEED_BATCH = 40;
export const FLASH_SET_SIZE = 10;

export function shuffleWords(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function localISODate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(isoDate, days) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const dt = new Date(year, month - 1, day);
  dt.setDate(dt.getDate() + days);
  return localISODate(dt);
}

function intervalDays(timesSpoken) {
  if (timesSpoken <= 1) return 3;
  if (timesSpoken === 2) return 7;
  return 14;
}

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return { userId: null, error };
  const userId = data?.user?.id ?? null;
  if (!userId) return { userId: null, error: { message: "Not signed in" } };
  return { userId, error: null };
}

function profileWordLevels(level) {
  const key = String(level || "beginner").toLowerCase();
  if (key === "advanced") return [1, 2, 3, 4, 5];
  if (key === "intermediate") return [1, 2, 3];
  if (/^[1-5]$/.test(key)) return [Number(key)];
  return [1];
}

const USER_WORD_SELECT = `
  word_id,
  times_spoken,
  last_spoken_at,
  next_due,
  ease,
  words!inner (
    id,
    word,
    meaning,
    example,
    ipa,
    level,
    category
  )
`;

function flattenUserWord(row) {
  return {
    ...row.words,
    word_id: row.word_id,
    times_spoken: row.times_spoken,
    last_spoken_at: row.last_spoken_at,
    next_due: row.next_due,
    ease: row.ease,
  };
}

async function profileLevelFor(userId) {
  const { data } = await supabase.from("profiles").select("level").eq("id", userId).maybeSingle();
  return data?.level || "beginner";
}

async function fetchUserWordRows(userId) {
  return await supabase
    .from("user_words")
    .select(USER_WORD_SELECT)
    .eq("user_id", userId)
    .order("word_id", { ascending: true });
}

function isDueOrNew(row, today) {
  const spoken = row.times_spoken ?? 0;
  const due = String(row.next_due || "").slice(0, 10);
  return spoken === 0 || (due && due <= today);
}

export async function seedUserWords(userId, level) {
  const { data: existing, error: existingError } = await supabase
    .from("user_words")
    .select("word_id")
    .eq("user_id", userId);
  if (existingError) return { data: null, error: existingError };

  const have = new Set((existing ?? []).map((row) => row.word_id));
  const levels = profileWordLevels(level);
  let query = supabase.from("words").select("id").in("level", levels).order("id");
  if (have.size) query = query.not("id", "in", `(${[...have].join(",")})`);
  let { data: candidates, error: wordsError } = await query.limit(SEED_BATCH);
  if (wordsError) return { data: null, error: wordsError };

  if (!(candidates ?? []).length) {
    let fallback = supabase.from("words").select("id").order("id");
    if (have.size) fallback = fallback.not("id", "in", `(${[...have].join(",")})`);
    const again = await fallback.limit(SEED_BATCH);
    if (again.error) return { data: null, error: again.error };
    candidates = again.data;
  }

  const rows = (candidates ?? []).map((word) => ({
    user_id: userId,
    word_id: word.id,
    times_spoken: 0,
    next_due: localISODate(),
  }));
  if (!rows.length) return { data: [], error: null };

  return await supabase.from("user_words").insert(rows).select();
}

function mixNewAndDue(rows, cap, today) {
  const unseen = rows.filter((row) => (row.times_spoken ?? 0) === 0);
  const due = rows.filter((row) => (row.times_spoken ?? 0) > 0 && isDueOrNew(row, today));
  const newTake = Math.min(unseen.length, Math.ceil(cap / 2));
  const dueTake = Math.min(due.length, cap - newTake);
  const picked = [
    ...shuffleWords(unseen).slice(0, newTake),
    ...shuffleWords(due).slice(0, dueTake),
  ];
  const ids = new Set(picked.map((row) => row.word_id));
  for (const row of shuffleWords(rows)) {
    if (picked.length >= cap) break;
    if (!ids.has(row.word_id)) {
      picked.push(row);
      ids.add(row.word_id);
    }
  }
  return { picked, ids };
}

export async function getDueWords(limit = DAILY_CAP, excludeIds = []) {
  const { userId, error: authError } = await currentUserId();
  if (authError) return { data: null, error: authError };

  const cap = Math.max(0, Math.min(limit ?? DAILY_CAP, DAILY_CAP));
  const today = localISODate();
  const skip = new Set((excludeIds || []).map(String));
  const notShown = (row) => !skip.has(String(row.word_id ?? row.id));

  let { data, error } = await fetchUserWordRows(userId);
  if (error) return { data: null, error };

  let eligible = (data ?? []).filter((row) => isDueOrNew(row, today)).map(flattenUserWord).filter(notShown);
  if (eligible.length < cap) {
    const level = await profileLevelFor(userId);
    const seeded = await seedUserWords(userId, level);
    if (seeded.error) {
      console.error(seeded.error);
      return { data: null, error: seeded.error };
    }
    const again = await fetchUserWordRows(userId);
    if (again.error) return { data: null, error: again.error };
    data = again.data ?? [];
    eligible = data.filter((row) => isDueOrNew(row, today)).map(flattenUserWord).filter(notShown);
  } else {
    data = data ?? [];
  }

  const all = (data ?? []).map(flattenUserWord).filter(notShown);
  let { picked, ids } = mixNewAndDue(eligible, cap, today);

  if (picked.length < cap) {
    for (const row of all) {
      if (picked.length >= cap) break;
      if (!ids.has(row.word_id)) {
        picked.push(row);
        ids.add(row.word_id);
      }
    }
  }

  if (picked.length < cap) {
    const level = await profileLevelFor(userId);
    const extra = await seedUserWords(userId, level);
    if (extra.error) console.error(extra.error);
    const cycled = await fetchUserWordRows(userId);
    if (!cycled.error) {
      for (const row of (cycled.data ?? []).map(flattenUserWord)) {
        if (picked.length >= cap) break;
        if (!ids.has(row.word_id)) {
          picked.push(row);
          ids.add(row.word_id);
        }
      }
    }
  }

  return { data: picked.slice(0, cap), error: null };
}

export async function countSpokenWords() {
  const { userId, error: authError } = await currentUserId();
  if (authError) return { count: 0, error: authError };
  const { count, error } = await supabase
    .from("user_words")
    .select("word_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gt("times_spoken", 0);
  return { count: count ?? 0, error };
}

export async function markSpoken(wordId, spoken) {
  const { userId, error: authError } = await currentUserId();
  if (authError) return { data: null, error: authError };

  const { data: row, error: fetchError } = await supabase
    .from("user_words")
    .select("times_spoken")
    .eq("user_id", userId)
    .eq("word_id", wordId)
    .single();
  if (fetchError) return { data: null, error: fetchError };

  const timesSpoken = (row?.times_spoken ?? 0) + 1;
  const today = localISODate();
  const nextDue = spoken ? addDays(today, intervalDays(timesSpoken)) : addDays(today, 1);

  return await supabase
    .from("user_words")
    .update({
      times_spoken: timesSpoken,
      last_spoken_at: new Date().toISOString(),
      next_due: nextDue,
    })
    .eq("user_id", userId)
    .eq("word_id", wordId)
    .select()
    .single();
}
