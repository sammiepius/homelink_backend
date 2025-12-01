import prisma from '../../src/prismaClient.js';

export const getAllProperties = async (req, res) => {
  const properties = await prisma.property.findMany({
    include: { landlord: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(properties);
};
