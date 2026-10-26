import { Link } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";

const stats = [
  { value: "10K+", label: "Developer Profiles" },
  { value: "25K+", label: "Connections Made" },
  { value: "6K+", label: "Tech Posts Shared" },
  { value: "24/7", label: "Collaboration Flow" },
];

const features = [
  {
    title: "Developer Profiles",
    description:
      "Show your headline, skills, projects, tech stack, and availability in one clean profile.",
  },
  {
    title: "Post And Share",
    description:
      "Publish updates, code snippets, images, and repost useful developer content from your network.",
  },
  {
    title: "Connect Smarter",
    description:
      "Explore developers, send requests, follow people, and build the right collaboration circle.",
  },
  {
    title: "Real-Time Chat",
    description:
      "Chat instantly with accepted connections, see message status, and stay active with live presence.",
  },
];

const steps = [
  {
    number: "01",
    title: "Build Your Profile",
    description: "Add your bio, projects, skills, links, and the tech stack you want to be known for.",
  },
  {
    number: "02",
    title: "Discover Developers",
    description: "Search and explore people by headline, skills, and availability to find your kind of builders.",
  },
  {
    number: "03",
    title: "Connect, Post, And Chat",
    description: "Grow your network, share ideas, and start real conversations around development work.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen overflow-hidden bg-dark-900 text-slate-900">
      <div className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(217,246,227,0.95),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(227,223,255,0.72),_transparent_28%),linear-gradient(180deg,_rgba(250,252,249,0.98),_rgba(244,247,244,1))]" />
        <div className="absolute left-[-8rem] top-24 h-72 w-72 rounded-full bg-emerald-200/55 blur-3xl" />
        <div className="absolute right-[-6rem] top-64 h-80 w-80 rounded-full bg-violet-200/45 blur-3xl" />

        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          <header className="rounded-3xl border border-white/70 bg-white/88 px-5 py-4 shadow-[0_20px_60px_rgba(148,163,184,0.12)] backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-2xl font-semibold tracking-tight text-slate-950">DevNetwork</p>
                <p className="text-sm text-slate-500">The social platform built for developers</p>
              </div>

              <div className="flex items-center gap-3">
                <ThemeToggle compact />
                <Link
                  to="/login"
                  className="rounded-full border border-emerald-100 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand-500 hover:text-slate-950"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(34,197,94,0.24)] transition hover:bg-brand-600"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </header>

          <main className="flex-1 pt-14 lg:pt-20">
            <section>
              <div className="mx-auto max-w-4xl text-center">
                <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">
                  Build Your Developer Circle
                </span>
                <h1 className="mt-6 text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
                  One place to show your work, find developers, and start real tech conversations.
                </h1>
                <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                  DevNetwork helps developers create strong profiles, share posts, connect with the right people,
                  and chat in real time around projects, learning, and collaboration.
                </p>

                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  <Link
                    to="/signup"
                    className="rounded-2xl bg-brand-500 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(34,197,94,0.22)] transition hover:bg-brand-600"
                  >
                    Create Your Account
                  </Link>
                  <Link
                    to="/login"
                    className="rounded-2xl border border-emerald-100 bg-white/85 px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-[0_12px_28px_rgba(148,163,184,0.08)] transition hover:border-brand-500 hover:text-slate-950"
                  >
                    Explore Your Network
                  </Link>
                </div>
              </div>

              <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {features.map((feature, index) => (
                  <article
                    key={feature.title}
                    className="rounded-[1.75rem] border border-white/75 bg-white/80 p-6 shadow-[0_18px_46px_rgba(148,163,184,0.14)] backdrop-blur"
                  >
                    <div className="flex items-center gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-sm font-semibold text-emerald-600">
                        0{index + 1}
                      </span>
                      <h2 className="text-lg font-semibold text-slate-900">{feature.title}</h2>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-600">{feature.description}</p>
                  </article>
                ))}
              </div>

              <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((item, index) => (
                  <div
                    key={item.label}
                    className={`rounded-2xl border p-5 text-center shadow-[0_16px_40px_rgba(148,163,184,0.1)] backdrop-blur ${
                      index % 2 === 0
                        ? "border-emerald-100 bg-emerald-50/70"
                        : "border-violet-100 bg-violet-50/65"
                    }`}
                  >
                    <p className="text-3xl font-semibold text-slate-900">{item.value}</p>
                    <p className="mt-2 text-sm text-slate-600">{item.label}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-24">
              <div className="text-center">
                <h2 className="text-4xl font-semibold tracking-tight text-slate-950">
                  How <span className="text-emerald-600">DevNetwork</span> Works
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
                  A simple flow for developers who want to present themselves well, build meaningful connections,
                  and collaborate faster.
                </p>
              </div>

              <div className="mt-12 grid gap-6 lg:grid-cols-3">
                {steps.map((step) => (
                  <article
                    key={step.number}
                    className="rounded-[2rem] border border-white/70 bg-white/84 p-8 shadow-[0_18px_42px_rgba(148,163,184,0.15)] backdrop-blur"
                  >
                    <p className="text-5xl font-semibold leading-none text-emerald-500">{step.number}</p>
                    <h3 className="mt-8 text-2xl font-semibold text-slate-950">{step.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-slate-600">{step.description}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="mt-24 rounded-[2rem] border border-white/75 bg-[linear-gradient(135deg,rgba(240,253,244,0.95),rgba(255,255,255,0.92),rgba(243,232,255,0.72))] px-6 py-10 text-center shadow-[0_22px_52px_rgba(148,163,184,0.16)] sm:px-10">
              <h2 className="text-3xl font-semibold text-slate-950 sm:text-4xl">
                Start building your developer presence today.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Create your profile, share what you know, find other developers, and grow a network that is built for real work.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link
                  to="/signup"
                  className="rounded-2xl bg-brand-500 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-600"
                >
                  Join DevNetwork
                </Link>
                <Link
                  to="/login"
                  className="rounded-2xl border border-emerald-100 bg-white/85 px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-brand-500 hover:text-slate-950"
                >
                  Already have an account?
                </Link>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
