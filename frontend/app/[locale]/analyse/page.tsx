import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AnalyseClient } from "./analyse-client";

export default async function AnalysePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <AnalyseClient />;
}
