// src/lib/services/user.service.ts
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { UserRole, Prisma } from "@/generated/prisma/client";
import type { UserPublic } from "@/types";

// ============================================================
// INTERFACES
// ============================================================

export interface CreateUserInput {
  email: string;
  password?: string;
  name?: string;
  phone?: string;
  role: UserRole;
  emailVerified?: boolean;
}

export interface UpdateUserInput {
  name?: string;
  phone?: string;
  avatar?: string;
  role?: UserRole;
  isActive?: boolean;
  emailVerified?: boolean;
  language?: string;
  timezone?: string;
  notificationsEnabled?: boolean;
}

export interface UserFiltersInput {
  role?: UserRole;
  isActive?: boolean;
  emailVerified?: boolean;
  search?: string;
}

// ============================================================
// SERVICE UNIFIÉ
// ============================================================

export class UserService {
  /**
   * Convertit un User Prisma en UserPublic (sans données sensibles)
   */
  static toPublicUser(user: Prisma.UserGetPayload<object>): UserPublic {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      emailVerified: user.emailVerified,
      isActive: user.isActive,
      language: user.language,
      currency: user.currency,
      timezone: user.timezone,
      notificationsEnabled: user.notificationsEnabled,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  }

  /**
   * Lister utilisateurs avec filtres et pagination
   */
  static async listUsers(filters: UserFiltersInput, page = 1, limit = 20) {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.emailVerified !== undefined) {
      where.emailVerified = filters.emailVerified;
    }

    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: "insensitive" } },
        { name: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          avatar: true,
          role: true,
          emailVerified: true,
          isActive: true,
          isLocked: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              orders: true,
              reviews: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
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
   * Créer un utilisateur
   */
  static async createUser(data: CreateUserInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error("Cet email est déjà utilisé");
    }

    const passwordHash = data.password ? await hashPassword(data.password) : null;

    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        phone: data.phone,
        role: data.role,
        emailVerified: data.emailVerified ?? false,
        emailVerifiedAt: data.emailVerified ? new Date() : null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });
  }

  /**
   * Trouver un utilisateur par email
   */
  static async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Trouver un utilisateur par ID
   */
  static async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Récupérer un utilisateur par ID (avec stats)
   */
  static async getUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        emailVerified: true,
        isActive: true,
        isLocked: true,
        lockedReason: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            orders: true,
            reviews: true,
            addresses: true,
          },
        },
      },
    });
  }

  /**
   * Mettre à jour un utilisateur
   */
  static async updateUser(id: string, data: UpdateUserInput) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        emailVerified: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Supprimer un utilisateur (soft delete)
   */
  static async deleteUser(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }

  /**
   * Verrouiller un compte
   */
  static async lockAccount(userId: string, reason: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        isLocked: true,
        lockedAt: new Date(),
        lockedReason: reason,
        isActive: false,
      },
    });
  }

  /**
   * Déverrouiller un compte
   */
  static async unlockAccount(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        isLocked: false,
        lockedAt: null,
        lockedReason: null,
        isActive: true,
        failedLoginCount: 0,
      },
    });
  }

  /**
   * Incrémenter le compteur de tentatives de connexion échouées
   */
  static async incrementFailedLoginCount(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginCount: { increment: 1 },
        lastFailedLoginAt: new Date(),
      },
    });
  }

  /**
   * Réinitialiser le compteur de tentatives de connexion
   */
  static async resetFailedLoginCount(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginCount: 0,
        lastFailedLoginAt: null,
      },
    });
  }

  /**
   * Mettre à jour la date de dernière connexion
   */
  static async updateLastLogin(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }
}