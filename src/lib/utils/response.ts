import { NextResponse } from "next/server";
import type { ApiSuccessResponse, ApiErrorResponse } from "@/types";

export function successResponse<T>(
  data:    T,
  message  = "Succès",
  status   = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    { success: true, message, data, timestamp: new Date().toISOString() },
    { status }
  );
}

export function errorResponse(
  message: string,
  status   = 400,
  errors?: Record<string, string | string[]>
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    { success: false, message, errors, timestamp: new Date().toISOString() },
    { status }
  );
}

export function getRequestMeta(request: Request): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  // ✅ CORRIGÉ : Support Cloudflare, Vercel, AWS
  const ipAddress =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-client-ip") ??
    null;

  const userAgent = request.headers.get("user-agent") ?? null;

  return { ipAddress, userAgent };
}