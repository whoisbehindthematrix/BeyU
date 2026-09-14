import { supabase } from "./supabase.js";
import { getUser } from "./auth.js";

export async function submitFeedback({ sessionId, kind, rating, comment }) {
  const { data, error } = await getUser();
  if (error) return { data: null, error };
  const user = data?.user;
  if (!user?.id) return { data: null, error: { message: "Not signed in" } };
  return await supabase.from("user_feedback").insert({
    user_id: user.id,
    session_id: sessionId ?? null,
    kind,
    rating: rating ?? null,
    comment: comment ?? null,
  });
}
