import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Family & Divorce Lawyers in Pakistan | PTL",
  description:
    "Expert family and divorce lawyers in Pakistan. We handle divorce, khula, child custody, maintenance, inheritance, and more. Trusted nationwide legal services.",
  keywords:
    "family lawyer Pakistan, divorce lawyer Pakistan, khula lawyer, child custody Pakistan, family law attorney, inheritance disputes Pakistan",
};

export default function FamilyDivorce() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-10 text-gray-800">
      {/* Hero Section */}
      <section className="mb-10 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">
          Family & Divorce Lawyers in Pakistan
        </h1>
        <Image
          src="/family-divorce-lawyers-pakistan.jpg"
          alt="Expert family and divorce lawyers in Pakistan handling divorce, khula, and child custody cases"
          width={1200}
          height={500}
          className="w-full h-auto object-cover rounded-md mb-6"
          placeholder="blur"
          blurDataURL="/family-divorce-lawyers-pakistan.jpg"
          loading="lazy"
        />
        <p className="text-lg text-gray-600">
          Get expert legal advice and representation for divorce, khula, child
          custody, maintenance, and family disputes across Pakistan.
        </p>
      </section>

      {/* Overview Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-blue-900 mb-3">
          Understanding Family & Divorce Law
        </h2>
        <p className="leading-relaxed text-gray-700">
          Family matters are often complex and emotional. At{" "}
          <strong>Pakistan&apos;s Top Lawyers (PTL)</strong>, our experienced
          family law attorneys provide professional guidance in cases of divorce
          (including mutual divorce and khula), child custody, guardianship,
          domestic violence, inheritance, and related family disputes.
        </p>
      </section>

      {/* Common Cases Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-blue-900 mb-3">
          Common Family Law Cases We Handle
        </h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Divorce & Khula (mutual & contested)</li>
          <li>Child Custody & Guardianship</li>
          <li>Maintenance (children & spouse)</li>
          <li>Domestic Violence Protection</li>
          <li>Dowry & Marriage Disputes</li>
          <li>Inheritance & Property Division</li>
        </ul>
      </section>

      {/* Why Choose PTL Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-blue-900 mb-3">
          Why Choose PTL for Family Law Cases?
        </h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Verified lawyers with years of family law expertise</li>
          <li>Confidential and client-focused approach</li>
          <li>Nationwide network (Karachi, Lahore, Islamabad & more)</li>
          <li>Transparent fees and case updates</li>
        </ul>
      </section>

      {/* Call to Action */}
      <section className="text-center">
        <Link
          href="/contact"
          className="inline-block px-6 py-3 bg-blue-900 text-white font-medium rounded-md hover:bg-blue-800 transition"
        >
          Contact a Family Lawyer Today
        </Link>
      </section>
    </main>
  );
}
