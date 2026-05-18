// src/types/index.ts
// ============================================================
// MARKETPLACE CG - TYPES TYPESCRIPT COMPLETS
// ============================================================

import {
  UserRole,
  ShopType,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  ProductStatus,
  NotificationType,
  DiscountType,
  ActivityAction,
  AddressType,
  StockMovementType,
} from "@/generated/prisma/client";

// ============================================================
// 1. TYPES D'AUTHENTIFICATION
// ============================================================

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  sessionId: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;  // ✅ CORRIGÉ (était number)
  refreshTokenExpiresAt: Date; // ✅ CORRIGÉ (était number)
}

export interface UserPublic {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  avatar: string | null;
  role: UserRole;
  emailVerified: boolean;
  isActive: boolean;
  language: string;
  currency: string;
  timezone: string;
  notificationsEnabled: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
}

export interface AuthResponse {
  user: UserPublic;
  tokens: AuthTokens;
}

// ============================================================
// 2. INPUT TYPES (pour validation Zod)
// ============================================================

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateProfileInput {
  name?: string;
  phone?: string;
  language?: string;
  timezone?: string;
  notificationsEnabled?: boolean;
}

export interface VerifyEmailInput {
  token: string;
}

export interface ResendVerificationInput {
  email: string;
}

export interface SendOTPInput {
  email: string;
  purpose?: "LOGIN" | "VERIFICATION";
}

export interface VerifyOTPInput {
  email: string;
  code: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

// ============================================================
// 3. USER TYPES (DTO)
// ============================================================

export interface CreateUserDTO {
  email: string;
  passwordHash?: string;
  name?: string;
  phone?: string;
  role: UserRole;
  emailVerified?: boolean;
}

export interface UpdateUserDTO {
  name?: string;
  phone?: string;
  avatar?: string;
  language?: string;
  timezone?: string;
  notificationsEnabled?: boolean;
}

export interface UserFilters {
  role?: UserRole;
  isActive?: boolean;
  emailVerified?: boolean;
  search?: string;
}

export interface UserWithStats {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: UserRole;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
  _count: {
    orders: number;
    reviews: number;
  };
}

// ============================================================
// 4. SHOP TYPES
// ============================================================

export interface CreateShopDTO {
  name: string;
  type: ShopType;
  description?: string;
  logo?: string;
  banner?: string;
  email?: string;
  phone?: string;
  slug: string;
  adminId: string;
  settings?: Record<string, unknown>;
  metaTitle?: string;
  metaDescription?: string;
}

export interface UpdateShopDTO {
  name?: string;
  description?: string;
  logo?: string;
  banner?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
  settings?: Record<string, unknown>;
  metaTitle?: string;
  metaDescription?: string;
}

export interface ShopWithStats {
  id: string;
  name: string;
  type: ShopType;
  slug: string;
  logo: string | null;
  isActive: boolean;
  _count: {
    products: number;
    orders: number;
    categories: number;
  };
}

// ============================================================
// 5. PRODUCT TYPES
// ============================================================

// ✅ AJOUTÉ : Type pour les images de produits
export interface ProductImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
  alt?: string;
}

export interface CreateProductDTO {
  name: string;
  slug: string;
  description?: string;
  price: number;
  comparePrice?: number;
  costPrice?: number;
  stock: number;
  sku?: string;
  barcode?: string;
  images?: ProductImage[]; // ✅ CORRIGÉ (était string[])
  thumbnail?: string;
  specifications?: Record<string, any>;
  shopId: string;
  categoryId: string;
  status?: ProductStatus;
  isFeatured?: boolean;
  isNew?: boolean;
}

export interface UpdateProductDTO {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  status?: ProductStatus;
  isFeatured?: boolean;
  images?: ProductImage[]; // ✅ CORRIGÉ
  thumbnail?: string;
  specifications?: Record<string, any>;
}

export interface ProductFilters {
  shopId?: string;
  categoryId?: string;
  status?: ProductStatus;
  isFeatured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  inStock?: boolean;
}

export interface ProductWithRelations {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  images: ProductImage[] | null; // ✅ CORRIGÉ (était any)
  thumbnail: string | null;
  averageRating: number;
  reviewCount: number;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  shop: {
    id: string;
    name: string;
    type: ShopType;
  };
}

// ============================================================
// 6. CATEGORY TYPES
// ============================================================

