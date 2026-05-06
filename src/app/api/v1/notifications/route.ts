// src/app/api/v1/notifications/route.ts
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/guards/auth.guard";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET(request: Request) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "20");

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user!.sub, deletedAt: null },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({
        where: { userId: user!.sub, deletedAt: null },
      }),
      prisma.notification.count({
        where: { userId: user!.sub, isRead: false, deletedAt: null },
      }),
    ]);

    return successResponse({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    console.error("[Notifications GET]", err);
    return errorResponse("Erreur serveur", 500);
  }
}