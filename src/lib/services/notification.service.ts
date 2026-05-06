import prisma from "@/lib/prisma";
import { CreateNotificationDTO } from "@/types";
import { Prisma } from "@/generated/prisma/client";

export class NotificationService {
  /**
   * Créer une notification
   */
  static async createNotification(data: CreateNotificationDTO) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
        metadata: data.metadata as Prisma.InputJsonValue,
      },
    });
  }

  /**
   * Créer des notifications en masse
   */
  static async createBulkNotifications(notifications: CreateNotificationDTO[]) {
    return prisma.notification.createMany({
      data: notifications.map((n) => ({
        userId: n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
        actionUrl: n.actionUrl,
        metadata: n.metadata as Prisma.InputJsonValue,
      })),
    });
  }

  /**
   * Lister les notifications d'un utilisateur
   */
  static async listUserNotifications(userId: string, page = 1, limit = 20) {
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: {
          userId,
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({
        where: {
          userId,
          deletedAt: null,
        },
      }),
      prisma.notification.count({
        where: {
          userId,
          isRead: false,
          deletedAt: null,
        },
      }),
    ]);

    return {
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
    };
  }

  /**
   * Marquer une notification comme lue
   */
  static async markAsRead(notificationId: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Supprimer une notification
   */
  static async deleteNotification(notificationId: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Supprimer toutes les notifications lues
   */
  static async deleteReadNotifications(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        isRead: true,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}