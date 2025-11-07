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

    const formatted = myProperties.map((p) => ({
      ...p,
      images: p.images ? JSON.parse(p.images) : [],
    }));
    res.status(200).json(formatted);
  } catch (error) {
    console.error('Error fetching landlord properties', error);
    res.status(500).json({ message: 'Failed to fetch property', error });
  }
};

// delete property
// export const deleteProperty = async (req, res) => {
//   const { id } = req.params;
//   const landlordId = req.user.id;

//   try {
//     const property = await prisma.property.findUnique({
//       where: { id: parseInt(id) },
//     });

//     if (!property) {
//       return res.status(404).json({ message: 'Property not found' });
//     }

//     if (property.landlordId !== parseInt(landlordId)) {
//       return res
//         .status(403)
//         .json({ message: 'Not authorized to delete this property' });
//     }

//     await prisma.property.delete({ where: { id: parseInt(id) } });
//     res.json({ message: 'Property deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting property:', error);
//     res.status(500).json({ message: 'Failed to delete property' });
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

export const deletePropertyImage = async (req, res) => {
  try {
    const { id } = req.params; // property ID
    const landlordId = req.user.id;
    const { imageUrl } = req.body; // URL of image to delete

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

    // Parse stored image JSON (if any)
    let images = [];
    try {
      images = JSON.parse(property.images || '[]');
    } catch (e) {
      images = [];
    }

    // Remove the image from Cloudinary (optional, only if you store public_id)
    // await cloudinary.uploader.destroy(publicIdFromUrl(imageUrl));

    // Filter out deleted image
    const updatedImages = images.filter((url) => url !== imageUrl);

    // Save updated images as a JSON string
    const updatedProperty = await prisma.property.update({
      where: { id: parseInt(id) },
      data: {
        images: JSON.stringify(updatedImages),
      },
    });

    res.status(200).json({
      message: 'Image deleted successfully',
      property: {
        ...updatedProperty,
        images: updatedImages, // send parsed version back
      },
    });
  } catch (error) {
    console.error('❌ Delete property image error:', error);
    res.status(500).json({ message: 'Failed to delete image', error });
  }
};

// DELETE PROPERTY
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
  if (typeof imageArray === "string") {
    try {
      imageArray = JSON.parse(imageArray);
    } catch (err) {
      console.warn("Image JSON parsing failed:", err.message);
      imageArray = [];
    }
  }

  if (Array.isArray(imageArray) && imageArray.length > 0) {
    const extractPublicId = (url) => {
      const parts = url.split("/");
      const filename = parts[parts.length - 1];
      return filename.split(".")[0];
    };

    await Promise.all(
      imageArray.map(async (url) => {
        const publicId = extractPublicId(url);
        try {
          await cloudinary.uploader.destroy(`homelink_properties/${publicId}`);
        } catch (err) {
          console.warn("Cloudinary deletion failed:", err.message);
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
