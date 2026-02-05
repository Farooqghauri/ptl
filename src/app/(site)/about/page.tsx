"use client";

import AboutAnimation from "../../../components/AboutAnimation";
export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <section className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-300">
            About PTL
          </p>
          <h1 className="mt-3 text-4xl font-extrabold text-white sm:text-5xl">
            Built for Pakistan&apos;s Legal Professionals
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-slate-300">
            PTL is a legal technology platform that helps lawyers draft faster,
            research smarter, and deliver higher quality work. Our tools are
            designed around Pakistani law and local court practice.
          </p>
        </section>

        <div className="my-12 flex items-center justify-center">
          <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 shadow-2xl shadow-black/40">
            <AboutAnimation />
          </div>
        </div>

        <section className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8">
            <h2 className="text-2xl font-bold text-white">Our Mission</h2>
            <p className="mt-4 text-slate-300">
              Empower Pakistani legal professionals with tools that reduce
              manual work, improve accuracy, and create consistent outcomes.
              PTL blends legal expertise with modern AI to support daily
              practice without replacing human judgment.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8">
            <h2 className="text-2xl font-bold text-white">Our Vision</h2>
            <p className="mt-4 text-slate-300">
              We aim to modernize legal practice across Pakistan by making AI a
              trusted assistant for drafting, research, and review. Our goal is
              to help firms serve clients faster and with greater confidence.
            </p>
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-8">
          <h2 className="text-2xl font-bold text-white">Why PTL</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                title: "Local Legal Focus",
                desc: "Designed for Pakistan&apos;s statutes, formats, and courtroom practice.",
              },
              {
                title: "Security First",
                desc: "Your drafts and research remain private and professional.",
              },
              {
                title: "Reliable Output",
                desc: "Templates and validation layers keep results consistent.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

