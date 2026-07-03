import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HealthBadge } from "@/components/health-badge";
import { Trajectory } from "@/components/trajectory";

const WIRED = [
  { label: "api", value: "NestJS 11 / Fastify" },
  { label: "db", value: "Drizzle + ULID keys" },
  { label: "auth", value: "Passport JWT" },
  { label: "workflow", value: "Comet 5-phase" },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-6 py-16">
      <header className="rise flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">
          CometKit · agentic starter
        </span>
        <HealthBadge />
      </header>

      <section className="rise rise-delay-1 mt-14">
        <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          Ship features on a{" "}
          <span className="text-primary">fixed trajectory</span>.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          A Turborepo scaffold wired for spec-driven agents. Every feature
          travels the same five phases — proposed, designed, built with TDD,
          verified against the gate, archived with its spec.
        </p>
        <div className="mt-8 flex gap-3">
          <Button asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/register">Create account</Link>
          </Button>
        </div>
      </section>

      <section className="rise rise-delay-2 mt-16">
        <Trajectory />
      </section>

      <footer className="rise rise-delay-2 mt-16 grid grid-cols-2 gap-x-8 gap-y-3 border-t border-border pt-6 sm:grid-cols-4">
        {WIRED.map((item) => (
          <div key={item.label}>
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {item.label}
            </div>
            <div className="mt-1 text-sm font-medium">{item.value}</div>
          </div>
        ))}
      </footer>
    </main>
  );
}
