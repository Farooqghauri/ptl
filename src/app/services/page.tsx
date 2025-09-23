import Link from "next/link";
import ServicesAnimation from "../../components/ServicesAnimation";

export const metadata = {
  title: "Legal Services in Pakistan | PTL",
  description:
    "Find expert lawyers in Pakistan for family law, criminal defense, property disputes, and corporate business. PTL connects you with trusted legal professionals in Karachi, Lahore, Islamabad, and nationwide.",
  keywords:
    "Pakistan lawyers, family lawyer Karachi, divorce lawyer Lahore, criminal lawyer Islamabad, property lawyer Pakistan, corporate lawyer, legal services Pakistan, SECP compliance, business law, child custody, inheritance, bail, legal advice",
};

const servicesList = [
  {
    name: "Family & Divorce Lawyers",
    slug: "family-divorce",
    description: `PTL offers expert family law services including divorce, child custody, guardianship, khula, and maintenance cases. Our lawyers in Karachi, Lahore, Islamabad, and other cities provide compassionate legal support for families.`,
    details: `We help with marriage registration, child adoption, domestic violence cases, and family mediation. Our family lawyers ensure your rights are protected in all Pakistani courts.`
  },
  {
    name: "Criminal Defense Lawyers",
    slug: "criminal-defense",
    description: `Facing criminal charges? PTL connects you with experienced criminal defense lawyers for bail, FIR registration, trial representation, and appeals. Our network covers Karachi, Lahore, Islamabad, and nationwide.`,
    details: `We handle cases involving theft, fraud, cybercrime, narcotics, anti-terrorism, and white-collar crime. Our lawyers protect your rights and provide strategic defense at every stage.`
  },
  {
    name: "Property & Real Estate Lawyers",
    slug: "property-real-estate",
    description: `Resolve property disputes, inheritance issues, and land transfers with PTL’s property lawyers. We assist with ownership verification, mutation, DHA land issues, and fraud cases across Pakistan.`,
    details: `Our legal experts help with property registration, succession certificates, and real estate contracts. Get reliable advice for property matters in Karachi, Lahore, Islamabad, and other regions.`
  },
  {
    name: "Corporate & Business Lawyers",
    slug: "corporate-business",
    description: `PTL provides corporate law services for SECP registration, business contracts, taxation, labor law, and regulatory compliance. Our lawyers support startups and established companies throughout Pakistan.`,
    details: `We assist with company formation, partnership agreements, intellectual property, workplace law, and dispute resolution. Grow your business with PTL’s legal expertise.`
  },
];

const faqs = [
  {
    question: "How do I find the best lawyer in Pakistan?",
    answer: "PTL connects you with verified and experienced lawyers in Karachi, Lahore, Islamabad, and all major cities. Search by legal service or location to find the right lawyer for your case."
  },
  {
    question: "Can PTL help overseas Pakistanis with legal issues?",
    answer: "Yes, PTL specializes in helping overseas Pakistanis with property disputes, family law, and business matters. Contact us for remote legal consultations and representation."
  },
  {
    question: "What types of cases do PTL lawyers handle?",
    answer: "Our lawyers handle family law, criminal defense, property disputes, corporate law, inheritance, child custody, bail, and more. Visit our service pages for details."
  },
  {
    question: "How do I contact PTL for legal advice?",
    answer: "You can contact us through our online form, WhatsApp, or phone. Visit our Contact page for details and get a free initial consultation."
  },
];

export default function Services() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">
        Legal Services in Pakistan – Find Trusted Lawyers
      </h1>
      <p className="text-gray-700 leading-relaxed mb-4">
        <span className="font-semibold">Pakistan&apos;s Top Lawyers (PTL)</span> is your reliable platform for finding the best lawyers in Pakistan. We connect individuals, families, and businesses with verified legal professionals for all types of cases. Whether you need a family lawyer in Karachi, a criminal defense attorney in Lahore, or a property lawyer in Islamabad, PTL is here to help.
      </p>
      <p className="text-gray-700 leading-relaxed mb-8">
        Our network covers all major cities and regions, offering expert legal advice, representation, and support. We specialize in family law, criminal defense, property disputes, and corporate business law. PTL ensures transparency, confidentiality, and professionalism in every case. <Link href="/contact" className="text-blue-700 hover:underline">Contact us</Link> for a free consultation.
      </p>

      {/* Animation Section */}
      <div className="flex justify-center mb-12">
        <ServicesAnimation />
      </div>

      <h2 className="text-2xl font-bold text-blue-900 mb-6">Our Practice Areas</h2>
      <ul className="space-y-12">
        {servicesList.map((service) => (
          <li key={service.slug} className="border-b pb-8">
            <h3 className="text-xl font-semibold text-blue-900 mb-2">
              <Link
                href={`/services/${service.slug}`}
                className="hover:underline"
              >
                {service.name}
              </Link>
            </h3>
            <p className="text-gray-700 leading-relaxed mb-2">
              {service.description}
            </p>
            <p className="text-gray-600 leading-relaxed mb-2">
              {service.details}
            </p>
            <Link
              href={`/services/${service.slug}`}
              className="text-blue-700 font-medium hover:underline"
            >
              Learn more &rarr;
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-12">
        <h2 className="text-xl font-bold text-blue-900 mb-4">Frequently Asked Questions</h2>
        <ul className="space-y-6">
          {faqs.map((faq, idx) => (
            <li key={idx}>
              <h4 className="font-semibold text-blue-800">{faq.question}</h4>
              <p className="text-gray-700">{faq.answer}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-12 text-center">
        <h2 className="text-xl font-bold text-blue-900 mb-2">Contact Pakistan&apos;s Top Lawyers</h2>
        <p className="text-gray-700 mb-4">
          Need legal advice or representation? <Link href="/contact" className="text-blue-700 hover:underline">Contact us</Link> today for a free consultation with Pakistan&apos;s leading lawyers.
        </p>
        <Link
          href="/contact"
          className="inline-block bg-blue-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition"
        >
          Get Legal Help
        </Link>
      </div>
    </main>
  );
}