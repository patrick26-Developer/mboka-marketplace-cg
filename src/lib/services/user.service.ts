import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { CreateUserDTO, UpdateUserDTO, UserFilters, UserPublic } from "@/types";
import { Prisma } from "@/generated/prisma/client";

export class UserService {
  /**
   * Convertit un User Prisma en UserPublic (sans données sensibles)
   */
  static toPublicUser(user: any): UserPublic {
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
   * Créer un utilisateur
   */
  static async createUser(data: CreateUserDTO): Promise<UserPublic> {
    const hashedPassword = data.passwordHash
      ? await hashPassword(data.passwordHash)
      : null;

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: hashedPassword,
        name: data.name,
        phone: data.phone,
        role: data.role,
        emailVerified: data.emailVerified ?? false,
      },
    });

    return this.toPublicUser(user);
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
  static async findById(id: string): Promise<UserPublic | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    return user ? this.toPublicUser(user) : null;
  }

  /**
   * Mettre à jour un utilisateur
   */
  static async updateUser(id: string, data: UpdateUserDTO): Promise<UserPublic> {
    const user = await prisma.user.update({
      where: { id },
      data,
    });

    return this.toPublicUser(user);
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
   * Lister les utilisateurs avec filtres
   */
  static async listUsers(filters: UserFilters) {
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

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return users.map(this.toPublicUser);
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
   * Verrouiller un compte
   */
  static async lockAccount(userId: string, reason: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        isLocked: true,
        lockedAt: new Date(),
        lockedReason: reason,
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
        failedLoginCount: 0,
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