import Link from "next/link";

export const metadata = {
  title: "Legal Services in Pakistan | PTL",
  description:
    "Explore expert legal services in Pakistan including family law, criminal defense, property disputes, and corporate business law with verified lawyers.",
  keywords:
    "Pakistan lawyers, family lawyer Pakistan, divorce lawyer Karachi, criminal lawyer Lahore, property dispute Pakistan, corporate lawyer Islamabad, SECP compliance Pakistan",
};

const servicesList = [
  {
    name: "Family & Divorce",
    slug: "family-divorce",
    description: `Our family law experts handle divorce, child custody, guardianship, and maintenance cases with compassion and expertise. Whether you need a divorce lawyer in Karachi or a child custody lawyer in Lahore, PTL connects you with trusted legal professionals.`,
  },
  {
    name: "Criminal Defense",
    slug: "criminal-defense",
    description: `Facing criminal charges is stressful, but PTL ensures you have experienced defense lawyers on your side. From bail applications to white-collar crime defense, our lawyers protect your rights across Pakistan.`,
  },
  {
    name: "Property & Real Estate",
    slug: "property-real-estate",
    description: `Property disputes and inheritance issues are common in Pakistan. Our property lawyers assist with ownership disputes, transfers, DHA land issues, and fraud cases — ensuring your property rights are secure.`,
  },
  {
    name: "Corporate & Business",
    slug: "corporate-business",
    description: `Running a business requires legal compliance. PTL provides corporate law experts to help with SECP registration, taxation, contract drafting, and workplace law so your business grows smoothly.`,
  },
];

export default function Services() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-blue-900 mb-4">
        Our Legal Services in Pakistan
      </h1>
      <p className="text-gray-700 leading-relaxed mb-8">
        At <span className="font-semibold">Pakistan&apos;s Top Lawyers (PTL)</span>, 
        we connect you with verified and experienced lawyers across Pakistan. 
        From family disputes to corporate compliance, our platform helps you find 
        the right legal support for your case.
      </p>

      <ul className="space-y-8">
        {servicesList.map((service) => (
          <li key={service.slug} className="border-b pb-6">
            <h2 className="text-2xl font-semibold text-blue-900 mb-2">
              <Link
                href={`/services/${service.slug}`}
                className="hover:underline"
              >
                {service.name}
              </Link>
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              {service.description}
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
    </main>
  );
}
