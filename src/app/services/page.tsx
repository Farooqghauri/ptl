import Link from "next/link";

export const metadata = {
  title: "Legal Services in Pakistan | PTL",
  description:
    "Explore the legal services offered by Pakistan's Top Lawyers, including family law, criminal law, property disputes, and more.",
};

const servicesList = [
  { name: "Family & Divorce", slug: "family-divorce" },
  { name: "Criminal Defense", slug: "criminal-defense" },
  { name: "Property & Real Estate", slug: "property-real-estate" },
  { name: "Corporate & Business", slug: "corporate-business" },
];

export default function Services() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-blue-900 mb-4">Our Services</h1>
      <p className="text-gray-700 leading-relaxed mb-6">
        Pakistan&apos;s Top Lawyers offers a wide range of legal services to help you with any case.
        Click on a service below to learn more.
      </p>
      <ul className="space-y-3">
        {servicesList.map((service) => (
          <li key={service.slug}>
            <Link
              href={`/services/${service.slug}`}
              className="text-blue-900 font-medium hover:underline"
            >
              {service.name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
