"use client";

export default function TopLawyersPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <section className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-300">
            Top Lawyers
          </p>
          <h1 className="mt-3 text-4xl font-extrabold text-white sm:text-5xl">
            Find Trusted Legal Professionals
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-slate-300">
            PTL connects you with vetted lawyers across Pakistan. We review
            experience, specialization, and client feedback to help you choose
            the right advocate for your matter.
          </p>
        </section>

        <section className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/60 p-8">
          <h2 className="text-2xl font-bold text-white">How It Works</h2>
          <div className="mt-6 space-y-3 text-sm text-slate-300">
            <div>Share your case details and preferred city.</div>
            <div>We shortlist lawyers who match your requirements.</div>
            <div>Book a consultation directly with the selected lawyer.</div>
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-8">
          <h2 className="text-2xl font-bold text-white">Need a Recommendation?</h2>
          <p className="mt-4 text-slate-300">
            Tell us about your legal issue and we will connect you with the
            most suitable lawyer for your case.
          </p>
          <div className="mt-6">
            <a
              href="/hire-a-top-lawyer"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500"
            >
              Request a Lawyer
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
