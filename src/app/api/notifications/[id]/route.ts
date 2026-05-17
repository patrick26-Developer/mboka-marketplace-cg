// src/app/api/v1/notifications/[id]/route.ts
import { authenticate } from "@/lib/guards/auth.guard";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const { id } = await params;

    const notification = await prisma.notification.findFirst({
      where: { id, userId: user!.sub, deletedAt: null },
      select: { id: true, isRead: true },
    });

    if (!notification) {
      return errorResponse("Notification introuvable", 404);
    }

    if (notification.isRead) {
      return successResponse(null, "Déjà lue");
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });

    return successResponse(null, "Notification marquée comme lue");
  } catch (err: unknown) {
    console.error("[Notification PATCH]", err);
    const message: string = err instanceof Error ? err.message : "Erreur serveur";
    return errorResponse(message, 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const { id } = await params;

    const notification = await prisma.notification.findFirst({
      where: { id, userId: user!.sub },
      select: { id: true },
    });

    if (!notification) {
      return errorResponse("Notification introuvable", 404);
    }

    await prisma.notification.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return successResponse(null, "Notification supprimée");
  } catch (err: unknown) {
    console.error("[Notification DELETE]", err);
    const message: string = err instanceof Error ? err.message : "Erreur serveur";
    return errorResponse(message, 500);
  }
}