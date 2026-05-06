// src/app/api/v1/orders/[id]/route.ts
import { authenticate } from "@/lib/guards/auth.guard";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { UserRole, OrderStatus } from "@/generated/prisma/client";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  adminNote: z.string().max(500).optional(),
  trackingNumber: z.string().max(100).optional(),
  trackingUrl: z.string().url("URL invalide").optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const { id } = await params;
    const role: UserRole = user!.role;

    const whereClause = {
      id,
      ...(role === "CUSTOMER"
        ? { userId: user!.sub }
        : role === "SHOP_ADMIN"
        ? { shop: { adminId: user!.sub } }
        : {}), // SUPER_ADMIN voit tout
    };

    const order = await prisma.order.findFirst({
      where: whereClause,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                thumbnail: true,
                status: true,
              },
            },
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            method: true,
            status: true,
            paidAt: true,
            transactionId: true,
            phoneNumber: true,
            operatorName: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        shop: {
          select: {
            id: true,
            name: true,
            type: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      return errorResponse("Commande introuvable", 404);
    }

    return successResponse(order);
  } catch (err: unknown) {
    console.error("[Order GET]", err);
    const message: string = err instanceof Error ? err.message : "Erreur serveur";
    return errorResponse(message, 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    // Seuls SUPER_ADMIN et SHOP_ADMIN peuvent modifier le statut
    if (user!.role === "CUSTOMER") {
      return errorResponse("Accès refusé", 403);
    }

    const { id } = await params;
    const body: unknown = await request.json();
    const parsed = updateStatusSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        "Données invalides",
        400,
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const { status, adminNote, trackingNumber, trackingUrl } = parsed.data;

    // Vérifier que la commande appartient à la boutique du SHOP_ADMIN
    if (user!.role === "SHOP_ADMIN") {
      const order = await prisma.order.findFirst({
        where: { id, shop: { adminId: user!.sub } },
        select: { id: true },
      });

      if (!order) {
        return errorResponse("Commande introuvable ou accès refusé", 404);
      }
    }

    const updateData: Record<string, unknown> = {
      status,
      ...(adminNote !== undefined && { adminNote }),
      ...(trackingNumber !== undefined && { trackingNumber }),
      ...(trackingUrl !== undefined && { trackingUrl }),
    };

    // Mettre à jour les timestamps selon le statut
    const now = new Date();
    switch (status) {
      case "CONFIRMED":
        updateData.confirmedAt = now;
        break;
      case "SHIPPED":
        updateData.shippedAt = now;
        break;
      case "DELIVERED":
        updateData.deliveredAt = now;
        updateData.paymentStatus = "COMPLETED";
        break;
      case "CANCELLED":
        updateData.cancelledAt = now;
        break;
      case "REFUNDED":
        updateData.refundedAt = now;
        updateData.paymentStatus = "REFUNDED";
        break;
    }

    const updated = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return successResponse(updated, "Statut mis à jour");
  } catch (err: unknown) {
    console.error("[Order PATCH]", err);
    const message: string = err instanceof Error ? err.message : "Erreur serveur";
    return errorResponse(message, 500);
  }
}