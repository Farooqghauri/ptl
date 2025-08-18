// src/app/[city]/[service]/page.tsx

export default function Page({
  params,
}: {
  params: { city: string; service: string };
}) {
  const { city, service } = params;

  const formattedCity = city.charAt(0).toUpperCase() + city.slice(1);
  const formattedService = service.charAt(0).toUpperCase() + service.slice(1);

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-blue-900">
          {formattedService} Lawyers in {formattedCity}
        </h1>
        <p className="mt-4 text-gray-700 text-lg">
          Connect with verified <strong>{formattedService}</strong> lawyers in{" "}
          <strong>{formattedCity}</strong>. PTL ensures your case is handled
          professionally, transparently, and on time.
        </p>
      </div>
    </main>
  );
}