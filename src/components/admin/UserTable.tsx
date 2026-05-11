// src/components/admin/UserTable.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useLocale } from "@/hooks/useLocale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import {
  MoreVertical,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Mail,
  MailCheck,
} from "lucide-react";
import { UserRole } from "@/generated/prisma/client";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: UserRole;
  emailVerified: boolean;
  isActive: boolean;
  isLocked: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
  _count: {
    orders: number;
    reviews: number;
  };
}

interface UserTableProps {
  users: User[];
  onRefresh: () => void;
}

const roleColors: Record<UserRole, string> = {
  SUPER_ADMIN: "bg-red-500/10 text-red-700 dark:text-red-400",
  SHOP_ADMIN: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  CUSTOMER: "bg-green-500/10 text-green-700 dark:text-green-400",
};

const roleLabels: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  SHOP_ADMIN: "Shop Admin",
  CUSTOMER: "Client",
};

export function UserTable({ users, onRefresh }: UserTableProps) {
  const { locale } = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleLockToggle = async (userId: string, isLocked: boolean) => {
    setLoading(userId);
    try {
      const endpoint = isLocked ? "unlock" : "lock";
      const res = await fetch(`/api/v1/admin/users/${userId}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Action administrative" }),
      });

      if (!res.ok) throw new Error();

      toast.success(isLocked ? "Compte déverrouillé" : "Compte verrouillé");
      onRefresh();
    } catch {
      toast.error("Erreur lors de l'opération");
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Confirmer la suppression ?")) return;

    setLoading(userId);
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      toast.success("Utilisateur supprimé");
      onRefresh();
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Utilisateur</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Activité</TableHead>
            <TableHead>Inscription</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                Aucun utilisateur trouvé
              </TableCell>
            </TableRow>
          ) : (
            users.map((user, index) => (
              <motion.tr
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group hover:bg-accent/50 transition-colors duration-200"
              >
                <TableCell>
                  <div>
                    <p className="font-medium">{user.name ?? "Sans nom"}</p>
                    {user.phone && (
                      <p className="text-xs text-muted-foreground">{user.phone}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={roleColors[user.role]}>
                    {roleLabels[user.role]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{user.email}</span>
                    {user.emailVerified ? (
                      <MailCheck className="h-4 w-4 text-green-600" />
                    ) : (
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {user.isLocked ? (
                      <Badge variant="outline" className="bg-red-500/10 text-red-700">
                        Verrouillé
                      </Badge>
                    ) : user.isActive ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-700">
                        Actif
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-500/10 text-gray-700">
                        Inactif
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p>{user._count.orders} commandes</p>
                    <p className="text-muted-foreground">{user._count.reviews} avis</p>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(user.createdAt), {
                    addSuffix: true,
                    locale: locale === "fr" ? fr : enUS,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={loading === user.id}
                        className="hover:bg-accent/50 transition-colors duration-200"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => router.push(`/admin/users/${user.id}`)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleLockToggle(user.id, user.isLocked)}
                      >
                        {user.isLocked ? (
                          <>
                            <Unlock className="mr-2 h-4 w-4" />
                            Déverrouiller
                          </>
                        ) : (
                          <>
                            <Lock className="mr-2 h-4 w-4" />
                            Verrouiller
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(user.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </motion.tr>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}