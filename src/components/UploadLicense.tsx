"use client";

import { CldUploadWidget, CloudinaryUploadWidgetResults } from "next-cloudinary";
import Image from "next/image";
import { useState } from "react";

export default function UploadLicense() {
  const [url, setUrl] = useState<string>("");

  // Define Cloudinary upload result info type
  type UploadInfo = {
    secure_url: string;
    public_id: string;
    format: string;
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white">
      <CldUploadWidget
        uploadPreset="ml_default"
        onUpload={(result: CloudinaryUploadWidgetResults | undefined) => {
          if (result?.event === "success" && result.info) {
            const info = result.info as UploadInfo;
            setUrl(info.secure_url);
          }
        }}
      >
        {({ open }) => (
          <button
            type="button"
            onClick={() => open()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Upload License
          </button>
        )}
      </CldUploadWidget>

      {url && (
        <div className="mt-3">
          <p className="text-sm text-gray-600 mb-1">Preview:</p>
          <div className="relative w-48 h-32">
            <Image
              src={url}
              alt="License Preview"
              fill
              className="object-contain rounded-md border shadow-sm"
              sizes="(max-width: 768px) 100vw, 200px"
              priority
            />
          </div>
        </div>
      )}
    </div>
  );
}
