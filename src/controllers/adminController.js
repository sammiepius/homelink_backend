// import prisma from '../../src/prismaClient.js';

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

// export const deleteProperty = async (req, res) => {
//   try {
//     const id = parseInt(req.params.id);

//     await prisma.property.delete({
//       where: { id },
//     });

//     res.json({ message: 'Property deleted' });
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to delete property' });
//   }
// };

export const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const landlordId = req.user.id; // from auth middleware

    // ✅ Validate and parse the ID safely
    if (!id || isNaN(id)) {
      return res
        .status(400)
        .json({ message: 'Invalid or missing property ID' });
    }
    const propertyId = parseInt(id, 10);

    // ✅ Find the property
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // ✅ Check ownership
    if (property.landlordId !== landlordId) {
      return res
        .status(403)
        .json({ message: 'Not authorized to delete this property' });
    }

    // ✅ (Optional) Delete images from Cloudinary if applicable
    // Optional: Delete images from Cloudinary if stored there
    if (property.images) {
      let imageArray = property.images;

      // If stored as JSON string, parse it
      if (typeof imageArray === 'string') {
        try {
          imageArray = JSON.parse(imageArray);
        } catch (err) {
          console.warn('Image JSON parsing failed:', err.message);
          imageArray = [];
        }
      }

      if (Array.isArray(imageArray) && imageArray.length > 0) {
        const extractPublicId = (url) => {
          const parts = url.split('/');
          const filename = parts[parts.length - 1];
          return filename.split('.')[0];
        };

        await Promise.all(
          imageArray.map(async (url) => {
            const publicId = extractPublicId(url);
            try {
              await cloudinary.uploader.destroy(
                `homelink_properties/${publicId}`
              );
            } catch (err) {
              console.warn('Cloudinary deletion failed:', err.message);
            }
          })
        );
      }
    }

    // ✅ Delete property from database
    await prisma.property.delete({
      where: { id: propertyId },
    });

    return res.status(200).json({
      success: true,
      message: 'Property deleted successfully',
    });
  } catch (error) {
    console.error('Property deletion error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete property',
      error: error.message,
    });
  }
};
export const adminDeleteProperty = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "Invalid or missing property ID" });
    }
    const propertyId = parseInt(id, 10);

    // Find property
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Optional: delete images from Cloudinary
    if (property.images) {
      let imageArray = property.images;

      if (typeof imageArray === "string") {
        try {
          imageArray = JSON.parse(imageArray);
        } catch {
          imageArray = [];
        }
      }

      if (Array.isArray(imageArray)) {
        const extractPublicId = (url) => {
          const parts = url.split("/");
          const filename = parts[parts.length - 1];
          return filename.split(".")[0];
        };

        await Promise.all(
          imageArray.map(async (url) => {
            const publicId = extractPublicId(url);
            try {
              await cloudinary.uploader.destroy(
                `homelink_properties/${publicId}`
              );
            } catch (err) {
              console.warn("Cloudinary deletion failed:", err.message);
            }
          })
        );
      }
    }

    // Delete from database
    await prisma.property.delete({
      where: { id: propertyId },
    });

    return res.status(200).json({
      success: true,
      message: "Property deleted successfully by admin",
    });

  } catch (error) {
    console.error("Admin delete property error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete property",
      error: error.message,
    });
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

// Approve a property (make it eligible to be shown publicly)
// export const approveProperty = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const property = await prisma.property.update({
//       where: { id: Number(id) },
//       data: { approved: true },
//     });

//     res.json({
//       message: 'Property approved successfully.',
//       property,
//     });
//   } catch (error) {
//     console.error('Approve property error:', error);
//     res.status(500).json({ message: 'Error approving property' });
//   }
// };

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
