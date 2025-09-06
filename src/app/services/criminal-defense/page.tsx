import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Criminal Defense Lawyers in Pakistan | PTL",
  description:
    "Hire expert criminal defense lawyers in Pakistan for bail, FIR quash, trial defense, white-collar crimes, and appeals. Trusted legal services nationwide.",
  keywords:
    "criminal lawyer Pakistan, bail lawyer, FIR quash Pakistan, white-collar crime defense, criminal defense attorney Pakistan",
};

export default function CriminalDefense() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-10 text-gray-800">
      {/* Hero Section */}
      <section className="mb-10 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">
          Criminal Defense Lawyers in Pakistan
        </h1>
        <Image
          src="/criminal-defense-lawyers-pakistan.jpg"
          alt="Top criminal defense lawyers in Pakistan handling bail, FIR quash, and trial defense"
          width={1200}
          height={500}
          className="w-full h-auto object-cover rounded-md mb-6"
          placeholder="blur"
          blurDataURL="/criminal-defense-lawyers-pakistan.jpg"
          loading="lazy"
        />
        <p className="text-lg text-gray-600">
          Protect your rights with experienced lawyers for bail, trial defense,
          and appeals in Pakistan&apos;s criminal courts.
        </p>
      </section>

      {/* Overview Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-blue-900 mb-3">
          Expert Legal Defense in Criminal Cases
        </h2>
        <p className="leading-relaxed text-gray-700">
          Being accused of a crime can be overwhelming. At{" "}
          <strong>Pakistan&apos;s Top Lawyers (PTL)</strong>, our criminal
          defense team represents clients in police investigations, lower
          courts, and high courts.
        </p>
      </section>

      {/* Common Cases */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-blue-900 mb-3">
          Common Criminal Cases We Handle
        </h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Bail Applications (pre-arrest & post-arrest)</li>
          <li>FIR Quash & Police Complaints</li>
          <li>White-Collar & Financial Crimes</li>
          <li>Narcotics & Drug Offenses</li>
          <li>Property Fraud & Forgery</li>
          <li>Trial Defense & Appeals</li>
        </ul>
      </section>

      {/* Why Choose */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-blue-900 mb-3">
          Why Choose PTL for Criminal Defense?
        </h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Skilled defense lawyers with proven case results</li>
          <li>Representation in all major Pakistani courts</li>
          <li>Dedicated to protecting your rights & freedom</li>
          <li>Strong track record in both trial & appellate courts</li>
        </ul>
      </section>

      {/* Call to Action */}
      <section className="text-center">
        <Link
          href="/contact"
          className="inline-block px-6 py-3 bg-blue-900 text-white font-medium rounded-md hover:bg-blue-800 transition"
        >
          Speak to a Criminal Lawyer Now
        </Link>
      </section>
    </main>
  );
}
