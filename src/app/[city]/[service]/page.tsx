import { Metadata } from "next";

interface PageProps {
  params: {
    city: string;
    service: string;
  };
}

// Optional: SEO metadata for each city/service
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city, service } = params;
  return {
    title: `${service} Lawyers in ${city} - Pakistan's Top Lawyers`,
    description: `Find the best ${service} lawyers in ${city} with PTL. Expert legal help for Pakistanis at home and abroad.`,
  };
}

export default function ServicePage({ params }: PageProps) {
  const { city, service } = params;

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-blue-900">
          {service.charAt(0).toUpperCase() + service.slice(1)} Lawyers in{" "}
          {city.charAt(0).toUpperCase() + city.slice(1)}
        </h1>
        <p className="mt-4 text-gray-700 text-lg">
          Connect with verified <strong>{service}</strong> lawyers in{" "}
          <strong>{city}</strong>. PTL ensures your case is handled
          professionally, transparently, and on time.
        </p>
      </div>
    </main>
  );
}
