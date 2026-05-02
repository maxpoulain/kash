import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/language-switcher";
import { PiggyBank, TrendingUp, Target, Shield, Sparkles } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  const t = await getTranslations("landing");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Navigation */}
      <header className="border-b border-border/50 bg-card/50 px-4 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-[10px] bg-primary text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.15)]">
              <PiggyBank className="size-6" />
            </div>
            <span className="font-display text-2xl font-semibold">Kash</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/login" className={buttonVariants({ variant: "ghost" })}>{t("signIn")}</Link>
            <Link href="/signup" className={buttonVariants()}>{t("getStarted")}</Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="mx-auto max-w-6xl px-4 py-20 md:py-32">
          <div className="text-center">
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              {t("heroTitle")}
              <span className="text-primary">{t("heroHighlight")}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              {t("heroDescription")}
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Link href="/signup" className={buttonVariants({ size: "lg" })}>{t("ctaPrimary")}</Link>
              <Link href="#features" className={buttonVariants({ variant: "outline", size: "lg" })}>{t("ctaSecondary")}</Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="border-t border-border bg-muted/30 px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h2 className="font-display text-3xl font-semibold text-foreground">
                {t("featuresTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {t("featuresSubtitle")}
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <Card className="border-border/50">
                <CardHeader>
                  <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <TrendingUp className="size-6" />
                  </div>
                  <CardTitle>{t("featureTrack.title")}</CardTitle>
                  <CardDescription>
                    {t("featureTrack.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {t("featureTrack.detail")}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-accent/15 text-accent">
                    <Target className="size-6" />
                  </div>
                  <CardTitle>{t("featureGoals.title")}</CardTitle>
                  <CardDescription>
                    {t("featureGoals.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {t("featureGoals.detail")}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-secondary/30 text-secondary-foreground">
                    <Sparkles className="size-6" />
                  </div>
                  <CardTitle>{t("featureHabits.title")}</CardTitle>
                  <CardDescription>
                    {t("featureHabits.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {t("featureHabits.detail")}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <Card className="flex-row items-center gap-8 p-8 md:p-12 border-border">
            <div className="flex-1">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Shield className="size-6" />
              </div>
              <h2 className="mt-4 font-display text-2xl font-semibold text-foreground">
                {t("trust.title")}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {t("trust.description")}
              </p>
            </div>
            <div className="flex gap-8 text-center">
              <div>
                <p className="font-display text-3xl font-bold text-primary">256-bit</p>
                <p className="text-sm text-muted-foreground">{t("trust.encryption")}</p>
              </div>
              <div>
                <p className="font-display text-3xl font-bold text-primary">100%</p>
                <p className="text-sm text-muted-foreground">{t("trust.privacy")}</p>
              </div>
            </div>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="border-t border-border px-4 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold text-foreground">
              {t("finalCta.title")}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t("finalCta.description")}
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link href="/signup" className={buttonVariants({ size: "lg" })}>{t("finalCta.createAccount")}</Link>
              <Link href="/login" className={buttonVariants({ variant: "outline", size: "lg" })}>{t("finalCta.contactSales")}</Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-[8px] bg-primary text-primary-foreground shadow-[inset_0_-2px_0_rgba(0,0,0,0.15)]">
                <PiggyBank className="size-5" />
              </div>
              <span className="font-display text-lg font-semibold">Kash</span>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {t("footer.copyright")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
