export const metadata = {
  title: "PTL Pricing | Pakistan's Top Lawyers",
  description:
    "Simple pricing for PTL AI legal tools. Choose Free, Normal, or Pro plans for Pakistani legal workflows.",
};

const plans = [
  {
    name: "Free",
    price: "PKR 0",
    cadence: "month",
    summary: "Try core tools with limited usage.",
    features: [
      "3 total tool uses",
      "Access to Legal Drafter",
      "Case Summarizer and Research",
      "Basic support",
    ],
  },
  {
    name: "Normal",
    price: "PKR 500",
    cadence: "month",
    summary: "For solo lawyers and small firms.",
    features: [
      "10 requests per day per tool",
      "All working AI tools",
      "Priority turnaround",
      "Email support",
    ],
    highlight: true,
  },
  {
    name: "Pro",
    price: "PKR 1200",
    cadence: "month",
    summary: "For high-volume legal teams.",
    features: [
      "Unlimited usage",
      "All working AI tools",
      "Team-ready workflows",
      "Priority support",
    ],
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <section className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-300">
            Pricing
          </p>
          <h1 className="mt-3 text-4xl font-extrabold text-white sm:text-5xl">
            Simple Pricing for Legal Professionals
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
            Choose the plan that matches your workflow. Upgrade any time as your
            practice grows.
          </p>
        </section>

        <section className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 shadow-xl shadow-black/20 ${
                plan.highlight
                  ? "border-blue-500/60 bg-slate-900/80"
                  : "border-slate-800 bg-slate-900/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">{plan.name}</h2>
                {plan.highlight && (
                  <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-200">
                    Most Popular
                  </span>
                )}
              </div>
              <p className="mt-4 text-3xl font-extrabold text-white">
                {plan.price}
                <span className="text-sm font-medium text-slate-400">/{plan.cadence}</span>
              </p>
              <p className="mt-3 text-sm text-slate-300">{plan.summary}</p>
              <div className="mt-6 space-y-2 text-sm text-slate-300">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-blue-400" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className={`mt-6 w-full rounded-xl px-5 py-3 font-semibold transition ${
                  plan.highlight
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500"
                    : "border border-slate-700 text-slate-200 hover:border-slate-500 hover:text-white"
                }`}
              >
                Get Started
              </button>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
