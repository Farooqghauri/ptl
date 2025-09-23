import AboutAnimation from "../../components/AboutAnimation";

export const metadata = {
  title: "About Pakistan's Top Lawyers (PTL) | Best Lawyers in Pakistan & Overseas Legal Services",
  description:
    "Pakistan's Top Lawyers (PTL) connects you with the best lawyers in Karachi, Lahore, Islamabad, and all over Pakistan. PTL specializes in quality legal services for overseas Pakistanis, including family law, criminal defense, property disputes, and corporate law.",
  keywords:
    "Pakistan Top Lawyers, best lawyers Pakistan, legal services Pakistan, overseas Pakistani legal help, family lawyer Karachi, criminal lawyer Lahore, property lawyer Islamabad, corporate lawyer Pakistan, hire lawyer Pakistan, trusted lawyers Pakistan",
};

export default function AboutPage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-10 text-gray-800">
      <section className="mb-12 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">
          About Pakistan&apos;s Top Lawyers (PTL)
        </h1>
        <h2 className="text-xl font-semibold text-blue-800 mb-4">
          Connecting You with the Best Lawyers in Pakistan & Overseas Legal Services
        </h2>
        <div className="max-w-3xl mx-auto mb-6 text-left">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Our Story</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-3">
            <li>
              <span className="font-semibold">It all began with a vision:</span> PTL wanted every Pakistani—whether in Karachi, Lahore, Islamabad, or living overseas—to have easy access to the best lawyers in their city.
            </li>
            <li>
              <span className="font-semibold">We saw the challenges:</span> Families struggling with legal issues, businesses needing trusted advice, and overseas Pakistanis searching for reliable representation back home.
            </li>
            <li>
              <span className="font-semibold">PTL built a network:</span> Our organization carefully verified lawyers for expertise in family law, criminal defense, property disputes, and corporate matters.
            </li>
            <li>
              <span className="font-semibold">Today, PTL connects you:</span> Whether you need a <span className="text-blue-900 font-semibold">family lawyer in Karachi</span>, a <span className="text-blue-900 font-semibold">criminal lawyer in Lahore</span>, or a <span className="text-blue-900 font-semibold">property lawyer in Islamabad</span>, PTL is your bridge to quality legal services.
            </li>
            <li>
              <span className="font-semibold">Our promise:</span> Confidentiality, professionalism, and client satisfaction—making PTL the preferred choice for legal services in Pakistan and for overseas Pakistanis.
            </li>
          </ul>
        </div>

        {/* ✅ Lottie Animation */}
        <div className="flex justify-center items-center mt-10 mb-8">
          <div className="w-full max-w-xl h-[250px] md:h-[350px] rounded-3xl overflow-hidden bg-white shadow-lg">
            <AboutAnimation />
          </div>
        </div>

        <p className="text-sm text-gray-500 mt-4">
          PTL in action – connecting clients with trusted lawyers for family law, criminal defense, property disputes, and corporate legal matters across Pakistan and worldwide.
        </p>
      </section>
    </main>
  );
}