import prisma from '../../src/prismaClient.js';
import cloudinary from '../util/cloudinary.js';

export const createProperty = async (req, res) => {
  const {
    title,
    description,
    price,
    location,
    images,
    type,
    bedrooms,
    bathrooms,
  } = req.body;

  const landlordId = parseInt(req.user.id);

  try {
    const landlord = await prisma.user.findUnique({
      where: { id: landlordId },
    });

    if (!landlord || landlord.role !== 'LANDLORD') {
      return res
        .status(403)
        .json({ error: 'Access denied. Only landlords can add properties.' });
    }

    const newProperty = await prisma.property.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        location,
        images: images ? JSON.stringify(images) : null, // ✅ store as JSON
        type,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseInt(bathrooms) : null,
        landlordId,
      },
    });

    res.status(201).json({
      message: '✅ Property added successfully',
      property: newProperty,
    });
  } catch (error) {
    console.error('❌ Error creating property:', error);
    res.status(500).json({ message: 'Failed to create property' });
  }
};

// Get all properties (for listing page)
export const getAllProperties = async (req, res) => {
  try {
    const properties = await prisma.property.findMany({
      include: { landlord: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const formatted = properties.map((p) => ({
      ...p,
      images: p.images ? JSON.parse(p.images) : [],
    }));
    res.status(200).json(formatted);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ message: 'Failed to fetch properties' });
  }
};

// Get single property by ID
export const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await prisma.property.findUnique({
      where: { id: parseInt(id) },
      // include: { landlord: true },
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    res.status(200).json({
      ...property,
      images: property.images ? JSON.parse(property.images) : [],
    });
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ message: 'Failed to fetch property' });
  }
};

//Get all properties posted by loggedin landlord
export const getMyProperty = async (req, res) => {
  try {
    const landlordId = req.user.id;

    const myProperties = await prisma.property.findMany({
      where: { landlordId: landlordId },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(myProperties);
  } catch (error) {
    console.error('Error fetching landlord properties', error);
    res.status(500).json({ message: 'Failed to fetch property', error });
  }
};

// delete property
export const deleteProperty = async (req, res) => {
  const { id } = req.params;
  const landlordId = req.user.id;

  try {
    const property = await prisma.property.findUnique({
      where: { id: parseInt(id) },
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (property.landlordId !== parseInt(landlordId)) {
      return res
        .status(403)
        .json({ message: 'Not authorized to delete this property' });
    }

    await prisma.property.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ message: 'Failed to delete property' });
  }
};

// UPDATE PROPERTY
// export const updateProperty = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const landlordId = req.user.id; // protect middleware
//     const { title, description, price, location, type, bedrooms, bathrooms } =
//       req.body;

//     // Make sure property exists and belongs to the landlord
//     const property = await prisma.property.findUnique({
//       where: { id: parseInt(id) },
//     });

//     if (!property) {
//       return res.status(404).json({ message: 'Property not found' });
//     }

//     if (property.landlordId !== landlordId) {
//       return res
//         .status(403)
//         .json({ message: 'Not authorized to edit this property' });
//     }

//     let imageUrls = property.images || [];

//     // If new image files are uploaded, upload them to Cloudinary
//     if (req.files && req.files.length > 0) {
//       const uploadedImages = await Promise.all(
//         req.files.map(async (file) => {
//           const upload = await cloudinary.uploader.upload(file.path, {
//             folder: 'homelink_properties',
//           });
//           return upload.secure_url;
//         })
//       );
//       imageUrls = [...imageUrls, ...uploadedImages];
//     }

//     // Update property
//     const updatedProperty = await prisma.property.update({
//       where: { id: parseInt(id) },
//       data: {
//         title,
//         description,
//         price: parseFloat(price),
//         location,
//         type,
//         bedrooms: bedrooms ? parseInt(bedrooms) : null,
//         bathrooms: bathrooms ? parseInt(bathrooms) : null,
//         images: images ? JSON.stringify(images) : null,
//       },
//     });

//     res.status(200).json({
//       message: 'Property updated successfully',
//       property: updatedProperty,
//     });
//   } catch (error) {
//     console.error('Property update error:', error);
//     res.status(500).json({ message: 'Failed to update property', error });
//   }
// };

export const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const landlordId = req.user.id; // From protect middleware
    const { title, description, price, location, type, bedrooms, bathrooms } =
      req.body;

    // 1️⃣ Find the property and verify ownership
    const property = await prisma.property.findUnique({
      where: { id: parseInt(id) },
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (property.landlordId !== landlordId) {
      return res
        .status(403)
        .json({ message: 'Not authorized to edit this property' });
    }

    // 2️⃣ Handle image uploads if new files exist
    let updatedImages = property.images ? JSON.parse(property.images) : [];

    if (req.files && req.files.length > 0) {
      const uploadedImages = await Promise.all(
        req.files.map(async (file) => {
          const upload = await cloudinary.uploader.upload(file.path, {
            folder: 'homelink_properties',
          });
          return upload.secure_url;
        })
      );
      updatedImages = [...updatedImages, ...uploadedImages];
    }

    // 3️⃣ Update property details
    const updatedProperty = await prisma.property.update({
      where: { id: parseInt(id) },
      data: {
        title: title || property.title,
        description: description || property.description,
        price: price ? parseFloat(price) : property.price,
        location: location || property.location,
        type: type || property.type,
        bedrooms: bedrooms ? parseInt(bedrooms) : property.bedrooms,
        bathrooms: bathrooms ? parseInt(bathrooms) : property.bathrooms,
        images: JSON.stringify(updatedImages),
      },
    });

    res.status(200).json({
      message: 'Property updated successfully',
      property: updatedProperty,
    });
  } catch (error) {
    console.error('❌ Property update error:', error);
    res
      .status(500)
      .json({ message: 'Failed to update property', error: error.message });
  }
};
