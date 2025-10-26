"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface Lawyer {
  _id: string;
  name: string;
  telephone: string;
  email: string;
  city: string;
  licenseNumber: string;
  picture?: string;
  licenseImage?: string;
}

export default function LawyersList() {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function fetchLawyers() {
      try {
        const res = await fetch("/api/lawyers");
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to load lawyers");

        setLawyers(data);
      } catch (err) {
        console.error(err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchLawyers();
  }, []);

  if (loading)
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <p className="text-center text-gray-600">Loading lawyers...</p>
      </div>
    );

  if (error)
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <p className="text-center text-red-600">❌ Error: {error}</p>
      </div>
    );

  if (lawyers.length === 0)
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <p className="text-center text-gray-500">No lawyers found. Add one first.</p>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-8">
        👩‍⚖️ All Registered Lawyers
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {lawyers.map((lawyer) => (
          <div
            key={lawyer._id}
            className="border rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-center mb-3">
              {lawyer.picture ? (
                <Image
                  src={lawyer.picture}
                  alt={`${lawyer.name} profile`}
                  width={120}
                  height={120}
                  className="rounded-full border object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                  No Image
                </div>
              )}
            </div>

            <h2 className="text-lg font-semibold text-center">
              {lawyer.name}
            </h2>

            <p className="text-sm text-gray-600 text-center">
              📍 {lawyer.city}
            </p>

            <div className="mt-3 space-y-1 text-sm text-gray-700">
              <p>
                <strong>License #:</strong> {lawyer.licenseNumber}
              </p>
              <p>
                <strong>Phone:</strong> {lawyer.telephone}
              </p>
              <p>
                <strong>Email:</strong> {lawyer.email}
              </p>
            </div>

            {lawyer.licenseImage && (
              <div className="mt-3">
                <p className="text-sm text-gray-500 mb-1">License Image:</p>
                <div className="relative w-full h-40">
                  <Image
                    src={lawyer.licenseImage}
                    alt="License"
                    fill
                    className="object-contain rounded border"
                    sizes="(max-width: 768px) 100vw, 300px"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
