// import prisma from '../../src/prismaClient.js';

// export const getAllProperties = async (req, res) => {
//   const properties = await prisma.property.findMany({
//     include: { landlord: true },
//     orderBy: { createdAt: 'desc' },
//   });
//   res.json(properties);
// };

// export const getDashboardStats = async (req, res) => {
//   const totalUsers = await prisma.user.count();
//   const totalLandlords = await prisma.user.count({
//     where: { role: 'LANDLORD' },
//   });
//   const totalTenants = await prisma.user.count({ where: { role: 'TENANT' } });
//   const totalProperties = await prisma.property.count();
//   const totalFavorites = await prisma.favorite.count();

//   res.json({
//     totalUsers,
//     totalLandlords,
//     totalTenants,
//     totalProperties,
//     totalFavorites,
//   });
// };
import prisma from '../../src/prismaClient.js';

export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalProperties = await prisma.property.count();
    const totalMessages = await prisma.contactMessage.count();

    res.json({ totalUsers, totalProperties, totalMessages });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ message: "Error getting dashboard stats" });
  }
};

export const getAllProperties = async (req, res) => {
  try {
    const properties = await prisma.property.findMany({
      include: { landlord: true },
      orderBy: { createdAt: "desc" },
    });

    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch properties" });
  }
};

export const deleteProperty = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    await prisma.property.delete({
      where: { id },
    });

    res.json({ message: "Property deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete property" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};
