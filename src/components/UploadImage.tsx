"use client";

import { CldUploadWidget, CloudinaryUploadWidgetResults } from "next-cloudinary";

interface UploadImageProps {
  onUpload: (url: string) => void;
  label: string;
}

export default function UploadImage({ onUpload, label }: UploadImageProps) {
  return (
    <div className="text-center">
      <CldUploadWidget
        uploadPreset={
          process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"
        }
        onSuccess={(result: CloudinaryUploadWidgetResults) => {
          const info = result?.info as { secure_url?: string } | undefined;
          if (info?.secure_url) {
            onUpload(info.secure_url);
          }
        }}
      >
        {({ open }) => (
          <button
            type="button"
            onClick={() => open?.()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full transition"
          >
            Upload {label}
          </button>
        )}
      </CldUploadWidget>
    </div>
  );
}
