import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PiggyBank, TrendingUp, Target, Wallet, Sparkles, Gift, Home } from "lucide-react";
import Link from "next/link";

export default function DesignSystemPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Navigation */}
      <header className="border-b border-border/50 bg-card/50 px-4 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <PiggyBank className="size-6" />
            </div>
            <span className="font-display text-2xl font-semibold">Kash</span>
          </div>
          <div className="flex gap-3">
            <Link href="/">
              <Button variant="ghost" className="gap-2">
                <Home className="size-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
              <Sparkles className="size-4 text-accent" />
              <span>Design System v1.0</span>
            </div>

            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              PiggyBank Finance
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              A gamified personal finance management application. Combining playful aesthetics
              with professional functionality, inspired by the timeless piggy bank tradition of saving.
            </p>

            {/* Feature Tags */}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary/50 px-4 py-2 text-sm text-secondary-foreground">
                <TrendingUp className="size-4" />
                <span>Growth Focused</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm">
                <span className="text-primary">●</span>
                <span>Secure & Trusted</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-accent/30 px-4 py-2 text-sm text-accent-foreground">
                <Gift className="size-4" />
                <span>Gamified Savings</span>
              </div>
            </div>
          </div>
        </section>

        {/* Color Palette Section */}
        <section className="border-y border-border bg-muted/30 px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-display text-2xl font-semibold text-foreground">Color Palette</h2>
            <p className="mt-2 text-muted-foreground">
              Our color system balances playfulness with professionalism
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Primary - Coral Pink */}
              <Card>
                <div className="h-24 rounded-t-xl bg-primary" />
                <CardContent className="pt-4">
                  <p className="font-medium text-foreground">Primary</p>
                  <p className="text-sm text-muted-foreground">Coral Pink - Piggy Bank</p>
                  <p className="mt-1 text-xs text-muted-foreground">Brand, CTAs, highlights</p>
                </CardContent>
              </Card>

              {/* Secondary - Soft Mint */}
              <Card>
                <div className="h-24 rounded-t-xl bg-secondary" />
                <CardContent className="pt-4">
                  <p className="font-medium text-foreground">Secondary</p>
                  <p className="text-sm text-muted-foreground">Soft Mint - Growth</p>
                  <p className="mt-1 text-xs text-muted-foreground">Success, income indicators</p>
                </CardContent>
              </Card>

              {/* Accent - Golden Yellow */}
              <Card>
                <div className="h-24 rounded-t-xl bg-accent" />
                <CardContent className="pt-4">
                  <p className="font-medium text-foreground">Accent</p>
                  <p className="text-sm text-muted-foreground">Golden Yellow - Wealth</p>
                  <p className="mt-1 text-xs text-muted-foreground">Coins, rewards, achievements</p>
                </CardContent>
              </Card>

              {/* Destructive - Warm Red */}
              <Card>
                <div className="h-24 rounded-t-xl bg-destructive" />
                <CardContent className="pt-4">
                  <p className="font-medium text-foreground">Destructive</p>
                  <p className="text-sm text-muted-foreground">Warm Red - Alert</p>
                  <p className="mt-1 text-xs text-muted-foreground">Expenses, warnings, errors</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-2xl font-semibold text-foreground">Features</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <Card className="border-border/50">
              <CardHeader>
                <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Wallet className="size-6" />
                </div>
                <CardTitle>Playful Yet Professional</CardTitle>
                <CardDescription>
                  We balance whimsy with trust. The piggy bank theme adds warmth while maintaining professionalism.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Every interaction feels approachable and friendly.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-accent/20 text-accent-foreground">
                  <Target className="size-6" />
                </div>
                <CardTitle>Gamification at Core</CardTitle>
                <CardDescription>
                  Every interaction is an opportunity for engagement. Progress bars, achievements, and rewards.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Transform financial management into an enjoyable journey.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-secondary/30 text-secondary-foreground">
                  <TrendingUp className="size-6" />
                </div>
                <CardTitle>Clarity Through Design</CardTitle>
                <CardDescription>
                  Complex financial data presented through intuitive visualizations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Charts, graphs, and progress indicators make insights accessible.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Component Demo Section */}
        <section className="border-t border-border bg-muted/30 px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-display text-2xl font-semibold text-foreground">Component Demo</h2>
            <p className="mt-2 text-muted-foreground">Interactive elements with rounded, friendly styling</p>

            <div className="mt-8 grid gap-8 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Buttons</CardTitle>
                  <CardDescription>Various button styles and sizes</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  <Button>Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="accent">Accent</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Form Elements</CardTitle>
                  <CardDescription>Input fields with rounded corners</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="Enter your email" />
                  <Input placeholder="Password" type="password" />
                  <div className="flex gap-3">
                    <Button className="w-full">Subscribe</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <PiggyBank className="size-5" />
              </div>
              <span className="font-display text-lg font-semibold">Kash</span>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              © 2025 Kash. PiggyBank Finance Design System.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
