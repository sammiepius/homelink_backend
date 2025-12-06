import { PrismaClient } from '@prisma/client';
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();


async function createAdmin() {
  try {
    const name = "Super Admin";
    const email = "admin@homelink.com";
    const password = "Admin123"; // CHANGE THIS AFTER FIRST LOGIN
    const hashed = await bcrypt.hash(password, 10);

    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: "ADMIN",
      },
    });

    console.log("Admin created:", admin);
    process.exit(0);

  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
}

createAdmin();
