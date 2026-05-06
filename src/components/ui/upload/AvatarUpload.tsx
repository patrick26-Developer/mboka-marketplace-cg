// src/components/upload/AvatarUpload.tsx
"use client";

import { CldUploadWidget, CldImage } from "next-cloudinary";
import { useState } from "react";
import type { CloudinaryUploadWidgetInfo } from "next-cloudinary";

interface AvatarUploadProps {
  userId:          string;
  currentAvatar?:  string | null;
  onUploadSuccess: (url: string) => void;
}

export function AvatarUpload({
  userId,
  currentAvatar,
  onUploadSuccess,
}: AvatarUploadProps) {
  const [resource, setResource] = useState<CloudinaryUploadWidgetInfo | undefined>();

  return (
    <div className="flex flex-col items-center gap-4">
      {(currentAvatar || resource) && (
        <CldImage
          src={resource?.public_id || currentAvatar || ""}
          width={200}
          height={200}
          crop="fill"
          gravity="face"
          className="rounded-full"
          alt="Avatar"
        />
      )}

      <CldUploadWidget
        signatureEndpoint="/api/upload/sign"
        options={{
          sources:              ["local", "camera"],
          multiple:             false,
          maxFiles:             1,
          clientAllowedFormats: ["jpg", "png", "webp"],
          maxFileSize:          5_000_000, // 5MB
          folder:               "marketplace-cg/avatars",
          // ✅ CORRIGÉ : transformation n'existe pas dans options
          // Les transformations se font côté serveur dans le preset Cloudinary
          // ou via le service côté serveur
          cropping:             true,
          croppingAspectRatio:  1, // carré pour l'avatar
        }}
        onSuccess={(result) => {
          if (typeof result?.info !== "string" && result?.info) {
            setResource(result.info);
            onUploadSuccess(result.info.secure_url);
          }
        }}
      >
        {({ open }) => (
          <button
            type="button"
            onClick={() => open()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {resource || currentAvatar ? "Changer l'avatar" : "Ajouter un avatar"}
          </button>
        )}
      </CldUploadWidget>
    </div>
  );
}