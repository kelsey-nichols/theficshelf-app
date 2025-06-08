import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  // Initialize an *admin* Supabase client
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) {
    console.error("Admin deleteUser error:", error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true });
}