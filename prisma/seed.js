const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_INITIAL_USERNAME || "admin";
  const password = process.env.ADMIN_INITIAL_PASSWORD || "password123";

  console.log(`Verificando usuário inicial (${username})...`);

  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (!existingUser) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        name: "Administrador",
        role: "ADMIN",
        profiles: {
          create: [
            {
              name: "Principal",
              avatar: "avatar-1",
              isKids: false,
            },
          ],
        },
      },
      include: {
        profiles: true,
      },
    });

    console.log(`✓ Usuário administrador '${username}' criado com sucesso.`);
    console.log(`✓ Perfil '${user.profiles[0].name}' criado (ID: ${user.profiles[0].id}).`);
  } else {
    console.log(`✓ Usuário '${username}' já existe.`);
  }
}

main()
  .catch((e) => {
    console.error("Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
