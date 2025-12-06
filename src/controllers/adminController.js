import prisma from '../../src/prismaClient.js';

export const getAllProperties = async (req, res) => {
  const properties = await prisma.property.findMany({
    include: { landlord: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(properties);
};

export const getDashboardStats = async (req, res) => {
  const totalUsers = await prisma.user.count();
  const totalLandlords = await prisma.user.count({
    where: { role: 'LANDLORD' },
  });
  const totalTenants = await prisma.user.count({ where: { role: 'TENANT' } });
  const totalProperties = await prisma.property.count();
  const totalFavorites = await prisma.favorite.count();

  res.json({
    totalUsers,
    totalLandlords,
    totalTenants,
    totalProperties,
    totalFavorites,
  });
};