export interface CreateCategoryDTO {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  shopId: string;
  parentId?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface UpdateCategoryDTO {
  name?: string;
  description?: string;
  icon?: string;
  image?: string;
  isActive?: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

export interface CategoryWithChildren {
  id: string;
  name: string;
  slug: string;
  children: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  _count: {
    products: number;
  };
}

// ============================================================
// 7. ORDER TYPES
// ============================================================

// ✅ AJOUTÉ : Type pour l'adresse de livraison (snapshot)
export interface ShippingAddressSnapshot {
  fullName: string;
  phoneNumber: string;
  street: string;
  city: string;
  region?: string;
  country: string;
  instructions?: string;
  [key: string]: string | undefined; // Pour permettre des champs personnalisés supplémentaires
}

export interface CreateOrderDTO {
  userId: string;
  shopId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price?: number;
  }>;
  shippingAddress: ShippingAddressSnapshot; // ✅ CORRIGÉ (type dédié)
  paymentMethod: PaymentMethod;
  couponCode?: string;
}

export interface UpdateOrderStatusDTO {
  status: OrderStatus;
  adminNote?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

export interface OrderWithDetails {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  createdAt: Date;
  items: Array<{
    id: string;
    productName: string;
    productImage: string | null;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

// ============================================================
// 8. CART TYPES
// ============================================================

export interface AddToCartDTO {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemDTO {
  quantity: number;
}

export interface CartItemWithProduct {
  id: string;
  quantity: number;
  priceSnapshot: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    stock: number;
    thumbnail: string | null;
    status: ProductStatus;
  };
}

export interface CartSummary {
  items: CartItemWithProduct[];
  subtotal: number;
  itemsCount: number;
}

// ============================================================
// 9. NOTIFICATION TYPES
// ============================================================

export interface CreateNotificationDTO {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface NotificationWithUser {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  actionUrl: string | null;
}

// ============================================================
// 10. REVIEW TYPES
// ============================================================

export interface CreateReviewDTO {
  productId: string;
  rating: number;
  comment?: string;
  images?: string[];
}

export interface ReviewWithUser {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
  product: {
    id: string;
    name: string;
  };
}

// ============================================================
// 11. ADDRESS TYPES
// ============================================================

export interface CreateAddressDTO {
  type: AddressType;
  fullName: string;
  phoneNumber: string;
  street: string;
  city: string;
  region?: string;
  postalCode?: string;
  country: string;
  instructions?: string;
  isDefault?: boolean;
}

export interface UpdateAddressDTO {
  fullName?: string;
  phoneNumber?: string;
  street?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  instructions?: string;
  isDefault?: boolean;
}

// ============================================================
// 12. COUPON TYPES
// ============================================================

export interface CreateCouponDTO {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minPurchase?: number;
  maxDiscount?: number;
  usageLimit?: number;
  shopId?: string;
  startDate: Date;
  endDate: Date;
}

export interface ValidateCouponDTO {
  code: string;
  shopId: string;
  subtotal: number;
  userId: string;
}

export interface CouponValidationResult {
  valid: boolean;
  couponId?: string;
  discountAmount?: number;
  message: string;
}

// ============================================================
// 13. PAYMENT TYPES
// ============================================================

export interface CreatePaymentDTO {
  orderId: string;
  amount: number;
  method: PaymentMethod;
}

export interface StripePaymentIntent {
  orderId: string;
  amount: number;
  currency: string;
  metadata?: Record<string, any>;
}

// ============================================================
// 14. API RESPONSE TYPES
// ============================================================

export interface ApiSuccessResponse<T = any> {
  success: true;
  message: string;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string | string[]>;
  timestamp: string;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================
// 15. PAGINATION TYPES
// ============================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ============================================================
// 16. UPLOAD TYPES
// ============================================================

export interface UploadResult {
  url: string;
  publicId?: string;
  width?: number;
  height?: number;
  format?: string;
  size: number;
}

export interface UploadOptions {
  maxSize?: number;
  allowedFormats?: string[];
  folder?: string;
  transformation?: Record<string, any>;
}

// ============================================================
// 17. PERMISSIONS & RBAC
// ============================================================

export type Permission =
  | "users:read"
  | "users:write"
  | "users:delete"
  | "products:read"
  | "products:write"
  | "products:delete"
  | "orders:read"
  | "orders:write"
  | "orders:create"    // ✅ AJOUTÉ
  | "orders:manage"
  | "shops:read"
  | "shops:write"
  | "shops:manage"
  | "analytics:read"
  | "settings:manage"
  | "cart:manage"      // ✅ AJOUTÉ
  | "reviews:create"   // ✅ AJOUTÉ
  | "wishlist:manage"; // ✅ AJOUTÉ

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    "users:read",
    "users:write",
    "users:delete",
    "products:read",
    "products:write",
    "products:delete",
    "orders:read",
    "orders:write",
    "orders:create",
    "orders:manage",
    "shops:read",
    "shops:write",
    "shops:manage",
    "analytics:read",
    "settings:manage",
  ],
  SHOP_ADMIN: [
    "products:read",
    "products:write",
    "products:delete",
    "orders:read",
    "orders:write",
    "orders:create",
    "orders:manage",
    "shops:read",
    "analytics:read",
  ],
  CUSTOMER: [
    "products:read",
    "orders:read",
    "orders:create",    // ✅ AJOUTÉ
    "cart:manage",      // ✅ AJOUTÉ
    "reviews:create",   // ✅ AJOUTÉ
    "wishlist:manage",  // ✅ AJOUTÉ
  ],
};

export const ROLE_REDIRECTS: Record<UserRole, string> = {
  SUPER_ADMIN: "/admin/dashboard",
  SHOP_ADMIN: "/shop/dashboard",
  CUSTOMER: "/",
};

// ============================================================
// 18. SESSION & DEVICE
// ============================================================

export interface SessionData {
  user: UserPublic;
  sessionId: string;
  expiresAt: Date;
}

export interface DeviceInfo {
  userAgent: string;
  ip: string;
  browser?: string;
  os?: string;
  device?: string;
}

// ============================================================
// 19. EMAIL TEMPLATES DATA
// ============================================================

export interface WelcomeEmailData {
  name: string;
  verificationUrl: string;
}

export interface VerificationEmailData {
  name: string;
  verificationUrl: string;
}

export interface PasswordResetEmailData {
  name: string;
  resetUrl: string;
}

export interface OTPEmailData {
  name: string;
  code: string;
  expiresInMinutes: number;
}

export interface PasswordChangedEmailData {
  name: string;
  changeDate: string;
}

export interface OrderConfirmationEmailData {
  name: string;
  orderNumber: string;
  totalAmount: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  trackingUrl?: string;
}

// ============================================================
// 20. ERROR TYPES
// ============================================================

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public errors?: Record<string, string>
  ) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, new.target.prototype); // ✅ AJOUTÉ
    Error.captureStackTrace(this, this.constructor);   // ✅ AJOUTÉ
  }
}

