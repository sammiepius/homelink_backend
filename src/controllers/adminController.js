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
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Error getting dashboard stats' });
  }
};

export const getAdminStats = async (req, res) => {
  try {
    // Basic counts
    const totalProperties = await prisma.property.count();
    const activeListings = await prisma.property.count({
      where: { isActive: true },
    });

    // Properties added last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const properties30d = await prisma.property.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    const totalUsers = await prisma.user.count();
    const landlords = await prisma.user.count({ where: { role: 'LANDLORD' } });
    const tenants = await prisma.user.count({ where: { role: 'TENANT' } });

    // Pending approvals (example: properties needing approval)
    const pendingApprovals = await prisma.property.count({
      where: { approved: false }, // adapt to your schema field
    });

    // Open reports / complaints (example)
    // const openReports = await prisma.report.count({
    //   where: { status: 'OPEN' }, // adapt to your schema
    // });

    // New inquiries (7 days)
    // const sevenDaysAgo = new Date();
    // sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    // const newInquiries7d = await prisma.inquiry.count({
    //   where: { createdAt: { gte: sevenDaysAgo } },
    // });

    res.json({
      stats: {
        totalProperties,
        activeListings,
        properties30d,
        totalUsers,
        landlords,
        tenants,
        pendingApprovals,
        // openReports,
        // newInquiries7d,
      },
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllProperties = async (req, res) => {
  try {
    const properties = await prisma.property.findMany({
      include: { landlord: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch properties' });
  }
};

export const deleteProperty = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    await prisma.property.delete({
      where: { id },
    });

    res.json({ message: 'Property deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete property' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

export const getMessages = async (req, res) => {
  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};
