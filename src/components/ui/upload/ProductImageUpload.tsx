// src/components/upload/ProductImageUpload.tsx
"use client";

import { CldUploadWidget, CldImage } from "next-cloudinary";
import { useState } from "react";
import type { CloudinaryUploadWidgetInfo } from "next-cloudinary";

interface ProductImageUploadProps {
  onUploadSuccess: (images: Array<{ url: string; publicId: string }>) => void;
  maxFiles?:       number;
}

export function ProductImageUpload({
  onUploadSuccess,
  maxFiles = 5,
}: ProductImageUploadProps) {
  const [resources, setResources] = useState<CloudinaryUploadWidgetInfo[]>([]);

  return (
    <div className="space-y-4">
      {resources.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {resources.map((r) => (
            <CldImage
              key={r.public_id}
              src={r.public_id}
              width={200}
              height={200}
              crop="fill"
              className="rounded-lg object-cover"
              alt="Image produit"
            />
          ))}
        </div>
      )}

      <CldUploadWidget
        signatureEndpoint="/api/upload/sign"
        options={{
          sources:              ["local"],
          multiple:             true,
          maxFiles,
          clientAllowedFormats: ["jpg", "png", "webp"],
          maxFileSize:          10_000_000, // 10MB
          folder:               "marketplace-cg/products",
          // ✅ CORRIGÉ : pas de transformation dans options widget
          // Les transformations sont configurées dans le preset Cloudinary
        }}
        onSuccess={(result) => {
          if (typeof result?.info !== "string" && result?.info) {
            setResources((prev) => [
              ...prev,
              result.info as CloudinaryUploadWidgetInfo,
            ]);
          }
        }}
        onQueuesEnd={(_result, { widget }) => {
          const uploaded = resources.map((r) => ({
            url:      r.secure_url,
            publicId: r.public_id,
          }));
          if (uploaded.length > 0) {
            onUploadSuccess(uploaded);
          }
          widget.close();
        }}
      >
        {({ open }) => (
          <button
            type="button"
            onClick={() => open()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ajouter des images ({resources.length}/{maxFiles})
          </button>
        )}
      </CldUploadWidget>
    </div>
  );
}