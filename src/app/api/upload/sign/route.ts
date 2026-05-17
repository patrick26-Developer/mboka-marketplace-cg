// src/app/api/v1/upload/sign/route.ts
import { v2 as cloudinary }               from "cloudinary";
import { authenticate }                    from "@/lib/guards/auth.guard";
import { successResponse, errorResponse }  from "@/lib/utils/response";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

export async function POST(request: Request) {
  // ✅ authenticate (pas authenticateRequest)
  const { user, error } = await authenticate(request);
  if (error) return error;

  try {
    const body = await request.json() as { paramsToSign?: unknown };

    // ✅ Vérification de type stricte avant usage
    if (
      !body.paramsToSign ||
      typeof body.paramsToSign !== "object" ||
      Array.isArray(body.paramsToSign)
    ) {
      return errorResponse("paramsToSign manquant ou invalide", 400);
    }

    // ✅ Cast sécurisé vers le type attendu par Cloudinary
    const paramsToSign = body.paramsToSign as Record<string, string>;

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!
    );

    // ✅ successResponse (pas ApiResponse.success)
    return successResponse(
      {
        signature,
        apiKey:    process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      },
      "Signature générée"
    );
  } catch (err) {
    console.error("[Upload Sign] Erreur:", err);
    return errorResponse("Échec de la génération de signature", 500);
  }
}