"use client";

import { useState } from "react";
import Image from "next/image";
import UploadImage from "@/components/UploadImage";

interface LawyerFormData {
  name: string;
  telephone: string;
  email: string;
  city: string;
  licenseNumber: string;
  picture?: string;
  licenseImage?: string;
}

export default function AddLawyerForm() {
  const [formData, setFormData] = useState<LawyerFormData>({
    name: "",
    telephone: "",
    email: "",
    city: "",
    licenseNumber: "",
  });

  const [pictureUrl, setPictureUrl] = useState<string>("");
  const [licenseUrl, setLicenseUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  // Handle text field updates
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const payload: LawyerFormData = {
        ...formData,
        picture: pictureUrl,
        licenseImage: licenseUrl,
      };

      const response = await fetch("/api/lawyers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save lawyer");
      }

      setMessage("✅ Lawyer saved successfully!");
      setFormData({
        name: "",
        telephone: "",
        email: "",
        city: "",
        licenseNumber: "",
      });
      setPictureUrl("");
      setLicenseUrl("");
    } catch (error) {
      console.error("Error saving lawyer:", error);
      setMessage(`❌ ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-w-md w-full mx-auto p-6 border rounded-lg bg-white shadow-lg"
      >
        <h2 className="text-2xl font-semibold text-center text-indigo-700 mb-4">
          Add New Lawyer
        </h2>

        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-indigo-500"
          required
        />
        <input
          type="text"
          name="telephone"
          placeholder="Telephone"
          value={formData.telephone}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-indigo-500"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-indigo-500"
          required
        />
        <input
          type="text"
          name="city"
          placeholder="City"
          value={formData.city}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-indigo-500"
          required
        />
        <input
          type="text"
          name="licenseNumber"
          placeholder="License Number"
          value={formData.licenseNumber}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-indigo-500"
          required
        />

        {/* Upload buttons */}
        <div className="space-y-3">
          <UploadImage
            label="Profile Picture"
            onUpload={(url) => setPictureUrl(url)}
          />
          {pictureUrl && (
            <div className="flex justify-center">
              <Image
                src={pictureUrl}
                alt="Profile"
                width={128}
                height={128}
                className="rounded-full border object-cover"
              />
            </div>
          )}

          <UploadImage
            label="License Image"
            onUpload={(url) => setLicenseUrl(url)}
          />
          {licenseUrl && (
            <div className="flex justify-center">
              <Image
                src={licenseUrl}
                alt="License"
                width={128}
                height={128}
                className="rounded border object-cover"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded transition ${
            !pictureUrl || !licenseUrl ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={!pictureUrl || !licenseUrl || loading}
        >
          {loading ? "Saving..." : "Save Lawyer"}
        </button>

        {message && (
          <p
            className={`text-sm text-center mt-2 ${
              message.startsWith("✅") ? "text-green-600" : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
