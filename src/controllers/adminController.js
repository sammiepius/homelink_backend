// import prisma from '../../src/prismaClient.js';

import prisma from '../../src/prismaClient.js';
import { logAudit } from '../util/auditLogger.js';

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

    // Pending approvals (properties needing approval)
    const pendingApprovals = await prisma.property.count({
      where: { approved: false }, // adapt to your schema field
    });

    // Open reports / complaints
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

export const getDashboardCharts = async (req, res) => {
  try {
    // USERS GROUPED BY MONTH
    const users = await prisma.user.findMany({
      select: { createdAt: true },
    });

    // PROPERTIES GROUPED BY MONTH
    const properties = await prisma.property.findMany({
      select: { createdAt: true },
    });

    const groupByMonth = (items) => {
      const map = {};

      items.forEach((item) => {
        const month = new Date(item.createdAt).toLocaleString('en-US', {
          month: 'short',
        });

        map[month] = (map[month] || 0) + 1;
      });

      return Object.entries(map).map(([month, count]) => ({
        month,
        count,
      }));
    };

    res.json({
      users: groupByMonth(users),
      properties: groupByMonth(properties),
    });
  } catch (error) {
    console.error('Dashboard charts error:', error);
    res.status(500).json({ message: 'Failed to load chart stats' });
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

// export const getAllUsers = async (req, res) => {
//   try {
//     const users = await prisma.user.findMany({
//       orderBy: { createdAt: 'desc' },
//     });

//     res.json(users);
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to fetch users' });
//   }
// };

// export const getMessages = async (req, res) => {
//   try {
//     const messages = await prisma.contactMessage.findMany({
//       orderBy: { createdAt: 'desc' },
//     });

//     res.json(messages);
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to fetch messages' });
//   }
// };
export const adminDeleteProperty = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'Invalid property ID' });
    }

    const propertyId = Number(id);

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // 🔥 ADMIN CAN DELETE ANY PROPERTY — NO OWNERSHIP CHECK

    // Optional: delete images from Cloudinary
    if (property.images) {
      let images = property.images;

      if (typeof images === 'string') {
        try {
          images = JSON.parse(images);
        } catch {
          images = [];
        }
      }

      if (Array.isArray(images)) {
        const extractPublicId = (url) => url.split('/').pop().split('.')[0];

        await Promise.all(
          images.map(async (url) => {
            try {
              await cloudinary.uploader.destroy(
                `homelink_properties/${extractPublicId(url)}`
              );
            } catch (err) {
              console.warn('Cloudinary delete failed:', err.message);
            }
          })
        );
      }
    }

    await prisma.property.delete({
      where: { id: propertyId },
    });

    // ✅ AUDIT LOG
    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'DELETE_PROPERTY',
      entity: 'Property',
      entityId: property.id,
      metadata: {
        title: property.title,
        landlordId: property.landlordId,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Property deleted by admin',
    });
  } catch (error) {
    console.error('Admin delete property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete property',
    });
  }
};

export const approveProperty = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await prisma.property.findUnique({
      where: { id: Number(id) },
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found.' });
    }

    if (property.approved === true) {
      return res.status(400).json({
        message: 'This property is already approved.',
      });
    }

    const updated = await prisma.property.update({
      where: { id: Number(id) },
      data: { approved: true },
    });

    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'APPROVE_PROPERTY',
      entity: 'Property',
      entityId: updated.id,
      metadata: {
        title: updated.title,
        landlordId: updated.landlordId,
      },
      ipAddress: req.ip,
    });

    return res.json({
      message: 'Property approved successfully.',
      property: updated,
    });
  } catch (error) {
    console.error('Approve property error:', error);
    res.status(500).json({ message: 'Error approving property.' });
  }
};

