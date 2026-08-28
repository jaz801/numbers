import { audience, initials } from "@/data/audience";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16 sm:py-24">
      <header className="mb-10">
        <p className="text-xs font-mono uppercase tracking-widest text-black/50 dark:text-white/50">
          Demo
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Audience
        </h1>
        <p className="mt-3 text-sm text-black/60 dark:text-white/60">
          {audience.length} people. Hard-coded for the proof of concept — no
          database yet.
        </p>
      </header>

      <ul className="divide-y divide-black/10 rounded-xl border border-black/10 dark:divide-white/10 dark:border-white/15">
        {audience.map((member) => (
          <li key={member.id} className="flex items-center gap-4 p-4">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-black/5 text-sm font-medium text-black/70 dark:bg-white/10 dark:text-white/70"
            >
              {initials(member.name)}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-medium">{member.name}</span>
              <a
                href={`mailto:${member.email}`}
                className="block truncate text-sm text-black/60 underline-offset-4 hover:underline dark:text-white/60"
              >
                {member.email}
              </a>
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