export class ValidationError extends AppError {
  constructor(errors: Record<string, string>) {
    super("Erreur de validation", 422, errors);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Non autorisé") {
    super(message, 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Accès refusé") {
    super(message, 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Ressource introuvable") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflit de ressource") {
    super(message, 409);
    this.name = "ConflictError";
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Trop de requêtes") {
    super(message, 429);
    this.name = "RateLimitError";
  }
}

// ============================================================
// 21. ACTIVITY LOG TYPES
// ============================================================

export interface CreateActivityLogDTO {
  userId?: string;
  action: ActivityAction;
  entity: string;
  entityId?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================================
// 22. STOCK MOVEMENT TYPES
// ============================================================

export interface CreateStockMovementDTO {
  productId: string;
  shopId: string;
  quantity: number;
  type: StockMovementType;
  reference?: string;
  note?: string;
  unitCost?: number;
  createdBy?: string;
}

// ============================================================
// 23. WISHLIST TYPES
// ============================================================

export interface AddToWishlistDTO {
  productId: string;
  notifyOnPriceChange?: boolean;
  notifyOnRestock?: boolean;
}

export interface WishlistItemWithProduct {
  id: string;
  createdAt: Date;
  notifyOnPriceChange: boolean;
  notifyOnRestock: boolean;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    stock: number;
    thumbnail: string | null;
    status: ProductStatus;
  };
}

// ============================================================
// 24. ANALYTICS TYPES
// ============================================================

export interface SalesAnalytics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    totalSales: number;
    quantity: number;
  }>;
  salesByMonth: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
}

export interface ShopAnalytics extends SalesAnalytics {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  totalReviews: number;
  averageRating: number;
}