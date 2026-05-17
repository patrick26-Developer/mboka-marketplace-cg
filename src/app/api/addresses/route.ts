// src/app/api/v1/addresses/route.ts
import { authenticate } from "@/lib/guards/auth.guard";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { z } from "zod";
import { AddressType } from "@/generated/prisma/client";

const createSchema = z.object({
  type: z.nativeEnum(AddressType).default("BOTH" as AddressType),
  fullName: z.string().min(2, "Nom trop court").max(255, "Nom trop long"),
  phoneNumber: z.string().min(8, "Numéro trop court").max(20, "Numéro trop long"),
  street: z.string().min(5, "Adresse trop courte").max(500, "Adresse trop longue"),
  city: z.string().min(2, "Ville requise").max(100, "Ville trop longue"),
  region: z.string().max(100).optional(),
  postalCode: z.string().max(10).optional(),
  country: z.string().max(100).default("Congo-Brazzaville"),
  instructions: z.string().max(500).optional(),
  isDefault: z.boolean().default(false),
});

const updateSchema = createSchema.partial();

export async function GET(request: Request): Promise<Response> {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const addresses = await prisma.address.findMany({
      where: { userId: user!.sub, deletedAt: null },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return successResponse(addresses);
  } catch (err: unknown) {
    console.error("[Addresses GET]", err);
    const message: string = err instanceof Error ? err.message : "Erreur serveur";
    return errorResponse(message, 500);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const body: unknown = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        "Données invalides",
        400,
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const { isDefault, ...addressData } = parsed.data;

    // Si isDefault, retirer le défaut des autres adresses
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: user!.sub, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        ...addressData,
        userId: user!.sub,
        isDefault,
      },
    });

    return successResponse(address, "Adresse créée", 201);
  } catch (err: unknown) {
    console.error("[Addresses POST]", err);
    const message: string = err instanceof Error ? err.message : "Erreur serveur";
    return errorResponse(message, 500);
  }
}