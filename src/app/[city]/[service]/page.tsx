


function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default async function LawyerPage({ params }: { params: { city: string; service: string } }) {
  const city = capitalize(params.city);
  const service = params.service.replace("-", " ").toUpperCase();

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-blue-900">
        Top {service} in {city}
      </h1>

      <p className="mt-4 text-gray-700">
        Connect with experienced and bar-certified {service.toLowerCase()}s in {city}. Get fast help from trusted legal experts.
      </p>
    </main>
  );
}