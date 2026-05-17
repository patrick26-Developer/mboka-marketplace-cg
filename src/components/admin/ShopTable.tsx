// src/components/admin/ShopTable.tsx
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
import { MoreVertical, Edit, Trash2, Power, PowerOff } from "lucide-react";
import { ShopType } from "@/generated/prisma/client";
import { toast } from "sonner";
import Image from "next/image";

interface Shop {
  id: string;
  name: string;
  type: ShopType;
  slug: string;
  logo: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  admin: {
    id: string;
    name: string | null;
    email: string;
  };
  _count: {
    products: number;
    orders: number;
  };
}

interface ShopTableProps {
  shops: Shop[];
  onRefresh: () => void;
}

const shopTypeLabels: Record<ShopType, string> = {
  SMARTPHONE: "Smartphones",
  LAPTOP: "Ordinateurs",
  PLAYSTATION: "PlayStation",
};

const shopTypeColors: Record<ShopType, string> = {
  SMARTPHONE: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  LAPTOP: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  PLAYSTATION: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
};

export function ShopTable({ shops, onRefresh }: ShopTableProps) {
  const { locale } = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleToggleStatus = async (shopId: string, currentStatus: boolean) => {
    setLoading(shopId);
    try {
      const res = await fetch(`/api/v1/admin/shops/${shopId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!res.ok) throw new Error();

      toast.success(
        currentStatus ? "Boutique désactivée" : "Boutique activée"
      );
      onRefresh();
    } catch {
      toast.error("Erreur lors de l'opération");
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (shopId: string) => {
    if (!confirm("Confirmer la suppression ? Toutes les données seront perdues."))
      return;

    setLoading(shopId);
    try {
      const res = await fetch(`/api/v1/admin/shops/${shopId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      toast.success("Boutique supprimée");
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
            <TableHead>Boutique</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Administrateur</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Statistiques</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Création</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shops.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                Aucune boutique enregistrée
              </TableCell>
            </TableRow>
          ) : (
            shops.map((shop, index) => (
              <motion.tr
                key={shop.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group hover:bg-accent/50 transition-colors duration-200"
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    {shop.logo ? (
                      <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <Image
                          src={shop.logo}
                          alt={shop.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary">
                          {shop.name[0]}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{shop.name}</p>
                      <p className="text-xs text-muted-foreground">/{shop.slug}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={shopTypeColors[shop.type]}>
                    {shopTypeLabels[shop.type]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{shop.admin.name ?? "Sans nom"}</p>
                    <p className="text-xs text-muted-foreground">{shop.admin.email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {shop.email && <p>{shop.email}</p>}
                    {shop.phone && (
                      <p className="text-muted-foreground">{shop.phone}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p>{shop._count.products} produits</p>
                    <p className="text-muted-foreground">
                      {shop._count.orders} commandes
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  {shop.isActive ? (
                    <Badge variant="outline" className="bg-green-500/10 text-green-700">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-500/10 text-gray-700">
                      Inactive
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(shop.createdAt), {
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
                        disabled={loading === shop.id}
                        className="hover:bg-accent/50 transition-colors duration-200"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => router.push(`/admin/shops/${shop.id}`)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          handleToggleStatus(shop.id, shop.isActive)
                        }
                      >
                        {shop.isActive ? (
                          <>
                            <PowerOff className="mr-2 h-4 w-4" />
                            Désactiver
                          </>
                        ) : (
                          <>
                            <Power className="mr-2 h-4 w-4" />
                            Activer
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(shop.id)}
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