export const rejectProperty = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await prisma.property.findUnique({
      where: { id: Number(id) },
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found.' });
    }

    if (property.approved === false && property.rejected === true) {
      return res.status(400).json({
        message: 'This property is already rejected.',
      });
    }

    const updated = await prisma.property.update({
      where: { id: Number(id) },
      data: {
        approved: false,
        rejected: true,
        isActive: false, // auto-disable rejected property
      },
    });

    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'REJECT_PROPERTY',
      entity: 'Property',
      entityId: updated.id,
      metadata: {
        title: updated.title,
      },
      ipAddress: req.ip,
    });

    return res.json({
      message: 'Property rejected.',
      property: updated,
    });
  } catch (error) {
    console.error('Reject property error:', error);
    res.status(500).json({ message: 'Error rejecting property.' });
  }
};

// export const rejectProperty = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const property = await prisma.property.update({
//       where: { id: Number(id) },
//       data: { approved: false },
//     });

//     res.json({
//       message: 'Property moved back to pending state.',
//       property,
//     });
//   } catch (error) {
//     console.error('Reject property error:', error);
//     res.status(500).json({ message: 'Error rejecting property' });
//   }
// };

export const toggleActiveProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const property = await prisma.property.findUnique({
      where: { id: Number(id) },
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found.' });
    }

    // Must be approved before activation
    if (!property.approved) {
      return res.status(400).json({
        message: 'Cannot activate property until it is approved.',
      });
    }

    if (property.rejected) {
      return res.status(400).json({
        message: 'Cannot activate a rejected property.',
      });
    }

    const updated = await prisma.property.update({
      where: { id: Number(id) },
      data: { isActive },
    });

    await logAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'TOGGLE_PROPERTY',
      entity: 'Property',
      entityId: updated.id,
      metadata: {
        title: updated.title,
      },
      ipAddress: req.ip,
    });

    return res.json({
      message: `Property is now ${isActive ? 'Active' : 'Inactive'}.`,
      property: updated,
    });
  } catch (error) {
    console.error('Toggle active error:', error);
    res.status(500).json({ message: 'Error toggling active status.' });
  }
};

// export const toggleActiveProperty = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // Get current state
//     const property = await prisma.property.findUnique({
//       where: { id: Number(id) },
//     });

//     if (!property) {
//       return res.status(404).json({ message: 'Property not found' });
//     }

//     // Toggle the active state
//     const updated = await prisma.property.update({
//       where: { id: Number(id) },
//       data: { isActive: !property.isActive },
//     });

//     res.json({
//       message: `Property is now ${updated.isActive ? 'active' : 'inactive'}.`,
//       property: updated,
//     });
//   } catch (error) {
//     console.error('Toggle active error:', error);
//     res.status(500).json({ message: 'Error toggling active state' });
//   }
// };
// export const getAuditLogs = async (req, res) => {
//   const logs = await prisma.auditLog.findMany({
//     orderBy: { createdAt: 'desc' },
//     take: 50,
//     include: {
//       actor: {
//         select: { name: true, email: true },
//       },
//     },
//   });

//   res.json(logs);
// };

export const getAuditLogsss = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const action = req.query.action || 'all';

    const where = {
      ...(action !== 'all' && { action }),
      ...(search && {
        metadata: {
          path: ['title'],
          string_contains: search,
        },
      }),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          actor: {
            select: { name: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      logs,
      pagination: {
        page,
        totalPages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (err) {
    console.error('Audit log error:', err);
    res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
};

export const getRecentActivities = async (req, res) => {
  try {
    const activities = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 4,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    res.json({ activities });
  } catch (error) {
    console.error('Recent activities error:', error);
    res.status(500).json({ message: 'Failed to fetch activities' });
  }
};
export const getRecentActivity = async (req, res) => {
  try {
    const activities = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        actorRole: true,
        action: true,
        entity: true,
        entityId: true,
        metadata: true,
        createdAt: true,
      },
    });

    res.status(200).json(activities);
  } catch (error) {
    console.error('Recent activity error:', error);
    res.status(500).json({ message: 'Failed to fetch recent activities' });
  }
};
