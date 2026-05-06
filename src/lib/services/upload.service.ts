import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

export class UploadService {
  /**
   * S'assure que le dossier d'upload existe
   */
  private static async ensureUploadDir(folder: string): Promise<void> {
    const dir = path.join(UPLOAD_DIR, folder);
    await fs.mkdir(dir, { recursive: true });
  }

  /**
   * Valide un fichier
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: "Format non autorisé. Utilisez JPG, PNG ou WebP",
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: "Fichier trop volumineux (max 5MB)",
      };
    }

    return { valid: true };
  }

  /**
   * Upload un avatar utilisateur
   */
  static async uploadAvatar(file: File, userId: string): Promise<string> {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    await this.ensureUploadDir("avatars");

    const ext = file.name.split(".").pop();
    const filename = `${userId}-${crypto.randomBytes(8).toString("hex")}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, "avatars", filename);

    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(filepath, Buffer.from(arrayBuffer));

    return `/uploads/avatars/${filename}`;
  }

  /**
   * Upload une image de produit
   */
  static async uploadProductImage(file: File, productId: string): Promise<string> {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    await this.ensureUploadDir("products");

    const ext = file.name.split(".").pop();
    const filename = `${productId}-${Date.now()}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, "products", filename);

    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(filepath, Buffer.from(arrayBuffer));

    return `/uploads/products/${filename}`;
  }

  /**
   * Supprime un fichier
   */
  static async deleteFile(url: string): Promise<void> {
    if (!url.startsWith("/uploads/")) return;

    const filename = url.replace("/uploads/", "");
    const filepath = path.join(UPLOAD_DIR, filename);

    try {
      await fs.unlink(filepath);
    } catch (error) {
      console.error("Failed to delete file:", error);
    }
  }
}