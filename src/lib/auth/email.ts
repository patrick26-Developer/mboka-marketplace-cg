// src/lib/auth/email.ts
import nodemailer from "nodemailer";
import type {
  OTPEmailData,
  PasswordResetEmailData,
  WelcomeEmailData,
  PasswordChangedEmailData,
  OrderConfirmationEmailData,
} from "@/types";

// ============================================================
// TRANSPORTER
// ============================================================

function createTransporter() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const FROM = `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`;

async function sendMail(options: {
  to:      string;
  subject: string;
  html:    string;
}): Promise<void> {
  const transporter = createTransporter();
  
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      await Promise.race([
        transporter.sendMail({
          from:    FROM,
          to:      options.to,
          subject: options.subject,
          html:    options.html,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Email timeout")), 10000)
        ),
      ]);
      
      return;
    } catch (error) {
      attempt++;
      
      if (attempt >= maxRetries) {
        console.error(`[Email] Failed after ${maxRetries} attempts:`, error);
        throw error;
      }
      
      console.warn(`[Email] Retry ${attempt}/${maxRetries}...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

// ============================================================
// TEMPLATE DE BASE
// ============================================================

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
         background:#f5f5f5;color:#1a1a1a}
    .wrap{max-width:560px;margin:40px auto;background:#fff;
          border-radius:12px;overflow:hidden;
          box-shadow:0 2px 20px rgba(0,0,0,.08)}
    .head{background:linear-gradient(135deg,#1a1a2e,#16213e);
          padding:32px;text-align:center}
    .head h1{color:#fff;font-size:22px;font-weight:700}
    .head span{color:#e94560}
    .body{padding:40px 32px}
    .foot{background:#f8f8f8;padding:20px 32px;text-align:center;
          font-size:12px;color:#888;border-top:1px solid #eee}
    .btn{display:inline-block;padding:14px 32px;background:#e94560;
         color:#fff;text-decoration:none;border-radius:8px;
         font-weight:600;font-size:15px;margin:24px 0}
    .otp{font-size:40px;font-weight:800;letter-spacing:12px;
         color:#e94560;text-align:center;padding:20px;
         background:#fff5f7;border-radius:8px;margin:24px 0}
    p{line-height:1.7;color:#444;margin-bottom:12px}
    .warn{font-size:12px;color:#999;margin-top:16px}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="head">
      <h1>Marketplace <span>CG</span> 🇨🇬</h1>
    </div>
    <div class="body">${content}</div>
    <div class="foot">
      © ${new Date().getFullYear()} Marketplace CG — Made in Congo-Brazzaville 🇨🇬
    </div>
  </div>
</body>
</html>`;
}

// ============================================================
// 1. BIENVENUE + VÉRIFICATION EMAIL
// ============================================================

export async function sendWelcomeEmail(
  to:   string,
  data: WelcomeEmailData
): Promise<void> {
  await sendMail({
    to,
    subject: "🇨🇬 Bienvenue sur Marketplace CG — Vérifiez votre email",
    html: baseTemplate(`
      <p>Bonjour <strong>${data.name ?? "cher client"}</strong>,</p>
      <p>Bienvenue sur <strong>Marketplace CG</strong> 🎉</p>
      <p>Cliquez sur le bouton ci-dessous pour vérifier votre adresse email :</p>
      <div style="text-align:center">
        <a href="${data.verificationUrl}" class="btn">Vérifier mon email</a>
      </div>
      <p class="warn">Ce lien expire dans 15 minutes. Si vous n'avez pas créé de compte, ignorez cet email.</p>
    `),
  });
}

// ============================================================
// 2. CODE OTP
// ============================================================

export async function sendOTPEmail(
  to:   string,
  data: OTPEmailData
): Promise<void> {
  await sendMail({
    to,
    subject: `${data.code} — Code de vérification Marketplace CG`,
    html: baseTemplate(`
      <p>Bonjour <strong>${data.name ?? ""}</strong>,</p>
      <p>Voici votre code de vérification :</p>
      <div class="otp">${data.code}</div>
      <p style="text-align:center;color:#888;font-size:14px">
        Ce code expire dans <strong>${data.expiresInMinutes} minutes</strong>
      </p>
      <p class="warn">Ne partagez jamais ce code. Si vous n'avez pas fait cette demande, ignorez cet email.</p>
    `),
  });
}

// ============================================================
// 3. RÉINITIALISATION MOT DE PASSE
// ============================================================

export async function sendPasswordResetEmail(
  to:   string,
  data: PasswordResetEmailData
): Promise<void> {
  await sendMail({
    to,
    subject: "Réinitialisation de votre mot de passe — Marketplace CG",
    html: baseTemplate(`
      <p>Bonjour <strong>${data.name ?? ""}</strong>,</p>
      <p>Vous avez demandé une réinitialisation de votre mot de passe.</p>
      <div style="text-align:center">
        <a href="${data.resetUrl}" class="btn">Réinitialiser mon mot de passe</a>
      </div>
      <p class="warn">Ce lien expire dans 2 heures. Si vous n'avez pas fait cette demande, votre compte est en sécurité.</p>
    `),
  });
}

// ============================================================
// 4. MOT DE PASSE MODIFIÉ
// ============================================================

export async function sendPasswordChangedEmail(
  to:   string,
  data: PasswordChangedEmailData
): Promise<void> {
  await sendMail({
    to,
    subject: "⚠️ Votre mot de passe a été modifié — Marketplace CG",
    html: baseTemplate(`
      <p>Bonjour <strong>${data.name ?? ""}</strong>,</p>
      <p>Votre mot de passe a été modifié avec succès le <strong>${data.changeDate}</strong>.</p>
      <p>Si vous n'êtes pas à l'origine de cette modification, contactez immédiatement notre support.</p>
    `),
  });
}

// ============================================================
// 5. CONFIRMATION COMMANDE
// ============================================================

export async function sendOrderConfirmationEmail(
  to:   string,
  data: OrderConfirmationEmailData
): Promise<void> {
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee">${item.name}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">
          ${item.price.toLocaleString("fr-CG")} FCFA
        </td>
      </tr>`
    )
    .join("");

  await sendMail({
    to,
    subject: `✅ Commande #${data.orderNumber} confirmée — Marketplace CG`,
    html: baseTemplate(`
      <p>Bonjour <strong>${data.name ?? ""}</strong>,</p>
      <p>Votre commande <strong>#${data.orderNumber}</strong> a été confirmée ! 🎉</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0">
        <thead>
          <tr style="background:#f5f5f5">
            <th style="padding:8px;text-align:left">Produit</th>
            <th style="padding:8px;text-align:center">Qté</th>
            <th style="padding:8px;text-align:right">Prix</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:12px 0;font-weight:700">Total</td>
            <td style="padding:12px 0;font-weight:700;text-align:right;color:#e94560">
              ${data.totalAmount.toLocaleString("fr-CG")} FCFA
            </td>
          </tr>
        </tfoot>
      </table>
      ${data.trackingUrl
        ? `<div style="text-align:center">
             <a href="${data.trackingUrl}" class="btn">Suivre ma commande</a>
           </div>`
        : ""}
    `),
  });
}