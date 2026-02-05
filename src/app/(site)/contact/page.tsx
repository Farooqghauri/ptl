export const metadata = {
  title: "Contact Pakistan's Top Lawyers",
  description:
    "Get in touch with Pakistan's Top Lawyers. Contact us for legal consultations, queries, and lawyer connections.",
};

export default function Contact() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <section className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-300">
            Contact
          </p>
          <h1 className="mt-3 text-4xl font-extrabold text-white sm:text-5xl">
            Let&apos;s Talk About Your Legal Needs
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
            Share your question and we will connect you with the right legal
            professional or guide you to the right tool.
          </p>
        </section>

        <section className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8">
            <h2 className="text-2xl font-bold text-white">Contact Details</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <div>Pakistan&apos;s Top Lawyers</div>
              <div>support@pakistantoplawyers.com</div>
              {/* <div>+92 300 0000000</div> */}
              <div>Lahore, Pakistan</div>
            </div>
            <p className="mt-6 text-sm text-slate-400">
              Office hours: Mon-Sat, 10:00 AM - 7:00 PM (PKT)
            </p>
          </div>

          <form className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-200">Name</label>
              <input
                type="text"
                placeholder="Your full name"
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-200">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-200">Message</label>
              <textarea
                placeholder="Tell us briefly about your legal requirement"
                rows={5}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500"
            >
              Send Message
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

