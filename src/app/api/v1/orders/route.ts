// src/app/api/v1/orders/route.ts
import { authenticate } from "@/lib/guards/auth.guard";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { OrderService } from "@/lib/services/order.service";
import { createOrderSchema } from "@/lib/validations/order.validation";

export async function GET(request: Request) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const page: number = Number(searchParams.get("page") ?? "1");
    const limit: number = Number(searchParams.get("limit") ?? "10");

    const result = await OrderService.listUserOrders(user!.sub, page, limit);
    return successResponse(result);
  } catch (err: unknown) {
    console.error("[Orders GET]", err);
    return errorResponse("Erreur serveur", 500);
  }
}

// src/app/api/v1/orders/route.ts
export async function POST(request: Request) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const body: unknown = await request.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        "Données invalides",
        400,
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    // ✅ CORRIGÉ : on passe userId séparément + data sans userId
    const order = await OrderService.createOrder(
      user!.sub,        // ← arg 1 : userId depuis JWT
      {
        ...parsed.data,
        userId: user!.sub,  // aussi dans le DTO pour cohérence
        items: parsed.data.items.map((item) => ({
          ...item,
          price: 0, // calculé côté service
        })),
      }
    );

    return successResponse(order, "Commande créée avec succès", 201);
  } catch (err: unknown) {
    console.error("[Orders POST]", err);
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return errorResponse(message, 500);
  }
}