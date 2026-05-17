// src/components/admin/RecentOrdersTable.tsx
"use client";

import { useTranslate } from "@/hooks/useTranslate";
import { formatFCFA } from "@/lib/utils/format";
import { formatDistanceToNow } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useLocale } from "@/hooks/useLocale";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { motion } from "framer-motion";
import { OrderStatus } from "@/generated/prisma/client";

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: OrderStatus;
  createdAt: Date;
  user: {
    name: string | null;
    email: string;
  };
  shop: {
    name: string;
    type: string;
  };
  items: Array<{
    productName: string;
    quantity: number;
  }>;
}

interface RecentOrdersTableProps {
  orders: Order[];
}

const statusColors: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  CONFIRMED: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  PROCESSING: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  SHIPPED: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  DELIVERED: "bg-green-500/10 text-green-700 dark:text-green-400",
  CANCELLED: "bg-red-500/10 text-red-700 dark:text-red-400",
  REFUNDED: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
};

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  const {t} = useTranslate();
  const { locale } = useLocale();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("admin.recentOrders")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° Commande</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Boutique</TableHead>
              <TableHead>Produits</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Aucune commande récente
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order, index) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group hover:bg-accent/50 transition-colors duration-200"
                >
                  <TableCell className="font-mono text-sm font-medium">
                    {order.orderNumber}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.user.name ?? "Client"}</p>
                      <p className="text-xs text-muted-foreground">{order.user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{order.shop.name}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {order.items.slice(0, 2).map((item, i) => (
                        <div key={i} className="text-muted-foreground">
                          {item.productName} (x{item.quantity})
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{order.items.length - 2} autres
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatFCFA(order.totalAmount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[order.status]}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(order.createdAt), {
                      addSuffix: true,
                      locale: locale === "fr" ? fr : enUS,
                    })}
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}