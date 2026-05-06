// prisma/seed.ts
import "dotenv/config";
import prisma from "../src/lib/prisma";
import { UserRole, ShopType, ProductStatus, OrderStatus, PaymentStatus, PaymentMethod } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth/password";

async function main() {
  console.log("Starting seed...");

  // ============================================================
  // 1. NETTOYER LA BASE
  // ============================================================
  console.log("Cleaning database...");
  
  await prisma.stockMovement.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.address.deleteMany();
  await prisma.emailVerificationToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.oAuthAccount.deleteMany();
  await prisma.user.deleteMany();

  console.log("Database cleaned");

  // ============================================================
  // 2. CRÉER UTILISATEURS
  // ============================================================
  console.log("👥 Creating users...");

  const passwordHash = await hashPassword("Password123!");

  // SUPER ADMIN
  const superAdmin = await prisma.user.create({
    data: {
      email: "admin@marketplace-cg.com",
      name: "Patrick De Grâce",
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      phone: "+242 06 123 45 67",
    },
  });

  // SHOP ADMINS
  const shopAdminSmartphone = await prisma.user.create({
    data: {
      email: "admin.smartphone@marketplace-cg.com",
      name: "Admin Smartphone",
      passwordHash,
      role: UserRole.SHOP_ADMIN,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  const shopAdminLaptop = await prisma.user.create({
    data: {
      email: "admin.laptop@marketplace-cg.com",
      name: "Admin Laptop",
      passwordHash,
      role: UserRole.SHOP_ADMIN,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  const shopAdminPlayStation = await prisma.user.create({
    data: {
      email: "admin.playstation@marketplace-cg.com",
      name: "Admin PlayStation",
      passwordHash,
      role: UserRole.SHOP_ADMIN,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  // CUSTOMERS
  const customers = await Promise.all(
    Array.from({ length: 10 }, async (_, i) => {
      return prisma.user.create({
        data: {
          email: `client${i + 1}@example.com`,
          name: `Client ${i + 1}`,
          passwordHash,
          role: UserRole.CUSTOMER,
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      });
    })
  );

  console.log(`✅ Created ${3 + 10} users (1 SUPER_ADMIN, 3 SHOP_ADMIN, 10 CUSTOMER)`);

  // ============================================================
  // 3. CRÉER BOUTIQUES
  // ============================================================
  console.log("🏪 Creating shops...");

  const shopSmartphone = await prisma.shop.create({
    data: {
      name: "Marketplace CG - Smartphones",
      type: ShopType.SMARTPHONE,
      description: "Les meilleurs smartphones du Congo-Brazzaville 🇨🇬",
      slug: "smartphones",
      adminId: shopAdminSmartphone.id,
      email: "smartphones@marketplace-cg.com",
      phone: "+242 05 111 11 11",
      isActive: true,
    },
  });

  const shopLaptop = await prisma.shop.create({
    data: {
      name: "Marketplace CG - Ordinateurs",
      type: ShopType.LAPTOP,
      description: "Ordinateurs portables puissants et modernes",
      slug: "laptops",
      adminId: shopAdminLaptop.id,
      email: "laptops@marketplace-cg.com",
      phone: "+242 05 222 22 22",
      isActive: true,
    },
  });

  const shopPlayStation = await prisma.shop.create({
    data: {
      name: "Marketplace CG - PlayStation",
      type: ShopType.PLAYSTATION,
      description: "Consoles et jeux PlayStation",
      slug: "playstation",
      adminId: shopAdminPlayStation.id,
      email: "playstation@marketplace-cg.com",
      phone: "+242 05 333 33 33",
      isActive: true,
    },
  });

  console.log("✅ Created 3 shops");

  // ============================================================
  // 4. CRÉER CATÉGORIES
  // ============================================================
  console.log("📁 Creating categories...");

  // SMARTPHONE CATEGORIES
  const catSmartphoneApple = await prisma.category.create({
    data: {
      name: "iPhone",
      slug: "iphone",
      shopId: shopSmartphone.id,
      order: 1,
    },
  });

  const catSmartphoneSamsung = await prisma.category.create({
    data: {
      name: "Samsung",
      slug: "samsung",
      shopId: shopSmartphone.id,
      order: 2,
    },
  });

  const catSmartphoneAccessories = await prisma.category.create({
    data: {
      name: "Accessoires",
      slug: "accessoires",
      shopId: shopSmartphone.id,
      order: 3,
    },
  });

  // LAPTOP CATEGORIES
  const catLaptopApple = await prisma.category.create({
    data: {
      name: "MacBook",
      slug: "macbook",
      shopId: shopLaptop.id,
      order: 1,
    },
  });

  const catLaptopGaming = await prisma.category.create({
    data: {
      name: "Gaming",
      slug: "gaming",
      shopId: shopLaptop.id,
      order: 2,
    },
  });

  const catLaptopBusiness = await prisma.category.create({
    data: {
      name: "Business",
      slug: "business",
      shopId: shopLaptop.id,
      order: 3,
    },
  });

  // PLAYSTATION CATEGORIES
  const catPlayStationConsoles = await prisma.category.create({
    data: {
      name: "Consoles",
      slug: "consoles",
      shopId: shopPlayStation.id,
      order: 1,
    },
  });

  const catPlayStationGames = await prisma.category.create({
    data: {
      name: "Jeux",
      slug: "jeux",
      shopId: shopPlayStation.id,
      order: 2,
    },
  });

  const catPlayStationAccessories = await prisma.category.create({
    data: {
      name: "Accessoires",
      slug: "accessoires",
      shopId: shopPlayStation.id,
      order: 3,
    },
  });

  console.log("✅ Created 9 categories");

  // ============================================================
  // 5. CRÉER PRODUITS
  // ============================================================
  console.log("📦 Creating products...");

  // SMARTPHONES
  const productsSmartphone = await Promise.all([
    prisma.product.create({
      data: {
        name: "iPhone 15 Pro Max 256GB",
        slug: "iphone-15-pro-max-256gb",
        description: "Le smartphone le plus puissant d'Apple avec puce A17 Pro et caméra 48MP",
        price: 1200000,
        comparePrice: 1350000,
        stock: 15,
        sku: "IPHONE-15-PM-256",
        shopId: shopSmartphone.id,
        categoryId: catSmartphoneApple.id,
        status: ProductStatus.ACTIVE,
        isFeatured: true,
        isNew: true,
        specifications: {
          screen: "6.7 pouces OLED",
          processor: "Apple A17 Pro",
          ram: "8GB",
          storage: "256GB",
          camera: "48MP principale + 12MP ultra-wide",
          battery: "4422 mAh",
        },
      },
    }),
    prisma.product.create({
      data: {
        name: "iPhone 14 128GB",
        slug: "iphone-14-128gb",
        description: "iPhone 14 avec écran Super Retina XDR",
        price: 850000,
        stock: 25,
        sku: "IPHONE-14-128",
        shopId: shopSmartphone.id,
        categoryId: catSmartphoneApple.id,
        status: ProductStatus.ACTIVE,
        isBestseller: true,
        specifications: {
          screen: "6.1 pouces OLED",
          processor: "Apple A15 Bionic",
          ram: "6GB",
          storage: "128GB",
        },
      },
    }),
    prisma.product.create({
      data: {
        name: "Samsung Galaxy S24 Ultra 512GB",
        slug: "samsung-s24-ultra-512gb",
        description: "Galaxy S24 Ultra avec S Pen et zoom 100x",
        price: 1100000,
        stock: 10,
        sku: "SAMSUNG-S24U-512",
        shopId: shopSmartphone.id,
        categoryId: catSmartphoneSamsung.id,
        status: ProductStatus.ACTIVE,
        isFeatured: true,
        isNew: true,
        specifications: {
          screen: "6.8 pouces Dynamic AMOLED 2X",
          processor: "Snapdragon 8 Gen 3",
          ram: "12GB",
          storage: "512GB",
        },
      },
    }),
    prisma.product.create({
      data: {
        name: "AirPods Pro 2ème génération",
        slug: "airpods-pro-2",
        description: "Écouteurs sans fil avec réduction de bruit active",
        price: 125000,
        stock: 50,
        sku: "AIRPODS-PRO-2",
        shopId: shopSmartphone.id,
        categoryId: catSmartphoneAccessories.id,
        status: ProductStatus.ACTIVE,
        isBestseller: true,
      },
    }),
  ]);

  // LAPTOPS
  const productsLaptop = await Promise.all([
    prisma.product.create({
      data: {
        name: "MacBook Pro 14 M3 Pro 18GB RAM 512GB SSD",
        slug: "macbook-pro-14-m3-pro",
        description: "MacBook Pro avec puce M3 Pro, idéal pour les créatifs",
        price: 2500000,
        stock: 8,
        sku: "MBP-14-M3P-512",
        shopId: shopLaptop.id,
        categoryId: catLaptopApple.id,
        status: ProductStatus.ACTIVE,
        isFeatured: true,
        isNew: true,
        specifications: {
          processor: "Apple M3 Pro 11-core CPU",
          ram: "18GB Unified Memory",
          storage: "512GB SSD",
          screen: "14.2 pouces Liquid Retina XDR",
          gpu: "14-core GPU",
        },
      },
    }),
    prisma.product.create({
      data: {
        name: "ASUS ROG Strix G16 RTX 4060",
        slug: "asus-rog-strix-g16-rtx4060",
        description: "PC gaming puissant avec Intel Core i7 et RTX 4060",
        price: 1800000,
        stock: 12,
        sku: "ASUS-ROG-G16-4060",
        shopId: shopLaptop.id,
        categoryId: catLaptopGaming.id,
        status: ProductStatus.ACTIVE,
        isFeatured: true,
        specifications: {
          processor: "Intel Core i7-13650HX",
          ram: "16GB DDR5",
          storage: "1TB SSD",
          gpu: "NVIDIA GeForce RTX 4060 8GB",
          screen: "16 pouces FHD 165Hz",
        },
      },
    }),
    prisma.product.create({
      data: {
        name: "Dell XPS 15 Intel Core i9",
        slug: "dell-xps-15-i9",
        description: "Ultrabook professionnel ultra-performant",
        price: 2200000,
        stock: 5,
        sku: "DELL-XPS15-I9",
        shopId: shopLaptop.id,
        categoryId: catLaptopBusiness.id,
        status: ProductStatus.ACTIVE,
        specifications: {
          processor: "Intel Core i9-13900H",
          ram: "32GB DDR5",
          storage: "1TB SSD",
          screen: "15.6 pouces 4K OLED",
        },
      },
    }),
  ]);

  // PLAYSTATION
  const productsPlayStation = await Promise.all([
    prisma.product.create({
      data: {
        name: "PlayStation 5 Standard Edition",
        slug: "ps5-standard",
        description: "Console PS5 avec lecteur Blu-ray",
        price: 650000,
        stock: 20,
        sku: "PS5-STD",
        shopId: shopPlayStation.id,
        categoryId: catPlayStationConsoles.id,
        status: ProductStatus.ACTIVE,
        isFeatured: true,
        isBestseller: true,
        specifications: {
          cpu: "AMD Zen 2 8-core",
          gpu: "10.28 TFLOPS AMD RDNA 2",
          ram: "16GB GDDR6",
          storage: "825GB SSD",
          resolution: "4K à 120fps",
        },
      },
    }),
    prisma.product.create({
      data: {
        name: "PlayStation 5 Digital Edition",
        slug: "ps5-digital",
        description: "Console PS5 sans lecteur (version numérique)",
        price: 550000,
        stock: 15,
        sku: "PS5-DIG",
        shopId: shopPlayStation.id,
        categoryId: catPlayStationConsoles.id,
        status: ProductStatus.ACTIVE,
        specifications: {
          cpu: "AMD Zen 2 8-core",
          storage: "825GB SSD",
        },
      },
    }),
    prisma.product.create({
      data: {
        name: "Spider-Man 2 PS5",
        slug: "spiderman-2-ps5",
        description: "Jeu d'action exclusif PlayStation 5",
        price: 55000,
        stock: 100,
        sku: "GAME-SM2-PS5",
        shopId: shopPlayStation.id,
        categoryId: catPlayStationGames.id,
        status: ProductStatus.ACTIVE,
        isBestseller: true,
      },
    }),
    prisma.product.create({
      data: {
        name: "God of War Ragnarök",
        slug: "god-of-war-ragnarok",
        description: "Suite épique de God of War",
        price: 50000,
        stock: 80,
        sku: "GAME-GOW-PS5",
        shopId: shopPlayStation.id,
        categoryId: catPlayStationGames.id,
        status: ProductStatus.ACTIVE,
        isBestseller: true,
      },
    }),
    prisma.product.create({
      data: {
        name: "DualSense Edge Wireless Controller",
        slug: "dualsense-edge",
        description: "Manette sans fil haut de gamme avec boutons arrière",
        price: 120000,
        stock: 30,
        sku: "PS5-DS-EDGE",
        shopId: shopPlayStation.id,
        categoryId: catPlayStationAccessories.id,
        status: ProductStatus.ACTIVE,
      },
    }),
  ]);

  const allProducts = [...productsSmartphone, ...productsLaptop, ...productsPlayStation];
  console.log(`✅ Created ${allProducts.length} products`);

  // ============================================================
  // 6. CRÉER ADRESSES
  // ============================================================
  console.log("🏠 Creating addresses...");

  const addresses = await Promise.all(
    customers.slice(0, 5).map((customer, i) =>
      prisma.address.create({
        data: {
          userId: customer.id,
          fullName: customer.name!,
          phoneNumber: `+242 06 ${100 + i} ${200 + i} ${300 + i}`,
          street: `${10 + i} Avenue de la Liberté`,
          city: i % 2 === 0 ? "Brazzaville" : "Pointe-Noire",
          region: i % 2 === 0 ? "Brazzaville" : "Kouilou",
          country: "Congo-Brazzaville",
          isDefault: true,
        },
      })
    )
  );

  console.log(`✅ Created ${addresses.length} addresses`);

  // ============================================================
  // 7. CRÉER COMMANDES
  // ============================================================
  console.log("🛒 Creating orders...");

  const order1 = await prisma.order.create({
    data: {
      orderNumber: `MCG-${Date.now()}-001`,
      userId: customers[0].id,
      shopId: shopSmartphone.id,
      subtotal: 1200000,
      totalAmount: 1200000,
      status: OrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.COMPLETED,
      paymentMethod: PaymentMethod.STRIPE,
      shippingAddress: {
        fullName: customers[0].name,
        phone: "+242 06 123 45 67",
        street: "10 Avenue de la Liberté",
        city: "Brazzaville",
      },
      confirmedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order1.id,
      productId: productsSmartphone[0].id,
      productName: productsSmartphone[0].name,
      productSku: productsSmartphone[0].sku,
      price: productsSmartphone[0].price,
      quantity: 1,
      subtotal: productsSmartphone[0].price,
    },
  });

  await prisma.payment.create({
    data: {
      orderId: order1.id,
      amount: 1200000,
      method: PaymentMethod.STRIPE,
      status: PaymentStatus.COMPLETED,
      paidAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("✅ Created 1 order with payment");

  // ============================================================
  // 8. CRÉER AVIS
  // ============================================================
  console.log("⭐ Creating reviews...");

  const reviews = await Promise.all([
    prisma.review.create({
      data: {
        userId: customers[0].id,
        productId: productsSmartphone[0].id,
        rating: 5,
        comment: "Excellent smartphone ! Très rapide et l'appareil photo est incroyable. Livraison rapide à Brazzaville.",
        isApproved: true,
        approvedAt: new Date(),
      },
    }),
    prisma.review.create({
      data: {
        userId: customers[1].id,
        productId: productsPlayStation[0].id,
        rating: 5,
        comment: "La PS5 est juste parfaite. Les graphismes sont époustouflants !",
        isApproved: true,
        approvedAt: new Date(),
      },
    }),
    prisma.review.create({
      data: {
        userId: customers[2].id,
        productId: productsLaptop[0].id,
        rating: 4,
        comment: "Très bon MacBook, mais un peu cher. La puce M3 Pro est vraiment puissante.",
        isApproved: true,
        approvedAt: new Date(),
      },
    }),
  ]);

  await prisma.product.update({
    where: { id: productsSmartphone[0].id },
    data: { averageRating: 5, reviewCount: 1 },
  });

  await prisma.product.update({
    where: { id: productsPlayStation[0].id },
    data: { averageRating: 5, reviewCount: 1 },
  });

  await prisma.product.update({
    where: { id: productsLaptop[0].id },
    data: { averageRating: 4, reviewCount: 1 },
  });

  console.log(`✅ Created ${reviews.length} reviews`);

  // ============================================================
  // 9. CRÉER COUPONS
  // ============================================================
  console.log("🎟️ Creating coupons...");

  const coupons = await Promise.all([
    prisma.coupon.create({
      data: {
        code: "WELCOME10",
        description: "10% de réduction pour les nouveaux clients",
        discountType: "PERCENTAGE",
        discountValue: 10,
        minPurchase: 100000,
        usageLimit: 100,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    }),
    prisma.coupon.create({
      data: {
        code: "CG2026",
        description: "50 000 FCFA de réduction",
        discountType: "FIXED_AMOUNT",
        discountValue: 50000,
        minPurchase: 500000,
        usageLimit: 50,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${coupons.length} coupons`);

  // ============================================================
  // 10. RÉSUMÉ
  // ============================================================
  console.log("\n🎉 Seed completed successfully!\n");
  console.log("📊 SUMMARY:");
  console.log(`   - Users: ${3 + 10} (1 SUPER_ADMIN, 3 SHOP_ADMIN, 10 CUSTOMER)`);
  console.log(`   - Shops: 3`);
  console.log(`   - Categories: 9`);
  console.log(`   - Products: ${allProducts.length}`);
  console.log(`   - Orders: 1`);
  console.log(`   - Reviews: ${reviews.length}`);
  console.log(`   - Coupons: ${coupons.length}`);
  console.log("\n🔐 Test Credentials:");
  console.log("   Super Admin: admin@marketplace-cg.com / Password123!");
  console.log("   Shop Admin Smartphone: admin.smartphone@marketplace-cg.com / Password123!");
  console.log("   Customer: client1@example.com / Password123!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });