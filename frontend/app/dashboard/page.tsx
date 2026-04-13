import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Welcome to your dashboard</h1>
      <p className="text-muted-foreground">{user.email}</p>
      <form action="/auth/signout" method="post">
        <Button variant="outline" type="submit">Sign out</Button>
      </form>
    </div>
  );
}
