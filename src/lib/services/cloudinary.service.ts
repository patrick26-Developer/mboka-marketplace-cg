import cloudinary from "@/lib/cloudinary/config";
import { UploadApiResponse } from "cloudinary";

export class CloudinaryService {
  /**
   * Upload un avatar utilisateur (400x400)
   */
  static async uploadAvatar(file: File, userId: string): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "marketplace-cg/avatars",
            public_id: `user-${userId}`,
            overwrite: true,
            transformation: [
              { width: 400, height: 400, crop: "fill", gravity: "face" },
              { quality: "auto:good" },
              { fetch_format: "auto" },
            ],
            resource_type: "image",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result!.secure_url);
          }
        )
        .end(buffer);
    });
  }

  /**
   * Upload une image de produit (max 1200x1200)
   */
  static async uploadProductImage(
    file: File,
    productId: string
  ): Promise<{ url: string; publicId: string }> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "marketplace-cg/products",
            public_id: `product-${productId}-${Date.now()}`,
            transformation: [
              { width: 1200, height: 1200, crop: "limit" },
              { quality: "auto:best" },
              { fetch_format: "auto" },
            ],
            resource_type: "image",
          },
          (error, result) => {
            if (error) reject(error);
            else
              resolve({
                url: result!.secure_url,
                publicId: result!.public_id,
              });
          }
        )
        .end(buffer);
    });
  }

  /**
   * Upload plusieurs images de produit
   */
  static async uploadProductImages(
    files: File[],
    productId: string
  ): Promise<Array<{ url: string; publicId: string }>> {
    return Promise.all(
      files.map((file) => this.uploadProductImage(file, productId))
    );
  }

  /**
   * Upload logo boutique (300x300, transparent)
   */
  static async uploadShopLogo(file: File, shopId: string): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "marketplace-cg/shops/logos",
            public_id: `shop-logo-${shopId}`,
            overwrite: true,
            transformation: [
              { width: 300, height: 300, crop: "pad", background: "transparent" },
              { quality: "auto:best" },
              { fetch_format: "auto" },
            ],
            resource_type: "image",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result!.secure_url);
          }
        )
        .end(buffer);
    });
  }

  /**
   * Upload bannière boutique (1920x400)
   */
  static async uploadShopBanner(file: File, shopId: string): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "marketplace-cg/shops/banners",
            public_id: `shop-banner-${shopId}`,
            overwrite: true,
            transformation: [
              { width: 1920, height: 400, crop: "fill" },
              { quality: "auto:good" },
              { fetch_format: "auto" },
            ],
            resource_type: "image",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result!.secure_url);
          }
        )
        .end(buffer);
    });
  }

  /**
   * Supprimer une image
   */
  static async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
    });
  }

  /**
   * Supprimer plusieurs images
   */
  static async deleteImages(publicIds: string[]): Promise<void> {
    await cloudinary.api.delete_resources(publicIds, {
      invalidate: true,
    });
  }

  /**
   * Générer une URL transformée
   */
  static getTransformedUrl(
    publicId: string,
    transformations: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string;
      format?: string;
    }
  ): string {
    return cloudinary.url(publicId, {
      ...transformations,
      secure: true,
    });
  }

  /**
   * Générer une URL de thumbnail
   */
  static getThumbnailUrl(publicId: string, size = 200): string {
    return this.getTransformedUrl(publicId, {
      width: size,
      height: size,
      crop: "fill",
      quality: "auto:good",
      format: "auto",
    });
  }

  /**
   * Valider un fichier image
   */
  static validateImage(file: File): { valid: boolean; error?: string } {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: "Format non autorisé. Utilisez JPG, PNG ou WebP",
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: "Fichier trop volumineux (max 5MB)",
      };
    }

    return { valid: true };
  }
}