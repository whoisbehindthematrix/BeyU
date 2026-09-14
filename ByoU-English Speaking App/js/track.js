import { supabase } from "./supabase.js";

let currentSessionId = null;

export function setSession(id) {
  currentSessionId = id ?? null;
}

function sendGtag(name, props = {}) {
  const gtagFn = typeof window !== "undefined" ? window.gtag : undefined;
  if (typeof gtagFn !== "function") return;
  if (name === "app_open") gtagFn("event", "session_start");
  else if (name === "login_success") gtagFn("event", "login", { method: props.provider });
  else if (name === "course_selected") gtagFn("event", "select_content", { content_type: "course", content_id: props.course_id });
  else if (name === "session_completed") gtagFn("event", "level_up", { level: props.day_number });
  else if (name === "mic_permission") gtagFn("event", "mic_permission", { result: props.result });
  else if (name === "feedback_shown") gtagFn("event", "feedback_shown", { latency_ms: props.latency_ms });
  else gtagFn("event", name, props);
}

export function track(name, props = {}) {
  try { sendGtag(name, props); } catch { /* ignore */ }
  Promise.resolve()
    .then(async () => {
      const { data } = await supabase.auth.getUser();
      await supabase.from("events").insert({
        user_id: data?.user?.id ?? null,
        session_id: currentSessionId,
        name,
        props,
      });
    })
    .catch(() => {});
}
