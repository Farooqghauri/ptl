"use client";

interface PageProps {
  params: {
    city: string;
    service: string;
  };
}

export default function ServicePage({ params }: PageProps) {
  const { city, service } = params;

  // Capitalize city and service names for nicer display
  const formattedCity = city.charAt(0).toUpperCase() + city.slice(1);
  const formattedService = service.charAt(0).toUpperCase() + service.slice(1);

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      {/* Page Header */}
      <h1 className="text-3xl md:text-4xl font-bold text-blue-900">
        Lawyers in {formattedCity} for {formattedService}
      </h1>

      {/* Intro Text */}
      <p className="mt-4 text-gray-700 max-w-3xl">
        Pakistan&apos;s Top Lawyers (PTL) helps you find verified{" "}
        <strong>{formattedService}</strong> lawyers in{" "}
        <strong>{formattedCity}</strong>. Get professional legal assistance
        with transparency, trust, and timely case handling.
      </p>

      {/* CTA Section */}
      <div className="mt-8 bg-white shadow-md rounded-lg p-6 max-w-2xl">
        <h2 className="text-xl font-semibold text-blue-900 mb-3">
          Need a {formattedService} Lawyer in {formattedCity}?
        </h2>
        <p className="text-gray-600">
          Our team connects you with the most experienced legal experts in{" "}
          {formattedCity}. Whether it’s court representation, property
          disputes, or family matters, PTL ensures you get the best possible
          guidance.
        </p>
        <button className="mt-6 bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition">
          Connect with a Lawyer
        </button>
      </div>
    </main>
  );
}
