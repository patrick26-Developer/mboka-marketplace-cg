import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/utils/activity";
import { ActivityAction, UserRole } from "@/generated/prisma/client";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",

  plugins: [nextCookies()],

  // ============================================================
  // ❌ IMPORTANT : désactiver les modules non utilisés
  // ============================================================
  emailAndPassword: {
    enabled: false,
  },
  // ============================================================
  // GOOGLE OAUTH
  // ============================================================
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      prompt: "select_account",
    },
  },

  session: {
    expiresIn: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  pages: {
    signIn: "/fr/auth/login",
    error: "/fr/auth/login?error=google_failed",
  },

  // ============================================================
  // HOOKS (OK - on garde ton logique métier)
  // ============================================================
  databaseHooks: {
    session: {
      create: {
        after: async (session) => {
          try {
            const userId: string = session.userId as string;

            const user = await prisma.user.findUnique({
              where: { id: userId },
              select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                isLocked: true,
              },
            });

            if (!user) return;

            // ⚠️ Tu bloques les admins côté business (OK)
            if (user.role !== UserRole.CUSTOMER) {
              console.warn(
                `[BetterAuth] Admin ${user.email} a tenté Google OAuth - Bloqué`
              );
              return;
            }

            await logActivity({
              userId: user.id,
              action: ActivityAction.LOGIN_SUCCESS,
              entity: "User",
              entityId: user.id,
              metadata: {
                provider: "GOOGLE",
                email: user.email,
              },
            });

            console.log(
              `[BetterAuth] Connexion Google réussie: ${user.email}`
            );
          } catch (err: unknown) {
            const message =
              err instanceof Error ? err.message : "Erreur inconnue";

            console.error(`[BetterAuth Hook] Erreur:`, message);
          }
        },
      },
    },
  },
});

export type Auth = typeof auth;