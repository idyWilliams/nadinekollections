

export async function logTryOnSession(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  data: {
    userId?: string | null;
    guestId?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mannequinSettings: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    products: any[];
    imageUrl: string;
    prompt: string;
    engine: string;
  }
) {
  return await supabase
    .from("try_on_sessions")
    .insert({
      user_id: data.userId,
      guest_id: data.guestId,
      mannequin_settings: data.mannequinSettings,
      products: data.products,
      generated_image_url: data.imageUrl,
      prompt_used: data.prompt,
      engine_used: data.engine,
    })
    .select()
    .single();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function checkRateLimit(supabase: any, identifier: { userId?: string; guestId?: string }): Promise<boolean> {
  const { userId, guestId } = identifier;

  // If user is logged in, unlimited access (or higher limit)
  if (userId) return true;

  // For guests, limit to 5 tries per 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from("try_on_sessions")
    .select("*", { count: "exact", head: true })
    .eq("guest_id", guestId)
    .gte("created_at", oneDayAgo);

  if (error) {
    console.error("Rate limit check error:", error);
    return true; // Fail open if DB error
  }

  return (count || 0) < 5;
}
