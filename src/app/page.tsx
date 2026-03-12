import Link from 'next/link'
import AnimatedHeroLogo from '@/components/AnimatedHeroLogo'

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(167,139,250,0.18),_transparent_30%)]" />
      <div className="absolute left-10 top-16 h-32 w-32 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute bottom-12 right-12 h-40 w-40 rounded-full bg-violet-400/10 blur-3xl" />

      <section className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid w-full gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-slate-900/70 px-4 py-2 text-sm text-cyan-200 shadow-[0_0_30px_rgba(34,211,238,0.08)] backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              AI-powered CV to Job Match Analysis
            </div>

            <h1 className="max-w-2xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Make every application feel like a
              <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-400 bg-clip-text text-transparent">
                {' '}
                smarter fit
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              JobFit.AI compares your CV against a job description, detects alignment and missing skills,
              and gives you a clearer picture of how strong your application really is.
            </p>

            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row lg:items-start">
              <Link
                href="/analyze"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-violet-500 px-7 py-3 font-semibold text-slate-950 transition hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(56,189,248,0.35)]"
              >
                Start Matching
              </Link>
              <div className="rounded-full border border-slate-700 bg-slate-900/70 px-5 py-3 text-sm text-slate-300 backdrop-blur">
                CV parsing, fit scoring, skill-gap detection
              </div>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 backdrop-blur">
                <div className="text-2xl font-bold text-cyan-300">CV</div>
                <p className="mt-2 text-sm text-slate-400">Extract strengths and experience from your resume.</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 backdrop-blur">
                <div className="text-2xl font-bold text-violet-300">JD</div>
                <p className="mt-2 text-sm text-slate-400">Understand role needs, tools, and required skills.</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 backdrop-blur">
                <div className="text-2xl font-bold text-slate-100">AI Fit</div>
                <p className="mt-2 text-sm text-slate-400">See your match score and what to improve next.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="rounded-[32px] border border-slate-800 bg-slate-900/60 p-4 shadow-[0_0_60px_rgba(15,23,42,0.65)] backdrop-blur-xl sm:p-6">
              <AnimatedHeroLogo />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
