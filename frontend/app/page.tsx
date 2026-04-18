import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PiggyBank, TrendingUp, Target, Shield, Sparkles } from "lucide-react";
import Link from "next/link";

export default function Home() {
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
          <div className="flex gap-3">
            <Link href="/login" className={buttonVariants({ variant: "ghost" })}>Sign In</Link>
            <Link href="/signup" className={buttonVariants()}>Get Started</Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="mx-auto max-w-6xl px-4 py-20 md:py-32">
          <div className="text-center">
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Save smarter,
              <span className="text-primary"> live better</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Track expenses, set savings goals, and build healthy financial habits with Kash.
              Your personal finance companion that makes saving fun.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Link href="/signup" className={buttonVariants({ size: "lg" })}>Start Saving Free</Link>
              <Link href="#features" className={buttonVariants({ variant: "outline", size: "lg" })}>Learn More</Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t border-border bg-muted/30 px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h2 className="font-display text-3xl font-semibold text-foreground">
                Everything you need to save
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Simple tools to help you take control of your finances
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <Card className="border-border/50">
                <CardHeader>
                  <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <TrendingUp className="size-6" />
                  </div>
                  <CardTitle>Track Spending</CardTitle>
                  <CardDescription>
                    See where your money goes with automatic categorization and insights
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Connect your accounts or add transactions manually. Get a clear picture of your spending habits.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-accent/15 text-accent">
                    <Target className="size-6" />
                  </div>
                  <CardTitle>Set Goals</CardTitle>
                  <CardDescription>
                    Save for what matters with personalized goals and progress tracking
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Whether it is a vacation, emergency fund, or new gadget, reach your goals faster.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-secondary/30 text-secondary-foreground">
                    <Sparkles className="size-6" />
                  </div>
                  <CardTitle>Build Habits</CardTitle>
                  <CardDescription>
                    Turn saving into a habit with streaks, achievements, and rewards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Stay motivated with gamified challenges that make finance management enjoyable.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="flex flex-col items-center gap-8 rounded-2xl bg-card p-8 ring-1 ring-border md:flex-row md:p-12">
            <div className="flex-1">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Shield className="size-6" />
              </div>
              <h2 className="mt-4 font-display text-2xl font-semibold text-foreground">
                Your data is safe with us
              </h2>
              <p className="mt-2 text-muted-foreground">
                Bank-level security with 256-bit encryption. We never sell your data and you can export or delete it anytime.
              </p>
            </div>
            <div className="flex gap-8 text-center">
              <div>
                <p className="font-display text-3xl font-bold text-primary">256-bit</p>
                <p className="text-sm text-muted-foreground">Encryption</p>
              </div>
              <div>
                <p className="font-display text-3xl font-bold text-primary">100%</p>
                <p className="text-sm text-muted-foreground">Private</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-border px-4 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold text-foreground">
              Ready to start saving?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join thousands of people who are taking control of their finances with Kash.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link href="/signup" className={buttonVariants({ size: "lg" })}>Create Free Account</Link>
              <Link href="/login" className={buttonVariants({ variant: "outline", size: "lg" })}>Contact Sales</Link>
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
              © 2025 Kash. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
