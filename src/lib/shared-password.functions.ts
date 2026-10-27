import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const applySharedPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: admin, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (roleError || !admin) throw new Error("Akses ditolak.");
    const { data: account, error: accountError } = await context.supabase.auth.getUser();
    if (accountError || account.user?.email !== "endahp.jkt@gmail.com") throw new Error("Akun bersama tidak sesuai.");
    const password = process.env['SHARED_ACCOUNT_PASSWORD'];
    if (!password) throw new Error("Sandi belum tersedia.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(context.userId, { password });
    return { ok: !error };
  });