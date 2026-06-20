import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash.includes("type=recovery") || hash.includes("access_token")) setReady(true);
    else supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="bg-gradient-hero flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="glass-strong w-full max-w-md space-y-4 rounded-2xl p-8 shadow-elegant">
        <h1 className="font-display text-2xl font-bold">Set new password</h1>
        {!ready ? (
          <p className="text-sm text-muted-foreground">Open this page from the reset link in your email.</p>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="pw">New password</Label>
              <Input id="pw" type="password" minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} required />
            </div>
            <Button variant="hero" className="w-full" disabled={loading}>Update password</Button>
          </>
        )}
      </form>
    </div>
  );
}
