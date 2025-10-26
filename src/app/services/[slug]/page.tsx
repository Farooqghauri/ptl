// app/services/[slug]/page.tsx
import { getServiceBySlug, SERVICES, type Service } from "@/lib/services"; // adjust path if needed
import LottieClient from "@/components/LottieClient";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

// ---------- SEO Metadata ----------
type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const service: Service | null = getServiceBySlug(slug);

  if (!service) {
    return {
      title: "Service not found — PTL",
      description: "The requested AI legal service could not be found.",
    };
  }

  const title = `${service.name} — AI Tools for Lawyers in Pakistan | PTL`;
  const description = service.short;
  const siteUrl = "https://ptl.pk"; // ✅ Replace with your actual production domain

  return {
    title,
    description,
    keywords: service.keywords ?? [
      "AI legal tools Pakistan",
      "Pakistani lawyers AI",
      "law tech Pakistan",
      "PTL AI tools",
    ],
    openGraph: {
      title,
      description,
      url: `${siteUrl}/services/${service.slug}`,
      images: service.banner
        ? [
            {
              url: `${siteUrl}${service.banner}`,
              width: 1200,
              height: 630,
              alt: `${service.name} banner`,
            },
          ]
        : undefined,
    },
  };
}

// ---------- Page UI ----------
export default async function ServicePage({ params }: Params) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  return (
    <main className="max-w-5xl mx-auto px-6 py-12 text-gray-800">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-gray-600">
        <Link href="/" className="hover:underline">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/services" className="hover:underline">
          Services
        </Link>
        <span className="mx-2">/</span>
        <span className="font-semibold text-blue-900">{service?.name}</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 mb-3">
          {service?.name}
        </h1>
        <p className="text-gray-700 text-lg">{service?.short}</p>
      </header>

      {/* Banner */}
      {service?.banner && (
        <div className="rounded-3xl overflow-hidden shadow-lg mb-10">
          <Image
            src={service.banner}
            alt={`${service.name} banner`}
            width={1200}
            height={600}
            className="object-cover w-full h-72 md:h-96"
          />
        </div>
      )}

      {/* Description */}
      <section className="mb-12 prose max-w-none">
        <p>{service?.long}</p>
      </section>

      {/* Lottie Animation */}
      {service?.lottie && (
        <section className="mb-12">
          <div className="max-w-3xl mx-auto">
            <LottieClient
              animationUrl={service.lottie}
              className="w-full h-[360px]"
              ariaLabel={`${service.name} animation`}
            />
          </div>
        </section>
      )}

      {/* Related tools */}
      <aside className="mt-12 border-t pt-8">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          Explore other PTL AI Tools
        </h3>
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {SERVICES.filter((s) => s.slug !== service?.slug).map((s) => (
            <li key={s.slug}>
              <Link
                href={`/services/${s.slug}`}
                className="block p-3 rounded-lg bg-gray-50 hover:bg-blue-50 transition"
              >
                <span className="font-medium text-blue-900">{s.name}</span>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {s.short}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <Link
            href="/services"
            className="text-blue-700 font-medium hover:underline"
          >
            ← Back to all PTL AI Tools
          </Link>
        </div>
      </aside>
    </main>
  );
}
