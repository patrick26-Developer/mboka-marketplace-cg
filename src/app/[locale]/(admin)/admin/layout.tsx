// src/app/[locale]/(admin)/admin/layout.tsx
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Vérifier authentification
  if (!user) {
    redirect("/auth/login?callbackUrl=/admin/dashboard");
  }

  // Vérifier rôle SUPER_ADMIN
  if (user.role !== "SUPER_ADMIN") {
    redirect("/");
  }

  return <AdminLayout>{children}</AdminLayout>;
}